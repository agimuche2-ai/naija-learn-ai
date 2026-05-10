import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { TOPICS } from "@/lib/topics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, BookOpen, Brain, Flame, Sparkles, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

type Attempt = {
  id: string;
  topic: string;
  score: number;
  total: number;
  accuracy: number;
  avg_difficulty: number;
  created_at: string;
};

function Dashboard() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("quiz_attempts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      setAttempts((data as Attempt[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const total = attempts.length;
    const avg =
      total === 0
        ? 0
        : Math.round(attempts.reduce((s, a) => s + Number(a.accuracy), 0) / total);
    const totalQs = attempts.reduce((s, a) => s + a.total, 0);
    const correct = attempts.reduce((s, a) => s + a.score, 0);
    return { total, avg, totalQs, correct };
  }, [attempts]);

  const byTopic = useMemo(() => {
    return TOPICS.map((t) => {
      const a = attempts.filter((x) => x.topic === t);
      const accuracy =
        a.length === 0 ? 0 : Math.round(a.reduce((s, x) => s + Number(x.accuracy), 0) / a.length);
      return { topic: t.replace(" ", "\n"), full: t, accuracy, attempts: a.length };
    });
  }, [attempts]);

  const trend = useMemo(() => {
    return [...attempts]
      .reverse()
      .slice(-10)
      .map((a, i) => ({ name: `#${i + 1}`, accuracy: Number(a.accuracy) }));
  }, [attempts]);

  const weakTopics = useMemo(
    () =>
      byTopic
        .filter((t) => t.attempts > 0 && t.accuracy < 70)
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 3),
    [byTopic],
  );

  const greeting = (user?.user_metadata?.full_name as string)?.split(" ")[0] || "Student";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="font-display text-3xl font-bold md:text-4xl">{greeting} 👋</h1>
          <p className="mt-1 text-muted-foreground">Here's your Chemistry progress overview.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/library">
              <BookOpen className="mr-1 h-4 w-4" /> Library
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-gradient-hero text-primary-foreground shadow-glow hover:opacity-95">
            <Link to="/quiz">
              <Sparkles className="mr-1 h-4 w-4" /> Start a quiz
            </Link>
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      {attempts.length > 0 && (
        <Card className="border-none bg-gradient-to-r from-primary/10 via-accent/5 to-transparent shadow-soft">
          <CardContent className="flex flex-wrap items-center justify-between gap-6 py-6">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/20 text-primary">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary/70">Overall Level</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black">SSS {attempts.length > 20 ? '3' : attempts.length > 10 ? '2' : '1'}</span>
                  <span className="text-sm text-muted-foreground">Mastery Path</span>
                </div>
              </div>
            </div>
            <div className="flex-1 max-w-md">
              <div className="flex justify-between text-xs mb-2">
                <span>Progress to next level</span>
                <span>{Math.min(100, (attempts.length % 10) * 10)}%</span>
              </div>
              <Progress value={(attempts.length % 10) * 10} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Flame} label="Quizzes taken" value={stats.total} accent />
        <StatCard icon={TrendingUp} label="Avg. accuracy" value={`${stats.avg}%`} />
        <StatCard icon={Brain} label="Questions answered" value={stats.totalQs} />
        <StatCard icon={Sparkles} label="Correct answers" value={stats.correct} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/library">
          <Card className="h-full border-primary/20 bg-primary/5 transition hover:bg-primary/10">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold">Browse Study Library</h3>
                <p className="text-sm text-muted-foreground">Access notes for SS1, SS2, and SS3</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/tutor">
          <Card className="h-full border-accent/20 bg-accent/5 transition hover:bg-accent/10">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold">Ask AI Tutor</h3>
                <p className="text-sm text-muted-foreground">Get instant help with any topic</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Accuracy by topic</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byTopic}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="topic" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                  labelFormatter={(_, p) => p[0]?.payload.full ?? ""}
                />
                <Bar dataKey="accuracy" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent trend</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {trend.length === 0 ? (
              <EmptyHint />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    dot={{ fill: "var(--primary)", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations + recent */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recommended for you</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {weakTopics.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Take a few quizzes — we'll spotlight your weak topics here.
              </p>
            ) : (
              weakTopics.map((t) => (
                <div
                  key={t.full}
                  className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{t.full}</p>
                      <span className="text-sm font-medium text-destructive">{t.accuracy}%</span>
                    </div>
                    <Progress value={t.accuracy} className="mt-2 h-2" />
                  </div>
                  <Button asChild size="sm" variant="ghost" className="ml-3">
                    <Link to="/quiz/$topic" params={{ topic: t.full }}>
                      Practice <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent attempts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : attempts.length === 0 ? (
              <EmptyHint />
            ) : (
              attempts.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{a.topic}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {a.score}/{a.total}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Number(a.accuracy).toFixed(0)}%
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Flame;
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <Card className={accent ? "border-primary/30 bg-gradient-card" : ""}>
      <CardContent className="flex items-center gap-4 pt-6">
        <div
          className={`grid h-11 w-11 place-items-center rounded-xl ${
            accent ? "bg-gradient-hero text-primary-foreground" : "bg-secondary text-foreground"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="font-display text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyHint() {
  return (
    <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
      <div>
        <p>No data yet.</p>
        <Button asChild size="sm" variant="link">
          <Link to="/quiz">Take your first quiz →</Link>
        </Button>
      </div>
    </div>
  );
}