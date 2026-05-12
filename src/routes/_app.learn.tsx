import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLearningProfile } from "@/hooks/use-learning-profile";
import { useMastery } from "@/hooks/use-mastery";
import {
  getLearningStyleStudyTips,
  LEARNING_STYLE_EMOJI,
  LEARNING_STYLE_LABELS,
  getMasteryColor,
  getMasteryLevel,
  getReviewIntervalDays,
} from "@/lib/adaptive-engine";
import { TOPICS } from "@/lib/topics";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/_app/learn")({ component: LearnPage });

// Curriculum sequence — ordered by typical teaching order
const CURRICULUM_ORDER: string[] = [
  "Separation of Mixtures",
  "Chemical Combination & the Mole",
  "Atomic Structure & Chemical Bonding",
  "Gas Laws",
  "Air & Atmosphere",
  "Water & Solutions",
  "Solubility",
  "Acids, Bases & Salts",
  "Oxidation & Reduction (Redox)",
  "Electrolysis",
  "Energy Changes in Reactions",
  "Rates of Reaction",
  "Chemical Equilibrium",
  "Environmental Pollution",
  "Non-Metals & Compounds",
  "Metals & Alloys",
  "Organic Chemistry",
  "Industrial Chemistry",
  "Mixed Chemistry",
];

function LearnPage() {
  const { profile, loading: profileLoading } = useLearningProfile();
  const { masteryByTopic, weakTopics, topicsNeedingReview, loading: masteryLoading } = useMastery();
  const loading = profileLoading || masteryLoading;

  // Recommended next topic based on curriculum sequence + mastery gaps
  const recommendedNext = useMemo(() => {
    // Find first topic in curriculum order that is not mastered and has fewest attempts
    for (const topicName of CURRICULUM_ORDER) {
      const data = masteryByTopic.find(t => t.topic === topicName);
      if (!data || data.mastery_score < 80) return data ?? { topic: topicName, mastery_score: 0, attempts: 0 };
    }
    return null;
  }, [masteryByTopic]);

  const studyTips = profile?.learning_style
    ? getLearningStyleStudyTips(profile.learning_style)
    : [];

  if (loading) {
    return (
      <div className="grid h-[60vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold md:text-4xl">Your Study Pathway</h1>
        <p className="mt-2 text-muted-foreground">Personalised to your learning style and progress.</p>
      </div>

      {/* Top row — review queue + recommended */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Spaced repetition queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-primary" /> Practice Today
              {topicsNeedingReview.length > 0 && (
                <span className="ml-auto rounded-full bg-warning/20 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                  {topicsNeedingReview.length} due
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topicsNeedingReview.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
                <div>
                  <p className="font-semibold">All caught up! 🎉</p>
                  <p className="text-sm text-muted-foreground mt-1">No reviews due today. Keep practising new topics.</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to="/quiz">Browse all topics</Link>
                </Button>
              </div>
            ) : (
              topicsNeedingReview.slice(0, 4).map((item) => {
                const level = getMasteryLevel(item.mastery_score, item.attempts);
                const color = getMasteryColor(level);
                return (
                  <div key={item.topic} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{item.topic}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{item.mastery_score}% mastery</span>
                          <span className="text-[10px] rounded-full bg-warning/20 px-1.5 py-0.5 text-amber-700 dark:text-amber-400 font-semibold flex-shrink-0">Due today</span>
                        </div>
                      </div>
                    </div>
                    <Button asChild size="sm" variant="ghost" className="flex-shrink-0">
                      <Link to="/quiz/$topic" params={{ topic: item.topic }}>
                        <Zap className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recommended next topic */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" /> Recommended Next
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recommendedNext ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-5">
                  <p className="text-xs uppercase tracking-widest text-primary font-bold mb-2">Focus Topic</p>
                  <h3 className="font-display text-xl font-bold">{recommendedNext.topic}</h3>
                  <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Brain className="h-3.5 w-3.5" />
                      {recommendedNext.attempts} attempts
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      ~15 min quiz
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      +~50 XP
                    </span>
                  </div>
                  <Progress value={recommendedNext.mastery_score} className="mt-3 h-2" />
                  <p className="mt-1 text-xs text-muted-foreground">{recommendedNext.mastery_score}% mastery</p>
                </div>
                <div className="flex gap-2">
                  <Button asChild className="flex-1 bg-gradient-hero text-primary-foreground shadow-glow hover:opacity-95">
                    <Link to="/quiz/$topic" params={{ topic: recommendedNext.topic }}>
                      <Sparkles className="mr-2 h-4 w-4" /> Start quiz
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link to="/library">
                      <BookOpen className="mr-2 h-4 w-4" /> Study notes
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="text-4xl">🏆</div>
                <p className="font-semibold">You've mastered all topics!</p>
                <p className="text-sm text-muted-foreground">Outstanding work. Keep reviewing to maintain your scores.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Learning style tips */}
      {profile?.learning_style && studyTips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {LEARNING_STYLE_EMOJI[profile.learning_style]}{" "}
              Tips for {LEARNING_STYLE_LABELS[profile.learning_style]} Learners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {studyTips.map((tip, i) => (
                <div key={i} className="rounded-xl border border-border bg-secondary/30 p-4">
                  <div className="mb-2 text-lg">{["💡", "🎯", "📌", "⚡"][i]}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full topic pathway */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4 text-primary" /> Full Chemistry Pathway
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {masteryByTopic.filter(t => t.mastery_score >= 80).length} / {TOPICS.length} mastered
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {CURRICULUM_ORDER.map((topicName, i) => {
              const data = masteryByTopic.find(t => t.topic === topicName);
              const score = data?.mastery_score ?? 0;
              const attempts = data?.attempts ?? 0;
              const level = getMasteryLevel(score, attempts);
              const color = getMasteryColor(level);
              const isDue = data?.isDue ?? false;
              const isRecommended = recommendedNext?.topic === topicName;
              const nextReviewDays = score > 0 ? getReviewIntervalDays(score) : null;

              return (
                <div
                  key={topicName}
                  className={`flex items-center gap-4 rounded-xl border p-3 transition-all hover:shadow-sm ${isRecommended ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}
                >
                  {/* Step number */}
                  <span className="w-6 text-center text-xs font-bold text-muted-foreground flex-shrink-0">{i + 1}</span>

                  {/* Color indicator */}
                  <div className="h-8 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{topicName}</p>
                      {isRecommended && <span className="text-[10px] rounded-full bg-primary/15 px-2 py-0.5 text-primary font-bold">Recommended</span>}
                      {isDue && <span className="text-[10px] rounded-full bg-warning/20 px-1.5 py-0.5 text-amber-700 dark:text-amber-400 font-semibold">Review due</span>}
                    </div>
                    {attempts > 0 && (
                      <div className="flex items-center gap-3 mt-1">
                        <Progress value={score} className="h-1.5 w-24" />
                        <span className="text-xs text-muted-foreground">{score}%</span>
                        {nextReviewDays && <span className="text-xs text-muted-foreground">Next review in {nextReviewDays}d</span>}
                      </div>
                    )}
                  </div>

                  {/* XP estimate */}
                  <span className="text-xs text-muted-foreground flex-shrink-0 hidden sm:block">
                    ~{40 + Math.round((1 - score / 100) * 40)} XP
                  </span>

                  {/* CTA */}
                  <Button asChild size="sm" variant={isRecommended ? "default" : "ghost"} className={`flex-shrink-0 ${isRecommended ? "bg-gradient-hero text-primary-foreground" : ""}`}>
                    <Link to="/quiz/$topic" params={{ topic: topicName }}>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
