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
  // FIRST TERM
  { step: '977',  title: 'Introduction to Chemistry',                                 term: 'First Term' },
  { step: '980',  title: 'Laboratory Familiarization',                                term: 'First Term' },
  { step: '981',  title: 'Nature of Matter',                                          term: 'First Term' },
  { step: '982',  title: 'Elements, Symbols and Valency',                             term: 'First Term' },
  { step: '983',  title: 'Compounds and Mixtures',                                    term: 'First Term' },
  { step: '986',  title: 'Standard Separation Techniques for Mixtures',               term: 'First Term' },
  { step: '987',  title: 'Particulate Nature of Matter',                              term: 'First Term' },
  { step: '988',  title: 'IUPAC Nomenclature of Chemical Compounds',                  term: 'First Term' },
  { step: '989',  title: 'Atomic Number, Mass Number, Isotopes and Calculations',     term: 'First Term' },
  { step: '990',  title: 'Structure of the Atom: Orbitals and Electronic Structure',  term: 'First Term' },
  // SECOND TERM
  { step: '993',  title: 'Introduction to the Mole Concept',                          term: 'Second Term' },
  { step: '994',  title: 'Writing and Balancing Chemical Equations',                  term: 'Second Term' },
  { step: '995',  title: 'Stoichiometry of Reactions',                                term: 'Second Term' },
  { step: '996',  title: 'Empirical and Molecular Formulae',                          term: 'Second Term' },
  { step: '997',  title: 'Laws of Chemical Combination',                              term: 'Second Term' },
  { step: '1000', title: 'Chemical Combinations',                                     term: 'Second Term' },
  { step: '1001', title: 'Chemical Combinations II',                                  term: 'Second Term' },
  { step: '1002', title: 'Kinetic Theory of Matter',                                  term: 'Second Term' },
  { step: '1003', title: "Gas Laws - Boyle's Law",                                    term: 'Second Term' },
  { step: '1004', title: "Gas Laws II - Avogadro's Law",                              term: 'Second Term' },
  // THIRD TERM
  { step: '1007', title: 'Acids',                                                     term: 'Third Term' },
  { step: '1008', title: 'Bases and Salts',                                           term: 'Third Term' },
  { step: '1009', title: 'Hydrolysis of Salt',                                        term: 'Third Term' },
  { step: '1010', title: 'Carbon and Its Properties',                                 term: 'Third Term' },
  { step: '1011', title: 'Oxide of Carbon',                                           term: 'Third Term' },
  { step: '1014', title: 'Coal and Fuel Gases',                                       term: 'Third Term' },
  { step: '1015', title: 'Trioxocarbonate (IV) Acid',                                 term: 'Third Term' },
  { step: '1016', title: 'Introduction to Hydrocarbons',                              term: 'Third Term' },
  { step: '1017', title: 'Cracking and Reforming',                                    term: 'Third Term' },
  { step: '1018', title: 'Applied Chemistry',                                         term: 'Third Term' },
];

function extractAndClean(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n');

  // Find start of real lesson content (after nav boilerplate)
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

  // Find end of lesson content (before footer)
  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    const t = lines[i].trim();
    if (
      t.startsWith('[Get complete class notes') ||
      t.startsWith('Get complete class notes') ||
      t.startsWith('[Back to Course') ||
      t.startsWith('Back to Course') ||
      t.startsWith('In our next class') ||
      t.startsWith('- [Dashboard]') ||
      t.startsWith('[Dashboard]')
    ) { end = i; break; }
  }

  const bodyLines = lines.slice(start, end);

  const cleaned = bodyLines
    // Drop pure navigation lines
    .filter(line => {
      const t = line.trim();
      if (!t) return true;
      if (/^\[?(JSS|SS\s*\d|Primary\s*\d)/i.test(t)) return false;
      return true;
    })
    // Convert markdown headings (####, ###, ##, #) to UPPERCASE plain-text headings
    .map(line => {
      // e.g. "#### Branches of chemistry" -> "BRANCHES OF CHEMISTRY"
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        return headingMatch[2].toUpperCase();
      }
      return line;
    })
    // Remove all asterisks and hash symbols
    .map(line => line.replace(/[*#]/g, ''))
    // Trim trailing whitespace per line
    .map(line => line.trimEnd())
    .join('\n');

  // Collapse 3+ blank lines into 2
  return cleaned.replace(/\n{3,}/g, '\n\n').trim();
}

async function run() {
  console.log('Step 1: Deleting ALL existing SS1 study materials...');
  const { error: delErr } = await supabase
    .from('study_materials')
    .delete()
    .eq('class_level', 'SS1');

  if (delErr) { console.error('Delete failed:', delErr.message); return; }
  console.log('Done. All SS1 content removed.\n');

  console.log('Step 2: Re-populating from ClassNotes.ng (zero asterisks, zero hashes)...\n');

  let ok = 0, fail = 0;

  for (const lesson of lessons) {
    const filePath = STEPS_DIR + '\\' + lesson.step + '\\content.md';

    if (!fs.existsSync(filePath)) {
      console.log('MISSING: ' + filePath);
      fail++; continue;
    }

    const content = extractAndClean(filePath);

    if (content.length < 50) {
      console.log('TOO SHORT, SKIPPED: ' + lesson.title);
      fail++; continue;
    }

    // Verify no * or # remain
    if (/[*#]/.test(content)) {
      console.log('WARNING - still has * or # in: ' + lesson.title);
    }

    const { error } = await supabase.from('study_materials').insert({
      title: lesson.title,
      topic: 'Chemistry',
      class_level: 'SS1',
      category: lesson.term,
      content,
    });

    if (error) {
      console.log('DB ERROR - ' + lesson.title + ': ' + error.message);
      fail++;
    } else {
      console.log('[' + lesson.term + '] OK: ' + lesson.title);
      ok++;
    }
  }

  console.log('\n================================');
  console.log('Done! Inserted: ' + ok + '/30   Failed: ' + fail + '/30');
  console.log('================================');
}

run();
