import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { TOPICS } from "@/lib/topics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, BookOpen, Brain, Flame, Sparkles, TrendingUp, MessageCircle, Target } from "lucide-react";
import { MasteryHeatmap } from "@/components/MasteryHeatmap";
import { XPProgressBar } from "@/components/XPProgressBar";
import { CoachInsightCard } from "@/components/CoachInsightCard";
import { useLearningProfile } from "@/hooks/use-learning-profile";
import { useMastery } from "@/hooks/use-mastery";

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
  const { profile } = useLearningProfile();
  const { masteryByTopic, weakTopics: masteryWeakTopics } = useMastery();
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">Welcome back, {greeting}! 👋</h1>
          <p className="mt-2 text-muted-foreground">Here's your Chemistry progress overview.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="rounded-lg">
            <Link to="/library"><BookOpen className="mr-2 h-4 w-4" /> Library</Link>
          </Button>
          <Button asChild className="bg-gradient-hero text-primary-foreground shadow-glow hover:opacity-95 rounded-lg">
            <Link to="/quiz"><Sparkles className="mr-2 h-4 w-4" /> Start Quiz</Link>
          </Button>
        </div>
      </div>

      {/* XP Card */}
      {profile && <XPProgressBar profile={profile} />}

      {/* Coach insight callout */}
      {masteryWeakTopics.length > 0 && (
        <CoachInsightCard
          variant="warning"
          title={`Focus area: ${masteryWeakTopics[0].topic}`}
          body={`You scored ${masteryWeakTopics[0].mastery_score}% here. Chat with Coach Amaka for a personalised study plan.`}
          cta="Open Coach"
          ctaHref="/coach"
        />
      )}

      {/* Progress Overview */}
      {attempts.length > 0 && (
        <Card className="border-none bg-gradient-to-br from-primary/15 via-primary/5 to-transparent shadow-md">
          <CardContent className="py-6 px-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/20 text-primary">
                  <TrendingUp className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary/70">Overall Level</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-display text-3xl font-black">SSS {attempts.length > 20 ? '3' : attempts.length > 10 ? '2' : '1'}</span>
                    <span className="text-sm text-muted-foreground">Mastery Path</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 md:max-w-xs">
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-medium">Progress to next level</span>
                  <span className="font-bold text-primary">{Math.min(100, (attempts.length % 10) * 10)}%</span>
                </div>
                <Progress value={(attempts.length % 10) * 10} className="h-2.5" />
              </div>
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

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/library" className="group">
          <Card className="h-full border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 transition-all hover:shadow-md hover:border-primary/40">
            <CardContent className="flex items-center justify-between gap-4 py-8 px-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground flex-shrink-0"><BookOpen className="h-6 w-6" /></div>
                <div><h3 className="font-bold text-foreground">Study Library</h3><p className="text-sm text-muted-foreground">SS1, SS2, SS3 notes</p></div>
              </div>
              <ArrowRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/tutor" className="group">
          <Card className="h-full border-accent/20 bg-gradient-to-br from-accent/10 to-accent/5 transition-all hover:shadow-md hover:border-accent/40">
            <CardContent className="flex items-center justify-between gap-4 py-8 px-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-accent-foreground flex-shrink-0"><MessageCircle className="h-6 w-6" /></div>
                <div><h3 className="font-bold text-foreground">Ask AI Tutor</h3><p className="text-sm text-muted-foreground">Get instant help</p></div>
              </div>
              <ArrowRight className="h-5 w-5 text-accent opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </CardContent>
          </Card>
        </Link>
        <Link to="/coach" className="group">
          <Card className="h-full border-success/20 bg-gradient-to-br from-success/10 to-success/5 transition-all hover:shadow-md hover:border-success/40">
            <CardContent className="flex items-center justify-between gap-4 py-8 px-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-success text-white flex-shrink-0"><Target className="h-6 w-6" /></div>
                <div><h3 className="font-bold text-foreground">Coach Amaka</h3><p className="text-sm text-muted-foreground">Study plans & strategy</p></div>
              </div>
              <ArrowRight className="h-5 w-5 text-success opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Mastery Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🗺️ Topic Mastery Map</CardTitle>
        </CardHeader>
        <CardContent>
          <MasteryHeatmap data={masteryByTopic} />
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Accuracy by Topic</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {byTopic.every((t) => t.attempts === 0) ? (
              <EmptyHint />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byTopic}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
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
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {trend.length === 0 ? (
              <EmptyHint />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
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
                    strokeWidth={2.5}
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
            <CardTitle className="text-lg">📌 Recommended for You</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {weakTopics.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                Take a few quizzes — we'll spotlight your weak topics here.
              </p>
            ) : (
              weakTopics.map((t) => (
                <div
                  key={t.full}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 p-4 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-foreground">{t.full}</p>
                      <span className="text-sm font-bold text-destructive">{t.accuracy}%</span>
                    </div>
                    <Progress value={t.accuracy} className="h-2" />
                  </div>
                  <Button asChild size="sm" variant="ghost" className="ml-3 flex-shrink-0">
                    <Link to="/quiz/$topic" params={{ topic: t.full }}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📊 Recent Attempts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground py-4">Loading…</p>
            ) : attempts.length === 0 ? (
              <EmptyHint />
            ) : (
              attempts.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{a.topic}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString()} {new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
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
    <Card className={accent ? "border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5" : "bg-card/50"}>
      <CardContent className="flex flex-col gap-2 py-6">
        <div className="flex items-center gap-3">
          <div
            className={`grid h-10 w-10 place-items-center rounded-lg flex-shrink-0 ${
              accent ? "bg-gradient-hero text-primary-foreground" : "bg-secondary text-foreground"
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">{label}</p>
        </div>
        <p className="font-display text-3xl font-bold">{value}</p>
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