ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tipo_conta_bancaria text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS acessibilidade_descricao text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cnpj_mei text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('user-documents', 'user-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);