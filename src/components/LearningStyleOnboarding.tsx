import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  LEARNING_STYLE_EMOJI,
  LEARNING_STYLE_LABELS,
  getLearningStyleStudyTips,
  type LearningStyle,
} from "@/lib/adaptive-engine";
import { useLearningProfile } from "@/hooks/use-learning-profile";
import { CheckCircle2, ChevronRight, Sparkles } from "lucide-react";

// ── Question data ─────────────────────────────────────────────────────────────
type Option = { label: string; style: LearningStyle };
type Question = { text: string; options: Option[] };

const QUESTIONS: Question[] = [
  {
    text: "When you're trying to understand a new Chemistry concept, you prefer to:",
    options: [
      { label: "Look at diagrams, charts, or colour-coded notes", style: "visual" },
      { label: "Listen to an explanation or discuss it out loud", style: "auditory" },
      { label: "Read detailed notes and write summaries", style: "reading" },
      { label: "Work through practice problems hands-on", style: "kinesthetic" },
    ],
  },
  {
    text: "When revising for WAEC/NECO, you are most likely to:",
    options: [
      { label: "Draw mind-maps and flowcharts", style: "visual" },
      { label: "Recite formulas aloud or create rhymes", style: "auditory" },
      { label: "Rewrite your notes in your own words", style: "reading" },
      { label: "Solve past questions under timed conditions", style: "kinesthetic" },
    ],
  },
  {
    text: "If you forget something in an exam, you try to remember it by:",
    options: [
      { label: "Picturing the diagram or page it was on", style: "visual" },
      { label: "Hearing how it sounds or how you said it", style: "auditory" },
      { label: "Recalling the exact words you read or wrote", style: "reading" },
      { label: "Thinking of a practical example or experiment", style: "kinesthetic" },
    ],
  },
  {
    text: "You find it easiest to learn from a teacher who:",
    options: [
      { label: "Uses the board a lot with clear diagrams", style: "visual" },
      { label: "Gives lively verbal explanations and stories", style: "auditory" },
      { label: "Hands out detailed notes and reading materials", style: "reading" },
      { label: "Gets students to try things and do experiments", style: "kinesthetic" },
    ],
  },
  {
    text: "After learning something new, to check if you understand it you prefer to:",
    options: [
      { label: "Sketch it out or create a visual summary", style: "visual" },
      { label: "Explain it to someone else out loud", style: "auditory" },
      { label: "Write it out in an organised format", style: "reading" },
      { label: "Apply it immediately to a problem or example", style: "kinesthetic" },
    ],
  },
];

// ── Tally helper ──────────────────────────────────────────────────────────────
function detectStyle(answers: LearningStyle[]): LearningStyle {
  const counts: Record<LearningStyle, number> = {
    visual: 0, auditory: 0, reading: 0, kinesthetic: 0,
  };
  for (const a of answers) counts[a]++;
  return (Object.keys(counts) as LearningStyle[]).reduce((a, b) =>
    counts[a] >= counts[b] ? a : b,
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function LearningStyleOnboarding() {
  const { completeOnboarding } = useLearningProfile();
  const [step, setStep] = useState<"intro" | "quiz" | "result">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<LearningStyle[]>([]);
  const [selected, setSelected] = useState<LearningStyle | null>(null);
  const [detectedStyle, setDetectedStyle] = useState<LearningStyle | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSelect = (style: LearningStyle) => {
    setSelected(style);
    const newAnswers = [...answers, style];
    setTimeout(() => {
      if (currentQ < QUESTIONS.length - 1) {
        setAnswers(newAnswers);
        setCurrentQ(currentQ + 1);
        setSelected(null);
      } else {
        const style = detectStyle(newAnswers);
        setDetectedStyle(style);
        setStep("result");
      }
    }, 350);
  };

  const handleDone = async () => {
    if (!detectedStyle) return;
    setSaving(true);
    await completeOnboarding(detectedStyle);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-3xl bg-card shadow-2xl overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

        {step === "intro" && (
          <div className="relative p-8 text-center">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-hero shadow-glow">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="font-display text-2xl font-bold">Welcome to NaijaTutor! 🎉</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Before we begin, let's take <strong>2 minutes</strong> to discover
              your unique learning style. This helps us personalise every
              explanation, quiz, and coaching tip just for you.
            </p>
            <ul className="mt-4 space-y-2 text-left text-sm text-muted-foreground">
              {["5 quick questions", "Instant personalisation", "No right or wrong answers"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
            <Button
              id="start-onboarding"
              onClick={() => setStep("quiz")}
              className="mt-8 w-full bg-gradient-hero text-primary-foreground shadow-glow hover:opacity-95"
              size="lg"
            >
              Let's find out <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === "quiz" && (
          <div className="relative p-8">
            {/* Progress */}
            <div className="flex justify-between text-xs text-muted-foreground mb-3">
              <span>Question {currentQ + 1} of {QUESTIONS.length}</span>
              <span>{Math.round(((currentQ) / QUESTIONS.length) * 100)}%</span>
            </div>
            <Progress value={(currentQ / QUESTIONS.length) * 100} className="h-1.5 mb-6" />

            <h3 className="font-display text-lg font-semibold leading-snug mb-6">
              {QUESTIONS[currentQ].text}
            </h3>

            <div className="space-y-3">
              {QUESTIONS[currentQ].options.map((opt) => (
                <button
                  key={opt.style}
                  onClick={() => handleSelect(opt.style)}
                  disabled={selected !== null}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all duration-200 ${
                    selected === opt.style
                      ? "border-primary bg-primary/10 text-primary scale-[0.99]"
                      : "border-border bg-card hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "result" && detectedStyle && (
          <div className="relative p-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-hero shadow-glow text-4xl">
              {LEARNING_STYLE_EMOJI[detectedStyle]}
            </div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
              Your learning style is
            </p>
            <h2 className="font-display text-3xl font-bold">
              {LEARNING_STYLE_LABELS[detectedStyle]} Learner
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
              We'll tailor every explanation, quiz hint, and coaching tip to match how
              you learn best.
            </p>

            <div className="mt-6 rounded-2xl bg-secondary/60 p-4 text-left space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                🎯 Study tips for you
              </p>
              {getLearningStyleStudyTips(detectedStyle).slice(0, 3).map((tip) => (
                <p key={tip} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-primary mt-0.5">▸</span> {tip}
                </p>
              ))}
            </div>

            <Button
              id="complete-onboarding"
              onClick={handleDone}
              disabled={saving}
              className="mt-6 w-full bg-gradient-hero text-primary-foreground shadow-glow hover:opacity-95"
              size="lg"
            >
              {saving ? "Saving…" : "Start learning! 🚀"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
