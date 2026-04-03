
CREATE TABLE public.tracker_state (
  id TEXT PRIMARY KEY DEFAULT 'main',
  subs JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  gid_counter INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tracker_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tracker state"
  ON public.tracker_state FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update tracker state"
  ON public.tracker_state FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can insert tracker state"
  ON public.tracker_state FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
