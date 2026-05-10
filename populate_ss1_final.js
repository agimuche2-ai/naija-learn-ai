import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const finalBatch = [
  {
    title: "Air and Atmosphere",
    content: `### Air and Atmosphere
Air is a mixture of gases that surrounds the earth. It is essential for life and various chemical processes.

#### Composition of Air
- Nitrogen: Approximately 78%
- Oxygen: Approximately 21%
- Argon: Approximately 0.9%
- Carbon Dioxide: Approximately 0.03%
- Noble Gases & Water Vapor: Trace amounts

#### Properties of Air
- Air has mass and occupies space.
- Air exerts pressure in all directions.
- Air can be compressed.

#### Important Processes
- Combustion: Reaction with oxygen to produce heat and light.
- Respiration: Biological process where living things use oxygen to produce energy.
- Rusting: Slow oxidation of iron in the presence of air and moisture.`
  },
  {
    title: "Water and Solutions",
    content: `### Water and Solutions
Water is a universal solvent due to its polar nature and ability to dissolve many substances.

#### Types of Water
- Soft Water: Lathers easily with soap (e.g., rainwater).
- Hard Water: Does not lather easily due to dissolved calcium and magnesium salts.

#### Solutions
- Solute: The substance being dissolved (e.g., salt).
- Solvent: The substance doing the dissolving (e.g., water).
- Solution: A homogeneous mixture of solute and solvent.

#### Solubility
Solubility is the maximum amount of solute that can dissolve in a given amount of solvent at a specific temperature.`
  }
];

async function populate() {
  console.log("Populating Final SS1 Topics (Air & Water)...");
  for (const note of finalBatch) {
    await supabase.from('study_materials').insert({
      title: note.title,
      topic: "Chemistry",
      class_level: "SS1",
      category: "Third Term",
      content: note.content
    });
    console.log("✓ Inserted: " + note.title);
  }
  console.log("Final Batch Done!");
}

populate();
