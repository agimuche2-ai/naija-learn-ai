import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const topics = [
  { id: 1, title: "Separation of Mixtures", level: "SS1", marker: "🔬 SEPARATION OF MIXTURES" },
  { id: 2, title: "Chemical Combination & the Mole", level: "SS2", marker: "⚗️  Topic 2: Chemical Combination" },
  { id: 3, title: "Gas Laws", level: "SS1", marker: "💨  Topic 3: Gas Laws" },
  { id: 4, title: "Atomic Structure & Chemical Bonding", level: "SS1", marker: "⚛️  Topic 4: Atomic Structure" },
  { id: 5, title: "Air & Atmosphere", level: "SS1", marker: "🌬️  Topic 5: Air & Atmosphere" },
  { id: 6, title: "Water & Solutions", level: "SS1", marker: "💧  Topic 6: Water & Solutions" },
  { id: 7, title: "Solubility", level: "SS2", marker: "💧  Topic 6: Water & Solutions" }, // Fallback search
  { id: 8, title: "Environmental Pollution", level: "SS2", marker: "🌿  Topic 8: Environmental Pollution" },
  { id: 9, title: "Acids, Bases & Salts", level: "SS2", marker: "🧪  Topic 9: Acids, Bases & Salts" },
  { id: 10, title: "Oxidation & Reduction (Redox)", level: "SS2", marker: "⚡  Topic 10: Oxidation & Reduction" },
  { id: 11, title: "Electrolysis", level: "SS2", marker: "🔋  Topic 11: Electrolysis" },
  { id: 12, title: "Energy Changes in Reactions", level: "SS3", marker: "🔥  Topic 12: Energy Changes" },
  { id: 13, title: "Rates of Reaction", level: "SS3", marker: "⏱️  Topic 13: Rates of Reaction" },
  { id: 14, title: "Chemical Equilibrium", level: "SS3", marker: "⚖️  Topic 14: Chemical Equilibrium" },
  { id: 15, title: "Non-Metals & Compounds", level: "SS3", marker: "🏭  Topics 15-18: Non-Metals" },
  { id: 16, title: "Metals & Alloys", level: "SS3", marker: "16.1  General Properties of Metals" },
  { id: 17, title: "Organic Chemistry", level: "SS3", marker: "17.1  Why Carbon is Special" },
  { id: 18, title: "Industrial Chemistry", level: "SS3", marker: "18.1  Haber Process" }
];

function cleanContent(text) {
  // Remove page numbers (e.g., "Topic Name   413")
  let cleaned = text.replace(/\t\d+$/gm, '');
  
  // Format headers (e.g., "18.1 Name" -> "### 18.1 Name")
  cleaned = cleaned.replace(/^(\d+\.\d+)\s+(.+)$/gm, '### $1 $2');
  
  // Format sections (e.g., "TYPE" -> "#### TYPE")
  cleaned = cleaned.replace(/^(TYPE|APPLICATION|HOW THE SERIES IS USED|EXAM TIP|DID YOU KNOW|WORKED EXAMPLE)/gm, '#### $1');

  // Add bold to definitions
  cleaned = cleaned.replace(/^(A MIXTURE|AN ELEMENT|A COMPOUND)/gm, '**$1**');

  return cleaned.trim();
}

async function populateNotes() {
  const content = fs.readFileSync('extracted_resource.txt', 'utf-8');
  
  // Delete existing to avoid duplicates and ensure "well-arranged" update
  await supabase.from('study_materials').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  for (const topic of topics) {
    let startIdx = content.indexOf(topic.marker);
    if (startIdx === -1) {
       console.log(`Skipping ${topic.title} - Marker not found`);
       continue;
    }
    
    // For Solubility, we need to find it relative to Topic 6 or a specific marker
    if (topic.id === 7) {
       startIdx = content.indexOf("7.1  Definitions", startIdx);
    }
    
    let endIdx = content.indexOf("PAST QUESTIONS", startIdx);
    if (endIdx === -1 || endIdx < startIdx) {
       // Look for next topic marker
       const nextTopic = topics.find(t => t.id === topic.id + 1);
       if (nextTopic) endIdx = content.indexOf(nextTopic.marker, startIdx);
    }
    
    let rawText = content.slice(startIdx, endIdx).trim();
    let cleaned = cleanContent(rawText);

    console.log(`Inserting ${topic.title}... (${cleaned.length} chars)`);
    
    const { error } = await supabase.from('study_materials').insert({
      title: topic.title,
      topic: "Chemistry",
      class_level: topic.level,
      category: "Chemistry Notes",
      content: cleaned
    });

    if (error) console.error(`Error ${topic.title}:`, error.message);
  }
  
  console.log("Notes population complete!");
}

populateNotes();
