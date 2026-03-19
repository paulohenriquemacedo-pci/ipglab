ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS escolaridade text,
  ADD COLUMN IF NOT EXISTS renda_mensal text,
  ADD COLUMN IF NOT EXISTS programa_social text;