ALTER TABLE public.historico ADD COLUMN IF NOT EXISTS cirurgia_id uuid;

CREATE POLICY "auth update historico" ON public.historico FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete historico" ON public.historico FOR DELETE TO authenticated USING (true);
