import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CoachInsightCard } from "@/components/CoachInsightCard";
import { useLearningProfile } from "@/hooks/use-learning-profile";
import { useMastery } from "@/hooks/use-mastery";
import { useAuth } from "@/hooks/use-auth";
import { useVoice } from "@/hooks/use-voice";
import { VoiceButton } from "@/components/VoiceButton";
import { supabase } from "@/integrations/supabase/client";
import { askCoach, type CoachContext } from "@/functions/coach";
import { getLevelFromXP, LEARNING_STYLE_EMOJI, LEARNING_STYLE_LABELS } from "@/lib/adaptive-engine";
import { Brain, Calendar, Loader2, RefreshCcw, Send, Sparkles, Target, TrendingUp, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/coach")({ component: CoachPage });

type Msg = { role: "user" | "assistant"; content: string };

function renderMarkdown(text: string): ReactNode[] {
  return text.split("\n").map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-2" />;
    if (line.startsWith("## ")) return <h2 key={i} className="mt-4 mb-2 text-lg font-bold">{line.slice(3)}</h2>;
    if (line.startsWith("### ")) return <h3 key={i} className="mt-3 mb-1 text-base font-bold">{line.slice(4)}</h3>;
    if (line.startsWith("- ") || line.startsWith("* ")) {
      return <li key={i} className="ml-4 list-disc text-sm mb-1">{renderInline(line.slice(2))}</li>;
    }
    return <p key={i} className="mb-2 text-sm leading-relaxed">{renderInline(line)}</p>;
  });
}

function renderInline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const regex = /\*\*(.*?)\*\*/g;
  let last = 0, m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<strong key={m.index} className="font-semibold">{m[1]}</strong>);
    last = regex.lastIndex;
  }
  parts.push(text.slice(last));
  return <>{parts}</>;
}

function CoachBubble({ msg }: { msg: Msg }) {
  const mine = msg.role === "user";
  return (
    <div className={`flex gap-3 ${mine ? "flex-row-reverse" : ""}`}>
      <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full shadow-sm text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-gradient-hero text-primary-foreground"}`}>
        {mine ? <User className="h-4 w-4" /> : "👩‍🏫"}
      </div>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-soft ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
        {renderMarkdown(msg.content)}
      </div>
    </div>
  );
}

function CoachPage() {
  const { user } = useAuth();
  const { profile } = useLearningProfile();
  const { weakTopics, strongTopics, topicsNeedingReview } = useMastery();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Voice ───────────────────────────────────────────────────────────────────
  const {
    state: voiceState,
    isSupported: voiceSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    transcript,
  } = useVoice({
    onTranscript: useCallback((text: string) => setInput(text), []),
    onError: useCallback((msg: string) => toast.error(msg), []),
    pitch: 1.1,
    rate: 0.9,
  });

  const isListening = voiceState === "listening";
  const isSpeaking = voiceState === "speaking";

  useEffect(() => {
    if (!user) return;
    supabase.from("quiz_attempts").select("id", { count: "exact", head: true }).then(({ count }) => setTotalQuizzes(count ?? 0));
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streaming]);

  // Populate textarea from voice transcript
  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  const context = useMemo((): CoachContext => ({
    learningStyle: profile?.learning_style ?? null,
    weakTopics: weakTopics.slice(0, 5).map(t => t.topic),
    strongTopics: strongTopics.slice(0, 3).map(t => t.topic),
    xp: profile?.xp ?? 0,
    level: getLevelFromXP(profile?.xp ?? 0).name,
    streakDays: profile?.streak_days ?? 0,
    totalQuizzes,
    reviewDueTopics: topicsNeedingReview.slice(0, 3).map(t => t.topic),
  }), [profile, weakTopics, strongTopics, totalQuizzes, topicsNeedingReview]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    if (isSpeaking) stopSpeaking();
    const userMsg: Msg = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);
    try {
      const reply = await askCoach({ data: { messages: next, context } });
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      if (autoSpeak) speak(reply);
    } catch {
      toast.error("Coach is unavailable right now. Try again shortly.");
    } finally {
      setStreaming(false);
    }
  };

  const insights = useMemo(() => {
    const cards: { variant: "warning" | "success" | "info" | "tip"; title: string; body: string }[] = [];
    if (weakTopics.length > 0) cards.push({ variant: "warning", title: `Weak area: ${weakTopics[0].topic}`, body: `Your accuracy is ${weakTopics[0].mastery_score}%. Practice 20 mins daily to see improvement this week.` });
    if ((profile?.streak_days ?? 0) >= 3) cards.push({ variant: "success", title: `🔥 ${profile!.streak_days}-day streak!`, body: profile!.streak_days >= 7 ? "Incredible! Keep going for the 30-day badge." : "Reach 7 days to unlock the Dedicated badge." });
    if (topicsNeedingReview.length > 0) cards.push({ variant: "info", title: `Review due: ${topicsNeedingReview[0].topic}`, body: "Spaced repetition locks in memory. A 10-minute review now saves hours of cramming later." });
    if (profile?.learning_style) cards.push({ variant: "tip", title: `${LEARNING_STYLE_EMOJI[profile.learning_style]} ${LEARNING_STYLE_LABELS[profile.learning_style]} learner tip`, body: profile.learning_style === "visual" ? "Draw a mind-map of your weakest topic before your next quiz." : profile.learning_style === "auditory" ? "Record yourself explaining a topic out loud, then play it back." : profile.learning_style === "reading" ? "Write a one-page summary of your weakest topic in your own words." : "Do 5 practice questions on your weakest topic right now." });
    if (strongTopics.length > 0) cards.push({ variant: "success", title: `Strong in ${strongTopics[0].topic}! ⭐`, body: `${strongTopics[0].mastery_score}% mastery — well done! Now shift focus to weaker areas.` });
    if (cards.length === 0) cards.push({ variant: "info", title: "Getting started", body: "Complete your first quiz to unlock personalised coaching insights!" });
    return cards;
  }, [weakTopics, strongTopics, topicsNeedingReview, profile]);

  const greeting = (user?.user_metadata?.full_name as string)?.split(" ")[0] || "Student";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-hero shadow-glow text-2xl flex-shrink-0">🧑‍🏫</div>
          <div>
            <h1 className="font-display text-3xl font-bold">Coach Amaka</h1>
            <p className="text-sm text-muted-foreground">Strategy, motivation &amp; personalised study plans</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {profile?.learning_style && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold">
              {LEARNING_STYLE_EMOJI[profile.learning_style]} {LEARNING_STYLE_LABELS[profile.learning_style]} Learner
            </span>
          )}
          {voiceSupported && (
            <VoiceButton
              state={voiceState}
              isSupported={voiceSupported}
              isSpeaking={isSpeaking}
              isListening={isListening}
              onMicClick={isListening ? stopListening : startListening}
              onStopSpeaking={stopSpeaking}
              autoSpeak={autoSpeak}
              onToggleAutoSpeak={() => setAutoSpeak(v => !v)}
            />
          )}
        </div>
      </div>

      {/* Listening banner */}
      {isListening && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
          <span className="font-medium text-destructive">Listening… speak to Amaka</span>
          {transcript && <span className="ml-2 text-muted-foreground italic truncate">"{transcript}"</span>}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Insights panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Your Insights</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {insights.map((card, i) => <CoachInsightCard key={i} {...card} />)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Quick Stats</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {[
                { icon: Brain, label: "Quizzes", value: totalQuizzes },
                { icon: Sparkles, label: "XP earned", value: (profile?.xp ?? 0).toLocaleString() },
                { icon: Calendar, label: "Streak", value: `${profile?.streak_days ?? 0}d 🔥` },
                { icon: Target, label: "Weak topics", value: weakTopics.length },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-xl bg-secondary/50 p-3">
                  <div className="flex items-center gap-1.5 mb-1"><Icon className="h-3.5 w-3.5 text-muted-foreground" /><p className="text-xs text-muted-foreground">{label}</p></div>
                  <p className="font-display text-xl font-bold">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Chat panel */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden flex flex-col" style={{ minHeight: 560 }}>
            <CardHeader className="border-b border-border pb-4 flex-shrink-0">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">Chat with Amaka</CardTitle>
                <div className="flex items-center gap-2">
                  {voiceSupported && (
                    <VoiceButton
                      state={voiceState}
                      isSupported={voiceSupported}
                      isSpeaking={isSpeaking}
                      isListening={isListening}
                      onMicClick={isListening ? stopListening : startListening}
                      onStopSpeaking={stopSpeaking}
                      autoSpeak={autoSpeak}
                      onToggleAutoSpeak={() => setAutoSpeak(v => !v)}
                      compact
                    />
                  )}
                  <Button variant="outline" size="sm" onClick={() => { setMessages([]); stopSpeaking(); }} disabled={messages.length === 0} className="rounded-lg">
                    <RefreshCcw className="mr-1.5 h-3.5 w-3.5" /> Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex flex-col flex-1">
              <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5" style={{ height: 380 }}>
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                    <div className="text-5xl mb-4">👩‍🏫</div>
                    <p className="font-semibold">Hey {greeting}, I'm Amaka!</p>
                    <p className="mt-1 text-sm text-muted-foreground max-w-sm">I'm here to coach you — study plans, motivation, strategy.</p>
                    <div className="mt-5 grid gap-2 w-full max-w-sm">
                      {[
                        ["📊 How am I doing overall?", "Hi Amaka! Can you give me a quick summary of how I'm doing?"],
                        ["📅 Generate my 7-day study plan", "Please generate a personalised 7-day study plan for me."],
                        ["🎨 Tips for my learning style", "What's the best way to study for someone with my learning style?"],
                        ["😰 Help me prioritise", "I'm feeling overwhelmed. Can you help me prioritise?"],
                      ].map(([label, msg]) => (
                        <button key={label} onClick={() => send(msg)} className="rounded-xl border border-border bg-card px-4 py-2.5 text-left text-sm transition hover:border-primary hover:bg-primary/5">{label}</button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, i) => <CoachBubble key={i} msg={msg} />)}
                    {streaming && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Amaka is thinking…</div>}
                  </>
                )}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-end gap-2 border-t border-border bg-secondary/20 p-3 flex-shrink-0">
                {voiceSupported && (
                  <VoiceButton
                    state={voiceState}
                    isSupported={voiceSupported}
                    isSpeaking={isSpeaking}
                    isListening={isListening}
                    onMicClick={isListening ? stopListening : startListening}
                    onStopSpeaking={stopSpeaking}
                    compact
                  />
                )}
                <textarea
                  id="coach-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }}}
                  rows={1}
                  placeholder={isListening ? "Listening — speak to Amaka…" : "Ask Amaka anything or tap 🎙️ to speak…"}
                  className="max-h-32 flex-1 resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                />
                <Button type="submit" disabled={streaming || !input.trim()} className="bg-gradient-hero text-primary-foreground shadow-glow hover:opacity-95">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
