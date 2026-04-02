ALTER TABLE public.project_registrations 
  ADD COLUMN IF NOT EXISTS possui_fontes_recurso boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS fontes_recurso_tipos text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fontes_recurso_detalhe text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS prev_venda_ingressos boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS prev_venda_ingressos_detalhe text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS estrategia_divulgacao text DEFAULT NULL;