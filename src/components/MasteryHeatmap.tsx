import { Link } from "@tanstack/react-router";
import { getMasteryColor, getMasteryLevel, type MasteryLevel } from "@/lib/adaptive-engine";
import type { TopicMasteryData } from "@/hooks/use-mastery";

// ── Legend item ───────────────────────────────────────────────────────────────
const LEGEND: { level: MasteryLevel; label: string }[] = [
  { level: "not-started", label: "Not started" },
  { level: "weak",        label: "Weak (<40%)" },
  { level: "developing",  label: "Developing" },
  { level: "strong",      label: "Strong (>65%)" },
  { level: "mastered",    label: "Mastered (>85%)" },
];

type Props = {
  data: TopicMasteryData[];
};

export function MasteryHeatmap({ data }: Props) {
  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {LEGEND.map(({ level, label }) => (
          <div key={level} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: getMasteryColor(level) }}
            />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {data.map((item, i) => {
          const level = getMasteryLevel(item.mastery_score, item.attempts);
          const color = getMasteryColor(level);
          return (
            <Link
              key={item.topic}
              to="/quiz/$topic"
              params={{ topic: item.topic }}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-3 transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {/* Colour accent bar */}
              <div
                className="absolute left-0 top-0 h-full w-1 rounded-l-xl transition-all group-hover:w-1.5"
                style={{ backgroundColor: color }}
              />

              <div className="pl-2">
                <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2">
                  {item.topic}
                </p>

                {item.attempts > 0 ? (
                  <>
                    <div className="mt-2 flex items-center justify-between">
                      <span
                        className="text-lg font-display font-bold"
                        style={{ color }}
                      >
                        {item.mastery_score}%
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {item.attempts} {item.attempts === 1 ? "attempt" : "attempts"}
                      </span>
                    </div>
                    {/* Mini progress bar */}
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.mastery_score}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Not started · click to practice
                  </p>
                )}

                {item.isDue && (
                  <span className="mt-1.5 inline-block rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                    Review due
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
