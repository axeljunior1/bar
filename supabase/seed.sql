-- Script de seed pour environnement de développement
-- À exécuter après création d'un utilisateur via Supabase Auth

-- Exemple d'initialisation manuelle :
-- 1. Créer un bar
-- 2. Lier le profil auth.users -> profiles
-- 3. Insérer catégories, conditionnements et moyens de paiement par défaut

-- INSERT INTO public.bars (name) VALUES ('Mon Bar') RETURNING id;
-- INSERT INTO public.profiles (id, bar_id, role, full_name)
--   VALUES ('<auth-user-uuid>', '<bar-uuid>', 'owner', 'Propriétaire');

CREATE OR REPLACE FUNCTION public.seed_bar_defaults(p_bar_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.bar_settings (bar_id) VALUES (p_bar_id)
  ON CONFLICT (bar_id) DO NOTHING;

  INSERT INTO public.payment_methods (bar_id, name, sort_order) VALUES
    (p_bar_id, 'Espèces', 1),
    (p_bar_id, 'Carte bancaire', 2)
  ON CONFLICT (bar_id, name) DO NOTHING;

  INSERT INTO public.packaging_types (bar_id, name, sort_order) VALUES
    (p_bar_id, 'Unité', 1),
    (p_bar_id, 'Pack 2', 2),
    (p_bar_id, 'Pack 3', 3),
    (p_bar_id, 'Pack 4', 4),
    (p_bar_id, 'Bouteille', 5),
    (p_bar_id, 'Verre', 6),
    (p_bar_id, 'Pichet', 7)
  ON CONFLICT (bar_id, name) DO NOTHING;
END;
$$;
