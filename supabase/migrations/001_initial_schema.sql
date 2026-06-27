-- BarManager — Schéma initial multi-bars avec RLS

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE public.user_role AS ENUM ('owner', 'employee');
CREATE TYPE public.slate_status AS ENUM ('open', 'paid', 'cancelled');

-- Établissements
CREATE TABLE public.bars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Profils utilisateurs (1 bar par utilisateur)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  bar_id uuid NOT NULL REFERENCES public.bars (id) ON DELETE RESTRICT,
  role public.user_role NOT NULL DEFAULT 'employee',
  full_name text,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX profiles_bar_id_idx ON public.profiles (bar_id);

-- Catégories de produits
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id uuid NOT NULL REFERENCES public.bars (id) ON DELETE RESTRICT,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bar_id, name)
);

CREATE INDEX categories_bar_id_idx ON public.categories (bar_id);

-- Types de conditionnement (listes configurables)
CREATE TABLE public.packaging_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id uuid NOT NULL REFERENCES public.bars (id) ON DELETE RESTRICT,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bar_id, name)
);

CREATE INDEX packaging_types_bar_id_idx ON public.packaging_types (bar_id);

-- Moyens de paiement
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id uuid NOT NULL REFERENCES public.bars (id) ON DELETE RESTRICT,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bar_id, name)
);

CREATE INDEX payment_methods_bar_id_idx ON public.payment_methods (bar_id);

-- Produits
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id uuid NOT NULL REFERENCES public.bars (id) ON DELETE RESTRICT,
  category_id uuid NOT NULL REFERENCES public.categories (id) ON DELETE RESTRICT,
  name text NOT NULL,
  unit_price numeric(10, 2) NOT NULL CHECK (unit_price >= 0),
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX products_bar_id_idx ON public.products (bar_id);
CREATE INDEX products_category_id_idx ON public.products (category_id);

-- Conditionnements par produit
CREATE TABLE public.product_packagings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id uuid NOT NULL REFERENCES public.bars (id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  packaging_type_id uuid NOT NULL REFERENCES public.packaging_types (id) ON DELETE RESTRICT,
  quantity numeric(10, 3) NOT NULL CHECK (quantity > 0),
  optional_price numeric(10, 2) CHECK (optional_price IS NULL OR optional_price >= 0),
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, packaging_type_id)
);

CREATE INDEX product_packagings_bar_id_idx ON public.product_packagings (bar_id);
CREATE INDEX product_packagings_product_id_idx ON public.product_packagings (product_id);

-- Ardoises
CREATE TABLE public.slates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id uuid NOT NULL REFERENCES public.bars (id) ON DELETE RESTRICT,
  client_name text NOT NULL,
  note text,
  status public.slate_status NOT NULL DEFAULT 'open',
  total numeric(10, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

CREATE INDEX slates_bar_id_idx ON public.slates (bar_id);
CREATE INDEX slates_status_idx ON public.slates (bar_id, status);

-- Lignes d'ardoise
CREATE TABLE public.slate_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id uuid NOT NULL REFERENCES public.bars (id) ON DELETE RESTRICT,
  slate_id uuid NOT NULL REFERENCES public.slates (id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  product_packaging_id uuid NOT NULL REFERENCES public.product_packagings (id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  packaging_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10, 2) NOT NULL CHECK (unit_price >= 0),
  line_total numeric(10, 2) NOT NULL CHECK (line_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX slate_lines_bar_id_idx ON public.slate_lines (bar_id);
CREATE INDEX slate_lines_slate_id_idx ON public.slate_lines (slate_id);

-- Ventes (historique immuable)
CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id uuid NOT NULL REFERENCES public.bars (id) ON DELETE RESTRICT,
  slate_id uuid REFERENCES public.slates (id) ON DELETE SET NULL,
  payment_method_id uuid NOT NULL REFERENCES public.payment_methods (id) ON DELETE RESTRICT,
  total numeric(10, 2) NOT NULL CHECK (total >= 0),
  sold_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL
);

CREATE INDEX sales_bar_id_idx ON public.sales (bar_id);
CREATE INDEX sales_sold_at_idx ON public.sales (bar_id, sold_at DESC);

-- Lignes de vente (copie immuable)
CREATE TABLE public.sale_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id uuid NOT NULL REFERENCES public.bars (id) ON DELETE RESTRICT,
  sale_id uuid NOT NULL REFERENCES public.sales (id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  packaging_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10, 2) NOT NULL CHECK (unit_price >= 0),
  line_total numeric(10, 2) NOT NULL CHECK (line_total >= 0)
);

CREATE INDEX sale_lines_bar_id_idx ON public.sale_lines (bar_id);
CREATE INDEX sale_lines_sale_id_idx ON public.sale_lines (sale_id);

-- Paramètres par bar
CREATE TABLE public.bar_settings (
  bar_id uuid PRIMARY KEY REFERENCES public.bars (id) ON DELETE CASCADE,
  currency text NOT NULL DEFAULT 'EUR',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Fonctions utilitaires RLS
CREATE OR REPLACE FUNCTION public.get_user_bar_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bar_id
  FROM public.profiles
  WHERE id = auth.uid()
    AND actif = true;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = auth.uid()
    AND actif = true;
$$;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = 'owner'::public.user_role FROM public.profiles WHERE id = auth.uid() AND actif = true),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER bars_updated_at
  BEFORE UPDATE ON public.bars
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER packaging_types_updated_at
  BEFORE UPDATE ON public.packaging_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER product_packagings_updated_at
  BEFORE UPDATE ON public.product_packagings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER slates_updated_at
  BEFORE UPDATE ON public.slates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Calcul du prix d'un conditionnement
CREATE OR REPLACE FUNCTION public.compute_packaging_price(
  p_unit_price numeric,
  p_quantity numeric,
  p_optional_price numeric
)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(p_optional_price, p_unit_price * p_quantity);
$$;

-- Données par défaut à la création d'un bar
CREATE OR REPLACE FUNCTION public.seed_bar_defaults(p_bar_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.bar_settings (bar_id)
  VALUES (p_bar_id)
  ON CONFLICT (bar_id) DO NOTHING;

  INSERT INTO public.payment_methods (bar_id, name, sort_order) VALUES
    (p_bar_id, 'Espèces', 1),
    (p_bar_id, 'Carte bancaire', 2),
    (p_bar_id, 'Autre', 3)
  ON CONFLICT (bar_id, name) DO NOTHING;

  INSERT INTO public.packaging_types (bar_id, name, sort_order) VALUES
    (p_bar_id, 'Unité', 1),
    (p_bar_id, 'Verre', 2),
    (p_bar_id, 'Bouteille', 3),
    (p_bar_id, 'Pichet', 4)
  ON CONFLICT (bar_id, name) DO NOTHING;

  INSERT INTO public.categories (bar_id, name, sort_order) VALUES
    (p_bar_id, 'Boissons', 1)
  ON CONFLICT (bar_id, name) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.on_bar_created_seed_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.seed_bar_defaults(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bars_seed_defaults ON public.bars;

CREATE TRIGGER bars_seed_defaults
  AFTER INSERT ON public.bars
  FOR EACH ROW EXECUTE FUNCTION public.on_bar_created_seed_defaults();

-- RLS
ALTER TABLE public.bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packaging_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_packagings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slate_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_settings ENABLE ROW LEVEL SECURITY;

-- Bars : lecture du bar de l'utilisateur
CREATE POLICY bars_select ON public.bars
  FOR SELECT USING (id = public.get_user_bar_id());

CREATE POLICY bars_update ON public.bars
  FOR UPDATE USING (id = public.get_user_bar_id() AND public.is_owner());

-- Profiles
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT USING (bar_id = public.get_user_bar_id());

CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY profiles_manage_owner ON public.profiles
  FOR ALL USING (bar_id = public.get_user_bar_id() AND public.is_owner());

-- Macro-policies par bar_id pour les tables métier
CREATE POLICY categories_select ON public.categories
  FOR SELECT USING (bar_id = public.get_user_bar_id());

CREATE POLICY categories_insert ON public.categories
  FOR INSERT WITH CHECK (bar_id = public.get_user_bar_id() AND public.is_owner());

CREATE POLICY categories_update ON public.categories
  FOR UPDATE USING (bar_id = public.get_user_bar_id() AND public.is_owner());

CREATE POLICY packaging_types_select ON public.packaging_types
  FOR SELECT USING (bar_id = public.get_user_bar_id());

CREATE POLICY packaging_types_insert ON public.packaging_types
  FOR INSERT WITH CHECK (bar_id = public.get_user_bar_id() AND public.is_owner());

CREATE POLICY packaging_types_update ON public.packaging_types
  FOR UPDATE USING (bar_id = public.get_user_bar_id() AND public.is_owner());

CREATE POLICY payment_methods_select ON public.payment_methods
  FOR SELECT USING (bar_id = public.get_user_bar_id());

CREATE POLICY payment_methods_insert ON public.payment_methods
  FOR INSERT WITH CHECK (bar_id = public.get_user_bar_id() AND public.is_owner());

CREATE POLICY payment_methods_update ON public.payment_methods
  FOR UPDATE USING (bar_id = public.get_user_bar_id() AND public.is_owner());

CREATE POLICY products_select ON public.products
  FOR SELECT USING (bar_id = public.get_user_bar_id());

CREATE POLICY products_insert ON public.products
  FOR INSERT WITH CHECK (bar_id = public.get_user_bar_id() AND public.is_owner());

CREATE POLICY products_update ON public.products
  FOR UPDATE USING (bar_id = public.get_user_bar_id() AND public.is_owner());

CREATE POLICY product_packagings_select ON public.product_packagings
  FOR SELECT USING (bar_id = public.get_user_bar_id());

CREATE POLICY product_packagings_insert ON public.product_packagings
  FOR INSERT WITH CHECK (bar_id = public.get_user_bar_id() AND public.is_owner());

CREATE POLICY product_packagings_update ON public.product_packagings
  FOR UPDATE USING (bar_id = public.get_user_bar_id() AND public.is_owner());

-- Ardoises : owner + employee
CREATE POLICY slates_select ON public.slates
  FOR SELECT USING (bar_id = public.get_user_bar_id());

CREATE POLICY slates_insert ON public.slates
  FOR INSERT WITH CHECK (bar_id = public.get_user_bar_id());

CREATE POLICY slates_update ON public.slates
  FOR UPDATE USING (bar_id = public.get_user_bar_id());

CREATE POLICY slate_lines_select ON public.slate_lines
  FOR SELECT USING (bar_id = public.get_user_bar_id());

CREATE POLICY slate_lines_insert ON public.slate_lines
  FOR INSERT WITH CHECK (bar_id = public.get_user_bar_id());

CREATE POLICY slate_lines_update ON public.slate_lines
  FOR UPDATE USING (bar_id = public.get_user_bar_id());

CREATE POLICY slate_lines_delete ON public.slate_lines
  FOR DELETE USING (bar_id = public.get_user_bar_id());

-- Ventes : lecture pour tous, insertion pour tous, pas de modification
CREATE POLICY sales_select ON public.sales
  FOR SELECT USING (bar_id = public.get_user_bar_id());

CREATE POLICY sales_insert ON public.sales
  FOR INSERT WITH CHECK (bar_id = public.get_user_bar_id());

CREATE POLICY sale_lines_select ON public.sale_lines
  FOR SELECT USING (bar_id = public.get_user_bar_id());

CREATE POLICY sale_lines_insert ON public.sale_lines
  FOR INSERT WITH CHECK (bar_id = public.get_user_bar_id());

CREATE POLICY bar_settings_select ON public.bar_settings
  FOR SELECT USING (bar_id = public.get_user_bar_id());

CREATE POLICY bar_settings_update ON public.bar_settings
  FOR UPDATE USING (bar_id = public.get_user_bar_id() AND public.is_owner());

CREATE POLICY bar_settings_insert ON public.bar_settings
  FOR INSERT WITH CHECK (bar_id = public.get_user_bar_id() AND public.is_owner());
