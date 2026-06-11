CREATE TABLE public.reposicoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID REFERENCES public.materiais(id) ON DELETE SET NULL,
  material_nome TEXT,
  tamanho TEXT,
  quantidade INTEGER NOT NULL DEFAULT 0,
  data_pedido DATE NOT NULL DEFAULT CURRENT_DATE,
  data_chegada DATE,
  fornecedor TEXT,
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reposicoes TO authenticated;
GRANT ALL ON public.reposicoes TO service_role;

ALTER TABLE public.reposicoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read reposicoes" ON public.reposicoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write reposicoes" ON public.reposicoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update reposicoes" ON public.reposicoes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete reposicoes" ON public.reposicoes FOR DELETE TO authenticated USING (true);