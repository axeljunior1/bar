-- Prix forcé sur les lignes d'ardoise (vente)

DROP FUNCTION IF EXISTS public.add_slate_line(uuid, uuid, integer);

CREATE OR REPLACE FUNCTION public.add_slate_line(
  p_slate_id uuid,
  p_product_packaging_id uuid,
  p_quantity integer DEFAULT 1,
  p_unit_price numeric DEFAULT NULL
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
  v_packaging_type_name text;
  v_catalog_price numeric(10, 2);
  v_unit_price numeric(10, 2);
  v_line_total numeric(10, 2);
  v_existing_line public.slate_lines%ROWTYPE;
  v_line public.slate_lines%ROWTYPE;
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
    v_product.unit_price,
    v_packaging.quantity,
    v_packaging.optional_price
  );

  v_unit_price := COALESCE(p_unit_price, v_catalog_price);

  SELECT *
  INTO v_existing_line
  FROM public.slate_lines
  WHERE slate_id = p_slate_id
    AND bar_id = v_bar_id
    AND product_packaging_id = p_product_packaging_id;

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
      product_name,
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
      v_product.name,
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
      v_packaging_type_name,
      p_quantity,
      'pending'
    );

    v_kitchen_created := true;
  END IF;

  v_slate_total := public.recalculate_slate_total_internal(p_slate_id, v_bar_id);

  RETURN jsonb_build_object(
    'line', jsonb_build_object(
      'id', v_line.id,
      'product_packaging_id', v_line.product_packaging_id,
      'product_name', v_line.product_name,
      'packaging_name', v_line.packaging_name,
      'quantity', v_line.quantity,
      'unit_price', v_line.unit_price,
      'line_total', v_line.line_total
    ),
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

    v_unit_price := public.compute_packaging_price(
      v_product.unit_price,
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
    'line', jsonb_build_object(
      'id', v_line.id,
      'product_packaging_id', v_line.product_packaging_id,
      'product_name', v_line.product_name,
      'packaging_name', v_line.packaging_name,
      'quantity', v_line.quantity,
      'unit_price', v_line.unit_price,
      'line_total', v_line.line_total
    ),
    'slate_total', v_slate_total
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_slate_line(uuid, uuid, integer, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_slate_line_unit_price(uuid, uuid, numeric) TO authenticated;
