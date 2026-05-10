import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Loader2, RotateCcw, Sparkles, XCircle } from "lucide-react";

export const Route = createFileRoute("/_app/quiz/$topic")({
  component: QuizRunner,
});

const QUIZ_LENGTH = 10;

type Question = {
  id: string;
  topic: string;
  difficulty: number;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
};

function QuizRunner() {
  const { topic } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [pool, setPool] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Adaptive state
  const [difficulty, setDifficulty] = useState(2); // start at medium
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState<
    { questionId: string; selected: number; correct: boolean; difficulty: number }[]
  >([]);
  const [current, setCurrent] = useState<Question | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("topic", topic);
      if (error) {
        toast.error("Could not load quiz");
        return;
      }
      const qs = (data ?? []) as unknown as Question[];
      setPool(qs);
      setCurrent(pickNext(qs, 2, []));
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  function pickNext(
    all: Question[],
    targetDiff: number,
    seen: { questionId: string }[],
  ): Question | null {
    const seenIds = new Set(seen.map((s) => s.questionId));
    const remaining = all.filter((q) => !seenIds.has(q.id));
    if (remaining.length === 0) return null;
    // Try exact difficulty, then nearest
    const tiers = [targetDiff, targetDiff - 1, targetDiff + 1, targetDiff - 2, targetDiff + 2];
    for (const d of tiers) {
      const tier = remaining.filter((q) => q.difficulty === d);
      if (tier.length) return tier[Math.floor(Math.random() * tier.length)];
    }
    return remaining[0];
  }

  const submit = () => {
    if (selected === null || !current) return;
    setRevealed(true);
    const correct = selected === current.correct_index;
    const newHistory = [
      ...history,
      {
        questionId: current.id,
        selected,
        correct,
        difficulty: current.difficulty,
      },
    ];
    setHistory(newHistory);
    // Adaptive logic
    let nextDiff = difficulty;
    let nextStreak = correct ? streak + 1 : 0;
    if (correct && nextStreak >= 2 && difficulty < 3) {
      nextDiff = difficulty + 1;
      nextStreak = 0;
    } else if (!correct && difficulty > 1) {
      nextDiff = difficulty - 1;
    }
    setDifficulty(nextDiff);
    setStreak(nextStreak);
  };

  const next = async () => {
    if (!current) return;
    setRevealed(false);
    setSelected(null);
    if (history.length >= QUIZ_LENGTH) {
      await finish();
      return;
    }
    const nxt = pickNext(pool, difficulty, history);
    if (!nxt) {
      await finish();
      return;
    }
    setCurrent(nxt);
  };

  const finish = async () => {
    setSaving(true);
    const score = history.filter((h) => h.correct).length;
    const total = history.length;
    const accuracy = total === 0 ? 0 : Math.round((score / total) * 100);
    const avgDiff =
      total === 0
        ? 0
        : Math.round((history.reduce((s, h) => s + h.difficulty, 0) / total) * 100) / 100;

    if (user) {
      const { data: attempt, error } = await supabase
        .from("quiz_attempts")
        .insert({
          user_id: user.id,
          topic,
          score,
          total,
          accuracy,
          avg_difficulty: avgDiff,
        })
        .select("id")
        .single();
      if (!error && attempt) {
        await supabase.from("quiz_answers").insert(
          history.map((h) => ({
            attempt_id: attempt.id,
            question_id: h.questionId,
            selected_index: h.selected,
            is_correct: h.correct,
            difficulty: h.difficulty,
            topic,
          })),
        );
      }
    }
    setSaving(false);
    setDone(true);
  };

  const progress = (history.length / QUIZ_LENGTH) * 100;

  if (loading) {
    return (
      <div className="grid h-[60vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (pool.length === 0) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">No questions available for this topic yet.</p>
        <Button asChild className="mt-4">
          <Link to="/quiz">Back to topics</Link>
        </Button>
      </div>
    );
  }

  if (done) return <ResultScreen history={history} topic={topic} onRetry={() => nav({ to: "/quiz/$topic", params: { topic } })} />;

  if (!current) return null;

  const correct = selected === current.correct_index;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between text-sm">
        <Link to="/quiz" className="text-muted-foreground hover:text-foreground">
          ← All topics
        </Link>
        <span className="font-medium text-muted-foreground">
          Question {history.length + 1} of {QUIZ_LENGTH}
        </span>
      </div>

      <Progress value={progress} className="h-2" />

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{topic}</p>
              <h2 className="mt-1 font-display text-2xl font-semibold leading-snug">
                {current.question}
              </h2>
            </div>
            <span className="shrink-0 rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent-foreground">
              {["Easy", "Medium", "Hard"][current.difficulty - 1]}
            </span>
          </div>

          <div className="grid gap-2.5">
            {current.options.map((o, i) => {
              const isSelected = selected === i;
              const isCorrect = i === current.correct_index;
              const showCorrect = revealed && isCorrect;
              const showWrong = revealed && isSelected && !isCorrect;
              return (
                <button
                  key={i}
                  disabled={revealed}
                  onClick={() => setSelected(i)}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                    showCorrect
                      ? "border-success bg-success/10"
                      : showWrong
                        ? "border-destructive bg-destructive/10"
                        : isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-secondary text-xs font-bold">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1">{o}</span>
                  {showCorrect && <CheckCircle2 className="h-4 w-4 text-success" />}
                  {showWrong && <XCircle className="h-4 w-4 text-destructive" />}
                </button>
              );
            })}
          </div>

          {revealed && (
            <div
              className={`rounded-xl border p-4 text-sm ${
                correct
                  ? "border-success/40 bg-success/5"
                  : "border-destructive/40 bg-destructive/5"
              }`}
            >
              <p className="font-semibold">
                {correct ? "✅ Correct!" : "❌ Not quite."}
              </p>
              {current.explanation && (
                <p className="mt-1 text-muted-foreground">{current.explanation}</p>
              )}
            </div>
          )}

          <div className="flex justify-end">
            {!revealed ? (
              <Button
                disabled={selected === null}
                onClick={submit}
                className="bg-gradient-hero text-primary-foreground shadow-glow hover:opacity-95"
              >
                Submit
              </Button>
            ) : (
              <Button onClick={next} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : history.length >= QUIZ_LENGTH ? (
                  <>Finish quiz <Sparkles className="ml-1 h-4 w-4" /></>
                ) : (
                  <>Next <ArrowRight className="ml-1 h-4 w-4" /></>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ResultScreen({
  history,
  topic,
  onRetry,
}: {
  history: { correct: boolean; difficulty: number }[];
  topic: string;
  onRetry: () => void;
}) {
  const score = history.filter((h) => h.correct).length;
  const total = history.length;
  const acc = Math.round((score / Math.max(1, total)) * 100);
  const recommend = useMemo(() => {
    if (acc >= 80) return "Excellent! You're ready for harder topics. Try Electrochemistry next.";
    if (acc >= 60) return "Solid effort. Review the questions you missed and try again to boost your score.";
    return `Keep going — practice ${topic} again or chat with the AI Tutor for clearer explanations.`;
  }, [acc, topic]);

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardContent className="space-y-6 pt-8 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-hero shadow-glow">
            <Sparkles className="h-9 w-9 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold">Quiz complete!</h2>
            <p className="mt-1 text-muted-foreground">{topic}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Score" value={`${score}/${total}`} />
            <Stat label="Accuracy" value={`${acc}%`} />
            <Stat
              label="Avg. level"
              value={(history.reduce((s, h) => s + h.difficulty, 0) / Math.max(1, total)).toFixed(1)}
            />
          </div>
          <p className="rounded-xl bg-secondary/60 p-4 text-sm">{recommend}</p>
          <div className="flex justify-center gap-2">
            <Button onClick={onRetry} variant="outline">
              <RotateCcw className="mr-1 h-4 w-4" /> Retry
            </Button>
            <Button asChild className="bg-gradient-hero text-primary-foreground shadow-glow hover:opacity-95">
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-bold">{value}</p>
    </div>
  );
}