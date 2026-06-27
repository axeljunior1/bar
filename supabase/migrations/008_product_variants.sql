-- Variantes produit (taille / couleur) et impact vente

CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id uuid NOT NULL REFERENCES public.bars (id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  size text,
  color text,
  unit_price numeric(10, 2) CHECK (unit_price IS NULL OR unit_price >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    NULLIF(btrim(COALESCE(size, '')), '') IS NOT NULL
    OR NULLIF(btrim(COALESCE(color, '')), '') IS NOT NULL
  )
);

CREATE INDEX product_variants_bar_id_idx ON public.product_variants (bar_id);
CREATE INDEX product_variants_product_id_idx ON public.product_variants (product_id);

CREATE UNIQUE INDEX product_variants_product_size_color_active_idx
  ON public.product_variants (
    product_id,
    lower(btrim(COALESCE(size, ''))),
    lower(btrim(COALESCE(color, '')))
  )
  WHERE actif = true;

CREATE TRIGGER product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_variants_select ON public.product_variants
  FOR SELECT USING (bar_id = public.get_user_bar_id());

CREATE POLICY product_variants_insert ON public.product_variants
  FOR INSERT WITH CHECK (bar_id = public.get_user_bar_id() AND public.is_owner());

CREATE POLICY product_variants_update ON public.product_variants
  FOR UPDATE USING (bar_id = public.get_user_bar_id() AND public.is_owner());

ALTER TABLE public.slate_lines
  ADD COLUMN IF NOT EXISTS product_variant_id uuid REFERENCES public.product_variants (id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS variant_size_snapshot text,
  ADD COLUMN IF NOT EXISTS variant_color_snapshot text;

CREATE INDEX slate_lines_product_variant_id_idx ON public.slate_lines (product_variant_id);

ALTER TABLE public.sale_lines
  ADD COLUMN IF NOT EXISTS variant_size_snapshot text,
  ADD COLUMN IF NOT EXISTS variant_color_snapshot text;

ALTER TABLE public.kitchen_items
  ADD COLUMN IF NOT EXISTS variant_size_snapshot text,
  ADD COLUMN IF NOT EXISTS variant_color_snapshot text;

CREATE OR REPLACE FUNCTION public.normalize_variant_text(p_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(btrim(COALESCE(p_value, '')), '');
$$;

CREATE OR REPLACE FUNCTION public.product_has_active_variants(
  p_product_id uuid,
  p_bar_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.product_variants
    WHERE product_id = p_product_id
      AND bar_id = p_bar_id
      AND actif = true
  );
$$;

CREATE OR REPLACE FUNCTION public.resolve_variant_base_unit_price(
  p_product public.products,
  p_variant public.product_variants
)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(p_variant.unit_price, p_product.unit_price);
$$;

CREATE OR REPLACE FUNCTION public.slate_line_to_json(p_line public.slate_lines)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT jsonb_build_object(
    'id', p_line.id,
    'product_packaging_id', p_line.product_packaging_id,
    'product_variant_id', p_line.product_variant_id,
    'product_name', p_line.product_name,
    'variant_size', p_line.variant_size_snapshot,
    'variant_color', p_line.variant_color_snapshot,
    'packaging_name', p_line.packaging_name,
    'quantity', p_line.quantity,
    'unit_price', p_line.unit_price,
    'line_total', p_line.line_total
  );
$$;

DROP FUNCTION IF EXISTS public.add_slate_line(uuid, uuid, integer, numeric);

CREATE OR REPLACE FUNCTION public.add_slate_line(
  p_slate_id uuid,
  p_product_packaging_id uuid,
  p_quantity integer DEFAULT 1,
  p_unit_price numeric DEFAULT NULL,
  p_product_variant_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bar_id uuid;
  v_slate public.slates%ROWTYPE;
  v_packaging public.product_packagings%ROWTYPE;
  v_product public.products%ROWTYPE;
  v_variant public.product_variants%ROWTYPE;
  v_packaging_type_name text;
  v_base_unit_price numeric(10, 2);
  v_catalog_price numeric(10, 2);
  v_unit_price numeric(10, 2);
  v_line_total numeric(10, 2);
  v_existing_line public.slate_lines%ROWTYPE;
  v_line public.slate_lines%ROWTYPE;
  v_slate_total numeric(10, 2);
  v_kitchen_created boolean := false;
  v_has_variants boolean;
  v_size_snapshot text;
  v_color_snapshot text;
BEGIN
  v_bar_id := public.get_user_bar_id();

  IF v_bar_id IS NULL THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 99 THEN
    RAISE EXCEPTION 'Quantité invalide';
  END IF;

  IF p_unit_price IS NOT NULL AND p_unit_price < 0 THEN
    RAISE EXCEPTION 'Prix invalide';
  END IF;

  SELECT *
  INTO v_slate
  FROM public.slates
  WHERE id = p_slate_id
    AND bar_id = v_bar_id
    AND status = 'open'::public.slate_status
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ardoise introuvable ou clôturée';
  END IF;

  SELECT *
  INTO v_packaging
  FROM public.product_packagings
  WHERE id = p_product_packaging_id
    AND bar_id = v_bar_id
    AND actif = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conditionnement introuvable';
  END IF;

  SELECT *
  INTO v_product
  FROM public.products
  WHERE id = v_packaging.product_id
    AND bar_id = v_bar_id
    AND actif = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produit non vendable';
  END IF;

  v_has_variants := public.product_has_active_variants(v_product.id, v_bar_id);

  IF v_has_variants THEN
    IF p_product_variant_id IS NULL THEN
      RAISE EXCEPTION 'Sélectionnez une variante';
    END IF;

    SELECT *
    INTO v_variant
    FROM public.product_variants
    WHERE id = p_product_variant_id
      AND product_id = v_product.id
      AND bar_id = v_bar_id
      AND actif = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Variante introuvable';
    END IF;

    v_size_snapshot := public.normalize_variant_text(v_variant.size);
    v_color_snapshot := public.normalize_variant_text(v_variant.color);
    v_base_unit_price := public.resolve_variant_base_unit_price(v_product, v_variant);
  ELSE
    IF p_product_variant_id IS NOT NULL THEN
      RAISE EXCEPTION 'Variante invalide pour ce produit';
    END IF;

    v_size_snapshot := NULL;
    v_color_snapshot := NULL;
    v_base_unit_price := v_product.unit_price;
  END IF;

  SELECT name
  INTO v_packaging_type_name
  FROM public.packaging_types
  WHERE id = v_packaging.packaging_type_id
    AND bar_id = v_bar_id
    AND actif = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Type de conditionnement introuvable';
  END IF;

  v_catalog_price := public.compute_packaging_price(
    v_base_unit_price,
    v_packaging.quantity,
    v_packaging.optional_price
  );

  v_unit_price := COALESCE(p_unit_price, v_catalog_price);

  SELECT *
  INTO v_existing_line
  FROM public.slate_lines
  WHERE slate_id = p_slate_id
    AND bar_id = v_bar_id
    AND product_packaging_id = p_product_packaging_id
    AND product_variant_id IS NOT DISTINCT FROM p_product_variant_id;

  IF FOUND THEN
    v_line_total := v_existing_line.unit_price * (v_existing_line.quantity + p_quantity);

    UPDATE public.slate_lines
    SET
      quantity = v_existing_line.quantity + p_quantity,
      line_total = v_line_total
    WHERE id = v_existing_line.id
    RETURNING * INTO v_line;
  ELSE
    v_line_total := v_unit_price * p_quantity;

    INSERT INTO public.slate_lines (
      bar_id,
      slate_id,
      product_id,
      product_packaging_id,
      product_variant_id,
      product_name,
      variant_size_snapshot,
      variant_color_snapshot,
      packaging_name,
      quantity,
      unit_price,
      line_total
    )
    VALUES (
      v_bar_id,
      p_slate_id,
      v_product.id,
      v_packaging.id,
      p_product_variant_id,
      v_product.name,
      v_size_snapshot,
      v_color_snapshot,
      v_packaging_type_name,
      p_quantity,
      v_unit_price,
      v_line_total
    )
    RETURNING * INTO v_line;
  END IF;

  IF v_product.is_kitchen_item THEN
    INSERT INTO public.kitchen_items (
      bar_id,
      slate_id,
      slate_line_id,
      client_name_snapshot,
      location_snapshot,
      note_snapshot,
      product_name_snapshot,
      variant_size_snapshot,
      variant_color_snapshot,
      packaging_name_snapshot,
      quantity,
      status
    )
    VALUES (
      v_bar_id,
      p_slate_id,
      v_line.id,
      v_slate.client_name,
      v_slate.location,
      v_slate.note,
      v_product.name,
      v_size_snapshot,
      v_color_snapshot,
      v_packaging_type_name,
      p_quantity,
      'pending'
    );

    v_kitchen_created := true;
  END IF;

  v_slate_total := public.recalculate_slate_total_internal(p_slate_id, v_bar_id);

  RETURN jsonb_build_object(
    'line', public.slate_line_to_json(v_line),
    'slate_total', v_slate_total,
    'kitchen_created', v_kitchen_created
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_slate_line_unit_price(
  p_slate_id uuid,
  p_line_id uuid,
  p_unit_price numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bar_id uuid;
  v_line public.slate_lines%ROWTYPE;
  v_packaging public.product_packagings%ROWTYPE;
  v_product public.products%ROWTYPE;
  v_variant public.product_variants%ROWTYPE;
  v_base_unit_price numeric(10, 2);
  v_unit_price numeric(10, 2);
  v_slate_total numeric(10, 2);
BEGIN
  v_bar_id := public.get_user_bar_id();

  IF v_bar_id IS NULL THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  IF p_unit_price IS NOT NULL AND p_unit_price < 0 THEN
    RAISE EXCEPTION 'Prix invalide';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.slates
    WHERE id = p_slate_id
      AND bar_id = v_bar_id
      AND status = 'open'::public.slate_status
  ) THEN
    RAISE EXCEPTION 'Ardoise introuvable ou clôturée';
  END IF;

  SELECT *
  INTO v_line
  FROM public.slate_lines
  WHERE id = p_line_id
    AND slate_id = p_slate_id
    AND bar_id = v_bar_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ligne introuvable';
  END IF;

  IF p_unit_price IS NULL THEN
    SELECT *
    INTO v_packaging
    FROM public.product_packagings
    WHERE id = v_line.product_packaging_id
      AND bar_id = v_bar_id
      AND actif = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Conditionnement introuvable';
    END IF;

    SELECT *
    INTO v_product
    FROM public.products
    WHERE id = v_line.product_id
      AND bar_id = v_bar_id
      AND actif = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produit non vendable';
    END IF;

    IF v_line.product_variant_id IS NOT NULL THEN
      SELECT *
      INTO v_variant
      FROM public.product_variants
      WHERE id = v_line.product_variant_id
        AND bar_id = v_bar_id
        AND actif = true;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Variante introuvable';
      END IF;

      v_base_unit_price := public.resolve_variant_base_unit_price(v_product, v_variant);
    ELSE
      v_base_unit_price := v_product.unit_price;
    END IF;

    v_unit_price := public.compute_packaging_price(
      v_base_unit_price,
      v_packaging.quantity,
      v_packaging.optional_price
    );
  ELSE
    v_unit_price := p_unit_price;
  END IF;

  UPDATE public.slate_lines
  SET
    unit_price = v_unit_price,
    line_total = v_unit_price * quantity
  WHERE id = v_line.id
  RETURNING * INTO v_line;

  v_slate_total := public.recalculate_slate_total_internal(p_slate_id, v_bar_id);

  RETURN jsonb_build_object(
    'line', public.slate_line_to_json(v_line),
    'slate_total', v_slate_total
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_slate_line_quantity(
  p_slate_id uuid,
  p_line_id uuid,
  p_quantity integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bar_id uuid;
  v_slate public.slates%ROWTYPE;
  v_line public.slate_lines%ROWTYPE;
  v_previous_quantity integer;
  v_product public.products%ROWTYPE;
  v_slate_total numeric(10, 2);
  v_kitchen_created boolean := false;
BEGIN
  v_bar_id := public.get_user_bar_id();

  IF v_bar_id IS NULL THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 99 THEN
    RAISE EXCEPTION 'Quantité invalide';
  END IF;

  SELECT *
  INTO v_slate
  FROM public.slates
  WHERE id = p_slate_id
    AND bar_id = v_bar_id
    AND status = 'open'::public.slate_status
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ardoise introuvable ou clôturée';
  END IF;

  SELECT *
  INTO v_line
  FROM public.slate_lines
  WHERE id = p_line_id
    AND slate_id = p_slate_id
    AND bar_id = v_bar_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ligne introuvable';
  END IF;

  v_previous_quantity := v_line.quantity;

  IF v_previous_quantity = p_quantity THEN
    v_slate_total := v_slate.total;
  ELSE
    UPDATE public.slate_lines
    SET
      quantity = p_quantity,
      line_total = unit_price * p_quantity
    WHERE id = v_line.id
    RETURNING * INTO v_line;

    IF p_quantity > v_previous_quantity THEN
      SELECT *
      INTO v_product
      FROM public.products
      WHERE id = v_line.product_id
        AND bar_id = v_bar_id;

      IF v_product.is_kitchen_item THEN
        INSERT INTO public.kitchen_items (
          bar_id,
          slate_id,
          slate_line_id,
          client_name_snapshot,
          location_snapshot,
          note_snapshot,
          product_name_snapshot,
          variant_size_snapshot,
          variant_color_snapshot,
          packaging_name_snapshot,
          quantity,
          status
        )
        VALUES (
          v_bar_id,
          p_slate_id,
          v_line.id,
          v_slate.client_name,
          v_slate.location,
          v_slate.note,
          v_line.product_name,
          v_line.variant_size_snapshot,
          v_line.variant_color_snapshot,
          v_line.packaging_name,
          p_quantity - v_previous_quantity,
          'pending'
        );

        v_kitchen_created := true;
      END IF;
    END IF;

    v_slate_total := public.recalculate_slate_total_internal(p_slate_id, v_bar_id);
  END IF;

  RETURN jsonb_build_object(
    'line', public.slate_line_to_json(v_line),
    'slate_total', v_slate_total,
    'kitchen_created', v_kitchen_created
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.checkout_slate(
  p_slate_id uuid,
  p_payment_method_id uuid,
  p_created_by uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bar_id uuid;
  v_slate public.slates%ROWTYPE;
  v_sale_id uuid;
BEGIN
  v_bar_id := public.get_user_bar_id();

  IF v_bar_id IS NULL THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  SELECT *
  INTO v_slate
  FROM public.slates
  WHERE id = p_slate_id
    AND bar_id = v_bar_id
    AND status = 'open'::public.slate_status
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ardoise introuvable ou déjà clôturée';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.payment_methods
    WHERE id = p_payment_method_id
      AND bar_id = v_bar_id
      AND actif = true
  ) THEN
    RAISE EXCEPTION 'Moyen de paiement invalide';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.slate_lines
    WHERE slate_id = p_slate_id
      AND bar_id = v_bar_id
  ) THEN
    RAISE EXCEPTION 'Ardoise sans consommation';
  END IF;

  INSERT INTO public.sales (
    bar_id,
    slate_id,
    payment_method_id,
    total,
    created_by
  )
  VALUES (
    v_bar_id,
    p_slate_id,
    p_payment_method_id,
    v_slate.total,
    p_created_by
  )
  RETURNING id INTO v_sale_id;

  INSERT INTO public.sale_lines (
    bar_id,
    sale_id,
    product_name,
    variant_size_snapshot,
    variant_color_snapshot,
    packaging_name,
    quantity,
    unit_price,
    line_total
  )
  SELECT
    bar_id,
    v_sale_id,
    product_name,
    variant_size_snapshot,
    variant_color_snapshot,
    packaging_name,
    quantity,
    unit_price,
    line_total
  FROM public.slate_lines
  WHERE slate_id = p_slate_id
    AND bar_id = v_bar_id;

  UPDATE public.slates
  SET
    status = 'paid'::public.slate_status,
    closed_at = now(),
    updated_at = now()
  WHERE id = p_slate_id;

  RETURN v_sale_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_slate_line(uuid, uuid, integer, numeric, uuid) TO authenticated;
