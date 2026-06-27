-- Initialisation automatique des données par défaut d'un bar (tenant)
-- Réexécutable sans erreur (idempotent)

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
