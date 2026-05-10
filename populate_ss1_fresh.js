import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const ss1Notes = [
  {
    title: "Introduction to Chemistry",
    content: `# Introduction to Chemistry
Chemistry is the branch of science that deals with the study of matter, its properties, composition, and the changes it undergoes.

### Branches of Chemistry
- **Organic Chemistry:** Study of carbon-based compounds.
- **Inorganic Chemistry:** Study of elements and compounds excluding carbon.
- **Physical Chemistry:** Study of physical properties and behaviors of chemical systems.
- **Analytical Chemistry:** Identification and quantification of components.
- **Biochemistry:** Chemical processes within living organisms.

### Applications of Chemistry
- **Agriculture:** Production of fertilizers and pesticides.
- **Medicine:** Development of drugs and vaccines.
- **Industry:** Manufacturing plastics, textiles, and alloys.
- **Daily Life:** Cooking, cleaning, and personal care products.`
  },
  {
    title: "Laboratory Familiarization",
    content: `# Laboratory Familiarization
A chemistry laboratory is a specialized workspace equipped for scientific experiments and investigations.

### Common Laboratory Apparatus
- **Beakers & Flasks:** For holding and mixing liquids.
- **Graduated Cylinders:** For measuring volume accurately.
- **Bunsen Burner:** Providing heat for experiments.
- **Test Tubes:** Small-scale reactions.
- **Burettes & Pipettes:** Used in titrations for precise volume delivery.

### Laboratory Safety Rules
1. Always wear a lab coat and safety goggles.
2. Never eat or drink in the lab.
3. Handle chemicals with extreme care; never smell them directly.
4. Report all accidents or spills to the instructor immediately.`
  },
  {
    title: "Nature of Matter",
    content: `# Nature of Matter
Matter is defined as anything that has mass and occupies space.

### States of Matter
- **Solid:** Fixed shape and volume; particles are closely packed.
- **Liquid:** Fixed volume but takes the shape of its container.
- **Gas:** No fixed shape or volume; particles move freely and rapidly.

### Physical and Chemical Changes
- **Physical Change:** A change where no new substance is formed and is usually reversible (e.g., melting of ice).
- **Chemical Change:** A change where a new substance is formed and is usually irreversible (e.g., burning of wood, rusting of iron).`
  },
  {
    title: "Elements, Symbols and Valency",
    content: `# Elements, Symbols and Valency
An element is a pure substance that cannot be broken down into simpler substances by chemical means.

### Chemical Symbols
Symbols are one or two-letter abbreviations for elements:
- **Hydrogen:** H
- **Oxygen:** O
- **Carbon:** C
- **Sodium:** Na (from Natrium)
- **Iron:** Fe (from Ferrum)

### Valency
Valency is the combining power of an atom or a radical. It determines how elements bond together to form compounds.
- **Hydrogen:** 1
- **Oxygen:** 2
- **Carbon:** 4
- **Sodium:** 1`
  },
  {
    title: "Compounds and Mixtures",
    content: `# Compounds and Mixtures
Most matter around us exists as compounds or mixtures.

### Compounds
A compound is a substance formed when two or more elements are chemically combined in a fixed ratio (e.g., Water - H2O, Table Salt - NaCl).

### Mixtures
A mixture is formed when two or more substances are physically combined and can be separated by physical methods (e.g., Air, Soil, Crude Oil).

| Feature | Compound | Mixture |
|---|---|---|
| Combination | Chemically combined | Physically combined |
| Composition | Fixed proportion | Variable proportion |
| Separation | Chemical methods only | Physical methods |
| Properties | New properties formed | Constituent properties retained |`
  },
  {
    title: "Standard Separation Techniques",
    content: `# Standard Separation Techniques
Methods used to separate components of a mixture based on their physical properties.

### Common Techniques
- **Filtration:** Separating an insoluble solid from a liquid (e.g., sand from water).
- **Evaporation:** Recovering a soluble solid from a solution (e.g., salt from brine).
- **Distillation:** Separating liquids with different boiling points.
- **Crystallization:** Obtaining pure crystals from a saturated solution.
- **Chromatography:** Separating components based on different rates of travel through a medium.`
  },
  {
    title: "Particulate Nature of Matter",
    content: `# Particulate Nature of Matter
Evidence suggests that matter is made up of tiny, discrete particles: Atoms, Molecules, and Ions.

### Basic Particles
- **Atoms:** The smallest particle of an element that can take part in a chemical reaction.
- **Molecules:** The smallest unit of a compound or element that can exist independently.
- **Ions:** Atoms or groups of atoms that carry an electrical charge (Cations + and Anions -).

### Evidence of Particulate Nature
- **Diffusion:** The spontaneous movement of particles from a region of higher concentration to lower concentration.
- **Brownian Motion:** The random, zigzag movement of particles suspended in a fluid.`
  },
  {
    title: "IUPAC Nomenclature",
    content: `# IUPAC Nomenclature
The International Union of Pure and Applied Chemistry (IUPAC) has established rules for naming chemical compounds systematically.

### Binary Compounds
Compounds containing only two elements:
- Metal + Non-metal: The metal name comes first, and the non-metal ends in "-ide" (e.g., Sodium Chloride).
- Two Non-metals: Uses prefixes like mono-, di-, tri- (e.g., Carbon Dioxide, Sulfur Trioxide).

### Oxidation States
In naming transition metal compounds, the oxidation state is indicated in Roman numerals:
- **Iron(II) Chloride:** FeCl2
- **Iron(III) Chloride:** FeCl3`
  },
  {
    title: "Atomic Structure & Calculations",
    content: `# Atomic Structure & Calculations
Understanding the internal structure of the atom is fundamental to chemistry.

### Key Terms
- **Atomic Number (Z):** The number of protons in the nucleus of an atom.
- **Mass Number (A):** The sum of protons and neutrons in the nucleus.
- **Isotopes:** Atoms of the same element with the same atomic number but different mass numbers (e.g., Carbon-12 and Carbon-14).

### Relative Atomic Mass (RAM)
The average mass of the atoms of an element compared to 1/12th the mass of Carbon-12. It takes into account isotopic abundance.`
  }
];

async function populate() {
  console.log("Populating SS1 Fresh Notes from ClassNotes.ng...");
  
  for (const note of ss1Notes) {
    const { error } = await supabase.from('study_materials').insert({
      title: note.title,
      topic: "Chemistry",
      class_level: "SS1",
      category: "Syllabus Notes",
      content: note.content
    });
    
    if (error) {
      console.error(`Error inserting ${note.title}:`, error.message);
    } else {
      console.log(`✓ Inserted: ${note.title}`);
    }
  }
  
  console.log("SS1 Population Complete!");
}

populate();
