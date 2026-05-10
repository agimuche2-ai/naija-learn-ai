CREATE TABLE IF NOT EXISTS public.study_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  class_level TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DELETE FROM public.study_materials
WHERE category NOT IN ('First Term', 'Second Term', 'Third Term')
   OR class_level NOT IN ('SS1', 'SS2', 'SS3');

ALTER TABLE public.study_materials
DROP CONSTRAINT IF EXISTS study_materials_category_term_check;

ALTER TABLE public.study_materials
ADD CONSTRAINT study_materials_category_term_check
CHECK (category IN ('First Term', 'Second Term', 'Third Term'));

CREATE INDEX IF NOT EXISTS idx_study_materials_class_term
ON public.study_materials(class_level, category);
