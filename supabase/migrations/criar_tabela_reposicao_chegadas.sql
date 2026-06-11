CREATE TABLE public.reposicao_chegadas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reposicao_id uuid NOT NULL REFERENCES public.reposicoes(id) ON DELETE CASCADE,
  quantidade integer NOT NULL DEFAULT 0,
  data_chegada date NOT NULL DEFAULT CURRENT_DATE,
  observacao text,
  criado_em timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reposicao_chegadas TO authenticated;
GRANT ALL ON public.reposicao_chegadas TO service_role;

ALTER TABLE public.reposicao_chegadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read reposicao_chegadas" ON public.reposicao_chegadas FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write reposicao_chegadas" ON public.reposicao_chegadas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update reposicao_chegadas" ON public.reposicao_chegadas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete reposicao_chegadas" ON public.reposicao_chegadas FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_reposicao_chegadas_reposicao ON public.reposicao_chegadas(reposicao_id);