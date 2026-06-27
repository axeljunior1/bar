-- Module Super Admin : gestion multi-bars et suspension

ALTER TABLE public.bars
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'suspended'));

CREATE TABLE public.super_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.super_admins
    WHERE user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

CREATE POLICY super_admins_select ON public.super_admins
  FOR SELECT USING (public.is_super_admin());

CREATE POLICY bars_select_super_admin ON public.bars
  FOR SELECT USING (public.is_super_admin());

CREATE POLICY bars_insert_super_admin ON public.bars
  FOR INSERT WITH CHECK (public.is_super_admin());

CREATE POLICY bars_update_super_admin ON public.bars
  FOR UPDATE USING (public.is_super_admin());
