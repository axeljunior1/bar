import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/types/database";

type SupabaseClient = ReturnType<typeof createServerClient<Database>>;

async function checkIsSuperAdmin(supabase: SupabaseClient): Promise<boolean> {
  const { data } = await supabase.rpc("is_super_admin");
  return Boolean(data);
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/login");
  const isPasswordResetRoute = pathname === "/login/nouveau-mot-de-passe";
  const isAuthCallbackRoute = pathname.startsWith("/auth/callback");
  const isSuspendedRoute = pathname === "/suspended";
  const isSuperAdminRoute = pathname.startsWith("/super-admin");
  const isPublicRoute =
    isAuthRoute || isAuthCallbackRoute || pathname.startsWith("/manifest");

  if (!user && !isPublicRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("bar_id")
      .eq("id", user.id)
      .eq("actif", true)
      .maybeSingle();

    let isSuperAdmin: boolean | null = null;

    async function getIsSuperAdmin(): Promise<boolean> {
      if (isSuperAdmin === null) {
        isSuperAdmin = await checkIsSuperAdmin(supabase);
      }

      return isSuperAdmin;
    }

    if (!profile) {
      if (await getIsSuperAdmin()) {
        if (!isSuperAdminRoute && !isPublicRoute && !isSuspendedRoute) {
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = "/super-admin";
          return NextResponse.redirect(redirectUrl);
        }
      } else if (!isPublicRoute) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/login";
        return NextResponse.redirect(redirectUrl);
      }
    } else if (
      !isSuspendedRoute &&
      !isSuperAdminRoute &&
      !isPublicRoute
    ) {
      const { data: bar } = await supabase
        .from("bars")
        .select("status")
        .eq("id", profile.bar_id)
        .maybeSingle();

      if (bar?.status === "suspended" && !(await getIsSuperAdmin())) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/suspended";
        return NextResponse.redirect(redirectUrl);
      }
    }

    if (isAuthRoute && !isPasswordResetRoute) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname =
        !profile && (await getIsSuperAdmin()) ? "/super-admin" : "/";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
