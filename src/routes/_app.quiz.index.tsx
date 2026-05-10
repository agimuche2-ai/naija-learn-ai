import { createFileRoute, Link } from "@tanstack/react-router";
import { TOPICS } from "@/lib/topics";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Atom } from "lucide-react";

export const Route = createFileRoute("/_app/quiz/")({
  component: QuizTopicList,
});

const topicMeta: Record<string, { emoji: string; blurb: string }> = {
  "Separation of Mixtures": { emoji: "🔬", blurb: "Filtration, distillation & chromatography" },
  "Chemical Combination & the Mole": { emoji: "⚗️", blurb: "Stoichiometry & chemical laws" },
  "Gas Laws": { emoji: "💨", blurb: "Boyle, Charles & ideal gases" },
  "Atomic Structure & Chemical Bonding": { emoji: "⚛️", blurb: "Atoms, ions & molecular bonds" },
  "Air & Atmosphere": { emoji: "🌬️", blurb: "Composition & noble gases" },
  "Water & Solutions": { emoji: "💧", blurb: "Hardness & purification" },
  "Solubility": { emoji: "🧪", blurb: "Solubility curves & rules" },
  "Environmental Pollution": { emoji: "🌿", blurb: "Air, water & soil pollution" },
  "Acids, Bases & Salts": { emoji: "🧪", blurb: "pH, titrations & salt prep" },
  "Oxidation & Reduction (Redox)": { emoji: "⚡", blurb: "Oxidation states & agents" },
  "Electrolysis": { emoji: "🔋", blurb: "Faraday's laws & cells" },
  "Energy Changes in Reactions": { emoji: "🔥", blurb: "Enthalpy & Hess's law" },
  "Rates of Reaction": { emoji: "⏱️", blurb: "Collision theory & factors" },
  "Chemical Equilibrium": { emoji: "⚖️", blurb: "Le Chatelier & Kc" },
  "Non-Metals & Compounds": { emoji: "🏭", blurb: "Halogens, sulfur & carbon" },
  "Metals & Alloys": { emoji: "🏗️", blurb: "Extraction & properties" },
  "Organic Chemistry": { emoji: "🧬", blurb: "Hydrocarbons & IUPAC" },
  "Industrial Chemistry": { emoji: "⚙️", blurb: "Haber, Contact & Solvay" },
  "Mixed Chemistry": { emoji: "🎓", blurb: "Full JAMB Practice (All Topics)" },
};

function QuizTopicList() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold md:text-4xl">Pick a topic</h1>
        <p className="mt-2 text-muted-foreground">
          Each quiz adapts in real time — answer correctly to unlock harder questions.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOPICS.map((t) => (
          <Link key={t} to="/quiz/$topic" params={{ topic: t }}>
            <Card className="group h-full cursor-pointer transition hover:-translate-y-1 hover:shadow-glow">
              <CardContent className="flex h-full flex-col gap-3 pt-6">
                <div className="flex items-start justify-between">
                  <div className="text-3xl">{topicMeta[t]?.emoji ?? "🧪"}</div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold">{t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {topicMeta[t]?.blurb ?? "Practice questions"}
                  </p>
                </div>
                <div className="mt-auto flex items-center gap-1 text-xs text-primary">
                  <Atom className="h-3.5 w-3.5" /> Adaptive · 10 questions
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}