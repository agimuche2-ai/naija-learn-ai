import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const STEPS_DIR = 'C:\\Users\\Hp\\.gemini\\antigravity\\brain\\99389c30-a0d3-411c-bea4-a837c15cbccf\\.system_generated\\steps';

// Map of step folder -> lesson metadata
const lessons = [
  // FIRST TERM
  { step: '977',  title: 'Introduction to Chemistry',                                    term: 'First Term' },
  { step: '980',  title: 'Laboratory Familiarization',                                   term: 'First Term' },
  { step: '981',  title: 'Nature of Matter',                                             term: 'First Term' },
  { step: '982',  title: 'Elements, Symbols and Valency',                                term: 'First Term' },
  { step: '983',  title: 'Compounds and Mixtures',                                       term: 'First Term' },
  { step: '986',  title: 'Standard Separation Techniques for Mixtures',                  term: 'First Term' },
  { step: '987',  title: 'Particulate Nature of Matter',                                 term: 'First Term' },
  { step: '988',  title: 'IUPAC Nomenclature of Chemical Compounds',                     term: 'First Term' },
  { step: '989',  title: 'Atomic Number, Mass Number, Isotopes and Calculations',        term: 'First Term' },
  { step: '990',  title: 'Structure of the Atom: Orbitals and Electronic Structure',     term: 'First Term' },
  // SECOND TERM
  { step: '993',  title: 'Introduction to the Mole Concept',                             term: 'Second Term' },
  { step: '994',  title: 'Writing and Balancing Chemical Equations',                     term: 'Second Term' },
  { step: '995',  title: 'Stoichiometry of Reactions',                                   term: 'Second Term' },
  { step: '996',  title: 'Empirical and Molecular Formulae',                             term: 'Second Term' },
  { step: '997',  title: 'Laws of Chemical Combination',                                 term: 'Second Term' },
  { step: '1000', title: 'Chemical Combinations',                                        term: 'Second Term' },
  { step: '1001', title: 'Chemical Combinations II',                                     term: 'Second Term' },
  { step: '1002', title: 'Kinetic Theory of Matter',                                     term: 'Second Term' },
  { step: '1003', title: 'Gas Laws - Boyle\'s Law',                                      term: 'Second Term' },
  { step: '1004', title: 'Gas Laws II - Avogadro\'s Law',                                term: 'Second Term' },
  // THIRD TERM
  { step: '1007', title: 'Acids',                                                        term: 'Third Term' },
  { step: '1008', title: 'Bases and Salts',                                              term: 'Third Term' },
  { step: '1009', title: 'Hydrolysis of Salt',                                           term: 'Third Term' },
  { step: '1010', title: 'Carbon and Its Properties',                                    term: 'Third Term' },
  { step: '1011', title: 'Oxide of Carbon',                                              term: 'Third Term' },
  { step: '1014', title: 'Coal and Fuel Gases',                                          term: 'Third Term' },
  { step: '1015', title: 'Trioxocarbonate (IV) Acid',                                   term: 'Third Term' },
  { step: '1016', title: 'Introduction to Hydrocarbons',                                 term: 'Third Term' },
  { step: '1017', title: 'Cracking and Reforming',                                       term: 'Third Term' },
  { step: '1018', title: 'Applied Chemistry',                                            term: 'Third Term' },
];

/**
 * Extract only the lesson body from a downloaded classnotes.ng markdown file.
 * The real content starts after the "---" separator and the nav block,
 * and ends before the "Get complete class notes" / "Back to Course" footer.
 */
function extractContent(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n');

  let start = -1;
  let end = lines.length;

  // Find the line that contains "Welcome to class!" or the first real heading/paragraph
  // after the nav. We look for lines after "ClassPrefect" or "Back to:"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('Back to:') || line === 'Welcome to class!') {
      start = i + 1;
      break;
    }
  }

  // If not found, fall back to finding after the --- separator
  if (start === -1) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        start = i + 1;
        break;
      }
    }
  }

  // Find the end - stop at the footer
  for (let i = start; i < lines.length; i++) {
    const line = lines[i].trim();
    if (
      line.startsWith('Get complete class notes') ||
      line.startsWith('[Get complete class notes') ||
      line.startsWith('Back to Course') ||
      line.startsWith('[Back to Course') ||
      line.startsWith('In our next class') ||
      line.startsWith('[Dashboard]') ||
      line.startsWith('- [Dashboard]')
    ) {
      end = i;
      break;
    }
  }

  const contentLines = lines.slice(start, end);

  // Clean the content:
  // 1. Remove all lines that are just navigation links (start with "- [" or "[JSS" etc)
  // 2. Remove all asterisks
  // 3. Trim blank lines at start/end
  const cleaned = contentLines
    .filter(line => {
      const t = line.trim();
      if (!t) return true; // keep blank lines for spacing
      // skip nav-only lines
      if (t.match(/^\[?(JSS|SS|Primary)\s*\d/i)) return false;
      if (t === '- [Classes]') return false;
      return true;
    })
    .map(line => line.replace(/\*/g, '')) // remove all asterisks
    .join('\n');

  // Remove excessive blank lines (3+ in a row -> 2)
  return cleaned.replace(/\n{3,}/g, '\n\n').trim();
}

async function populate() {
  console.log('Step 1: Removing ALL existing SS1 study materials...');
  const { error: delErr } = await supabase
    .from('study_materials')
    .delete()
    .eq('class_level', 'SS1');
  if (delErr) {
    console.error('Delete error:', delErr.message);
    return;
  }
  console.log('✓ All SS1 content removed.\n');

  console.log('Step 2: Populating SS1 from ClassNotes.ng (30 lessons)...\n');

  let successCount = 0;
  let failCount = 0;

  for (const lesson of lessons) {
    const filePath = `${STEPS_DIR}\\${lesson.step}\\content.md`;

    if (!fs.existsSync(filePath)) {
      console.log('MISSING FILE: ' + filePath);
      failCount++;
      continue;
    }

    const content = extractContent(filePath);

    if (content.length < 50) {
      console.log('SKIPPED (too short): ' + lesson.title);
      failCount++;
      continue;
    }

    const { error } = await supabase.from('study_materials').insert({
      title: lesson.title,
      topic: 'Chemistry',
      class_level: 'SS1',
      category: lesson.term,
      content: content,
    });

    if (error) {
      console.log('ERROR inserting ' + lesson.title + ': ' + error.message);
      failCount++;
    } else {
      console.log('[' + lesson.term + '] ✓ ' + lesson.title);
      successCount++;
    }
  }

  console.log('\n================================');
  console.log('Population Complete!');
  console.log('Successful: ' + successCount + '/30');
  console.log('Failed:     ' + failCount + '/30');
  console.log('================================');
}

populate();
