import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function checkDb() {
  console.log("Checking study_materials...");
  const { data, error, count } = await supabase
    .from('study_materials')
    .select('class_level, category', { count: 'exact' });

  if (error) {
    console.error("Error fetching:", error);
    return;
  }

  console.log(`Total rows: ${count}`);
  
  const breakdown = {};
  if (data) {
    for (const row of data) {
      const key = `${row.class_level} - ${row.category}`;
      breakdown[key] = (breakdown[key] || 0) + 1;
    }
  }
  console.log("Breakdown:");
  console.table(breakdown);
}

checkDb();
