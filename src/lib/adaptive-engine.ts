// ─── Adaptive Learning Engine ─────────────────────────────────────────────────
// Pure functions powering NaijaTutor's adaptive system.

// ── Types ──────────────────────────────────────────────────────────────────────
export type LearningStyle = "visual" | "auditory" | "reading" | "kinesthetic";

export type Level = {
  name: string;
  minXP: number;
  maxXP: number;
  color: string;
  emoji: string;
};

export const LEVELS: Level[] = [
  { name: "Beginner",      minXP: 0,     maxXP: 499,   color: "oklch(0.6 0.08 220)",  emoji: "🌱" },
  { name: "Practitioner",  minXP: 500,   maxXP: 1999,  color: "oklch(0.6 0.16 155)",  emoji: "📚" },
  { name: "Scholar",       minXP: 2000,  maxXP: 4999,  color: "oklch(0.55 0.18 250)", emoji: "🎓" },
  { name: "Master",        minXP: 5000,  maxXP: 9999,  color: "oklch(0.72 0.16 78)",  emoji: "⭐" },
  { name: "Champion",      minXP: 10000, maxXP: Infinity, color: "oklch(0.65 0.22 30)", emoji: "🏆" },
];

// ── XP Calculation ─────────────────────────────────────────────────────────────
/**
 * XP formula: base 10 pts, +accuracy bonus, +difficulty multiplier
 * Max per quiz: ~180 XP (100% accuracy, difficulty 3)
 */
export function getXPForAttempt(accuracy: number, avgDifficulty: number): number {
  const base = 10;
  const accuracyBonus = Math.round((accuracy / 100) * 50);
  const difficultyMultiplier = 0.5 + avgDifficulty * 0.5; // 1.0 → 2.0
  return Math.round((base + accuracyBonus) * difficultyMultiplier);
}

// ── Level System ──────────────────────────────────────────────────────────────
export function getLevelFromXP(xp: number): Level {
  // findLast not available in older TS targets — iterate reversed
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getXPProgress(xp: number): { current: Level; progressPct: number; xpToNext: number } {
  const current = getLevelFromXP(xp);
  const isMax = current.maxXP === Infinity;
  if (isMax) return { current, progressPct: 100, xpToNext: 0 };
  const rangeSize = current.maxXP - current.minXP + 1;
  const earned = xp - current.minXP;
  return {
    current,
    progressPct: Math.round((earned / rangeSize) * 100),
    xpToNext: current.maxXP + 1 - xp,
  };
}

// ── Mastery Calculation ───────────────────────────────────────────────────────
/**
 * Weighted rolling average — recent attempts count 2×.
 * Returns 0–100.
 */
export function calculateMastery(accuracies: number[]): number {
  if (accuracies.length === 0) return 0;
  if (accuracies.length === 1) return Math.round(accuracies[0]);
  // Weight: most recent gets weight 2, rest get weight 1
  const weighted = accuracies.map((a, i) => (i === accuracies.length - 1 ? a * 2 : a));
  const totalWeight = accuracies.length + 1;
  return Math.round(weighted.reduce((s, a) => s + a, 0) / totalWeight);
}

export type MasteryLevel = "not-started" | "weak" | "developing" | "strong" | "mastered";

export function getMasteryLevel(score: number, attempts: number): MasteryLevel {
  if (attempts === 0) return "not-started";
  if (score < 40) return "weak";
  if (score < 65) return "developing";
  if (score < 85) return "strong";
  return "mastered";
}

export function getMasteryColor(level: MasteryLevel): string {
  switch (level) {
    case "not-started": return "var(--muted)";
    case "weak":        return "oklch(0.6 0.22 27)";   // red
    case "developing":  return "oklch(0.72 0.16 78)";  // amber
    case "strong":      return "oklch(0.6 0.16 155)";  // green
    case "mastered":    return "oklch(0.42 0.13 160)"; // deep green
  }
}

// ── Spaced Repetition ────────────────────────────────────────────────────────
/**
 * Returns number of days until next review based on mastery score.
 * Higher mastery → longer interval.
 */
export function getReviewIntervalDays(masteryScore: number): number {
  if (masteryScore >= 85) return 14;  // 2 weeks
  if (masteryScore >= 65) return 7;   // 1 week
  if (masteryScore >= 40) return 3;   // 3 days
  return 1;                           // tomorrow
}

export function getNextReviewDate(masteryScore: number, fromDate = new Date()): Date {
  const days = getReviewIntervalDays(masteryScore);
  const next = new Date(fromDate);
  next.setDate(next.getDate() + days);
  return next;
}

export function isDueForReview(nextReviewDate: string | Date): boolean {
  const due = new Date(nextReviewDate);
  return due <= new Date();
}

// ── Learning Style ────────────────────────────────────────────────────────────
export const LEARNING_STYLE_LABELS: Record<LearningStyle, string> = {
  visual:      "Visual",
  auditory:    "Auditory",
  reading:     "Read-Write",
  kinesthetic: "Kinesthetic",
};

export const LEARNING_STYLE_EMOJI: Record<LearningStyle, string> = {
  visual:      "🎨",
  auditory:    "🎧",
  reading:     "📖",
  kinesthetic: "🔬",
};

export function getLearningStylePromptHint(style: LearningStyle): string {
  switch (style) {
    case "visual":
      return "This student is a VISUAL learner. Use diagrams, flowcharts (described in text), colour-coded examples, and spatial analogies. Explicitly say 'Picture this...' or 'Imagine a diagram where...'. Show structures and layouts clearly.";
    case "auditory":
      return "This student is an AUDITORY learner. Use rhythm, mnemonics, and verbal step-by-step walkthroughs. Say things like 'Say this out loud...' or 'Think of it as a pattern you can recite...'. Use conversational explanations.";
    case "reading":
      return "This student is a READ-WRITE learner. Provide detailed written explanations, bullet-point lists, definitions, and numbered steps. Include key terms and their precise meanings. Structured notes work best.";
    case "kinesthetic":
      return "This student is a KINESTHETIC learner. Use worked examples, real-world applications, and hands-on analogies. Say 'Try this calculation...' or 'In the lab this looks like...'. Include practice problems in the explanation.";
  }
}

export function getLearningStyleStudyTips(style: LearningStyle): string[] {
  switch (style) {
    case "visual":
      return [
        "Draw diagrams and mind-maps for each topic",
        "Use colour-coded notes — different colours for different concepts",
        "Watch YouTube videos showing chemistry experiments",
        "Create visual timelines for chemical processes",
      ];
    case "auditory":
      return [
        "Read your notes out loud when studying",
        "Create mnemonics and rhymes for formulas (e.g. OIL RIG for Redox)",
        "Study with a partner and explain concepts to each other",
        "Listen to chemistry podcasts or recorded lectures",
      ];
    case "reading":
      return [
        "Rewrite textbook notes in your own words",
        "Make detailed bullet-point summaries for each topic",
        "Write out definitions for every new term you encounter",
        "Keep a chemistry journal — log questions and answers daily",
      ];
    case "kinesthetic":
      return [
        "Do as many practice problems as possible — repetition is key",
        "Relate every concept to a real-world application (e.g. Haber process → fertiliser)",
        "Build physical models of molecules if possible",
        "Time yourself on past questions to simulate exam pressure",
      ];
  }
}

// ── Streak ────────────────────────────────────────────────────────────────────
export function calculateStreak(lastActiveDates: string[]): number {
  if (lastActiveDates.length === 0) return 0;
  const sorted = [...lastActiveDates].map((d) => new Date(d)).sort((a, b) => b.getTime() - a.getTime());
  let streak = 0;
  let current = new Date();
  current.setHours(0, 0, 0, 0);
  for (const date of sorted) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((current.getTime() - d.getTime()) / 86400000);
    if (diff === 0 || diff === 1) {
      streak++;
      current = d;
    } else {
      break;
    }
  }
  return streak;
}

// ── Badges ───────────────────────────────────────────────────────────────────
export type Badge = { id: string; label: string; emoji: string; description: string };

export const BADGES: Badge[] = [
  { id: "first_quiz",     emoji: "🎯", label: "First Steps",    description: "Completed your first quiz" },
  { id: "streak_3",       emoji: "🔥", label: "On Fire",        description: "3-day study streak" },
  { id: "streak_7",       emoji: "💎", label: "Dedicated",      description: "7-day study streak" },
  { id: "streak_30",      emoji: "👑", label: "Unstoppable",    description: "30-day study streak" },
  { id: "topic_master",   emoji: "⭐", label: "Topic Master",   description: "Scored 85%+ on any topic" },
  { id: "perfect_quiz",   emoji: "💯", label: "Perfect Score",  description: "100% accuracy on a quiz" },
  { id: "xp_500",         emoji: "📚", label: "Practitioner",   description: "Earned 500 XP" },
  { id: "xp_2000",        emoji: "🎓", label: "Scholar",        description: "Earned 2,000 XP" },
  { id: "quiz_10",        emoji: "🏅", label: "Quiz Veteran",   description: "Completed 10 quizzes" },
  { id: "quiz_50",        emoji: "🏆", label: "Quiz Champion",  description: "Completed 50 quizzes" },
];

export function getEarnedBadges(stats: {
  totalQuizzes: number;
  streakDays: number;
  xp: number;
  hasTopicMastery: boolean;
  hasPerfectScore: boolean;
}): Badge[] {
  const earned: Badge[] = [];
  if (stats.totalQuizzes >= 1)  earned.push(BADGES.find(b => b.id === "first_quiz")!);
  if (stats.totalQuizzes >= 10) earned.push(BADGES.find(b => b.id === "quiz_10")!);
  if (stats.totalQuizzes >= 50) earned.push(BADGES.find(b => b.id === "quiz_50")!);
  if (stats.streakDays >= 3)    earned.push(BADGES.find(b => b.id === "streak_3")!);
  if (stats.streakDays >= 7)    earned.push(BADGES.find(b => b.id === "streak_7")!);
  if (stats.streakDays >= 30)   earned.push(BADGES.find(b => b.id === "streak_30")!);
  if (stats.xp >= 500)          earned.push(BADGES.find(b => b.id === "xp_500")!);
  if (stats.xp >= 2000)         earned.push(BADGES.find(b => b.id === "xp_2000")!);
  if (stats.hasTopicMastery)    earned.push(BADGES.find(b => b.id === "topic_master")!);
  if (stats.hasPerfectScore)    earned.push(BADGES.find(b => b.id === "perfect_quiz")!);
  return earned.filter(Boolean);
}
