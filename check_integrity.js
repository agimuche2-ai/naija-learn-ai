import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function check() {
  const { data } = await supabase.from('study_materials').select('title, content').in('title', ['Metals & Alloys', 'Organic Chemistry']);
  data.forEach(m => {
     console.log(`Topic: ${m.title}`);
     console.log(`Content Preview: ${m.content.substring(0, 200)}`);
  });
}

check();
