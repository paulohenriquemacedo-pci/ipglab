
-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Perfis de usuários (proponentes)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  person_type TEXT CHECK (person_type IN ('PF', 'PJ')),
  cnpj TEXT,
  artistic_language TEXT,
  state TEXT,
  city TEXT,
  experience_level TEXT CHECK (experience_level IN ('nenhuma', 'basica', 'avancada')),
  bio TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para criar perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Editais pré-cadastrados
CREATE TABLE public.editais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  instrument_type TEXT NOT NULL,
  description TEXT,
  max_budget NUMERIC,
  deadline TIMESTAMPTZ,
  state TEXT,
  artistic_languages TEXT[],
  requirements JSONB,
  checklist JSONB,
  briefing TEXT,
  pdf_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.editais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Editais are viewable by authenticated users" ON public.editais FOR SELECT TO authenticated USING (true);

CREATE TRIGGER update_editais_updated_at BEFORE UPDATE ON public.editais
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Projetos culturais
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  edital_id UUID REFERENCES public.editais(id),
  title TEXT NOT NULL DEFAULT 'Novo Projeto',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'submitted', 'approved')),
  conformity_score INTEGER,
  idea_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seções do projeto (7 etapas do wizard)
CREATE TABLE public.project_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL CHECK (step_number BETWEEN 1 AND 7),
  step_name TEXT NOT NULL,
  content TEXT,
  ai_draft TEXT,
  ai_suggestions TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, step_number)
);

ALTER TABLE public.project_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sections" ON public.project_sections FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_sections.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert own sections" ON public.project_sections FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_sections.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update own sections" ON public.project_sections FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_sections.project_id AND projects.user_id = auth.uid()));

CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON public.project_sections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Chat history para contexto
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  step_number INTEGER,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON public.chat_messages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = chat_messages.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert own messages" ON public.chat_messages FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = chat_messages.project_id AND projects.user_id = auth.uid()));

-- Textos de referência do proponente (voz artística)
CREATE TABLE public.reference_texts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  word_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reference_texts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own references" ON public.reference_texts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own references" ON public.reference_texts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own references" ON public.reference_texts FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket para PDFs de editais
INSERT INTO storage.buckets (id, name, public) VALUES ('edital-pdfs', 'edital-pdfs', false);
CREATE POLICY "Users can upload edital PDFs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'edital-pdfs');
CREATE POLICY "Users can view own edital PDFs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'edital-pdfs');
