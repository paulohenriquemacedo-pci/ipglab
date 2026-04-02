
-- Migrate team data from step 5 to step 7
INSERT INTO project_sections (project_id, step_number, step_name, content, is_completed, created_at, updated_at)
SELECT project_id, 7, 'Equipe do Projeto', 
       json_build_object('team', (content::jsonb)->'team')::text,
       true, now(), now()
FROM project_sections
WHERE step_number = 5 AND content IS NOT NULL AND content::jsonb ? 'team'
ON CONFLICT (project_id, step_number) DO UPDATE 
  SET content = EXCLUDED.content, is_completed = true, updated_at = now();

-- Migrate chronogram data from step 5 to step 8
INSERT INTO project_sections (project_id, step_number, step_name, content, is_completed, created_at, updated_at)
SELECT project_id, 8, 'Cronograma de Execução',
       json_build_object('chronogram', (content::jsonb)->'chronogram')::text,
       true, now(), now()
FROM project_sections
WHERE step_number = 5 AND content IS NOT NULL AND content::jsonb ? 'chronogram'
ON CONFLICT (project_id, step_number) DO UPDATE 
  SET content = EXCLUDED.content, is_completed = true, updated_at = now();
