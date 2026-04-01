-- Migration para expandir a tabela projects para o formato Edital Octo Marques
-- Adiciona campos narrativos diretos, modalidades e JSON para orçamento e anexos.

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS modality TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS objectives TEXT,
ADD COLUMN IF NOT EXISTS goals TEXT,
ADD COLUMN IF NOT EXISTS audience TEXT,
ADD COLUMN IF NOT EXISTS justification TEXT,
ADD COLUMN IF NOT EXISTS accessibility TEXT,
ADD COLUMN IF NOT EXISTS democratization TEXT,
ADD COLUMN IF NOT EXISTS chronogram TEXT,
ADD COLUMN IF NOT EXISTS local TEXT,
ADD COLUMN IF NOT EXISTS team TEXT,
ADD COLUMN IF NOT EXISTS budget JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS annexes JSONB DEFAULT '[]'::jsonb;
