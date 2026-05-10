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
  { id: 7, title: "Solubility", level: "SS2", marker: "7.1  Definitions" },
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

function termForTopic(topic) {
  const termsById = {
    1: "First Term",
    2: "Second Term",
    3: "Second Term",
    4: "First Term",
    5: "Third Term",
    6: "Third Term",
    7: "Third Term",
    8: "Third Term",
    9: "Third Term",
    10: "First Term",
    11: "First Term",
    12: "Second Term",
    13: "Second Term",
    14: "Second Term",
    15: "Second Term",
    16: "Second Term",
    17: "First Term",
    18: "Third Term",
  };

  return termsById[topic.id];
}

function cleanContent(text) {
  let cleaned = text.replace(/\t\d+$/gm, '');
  cleaned = cleaned.replace(/^(\d+\.\d+)\s+(.+)$/gm, '### $1 $2');
  cleaned = cleaned.replace(/^(TYPE|APPLICATION|HOW IT WORKS|HOW THE SERIES IS USED|EXAM TIP|DID YOU KNOW|WORKED EXAMPLE|EXAMPLES|STEPS|SUBSTANCES)/gm, '#### $1');
  cleaned = cleaned.replace(/^(A MIXTURE|AN ELEMENT|A COMPOUND|A MOLE|A REACTION)/gm, '**$1**');
  return cleaned.trim();
}

async function populate() {
  const content = fs.readFileSync('extracted_resource.txt', 'utf-8');
  const lines = content.split('\n');

  console.log("Cleaning old data...");
  await supabase.from('study_materials').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    const nextTopic = topics[i+1];
    
    console.log(`\n--- Processing Topic: ${topic.title} ---`);
    
    let startIdx = content.indexOf(topic.marker, 4000); 
    if (startIdx === -1) startIdx = content.indexOf(topic.marker); 
    
    if (startIdx === -1) {
       console.log(`Marker not found for ${topic.title}`);
       continue;
    }

    // Hard stop at next topic marker to prevent leakage
    let searchLimit = nextTopic ? content.indexOf(nextTopic.marker, startIdx + 100) : content.length;
    if (searchLimit === -1) searchLimit = content.length;

    let pastQsIdx = content.indexOf("PAST QUESTIONS", startIdx);
    if (pastQsIdx === -1 || pastQsIdx > searchLimit) pastQsIdx = searchLimit;

    let answersIdx = content.indexOf("📋  ANSWERS & DETAILED EXPLANATIONS", pastQsIdx);
    if (answersIdx === -1 || (nextTopic && answersIdx > content.indexOf(nextTopic.marker, pastQsIdx))) {
       answersIdx = searchLimit;
    }
    
    // Notes
    let notesText = content.slice(startIdx, pastQsIdx).trim();
    let cleanedNotes = cleanContent(notesText);
    
    await supabase.from('study_materials').insert({
      title: topic.title,
      topic: "Chemistry",
      class_level: topic.level,
      category: termForTopic(topic),
      content: cleanedNotes
    });
    console.log(`✓ Notes inserted`);

    // Questions
    const topicQs = [];
    const qStartLine = content.substring(0, pastQsIdx).split('\n').length;
    const qEndLine = content.substring(0, answersIdx).split('\n').length;
    const solStartLine = content.substring(0, answersIdx).split('\n').length;
    const solEndLine = lines.length; // Be inclusive for solutions

    for (let j = 1; j <= 300; j++) {
      const qMarker = `Q${j}.`;
      const solMarker = `Question ${j}`;
      
      let qText = "";
      let options = [];
      let foundQ = false;

      for (let l = qStartLine; l < qEndLine; l++) {
        if (lines[l]?.trim().startsWith(qMarker)) {
          foundQ = true;
          let current = l + 1;
          while (current < qEndLine && !lines[current]?.trim()) current++;
          qText = lines[current]?.trim() || "";
          
          let optCount = 0;
          while (optCount < 4 && current < qEndLine) {
            current++;
            const optLine = lines[current]?.trim();
            if (optLine && (optLine.startsWith('A.') || optLine.startsWith('B.') || optLine.startsWith('C.') || optLine.startsWith('D.'))) {
              options.push(optLine.substring(3).trim());
              optCount++;
            }
          }
          break;
        }
      }
      
      if (!foundQ) continue;

      let answer = "";
      let explanation = "";
      let foundSol = false;

      for (let l = solStartLine; l < solEndLine; l++) {
        if (lines[l]?.trim() === solMarker) {
          foundSol = true;
          let current = l + 1;
          while (current < solEndLine) {
            const line = lines[current]?.trim();
            if (line && line.startsWith('✅ ANSWER:')) {
              answer = line.split(':')[1].trim().substring(0, 1);
            } else if (line && line.startsWith('📝 EXPLANATION:')) {
              explanation = line.split(':')[1].trim();
              let nextLine = current + 1;
              while (nextLine < solEndLine && lines[nextLine].trim() && !lines[nextLine].trim().startsWith('Question')) {
                 explanation += " " + lines[nextLine].trim();
                 nextLine++;
              }
              break;
            }
            current++;
            if (lines[current]?.trim().startsWith('Question')) break;
          }
          break;
        }
      }
      
      if (foundQ && foundSol && options.length === 4) {
        topicQs.push({
          topic: topic.title,
          difficulty: 1 + (j % 3),
          question: qText,
          options: options,
          correct_index: ['A', 'B', 'C', 'D'].indexOf(answer),
          explanation: explanation
        });
      }
    }
    
    if (topicQs.length > 0) {
      for (let j = 0; j < topicQs.length; j += 50) {
         await supabase.from('questions').insert(topicQs.slice(j, j + 50));
      }
      console.log(`✓ ${topicQs.length} Questions inserted`);
    }
  }

  console.log("\nPopulation Complete!");
}

populate();
