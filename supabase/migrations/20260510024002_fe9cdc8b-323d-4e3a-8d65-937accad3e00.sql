
-- Enums
CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'admin');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  school TEXT,
  class_level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role function (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Auto-create profile + default student role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE PLPGSQL AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Questions
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  difficulty INT NOT NULL CHECK (difficulty BETWEEN 1 AND 3),
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Quiz attempts
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  score INT NOT NULL,
  total INT NOT NULL,
  accuracy NUMERIC(5,2) NOT NULL,
  avg_difficulty NUMERIC(3,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Quiz answers
CREATE TABLE public.quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id),
  selected_index INT,
  is_correct BOOLEAN NOT NULL,
  difficulty INT NOT NULL,
  topic TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- profiles
CREATE POLICY "profiles self select" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- user_roles
CREATE POLICY "roles self read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles admin manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- questions
CREATE POLICY "questions read all" ON public.questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "questions admin manage" ON public.questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- quiz_attempts
CREATE POLICY "attempts owner read" ON public.quiz_attempts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "attempts owner insert" ON public.quiz_attempts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- quiz_answers
CREATE POLICY "answers via attempt read" ON public.quiz_answers FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.quiz_attempts a WHERE a.id = attempt_id AND
      (a.user_id = auth.uid() OR public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin')))
  );
CREATE POLICY "answers via attempt insert" ON public.quiz_answers FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.quiz_attempts a WHERE a.id = attempt_id AND a.user_id = auth.uid())
  );

-- Seed Chemistry questions (SSS-level)
INSERT INTO public.questions (topic, difficulty, question, options, correct_index, explanation) VALUES
('Atomic Structure', 1, 'Which subatomic particle has no charge?', '["Proton","Neutron","Electron","Positron"]'::jsonb, 1, 'Neutrons are electrically neutral.'),
('Atomic Structure', 1, 'The atomic number of an element equals the number of:', '["Neutrons","Protons","Nucleons","Electrons in outer shell"]'::jsonb, 1, 'Atomic number = number of protons.'),
('Atomic Structure', 2, 'An atom has 17 protons and 18 neutrons. Its mass number is:', '["17","18","35","1"]'::jsonb, 2, 'Mass number = protons + neutrons = 35.'),
('Atomic Structure', 2, 'Isotopes of an element differ in:', '["Atomic number","Number of electrons","Number of neutrons","Chemical properties"]'::jsonb, 2, 'Isotopes share protons but differ in neutrons.'),
('Atomic Structure', 3, 'The electron configuration of Cl (Z=17) is:', '["2,8,7","2,8,8","2,7,8","2,8,6,1"]'::jsonb, 0, 'Chlorine: 2,8,7.'),
('Periodic Table', 1, 'Group 1 elements are commonly called:', '["Halogens","Noble gases","Alkali metals","Transition metals"]'::jsonb, 2, 'Group 1 = alkali metals.'),
('Periodic Table', 2, 'Atomic radius generally ___ across a period from left to right.', '["Increases","Decreases","Stays same","Doubles"]'::jsonb, 1, 'Increasing nuclear charge pulls electrons closer.'),
('Periodic Table', 2, 'Which element has the highest electronegativity?', '["Oxygen","Fluorine","Nitrogen","Chlorine"]'::jsonb, 1, 'Fluorine is the most electronegative element.'),
('Periodic Table', 3, 'Diagonal relationship is observed between Li and:', '["Na","Mg","Be","Al"]'::jsonb, 1, 'Li-Mg show similar properties (diagonal relationship).'),
('Chemical Bonding', 1, 'A covalent bond is formed by:', '["Transfer of electrons","Sharing of electrons","Loss of protons","Attraction of ions"]'::jsonb, 1, 'Covalent bonds share electrons.'),
('Chemical Bonding', 2, 'Which compound has ionic bonding?', '["H2O","CO2","NaCl","CH4"]'::jsonb, 2, 'NaCl is ionic.'),
('Chemical Bonding', 2, 'The shape of a methane (CH4) molecule is:', '["Linear","Trigonal planar","Tetrahedral","Bent"]'::jsonb, 2, 'CH4 is tetrahedral (109.5°).'),
('Chemical Bonding', 3, 'Which has the highest boiling point?', '["HF","HCl","HBr","HI"]'::jsonb, 0, 'HF has hydrogen bonding.'),
('Stoichiometry', 1, 'How many moles are in 36 g of water (M=18 g/mol)?', '["1","2","18","36"]'::jsonb, 1, '36/18 = 2 moles.'),
('Stoichiometry', 2, 'Avogadro''s number is approximately:', '["6.02 × 10^22","6.02 × 10^23","3.01 × 10^23","9.11 × 10^23"]'::jsonb, 1, '6.022 × 10^23 particles per mole.'),
('Stoichiometry', 2, 'The molar mass of CaCO3 is (Ca=40, C=12, O=16):', '["80","100","60","116"]'::jsonb, 1, '40+12+48 = 100 g/mol.'),
('Stoichiometry', 3, 'In 2H2 + O2 → 2H2O, how many moles of O2 react with 8 moles of H2?', '["2","4","8","16"]'::jsonb, 1, 'Ratio 2:1 → 8/2 = 4 moles O2.'),
('Acids and Bases', 1, 'The pH of a neutral solution at 25°C is:', '["0","7","14","1"]'::jsonb, 1, 'Neutral pH = 7.'),
('Acids and Bases', 1, 'Litmus paper turns ___ in acidic solution.', '["Blue","Red","Green","Colourless"]'::jsonb, 1, 'Acid turns blue litmus red.'),
('Acids and Bases', 2, 'Which is a strong base?', '["NH3","NaOH","CH3COOH","H2CO3"]'::jsonb, 1, 'NaOH dissociates completely.'),
('Acids and Bases', 3, 'A solution of pH 4 is how many times more acidic than pH 6?', '["2","10","20","100"]'::jsonb, 3, 'Each unit = 10x; 2 units = 100x.'),
('Electrochemistry', 1, 'Electrolysis requires:', '["AC current","DC current","No current","Heat only"]'::jsonb, 1, 'Direct current is required.'),
('Electrochemistry', 2, 'In a galvanic cell, oxidation occurs at the:', '["Cathode","Anode","Salt bridge","Wire"]'::jsonb, 1, 'Anode = oxidation.'),
('Electrochemistry', 3, 'The standard hydrogen electrode has a potential of:', '["+1.00 V","-1.00 V","0.00 V","+0.76 V"]'::jsonb, 2, 'SHE is defined as 0.00 V.'),
('Organic Chemistry', 1, 'The general formula of alkanes is:', '["CnH2n","CnH2n+2","CnH2n-2","CnHn"]'::jsonb, 1, 'Alkanes: CnH2n+2.'),
('Organic Chemistry', 1, 'Ethene contains a:', '["Single bond","Double bond","Triple bond","Aromatic ring"]'::jsonb, 1, 'C=C double bond.'),
('Organic Chemistry', 2, 'Which functional group is in ethanol?', '["-COOH","-OH","-CHO","-NH2"]'::jsonb, 1, 'Hydroxyl group.'),
('Organic Chemistry', 2, 'Fermentation of glucose produces ethanol and:', '["O2","CO2","H2O","CH4"]'::jsonb, 1, 'C6H12O6 → 2 C2H5OH + 2 CO2.'),
('Organic Chemistry', 3, 'The IUPAC name of (CH3)2CHCH2OH is:', '["1-butanol","2-methyl-1-propanol","2-butanol","Isopropanol"]'::jsonb, 1, '2-methylpropan-1-ol.'),
('Gas Laws', 1, 'Boyle''s law relates:', '["P and T","V and T","P and V","n and V"]'::jsonb, 2, 'PV = constant at constant T.'),
('Gas Laws', 2, 'At STP, 1 mole of gas occupies:', '["11.2 L","22.4 L","24.0 L","1.0 L"]'::jsonb, 1, '22.4 L at STP.'),
('Gas Laws', 3, 'A gas at 2 atm and 300 K is heated to 600 K at constant V. New pressure is:', '["1 atm","2 atm","3 atm","4 atm"]'::jsonb, 3, 'P/T constant: 2*(600/300)=4 atm.');
