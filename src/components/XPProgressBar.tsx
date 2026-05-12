import { getXPProgress, LEARNING_STYLE_EMOJI, LEARNING_STYLE_LABELS, LEVELS } from "@/lib/adaptive-engine";
import type { LearningProfile } from "@/hooks/use-learning-profile";

const LEVELS_ORDERED = LEVELS;

type Props = {
  profile: LearningProfile;
  compact?: boolean;
};

export function XPProgressBar({ profile, compact = false }: Props) {
  const { current, progressPct, xpToNext } = getXPProgress(profile.xp);
  const isMax = xpToNext === 0;

  if (compact) {
    return (
      <div className="px-4 py-3 rounded-xl bg-secondary/60 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-base leading-none">{current.emoji}</span>
            <span className="text-xs font-bold truncate">{current.name}</span>
            {profile.learning_style && (
              <span
                className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary flex-shrink-0"
                title={LEARNING_STYLE_LABELS[profile.learning_style]}
              >
                {LEARNING_STYLE_EMOJI[profile.learning_style]}
              </span>
            )}
          </div>
          <span className="text-xs font-bold text-primary flex-shrink-0">{profile.xp} XP</span>
        </div>

        {/* Progress bar */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-border">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-hero transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {!isMax && (
          <p className="text-[10px] text-muted-foreground">
            {xpToNext} XP to <span className="font-semibold">{
              LEVELS_ORDERED.find(l => l.minXP > profile.xp)?.name
            }</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div
          className="grid h-12 w-12 place-items-center rounded-xl text-2xl shadow-sm"
          style={{ background: current.color + "30" }}
        >
          {current.emoji}
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Level</p>
          <p className="font-display text-xl font-bold">{current.name}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-muted-foreground">Total XP</p>
          <p className="font-display text-2xl font-black text-primary">{profile.xp.toLocaleString()}</p>
        </div>
      </div>

      {/* Bar */}
      <div>
        <div className="flex justify-between text-xs mb-1.5 text-muted-foreground">
          <span>{current.name}</span>
          {!isMax && <span>{xpToNext} XP to next level</span>}
        </div>
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-hero transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>{current.minXP}</span>
          {!isMax && <span>{current.maxXP + 1}</span>}
        </div>
      </div>

      {/* Streak */}
      {profile.streak_days > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-warning/10 px-3 py-2">
          <span className="text-lg">🔥</span>
          <p className="text-sm font-semibold">
            {profile.streak_days}-day streak — keep it going!
          </p>
        </div>
      )}
    </div>
  );
}

