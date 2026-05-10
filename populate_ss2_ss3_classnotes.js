import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const STEPS_DIR = 'C:\\Users\\Hp\\.gemini\\antigravity\\brain\\99389c30-a0d3-411c-bea4-a837c15cbccf\\.system_generated\\steps';

const lessons = [
  // ===== SS2 FIRST TERM =====
  { step: '1065', title: 'The Periodic Table',                       level: 'SS2', term: 'First Term' },
  { step: '1066', title: 'The Periodic Trend',                       level: 'SS2', term: 'First Term' },
  { step: '1067', title: 'Types of Reaction/Redox Reactions',        level: 'SS2', term: 'First Term' },
  { step: '1068', title: 'Oxidizing and Reducing Agents',            level: 'SS2', term: 'First Term' },
  { step: '1069', title: 'Ionic Theory',                             level: 'SS2', term: 'First Term' },
  { step: '1072', title: 'Electrolysis',                             level: 'SS2', term: 'First Term' },
  { step: '1073', title: 'Electrolysis of Specified Electrolytes',   level: 'SS2', term: 'First Term' },
  { step: '1074', title: "Faraday's Laws of Electrolysis",           level: 'SS2', term: 'First Term' },
  { step: '1075', title: 'Electrochemical Cells',                    level: 'SS2', term: 'First Term' },
  { step: '1076', title: 'Application of Electrochemical Cells',     level: 'SS2', term: 'First Term' },
  // ===== SS2 SECOND TERM =====
  { step: '1079', title: 'Rates of Chemical Reaction',               level: 'SS2', term: 'Second Term' },
  { step: '1080', title: 'Exothermic and Endothermic Reactions',     level: 'SS2', term: 'Second Term' },
  { step: '1081', title: 'Chemical Equilibrium',                     level: 'SS2', term: 'Second Term' },
  { step: '1082', title: 'Oxygen and its Compounds',                 level: 'SS2', term: 'Second Term' },
  { step: '1083', title: 'Chlorine and other Halogens',              level: 'SS2', term: 'Second Term' },
  { step: '1090', title: 'Nitrogen',                                 level: 'SS2', term: 'Second Term' },
  { step: '1091', title: 'Compounds of Nitrogen',                    level: 'SS2', term: 'Second Term' },
  { step: '1092', title: 'Sulphur',                                  level: 'SS2', term: 'Second Term' },
  { step: '1093', title: 'Compounds of Sulphur',                     level: 'SS2', term: 'Second Term' },
  // ===== SS2 THIRD TERM =====
  { step: '1094', title: 'Water',                                    level: 'SS2', term: 'Third Term' },
  { step: '1097', title: 'Solubility and Solutions',                  level: 'SS2', term: 'Third Term' },
  { step: '1098', title: 'Mass/Volume Relationship',                 level: 'SS2', term: 'Third Term' },
  { step: '1099', title: 'Acid/Base Reactions',                      level: 'SS2', term: 'Third Term' },
  { step: '1100', title: 'Hydrocarbons',                             level: 'SS2', term: 'Third Term' },
  { step: '1101', title: 'Saturated Hydrocarbon (Alkanes)',           level: 'SS2', term: 'Third Term' },
  { step: '1104', title: 'Unsaturated Hydrocarbon (Alkenes)',         level: 'SS2', term: 'Third Term' },
  { step: '1105', title: 'Unsaturated Hydrocarbon (Alkynes)',         level: 'SS2', term: 'Third Term' },
  { step: '1106', title: 'Alkanols',                                 level: 'SS2', term: 'Third Term' },
  // ===== SS3 FIRST TERM =====
  { step: '1109', title: 'Saturated Hydrocarbon - Alkanes',          level: 'SS3', term: 'First Term' },
  { step: '1110', title: 'Unsaturated Hydrocarbon - Alkenes',        level: 'SS3', term: 'First Term' },
  { step: '1111', title: 'Unsaturated Hydrocarbons - Alkynes',       level: 'SS3', term: 'First Term' },
  { step: '1112', title: 'Aromatic Hydrocarbon',                     level: 'SS3', term: 'First Term' },
  { step: '1113', title: 'Alkanols',                                 level: 'SS3', term: 'First Term' },
  { step: '1117', title: 'Alkanoic Acids',                           level: 'SS3', term: 'First Term' },
  { step: '1118', title: 'Fat and Oil as Higher Esters',             level: 'SS3', term: 'First Term' },
  { step: '1119', title: 'Natural and Synthetic Polymers',           level: 'SS3', term: 'First Term' },
  { step: '1120', title: 'Carbohydrates',                            level: 'SS3', term: 'First Term' },
  { step: '1121', title: 'Amines and Amides',                        level: 'SS3', term: 'First Term' },
  // ===== SS3 SECOND TERM =====
  { step: '1124', title: 'Nuclear Chemistry',                        level: 'SS3', term: 'Second Term' },
  { step: '1125', title: 'Nuclear Reactions',                        level: 'SS3', term: 'Second Term' },
  { step: '1126', title: 'Simple Molecules and their Shapes',        level: 'SS3', term: 'Second Term' },
  { step: '1127', title: 'Metallic Bonding',                         level: 'SS3', term: 'Second Term' },
  { step: '1128', title: 'Metals and their Compound',                level: 'SS3', term: 'Second Term' },
  { step: '1131', title: 'Extraction of Metals',                     level: 'SS3', term: 'Second Term' },
  { step: '1132', title: 'Introduction to Qualitative Analysis',     level: 'SS3', term: 'Second Term' },
  { step: '1133', title: 'Test for Anions, Identification of Gases', level: 'SS3', term: 'Second Term' },
  { step: '1134', title: 'Volumetric Analysis',                      level: 'SS3', term: 'Second Term' },
];

function extractAndClean(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n');

  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.startsWith('Back to:') || t === 'Welcome to class!') {
      start = i + 1;
      break;
    }
  }
  if (start === -1) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '---') { start = i + 1; break; }
    }
  }
  if (start === -1) start = 0;

  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    const t = lines[i].trim();
    if (
      t.startsWith('[Get complete class notes') ||
      t.startsWith('Get complete class notes') ||
      t.startsWith('[Back to Course') ||
      t.startsWith('Back to Course') ||
      t.startsWith('In our next class') ||
      t.startsWith('Should you have any further question') ||
      t.startsWith('- [Dashboard]') ||
      t.startsWith('[Dashboard]')
    ) { end = i; break; }
  }

  const bodyLines = lines.slice(start, end);

  const cleaned = bodyLines
    .filter(line => {
      const t = line.trim();
      if (!t) return true;
      if (/^\[?(JSS|SS\s*\d|Primary\s*\d)/i.test(t)) return false;
      if (t.startsWith('[Classes]')) return false;
      if (t.startsWith('- [Classes]')) return false;
      if (t === '[ClassPrefect]') return false;
      return true;
    })
    .map(line => {
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        return headingMatch[2].toUpperCase();
      }
      return line;
    })
    .map(line => line.replace(/[*#]/g, ''))
    .map(line => line.trimEnd())
    .join('\n');

  return cleaned.replace(/\n{3,}/g, '\n\n').trim();
}

async function run() {
  console.log('Step 1: Deleting ALL existing SS2 and SS3 study materials...');

  const { error: del2 } = await supabase.from('study_materials').delete().eq('class_level', 'SS2');
  if (del2) console.error('SS2 delete error:', del2.message);
  else console.log('  SS2 content removed.');

  const { error: del3 } = await supabase.from('study_materials').delete().eq('class_level', 'SS3');
  if (del3) console.error('SS3 delete error:', del3.message);
  else console.log('  SS3 content removed.');

  console.log('\nStep 2: Populating SS2 + SS3 from ClassNotes.ng...\n');

  let ok = 0, fail = 0;

  for (const lesson of lessons) {
    const filePath = STEPS_DIR + '\\' + lesson.step + '\\content.md';

    if (!fs.existsSync(filePath)) {
      console.log('MISSING: ' + lesson.title + ' (step ' + lesson.step + ')');
      fail++; continue;
    }

    const content = extractAndClean(filePath);

    if (content.length < 50) {
      console.log('TOO SHORT: ' + lesson.title);
      fail++; continue;
    }

    if (/[*#]/.test(content)) {
      console.log('WARNING: still has * or # in ' + lesson.title);
    }

    const { error } = await supabase.from('study_materials').insert({
      title: lesson.title,
      topic: 'Chemistry',
      class_level: lesson.level,
      category: lesson.term,
      content,
    });

    if (error) {
      console.log('DB ERROR - ' + lesson.title + ': ' + error.message);
      fail++;
    } else {
      console.log('[' + lesson.level + ' ' + lesson.term + '] OK: ' + lesson.title);
      ok++;
    }
  }

  console.log('\n================================');
  console.log('Done! Inserted: ' + ok + '/' + lessons.length + '   Failed: ' + fail + '/' + lessons.length);
  console.log('================================');
}

run();
