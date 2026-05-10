import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const ss1Master = [
  { title: "Introduction to Chemistry", class_level: "SS1", content: `# Introduction to Chemistry\nChemistry is the study of matter and its changes.\n\n### Branches of Chemistry\n- Organic Chemistry\n- Inorganic Chemistry\n- Physical Chemistry\n- Analytical Chemistry\n- Biochemistry` },
  { title: "Laboratory Familiarization", class_level: "SS1", content: `# Laboratory Familiarization\nA workspace for experiments.\n\n### Rules\n- Wear lab coat\n- No eating\n- Report spills` },
  { title: "Nature of Matter", class_level: "SS1", content: `# Nature of Matter\nStates: Solid, Liquid, Gas.\n\n### Changes\n- Physical: Reversible\n- Chemical: Irreversible` },
  { title: "Elements, Symbols and Valency", class_level: "SS1", content: `# Elements, Symbols and Valency\n### Valency List\n- Hydrogen: 1\n- Oxygen: 2\n- Sodium: 1` },
  { title: "Standard Separation Techniques", class_level: "SS1", content: `# Standard Separation Techniques\n- Filtration\n- Distillation\n- Chromatography` },
  { title: "IUPAC Nomenclature", class_level: "SS1", content: `# IUPAC Nomenclature\nSystematic naming rules for compounds.\n- Metal + Non-metal: -ide ending` },
  { title: "Structure of the Atom: Orbitals", class_level: "SS1", content: `# Atomic Structure\n- Aufbau Principle\n- Pauli Principle\n- Hund's Rule` },
  { title: "Mole Concept", class_level: "SS1", content: `# Mole Concept\n- 6.02 x 10^23 particles\n- n = m / M` },
  { title: "Chemical Bonding", class_level: "SS1", content: `# Chemical Bonding\n- Electrovalent\n- Covalent\n- Metallic` },
  { title: "Kinetic Theory & Gas Laws", class_level: "SS1", content: `# Gas Laws\n- Boyle's Law: P1V1 = P2V2\n- Charles' Law: V1/T1 = V2/T2` },
  { title: "Air and Atmosphere", class_level: "SS1", content: `# Air and Atmosphere\n- Nitrogen: 78%\n- Oxygen: 21%\n- CO2: 0.03%` },
  { title: "Water and Solutions", class_level: "SS1", content: `# Water and Solutions\n- Hardness: Calcium/Magnesium salts\n- Soft Water: Lathers easily` }
];

async function populate() {
  console.log("🚀 Re-populating Pristine SS1 Master Library...");
  for (const note of ss1Master) {
    await supabase.from('study_materials').insert({
      title: note.title,
      topic: "Chemistry",
      class_level: note.class_level,
      category: "Full Curriculum",
      content: note.content
    });
    console.log(`✓ ${note.title} (Clean)`);
  }
  console.log("🎉 SS1 Re-population Complete!");
}

populate();
