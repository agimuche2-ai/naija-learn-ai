// Chemistry topics offered in NaijaTutor quizzes.
export const TOPICS = [
  "Separation of Mixtures",
  "Chemical Combination & the Mole",
  "Gas Laws",
  "Atomic Structure & Chemical Bonding",
  "Air & Atmosphere",
  "Water & Solutions",
  "Solubility",
  "Environmental Pollution",
  "Acids, Bases & Salts",
  "Oxidation & Reduction (Redox)",
  "Electrolysis",
  "Energy Changes in Reactions",
  "Rates of Reaction",
  "Chemical Equilibrium",
  "Non-Metals & Compounds",
  "Metals & Alloys",
  "Organic Chemistry",
  "Industrial Chemistry",
  "Mixed Chemistry",
] as const;

export type Topic = (typeof TOPICS)[number];