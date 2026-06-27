-- Unicité uniquement sur les enregistrements actifs (soft delete via actif = false)

ALTER TABLE public.categories
  DROP CONSTRAINT IF EXISTS categories_bar_id_name_key;

CREATE UNIQUE INDEX categories_bar_id_name_active_idx
  ON public.categories (bar_id, name)
  WHERE actif = true;

ALTER TABLE public.packaging_types
  DROP CONSTRAINT IF EXISTS packaging_types_bar_id_name_key;

CREATE UNIQUE INDEX packaging_types_bar_id_name_active_idx
  ON public.packaging_types (bar_id, name)
  WHERE actif = true;

ALTER TABLE public.payment_methods
  DROP CONSTRAINT IF EXISTS payment_methods_bar_id_name_key;

CREATE UNIQUE INDEX payment_methods_bar_id_name_active_idx
  ON public.payment_methods (bar_id, name)
  WHERE actif = true;

ALTER TABLE public.product_packagings
  DROP CONSTRAINT IF EXISTS product_packagings_product_id_packaging_type_id_key;

CREATE UNIQUE INDEX product_packagings_product_packaging_type_active_idx
  ON public.product_packagings (product_id, packaging_type_id)
  WHERE actif = true;
