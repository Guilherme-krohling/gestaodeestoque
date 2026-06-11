
CREATE TABLE public.materiais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  referencia_cfn TEXT,
  tamanho TEXT,
  estoque_minimo INTEGER NOT NULL DEFAULT 0,
  fornecedor_padrao TEXT,
  unidade TEXT NOT NULL DEFAULT 'unidade',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES public.materiais(id) ON DELETE CASCADE,
  lote TEXT NOT NULL,
  validade DATE,
  data_contagem DATE DEFAULT CURRENT_DATE,
  saldo_inicial INTEGER NOT NULL DEFAULT 0,
  entradas INTEGER NOT NULL DEFAULT 0,
  saidas INTEGER NOT NULL DEFAULT 0,
  saldo_atual INTEGER NOT NULL DEFAULT 0,
  ultima_movimentacao TIMESTAMPTZ DEFAULT now(),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_estoque_material ON public.estoque(material_id);
CREATE INDEX idx_estoque_validade ON public.estoque(validade);

CREATE TABLE public.historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  tipo TEXT NOT NULL,
  material_id UUID REFERENCES public.materiais(id) ON DELETE SET NULL,
  material_nome TEXT,
  referencia_cfn TEXT,
  tamanho TEXT,
  lote TEXT,
  validade DATE,
  paciente TEXT,
  convenio TEXT,
  procedimento TEXT,
  quantidade INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_historico_criado_em ON public.historico(criado_em DESC);
CREATE INDEX idx_historico_tipo ON public.historico(tipo);

CREATE TABLE public.procedimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.procedimentos (nome) VALUES
  ('Angioplastia'),
  ('Angioplastia + stent'),
  ('Endoprótese');

ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read materiais" ON public.materiais FOR SELECT USING (true);
CREATE POLICY "public write materiais" ON public.materiais FOR INSERT WITH CHECK (true);
CREATE POLICY "public update materiais" ON public.materiais FOR UPDATE USING (true);
CREATE POLICY "public delete materiais" ON public.materiais FOR DELETE USING (true);

CREATE POLICY "public read estoque" ON public.estoque FOR SELECT USING (true);
CREATE POLICY "public write estoque" ON public.estoque FOR INSERT WITH CHECK (true);
CREATE POLICY "public update estoque" ON public.estoque FOR UPDATE USING (true);
CREATE POLICY "public delete estoque" ON public.estoque FOR DELETE USING (true);

CREATE POLICY "public read historico" ON public.historico FOR SELECT USING (true);
CREATE POLICY "public write historico" ON public.historico FOR INSERT WITH CHECK (true);

CREATE POLICY "public read procedimentos" ON public.procedimentos FOR SELECT USING (true);
CREATE POLICY "public write procedimentos" ON public.procedimentos FOR INSERT WITH CHECK (true);
CREATE POLICY "public delete procedimentos" ON public.procedimentos FOR DELETE USING (true);
