export type UserRole = "owner" | "employee";
export type SlateStatus = "open" | "paid" | "cancelled";
export type BarStatus = "active" | "suspended";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      bars: {
        Row: {
          id: string;
          name: string;
          status: BarStatus;
          actif: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          status?: BarStatus;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          status?: BarStatus;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      super_admins: {
        Row: {
          user_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          bar_id: string;
          role: UserRole;
          full_name: string | null;
          actif: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          bar_id: string;
          role?: UserRole;
          full_name?: string | null;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bar_id?: string;
          role?: UserRole;
          full_name?: string | null;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          bar_id: string;
          name: string;
          sort_order: number;
          actif: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bar_id: string;
          name: string;
          sort_order?: number;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bar_id?: string;
          name?: string;
          sort_order?: number;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      packaging_types: {
        Row: {
          id: string;
          bar_id: string;
          name: string;
          sort_order: number;
          actif: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bar_id: string;
          name: string;
          sort_order?: number;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bar_id?: string;
          name?: string;
          sort_order?: number;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_methods: {
        Row: {
          id: string;
          bar_id: string;
          name: string;
          sort_order: number;
          actif: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bar_id: string;
          name: string;
          sort_order?: number;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bar_id?: string;
          name?: string;
          sort_order?: number;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          bar_id: string;
          category_id: string;
          name: string;
          unit_price: number;
          is_kitchen_item: boolean;
          actif: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bar_id: string;
          category_id: string;
          name: string;
          unit_price: number;
          is_kitchen_item?: boolean;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bar_id?: string;
          category_id?: string;
          name?: string;
          unit_price?: number;
          is_kitchen_item?: boolean;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          bar_id: string;
          product_id: string;
          size: string | null;
          color: string | null;
          unit_price: number | null;
          sort_order: number;
          actif: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bar_id: string;
          product_id: string;
          size?: string | null;
          color?: string | null;
          unit_price?: number | null;
          sort_order?: number;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bar_id?: string;
          product_id?: string;
          size?: string | null;
          color?: string | null;
          unit_price?: number | null;
          sort_order?: number;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_packagings: {
        Row: {
          id: string;
          bar_id: string;
          product_id: string;
          packaging_type_id: string;
          quantity: number;
          optional_price: number | null;
          actif: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bar_id: string;
          product_id: string;
          packaging_type_id: string;
          quantity: number;
          optional_price?: number | null;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bar_id?: string;
          product_id?: string;
          packaging_type_id?: string;
          quantity?: number;
          optional_price?: number | null;
          actif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      slates: {
        Row: {
          id: string;
          bar_id: string;
          client_name: string;
          location: string | null;
          note: string | null;
          status: SlateStatus;
          total: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          closed_at: string | null;
        };
        Insert: {
          id?: string;
          bar_id: string;
          client_name: string;
          location?: string | null;
          note?: string | null;
          status?: SlateStatus;
          total?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          closed_at?: string | null;
        };
        Update: {
          id?: string;
          bar_id?: string;
          client_name?: string;
          location?: string | null;
          note?: string | null;
          status?: SlateStatus;
          total?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          closed_at?: string | null;
        };
        Relationships: [];
      };
      kitchen_items: {
        Row: {
          id: string;
          bar_id: string;
          slate_id: string;
          slate_line_id: string;
          client_name_snapshot: string;
          location_snapshot: string | null;
          note_snapshot: string | null;
          product_name_snapshot: string;
          variant_size_snapshot: string | null;
          variant_color_snapshot: string | null;
          packaging_name_snapshot: string | null;
          quantity: number;
          status: string;
          created_at: string;
          served_at: string | null;
        };
        Insert: {
          id?: string;
          bar_id: string;
          slate_id: string;
          slate_line_id: string;
          client_name_snapshot: string;
          location_snapshot?: string | null;
          note_snapshot?: string | null;
          product_name_snapshot: string;
          packaging_name_snapshot?: string | null;
          quantity: number;
          status?: string;
          created_at?: string;
          served_at?: string | null;
        };
        Update: {
          id?: string;
          bar_id?: string;
          slate_id?: string;
          slate_line_id?: string;
          client_name_snapshot?: string;
          location_snapshot?: string | null;
          note_snapshot?: string | null;
          product_name_snapshot?: string;
          packaging_name_snapshot?: string | null;
          quantity?: number;
          status?: string;
          created_at?: string;
          served_at?: string | null;
        };
        Relationships: [];
      };
      slate_lines: {
        Row: {
          id: string;
          bar_id: string;
          slate_id: string;
          product_id: string;
          product_packaging_id: string;
          product_variant_id: string | null;
          product_name: string;
          variant_size_snapshot: string | null;
          variant_color_snapshot: string | null;
          packaging_name: string;
          quantity: number;
          unit_price: number;
          line_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          bar_id: string;
          slate_id: string;
          product_id: string;
          product_packaging_id: string;
          product_variant_id: string | null;
          product_name: string;
          variant_size_snapshot: string | null;
          variant_color_snapshot: string | null;
          packaging_name: string;
          quantity: number;
          unit_price: number;
          line_total: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          bar_id?: string;
          slate_id?: string;
          product_id?: string;
          product_packaging_id?: string;
          product_name?: string;
          packaging_name?: string;
          quantity?: number;
          unit_price?: number;
          line_total?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      sales: {
        Row: {
          id: string;
          bar_id: string;
          slate_id: string | null;
          payment_method_id: string;
          total: number;
          sold_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          bar_id: string;
          slate_id?: string | null;
          payment_method_id: string;
          total: number;
          sold_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          bar_id?: string;
          slate_id?: string | null;
          payment_method_id?: string;
          total?: number;
          sold_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };
      sale_lines: {
        Row: {
          id: string;
          bar_id: string;
          sale_id: string;
          product_name: string;
          variant_size_snapshot: string | null;
          variant_color_snapshot: string | null;
          packaging_name: string;
          quantity: number;
          unit_price: number;
          line_total: number;
        };
        Insert: {
          id?: string;
          bar_id: string;
          sale_id: string;
          product_name: string;
          variant_size_snapshot?: string | null;
          variant_color_snapshot?: string | null;
          packaging_name: string;
          quantity: number;
          unit_price: number;
          line_total: number;
        };
        Update: {
          id?: string;
          bar_id?: string;
          sale_id?: string;
          product_name?: string;
          packaging_name?: string;
          quantity?: number;
          unit_price?: number;
          line_total?: number;
        };
        Relationships: [];
      };
      bar_settings: {
        Row: {
          bar_id: string;
          currency: string;
          updated_at: string;
        };
        Insert: {
          bar_id: string;
          currency?: string;
          updated_at?: string;
        };
        Update: {
          bar_id?: string;
          currency?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_bar_id: { Args: Record<string, never>; Returns: string };
      get_user_role: { Args: Record<string, never>; Returns: UserRole };
      is_owner: { Args: Record<string, never>; Returns: boolean };
      is_super_admin: { Args: Record<string, never>; Returns: boolean };
      compute_packaging_price: {
        Args: {
          p_unit_price: number;
          p_quantity: number;
          p_optional_price: number | null;
        };
        Returns: number;
      };
      checkout_slate: {
        Args: {
          p_slate_id: string;
          p_payment_method_id: string;
          p_created_by: string | null;
        };
        Returns: string;
      };
      add_slate_line: {
        Args: {
          p_slate_id: string;
          p_product_packaging_id: string;
          p_quantity?: number;
          p_line_total?: number | null;
          p_product_variant_id?: string | null;
        };
        Returns: Json;
      };
      update_slate_line_line_total: {
        Args: {
          p_slate_id: string;
          p_line_id: string;
          p_line_total?: number | null;
        };
        Returns: Json;
      };
      update_slate_line_quantity: {
        Args: {
          p_slate_id: string;
          p_line_id: string;
          p_quantity: number;
        };
        Returns: Json;
      };
      delete_slate_line: {
        Args: {
          p_slate_id: string;
          p_line_id: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      user_role: UserRole;
      slate_status: SlateStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Bar = Database["public"]["Tables"]["bars"]["Row"];
export type Slate = Database["public"]["Tables"]["slates"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
