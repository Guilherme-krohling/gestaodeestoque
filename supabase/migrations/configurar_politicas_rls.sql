-- Lock down all tables to authenticated users only
-- Drop existing public policies
DROP POLICY IF EXISTS "public read materiais" ON public.materiais;
DROP POLICY IF EXISTS "public write materiais" ON public.materiais;
DROP POLICY IF EXISTS "public update materiais" ON public.materiais;
DROP POLICY IF EXISTS "public delete materiais" ON public.materiais;

DROP POLICY IF EXISTS "public read estoque" ON public.estoque;
DROP POLICY IF EXISTS "public write estoque" ON public.estoque;
DROP POLICY IF EXISTS "public update estoque" ON public.estoque;
DROP POLICY IF EXISTS "public delete estoque" ON public.estoque;

DROP POLICY IF EXISTS "public read historico" ON public.historico;
DROP POLICY IF EXISTS "public write historico" ON public.historico;

DROP POLICY IF EXISTS "public read procedimentos" ON public.procedimentos;
DROP POLICY IF EXISTS "public write procedimentos" ON public.procedimentos;
DROP POLICY IF EXISTS "public delete procedimentos" ON public.procedimentos;

-- materiais: authenticated full access
CREATE POLICY "auth read materiais" ON public.materiais FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write materiais" ON public.materiais FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update materiais" ON public.materiais FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete materiais" ON public.materiais FOR DELETE TO authenticated USING (true);

-- estoque: authenticated full access
CREATE POLICY "auth read estoque" ON public.estoque FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write estoque" ON public.estoque FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update estoque" ON public.estoque FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete estoque" ON public.estoque FOR DELETE TO authenticated USING (true);

-- historico: append-only for authenticated
CREATE POLICY "auth read historico" ON public.historico FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write historico" ON public.historico FOR INSERT TO authenticated WITH CHECK (true);

-- procedimentos: authenticated read/write/delete (no update needed)
CREATE POLICY "auth read procedimentos" ON public.procedimentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write procedimentos" ON public.procedimentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth delete procedimentos" ON public.procedimentos FOR DELETE TO authenticated USING (true);