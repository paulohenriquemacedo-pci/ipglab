-- Semeia o Edital Octo Marques no banco de dados
INSERT INTO public.editais (id, name, description, instrument_type, state, deadline, max_budget, active, briefing)
VALUES (
  gen_random_uuid(),
  'Edital Octo Marques 110 Anos (PNAB)',
  'Seleção de projetos culturais para fomento à cultura no Município de Goiás através da Lei Aldir Blanc (PNAB). Foco em circulação, formação e produção artística.',
  'fomento',
  'GO',
  '2026-05-15 23:59:59',
  23400,
  true,
  'Edital de Chamamento Público nº 01/2026. Objetivo: Seleção de projetos. Categorias: Artes Visuais, Artesanato, Audiovisual, Cultura Popular, Educação Patrimonial, Gastronomia, Literatura e Música. Público: Agentes residentes no município há pelo menos 2 anos. Critérios: Atuação reconhecida (20 pts), Integração/Inovação (30 pts), Vulnerabilidade (15 pts), Impacto Comunitário (15 pts), Patrimônio (10 pts), Acessibilidade (10 pts).'
);
