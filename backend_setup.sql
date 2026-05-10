-- Master Backend Setup for NaijaTutor

-- 1. Tables & Structure (Ensuring they exist)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.study_materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    class_level TEXT NOT NULL,
    category TEXT NOT NULL CONSTRAINT study_materials_category_term_check CHECK (category IN ('First Term', 'Second Term', 'Third Term')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic TEXT NOT NULL,
    difficulty INTEGER DEFAULT 1,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_index INTEGER NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    topic TEXT NOT NULL,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    accuracy INTEGER NOT NULL,
    avg_difficulty DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attempt_id UUID REFERENCES public.quiz_attempts ON DELETE CASCADE,
    question_id UUID REFERENCES public.questions ON DELETE SET NULL,
    selected_index INTEGER,
    is_correct BOOLEAN,
    difficulty INTEGER,
    topic TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

-- Public read for materials and questions
CREATE POLICY "Public Read Materials" ON public.study_materials FOR SELECT USING (true);
CREATE POLICY "Public Read Questions" ON public.questions FOR SELECT USING (true);

-- User-specific access for attempts and answers
CREATE POLICY "Users can manage own attempts" ON public.quiz_attempts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own quiz answers" ON public.quiz_answers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.quiz_attempts 
            WHERE id = quiz_answers.attempt_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own profiles" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profiles" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 3. Functions & Triggers (Auto-profile creation)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_attempts;
