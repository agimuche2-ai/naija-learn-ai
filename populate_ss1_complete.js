import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const ss1NewNotes = [
  {
    title: "Structure of the Atom: Orbitals",
    content: `### Structure of the Atom: Orbitals and Electronic Structure
Understanding how electrons are arranged in atoms is key to predicting chemical behavior.

#### Quantum Numbers
- Principal Quantum Number (n): Indicates the main energy level (1, 2, 3, etc.).
- Azimuthal Quantum Number (l): Defines the shape of the orbital (s, p, d, f).
- Magnetic Quantum Number (m): Specifies the orientation of the orbital in space.
- Spin Quantum Number (s): Describes the direction of electron spin (+1/2 or -1/2).

#### Rules for Filling Orbitals
- Pauli Exclusion Principle: No two electrons in an atom can have the same set of four quantum numbers.
- Aufbau Principle: Electrons fill the lowest energy orbitals first.
- Hund’s Rule: Orbitals of the same energy are each occupied by one electron before any is occupied by a second.`
  },
  {
    title: "Introduction to the Mole Concept",
    content: `### Introduction to the Mole Concept
The mole is the unit of measurement for amount of substance in the International System of Units (SI).

#### Key Constants
- Avogadro’s Number: 6.02 x 10^23 particles per mole.
- Molar Mass: The mass of one mole of a substance (in g/mol).
- Molar Volume: At S.T.P. (Standard Temperature and Pressure), one mole of any gas occupies 22.4 dm³.

#### Basic Formulas
- Number of moles (n) = Mass (m) / Molar Mass (M)
- Number of particles = n x Avogadro’s Number`
  },
  {
    title: "Chemical Equations and Stoichiometry",
    content: `### Writing and Balancing Chemical Equations
Chemical equations represent chemical reactions using symbols and formulas.

#### Balancing Rules
- The Law of Conservation of Mass must be obeyed: atoms are neither created nor destroyed.
- Adjust only the coefficients (the numbers in front), never the subscripts.

#### Stoichiometry
Stoichiometry is the study of the quantitative relationships between reactants and products in a chemical reaction.
- Mole-to-Mole calculations: Using the balanced equation to find ratios.
- Mass-to-Mass calculations: Converting mass to moles, then using the ratio, then back to mass.`
  },
  {
    title: "Empirical and Molecular Formulae",
    content: `### Empirical and Molecular Formulae
- Empirical Formula: The simplest whole-number ratio of atoms of each element in a compound.
- Molecular Formula: The actual number of atoms of each element in a molecule.

#### Calculation Steps
1. Find the mass or percentage of each element.
2. Convert to moles by dividing by atomic mass.
3. Divide each by the smallest number of moles to find the ratio.
4. If necessary, multiply to get whole numbers for the empirical formula.`
  },
  {
    title: "Laws of Chemical Combination",
    content: `### Laws of Chemical Combination
These laws govern how elements combine to form compounds.

#### The Four Laws
- Law of Conservation of Mass: Total mass of reactants equals total mass of products.
- Law of Constant Composition: A given compound always contains the same elements in the same proportion by mass.
- Law of Multiple Proportions: When two elements form more than one compound, the masses of one element that combine with a fixed mass of the other are in a ratio of small whole numbers.
- Law of Reciprocal Proportions: The weights of two elements that react with a third element are also the weights in which they react with each other.`
  },
  {
    title: "Chemical Combinations and Bonding",
    content: `### Chemical Combinations and Bonding
Atoms combine to achieve a stable electronic configuration, usually an octet.

#### Types of Bonds
- Electrovalent (Ionic) Bond: Formed by the complete transfer of electrons from a metal to a non-metal.
- Covalent Bond: Formed by the sharing of electron pairs between non-metals.
- Co-ordinate (Dative) Bond: A type of covalent bond where both shared electrons come from one atom.
- Metallic Bond: The attraction between positive metal ions and a "sea" of delocalized electrons.`
  },
  {
    title: "Kinetic Theory and Gas Laws",
    content: `### Kinetic Theory and Gas Laws
The kinetic theory describes the behavior of matter in terms of particles in motion.

#### Basic Gas Laws
- Boyle’s Law: Pressure is inversely proportional to volume at constant temperature (P1V1 = P2V2).
- Charles’ Law: Volume is directly proportional to absolute temperature at constant pressure (V1/T1 = V2/T2).
- General Gas Equation: Combines the laws into P1V1/T1 = P2V2/T2.
- Ideal Gas Equation: PV = nRT`
  },
  {
    title: "Acids, Bases, and Salts",
    content: `### Acids, Bases, and Salts
- Acids: Substances that produce hydrogen ions (H+) in water. They have a sour taste and turn blue litmus paper red.
- Bases: Substances that produce hydroxide ions (OH-) in water. They feel slippery and turn red litmus paper blue.
- Salts: Ionic compounds formed by the neutralization of an acid with a base.

#### pH Scale
The pH scale measures the acidity or alkalinity of a solution, ranging from 0 (very acidic) to 14 (very basic), with 7 being neutral.`
  },
  {
    title: "Carbon and Its Compounds",
    content: `### Carbon and Its Compounds
Carbon is unique because of its ability to form long chains and rings (catenation).

#### Allotropes of Carbon
- Diamond: Hardest natural substance; used in jewelry and cutting tools.
- Graphite: Soft and slippery; conducts electricity; used as a lubricant and in pencils.
- Amorphous Carbon: Includes coal, coke, and charcoal.

#### Oxides of Carbon
- Carbon (IV) Oxide (CO2): Used in fire extinguishers and photosynthesis.
- Carbon (II) Oxide (CO): A poisonous, odorless gas formed by incomplete combustion.`
  },
  {
    title: "Introduction to Hydrocarbons",
    content: `### Introduction to Hydrocarbons
Hydrocarbons are organic compounds containing only hydrogen and carbon.

#### Classification
- Alkanes: Saturated hydrocarbons with single bonds (CnH2n+2).
- Alkenes: Unsaturated hydrocarbons with at least one double bond (CnH2n).
- Alkynes: Unsaturated hydrocarbons with at least one triple bond (CnH2n-2).

#### Petroleum (Crude Oil)
A complex mixture of hydrocarbons separated by fractional distillation into useful fractions like petrol, kerosene, and diesel.`
  }
];

function termForTitle(title) {
  if (
    [
      "Structure of the Atom: Orbitals",
    ].includes(title)
  ) {
    return "First Term";
  }

  if (
    [
      "Introduction to the Mole Concept",
      "Chemical Equations and Stoichiometry",
      "Empirical and Molecular Formulae",
      "Laws of Chemical Combination",
      "Chemical Combinations and Bonding",
      "Kinetic Theory and Gas Laws",
    ].includes(title)
  ) {
    return "Second Term";
  }

  return "Third Term";
}

async function populate() {
  console.log("Populating All Remaining SS1 Topics from ClassNotes.ng...");
  
  for (const note of ss1NewNotes) {
    const { error } = await supabase.from('study_materials').insert({
      title: note.title,
      topic: "Chemistry",
      class_level: "SS1",
      category: termForTitle(note.title),
      content: note.content
    });
    
    if (error) {
      console.log("Error inserting " + note.title + ": " + error.message);
    } else {
      console.log("✓ Inserted: " + note.title);
    }
  }
  
  console.log("SS1 Complete Population Done!");
}

populate();
