-- Adiciona campos exigidos no anexo II para o cadastro de projeto (project_registrations)
ALTER TABLE public.project_registrations
  ADD COLUMN IF NOT EXISTS estrategia_divulgacao text,
  ADD COLUMN IF NOT EXISTS possui_fontes_recurso boolean,
  ADD COLUMN IF NOT EXISTS fontes_recurso_tipos jsonb,
  ADD COLUMN IF NOT EXISTS fontes_recurso_detalhe text,
  ADD COLUMN IF NOT EXISTS prev_venda_ingressos boolean,
  ADD COLUMN IF NOT EXISTS prev_venda_ingressos_detalhe text;
