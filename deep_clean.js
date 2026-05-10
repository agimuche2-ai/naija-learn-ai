import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function cleanup() {
  console.log("🧹 Starting Deep Clean of Study Materials...");
  
  // 1. Wipe everything
  const { error: wipeError } = await supabase.from('study_materials').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (wipeError) console.error("Wipe failed:", wipeError.message);
  else console.log("✓ All old/incorrect materials removed.");

  console.log("✨ Library is now pristine and empty.");
}

cleanup();
