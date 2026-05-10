import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function check() {
  const { data: materials } = await supabase.from('study_materials').select('*').limit(1);
  const { data: questions } = await supabase.from('questions').select('*').limit(1);
  
  console.log('Material Row:', JSON.stringify(materials?.[0], null, 2));
  console.log('Question Row:', JSON.stringify(questions?.[0], null, 2));
}

check();
