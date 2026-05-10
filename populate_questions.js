import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function populateQuestions() {
  const content = fs.readFileSync('extracted_resource.txt', 'utf-8');
  const lines = content.split('\n');

  const questions = [];
  const startLine = 39825; // Line where Q1 starts
  const endLine = 43530;   // Line where Mixed Questions end
  
  const solStartLine = 43543; // Line where Solution 1 starts

  // Helper to parse a block of text into a Question object
  // For simplicity, I'll extract the first 50 questions
  for (let i = 1; i <= 50; i++) {
    const qMarker = `Q${i}.`;
    const solMarker = `Question ${i}`;
    
    // Find Question
    let qText = "";
    let options = [];
    let topic = "Mixed Chemistry";
    
    // Scan for question
    let foundQ = false;
    for (let l = startLine; l < endLine; l++) {
      if (lines[l].trim().startsWith(qMarker)) {
        foundQ = true;
        // The question is the next non-empty line
        let current = l + 1;
        while (!lines[current].trim()) current++;
        qText = lines[current].trim();
        
        // Find options A, B, C, D
        let optCount = 0;
        while (optCount < 4) {
          current++;
          const line = lines[current].trim();
          if (line.startsWith('A.') || line.startsWith('B.') || line.startsWith('C.') || line.startsWith('D.')) {
            options.push(line.substring(3).trim());
            optCount++;
          }
        }
        break;
      }
    }
    
    // Find Answer & Explanation
    let answer = "";
    let explanation = "";
    let foundSol = false;
    for (let l = solStartLine; l < lines.length; l++) {
      if (lines[l].trim() === solMarker) {
        foundSol = true;
        let current = l + 1;
        while (current < lines.length) {
          const line = lines[current].trim();
          if (line.startsWith('✅ ANSWER:')) {
            answer = line.split(':')[1].trim();
          } else if (line.startsWith('📝 EXPLANATION:')) {
            explanation = line.split(':')[1].trim();
            break;
          }
          current++;
        }
        break;
      }
    }
    
    if (foundQ && foundSol) {
      const correctIdx = ['A', 'B', 'C', 'D'].indexOf(answer);
      questions.push({
        topic: topic,
        difficulty: 1 + (i % 3), // Varied difficulty
        question: qText,
        options: options,
        correct_index: correctIdx,
        explanation: explanation
      });
    }
  }

  console.log(`Parsed ${questions.length} questions. Inserting...`);
  
  // Insert in batches of 10
  for (let i = 0; i < questions.length; i += 10) {
    const batch = questions.slice(i, i + 10);
    const { error } = await supabase.from('questions').insert(batch);
    if (error) console.error("Error inserting batch:", error.message);
    else console.log(`Inserted batch ${i/10 + 1}`);
  }

  console.log("Questions population complete!");
}

populateQuestions();
