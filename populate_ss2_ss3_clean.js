import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const ss2ss3Topics = [
  { title: "Solubility", level: "SS2", marker: "7.1  Definitions" },
  { title: "Environmental Pollution", level: "SS2", marker: "🌿  Topic 8: Environmental Pollution" },
  { title: "Acids, Bases & Salts", level: "SS2", marker: "🧪  Topic 9: Acids, Bases & Salts" },
  { title: "Oxidation & Reduction (Redox)", level: "SS2", marker: "⚡  Topic 10: Oxidation & Reduction" },
  { title: "Electrolysis", level: "SS2", marker: "🔋  Topic 11: Electrolysis" },
  { title: "Energy Changes", level: "SS3", marker: "🔥  Topic 12: Energy Changes" },
  { title: "Rates of Reaction", level: "SS3", marker: "⏱️  Topic 13: Rates of Reaction" },
  { title: "Chemical Equilibrium", level: "SS3", marker: "⚖️  Topic 14: Chemical Equilibrium" },
  { title: "Organic Chemistry", level: "SS3", marker: "17.1  Why Carbon is Special" },
  { title: "Industrial Chemistry", level: "SS3", marker: "18.1  Haber Process" }
];

function termForTopic(topic) {
  if (["Oxidation & Reduction (Redox)", "Electrolysis", "Organic Chemistry"].includes(topic.title)) {
    return "First Term";
  }
  if (["Solubility", "Environmental Pollution", "Acids, Bases & Salts", "Industrial Chemistry"].includes(topic.title)) {
    return "Third Term";
  }
  return "Second Term";
}

function superClean(text) {
  // Remove all asterisks
  let cleaned = text.replace(/\*/g, '');
  // Fix headers
  cleaned = cleaned.replace(/^(\d+\.\d+)\s+(.+)$/gm, '### $1 $2');
  return cleaned.trim();
}

async function populate() {
  const content = fs.readFileSync('extracted_resource.txt', 'utf-8');
  console.log("🧹 Populating Cleaned SS2 & SS3 Library (No Asterisks)...");

  for (const topic of ss2ss3Topics) {
    let startIdx = content.indexOf(topic.marker, 4000);
    if (startIdx === -1) startIdx = content.indexOf(topic.marker);
    
    if (startIdx === -1) continue;

    let pastQsIdx = content.indexOf("PAST QUESTIONS", startIdx);
    if (pastQsIdx === -1) pastQsIdx = startIdx + 5000; // safety

    let rawNotes = content.slice(startIdx, pastQsIdx).trim();
    let cleanNotes = superClean(rawNotes);

    await supabase.from('study_materials').insert({
      title: topic.title,
      topic: "Chemistry",
      class_level: topic.level,
      category: termForTopic(topic),
      content: cleanNotes
    });
    console.log(`✓ ${topic.title} (Clean)`);
  }
  console.log("🎊 SS2 & SS3 Re-population Complete!");
}

populate();
