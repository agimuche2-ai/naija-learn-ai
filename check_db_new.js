import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function check() {
  const { data: materials } = await supabase.from('study_materials').select('*').order('created_at', { ascending: false }).limit(5);
  
  materials.forEach(m => {
     console.log('---');
     console.log(`Title: ${m.title}`);
     console.log(`Category: ${m.category}`);
     console.log(`Content Preview: ${m.content.substring(0, 100)}`);
  });
}

check();
