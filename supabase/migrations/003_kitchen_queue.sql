-- Module Cuisine : file d'attente des repas à préparer

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_kitchen_item boolean NOT NULL DEFAULT false;

ALTER TABLE public.slates
  ADD COLUMN IF NOT EXISTS location text;

CREATE TABLE public.kitchen_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id uuid NOT NULL REFERENCES public.bars (id) ON DELETE RESTRICT,
  slate_id uuid NOT NULL REFERENCES public.slates (id) ON DELETE RESTRICT,
  slate_line_id uuid NOT NULL REFERENCES public.slate_lines (id) ON DELETE RESTRICT,
  client_name_snapshot text NOT NULL,
  location_snapshot text,
  note_snapshot text,
  product_name_snapshot text NOT NULL,
  packaging_name_snapshot text,
  quantity numeric(10, 3) NOT NULL CHECK (quantity > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'served')),
  created_at timestamptz NOT NULL DEFAULT now(),
  served_at timestamptz
);

CREATE INDEX kitchen_items_bar_id_idx ON public.kitchen_items (bar_id);
CREATE INDEX kitchen_items_status_idx ON public.kitchen_items (bar_id, status, created_at);

ALTER TABLE public.kitchen_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY kitchen_items_select ON public.kitchen_items
  FOR SELECT USING (bar_id = public.get_user_bar_id());

CREATE POLICY kitchen_items_insert ON public.kitchen_items
  FOR INSERT WITH CHECK (bar_id = public.get_user_bar_id());

CREATE POLICY kitchen_items_update ON public.kitchen_items
  FOR UPDATE USING (bar_id = public.get_user_bar_id());
