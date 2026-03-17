
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nome_grupo text,
  ADD COLUMN IF NOT EXISTS funcao_no_grupo text,
  ADD COLUMN IF NOT EXISTS tempo_residencia_municipio text;
