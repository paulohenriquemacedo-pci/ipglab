
CREATE TABLE public.project_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipo de pessoa
  person_type TEXT,
  
  -- Dados pessoais (PF)
  full_name TEXT,
  nome_social TEXT,
  cpf TEXT,
  rg TEXT,
  rg_orgao TEXT,
  data_nascimento DATE,
  email_contato TEXT,
  telefone TEXT,
  cnpj_mei TEXT,
  
  -- Dados PJ
  razao_social TEXT,
  nome_fantasia TEXT,
  cnpj TEXT,
  num_representantes_legais TEXT,
  
  -- Endereço
  endereco TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cep TEXT,
  city TEXT,
  state TEXT,
  
  -- Bancários
  banco TEXT,
  agencia TEXT,
  conta_bancaria TEXT,
  tipo_conta_bancaria TEXT,
  
  -- Perfil sociocultural
  comunidade_tradicional TEXT,
  genero TEXT,
  lgbtqiapn BOOLEAN DEFAULT false,
  lgbtqiapn_tipo TEXT,
  raca_cor_etnia TEXT,
  pcd BOOLEAN DEFAULT false,
  pcd_tipo TEXT,
  escolaridade TEXT,
  renda_mensal TEXT,
  programa_social TEXT,
  funcao_profissao TEXT,
  bio TEXT,
  
  -- Cotas
  concorre_cotas BOOLEAN DEFAULT false,
  cota_tipo TEXT,
  
  -- Categoria (varia por edital)
  categoria_inscricao TEXT,
  
  -- Coletivo
  representa_coletivo BOOLEAN DEFAULT false,
  nome_grupo TEXT,
  funcao_no_grupo TEXT,
  ano_criacao_coletivo TEXT,
  qtd_pessoas_coletivo TEXT,
  membros_coletivo JSONB DEFAULT '[]'::jsonb,
  
  -- Público e acessibilidade
  perfil_publico TEXT,
  acao_cultural_publico TEXT[],
  acessibilidade_arquitetonica TEXT[],
  acessibilidade_comunicacional TEXT[],
  acessibilidade_atitudinal TEXT[],
  acessibilidade_descricao TEXT,
  locais_execucao TEXT,
  
  -- Testemunha (residência)
  tempo_residencia_municipio TEXT,
  testemunha_nome TEXT,
  testemunha_cpf TEXT,
  testemunha_rg TEXT,
  testemunha_telefone TEXT,
  testemunha_endereco TEXT,
  
  -- Trajetória (premiação)
  trajetoria_inicio TEXT,
  trajetoria_acoes TEXT,
  trajetoria_impacto TEXT,
  trajetoria_outras_areas TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(project_id)
);

ALTER TABLE public.project_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own registrations" ON public.project_registrations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own registrations" ON public.project_registrations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registrations" ON public.project_registrations
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_project_registrations_updated_at
  BEFORE UPDATE ON public.project_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
