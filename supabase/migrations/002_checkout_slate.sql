-- Encaissement transactionnel d'une ardoise ouverte

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
    packaging_name,
    quantity,
    unit_price,
    line_total
  )
  SELECT
    bar_id,
    v_sale_id,
    product_name,
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

GRANT EXECUTE ON FUNCTION public.checkout_slate(uuid, uuid, uuid) TO authenticated;
