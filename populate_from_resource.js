import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function parseAndPopulate() {
  const content = fs.readFileSync('extracted_resource.txt', 'utf-8');
  const lines = content.split('\n');

  // 1. POPULATE STUDY MATERIAL (TOPIC 1 example)
  const topic1Title = "Separation of Mixtures";
  const topic1Level = "SS1";
  let topic1Content = "";
  let inTopic1 = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes("🔬 SEPARATION OF MIXTURES")) {
      inTopic1 = true;
      continue;
    }
    if (line.includes("PAST QUESTIONS")) {
      inTopic1 = false;
      break;
    }
    if (inTopic1) {
      topic1Content += lines[i] + "\n";
    }
  }

  if (topic1Content) {
    console.log("Found Topic 1 Content. Length:", topic1Content.length);
    const { error } = await supabase.from('study_materials').insert({
      title: topic1Title,
      topic: "General Chemistry",
      class_level: topic1Level,
      content: topic1Content.trim()
    });
    if (error) console.error("Error inserting material:", error);
    else console.log("Topic 1 Material inserted!");
  }

  // 2. POPULATE QUESTIONS (Sample)
  // Parsing questions is harder, but look for "Q1. (JAMB 1983)"
  // Format: Q1. (JAMB 1983) \n Question \n A. ... \n B. ... \n C. ... \n D. ...
  // Answer & Explanation usually follow later in the book or right after.
  // I'll need to find where the answers are.
}

parseAndPopulate();
