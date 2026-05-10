import { createFileRoute, Link } from "@tanstack/react-router";
import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import {
  Atom,
  Brain,
  LineChart,
  Sparkles,
  Target,
  Wand2,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const features = [
  {
    icon: Brain,
    title: "Adaptive Quizzes",
    body: "Questions get easier or harder based on how you perform — so every session is at your level.",
  },
  {
    icon: Wand2,
    title: "AI Chemistry Tutor",
    body: "Ask anything from atomic structure to organic chemistry and get clear, step-by-step answers.",
  },
  {
    icon: LineChart,
    title: "Full Study Library",
    body: "Detailed Chemistry notes and resources for SS1, SS2, and SS3, structured for Nigerian exams.",
  },
  {
    icon: Target,
    title: "WAEC/NECO Ready",
    body: "Aligned to the Nigerian SSS Chemistry syllabus with exam-style questions and tips.",
  },
];

const topics = [
  "Atomic Structure",
  "Periodic Table",
  "Chemical Bonding",
  "Stoichiometry",
  "Acids and Bases",
  "Electrochemistry",
  "Organic Chemistry",
  "Gas Laws",
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-hero opacity-[0.08]" />
        <div className="absolute -top-40 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-accent/20 blur-3xl" />

        <div className="mx-auto max-w-6xl px-4 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Built for Nigerian SSS Chemistry
              </div>
              <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
                Master Chemistry,
                <br />
                <span className="text-gradient">one quiz at a time.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                NaijaTutor is your AI-powered study partner — adaptive quizzes,
                instant explanations, and a clear path to a top WAEC/NECO grade.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-hero text-primary-foreground shadow-glow hover:opacity-95"
                >
                  <Link to="/auth">
                    Start practising free <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-primary/20 hover:bg-primary/5">
                  <Link to="/library">Browse Study Notes</Link>
                </Button>
                <Button asChild size="lg" variant="ghost">
                  <Link to="/tutor">AI tutor</Link>
                </Button>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {["No credit card", "WAEC/NECO aligned", "Free for students"].map((t) => (
                  <li key={t} className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual card */}
            <div className="relative">
              <div className="relative rounded-3xl border border-border bg-gradient-card p-6 shadow-glow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10">
                      <Atom className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Today's quiz</div>
                      <div className="font-semibold">Chemical Bonding</div>
                    </div>
                  </div>
                  <div className="rounded-full bg-accent/20 px-2.5 py-1 text-xs font-medium text-accent-foreground">
                    Difficulty 2
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-secondary/60 p-5">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Question 3 of 10
                  </div>
                  <p className="mt-2 font-display text-lg font-semibold">
                    The shape of a methane (CH₄) molecule is:
                  </p>
                  <div className="mt-4 grid gap-2">
                    {["Linear", "Trigonal planar", "Tetrahedral", "Bent"].map((o, i) => (
                      <div
                        key={o}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition ${
                          i === 2
                            ? "border-primary bg-primary/10 font-semibold text-primary"
                            : "border-border bg-card"
                        }`}
                      >
                        <span className="grid h-6 w-6 place-items-center rounded-md bg-background text-xs font-bold">
                          {String.fromCharCode(65 + i)}
                        </span>
                        {o}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Streak: 🔥 4 correct</span>
                  <span className="font-semibold text-primary">+10 XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-secondary/30 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Everything you need to ace Chemistry.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Smart practice, instant help, and clear progress — all in one place.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-glow"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-hero text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Topics */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold md:text-4xl">
                Cover the full SSS syllabus.
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Practice every major Chemistry topic with hand-crafted, exam-style questions.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/quiz">
                Browse all topics <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {topics.map((t) => (
              <div
                key={t}
                className="rounded-xl border border-border bg-card px-5 py-4 font-medium shadow-soft"
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-hero p-10 text-center shadow-glow md:p-16">
          <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-5xl">
            Ready to level up your Chemistry?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Join thousands of Nigerian students using NaijaTutor to prepare for WAEC and NECO.
          </p>
          <Button asChild size="lg" className="mt-8 bg-background text-foreground hover:bg-background/90">
            <Link to="/auth">Create free account</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} NaijaTutor · Built with care for Nigerian students.
      </footer>
    </div>
  );
}
