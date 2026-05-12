import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  getNextReviewDate,
  getXPForAttempt,
  type LearningStyle,
} from "@/lib/adaptive-engine";

// ── Types ────────────────────────────────────────────────────────────────────
export type LearningProfile = {
  id?: string;
  user_id: string;
  learning_style: LearningStyle | null;
  xp: number;
  streak_days: number;
  last_active_date: string | null;
  onboarding_done: boolean;
  goals: string[];
};

type LearningProfileCtx = {
  profile: LearningProfile | null;
  loading: boolean;
  updateProfile: (updates: Partial<LearningProfile>) => Promise<void>;
  addXP: (accuracy: number, avgDifficulty: number) => Promise<number>;
  completeOnboarding: (style: LearningStyle) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const Ctx = createContext<LearningProfileCtx>({
  profile: null,
  loading: true,
  updateProfile: async () => {},
  addXP: async () => 0,
  completeOnboarding: async () => {},
  refreshProfile: async () => {},
});

// ── Default profile factory ──────────────────────────────────────────────────
function defaultProfile(userId: string): LearningProfile {
  return {
    user_id: userId,
    learning_style: null,
    xp: 0,
    streak_days: 0,
    last_active_date: null,
    onboarding_done: false,
    goals: [],
  };
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function LearningProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setProfile(null); setLoading(false); return; }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("learning_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        // Table might not exist yet — use localStorage fallback
        const local = localStorage.getItem(`naija_profile_${user.id}`);
        setProfile(local ? JSON.parse(local) : defaultProfile(user.id));
      } else if (!data) {
        // First-time user — create row
        const fresh = defaultProfile(user.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: created } = await (supabase as any)
          .from("learning_profiles")
          .insert({ ...fresh })
          .select("*")
          .single();
        setProfile(created ?? fresh);
      } else {
        setProfile(data as LearningProfile);
      }
    } catch {
      const local = localStorage.getItem(`naija_profile_${user.id}`);
      setProfile(local ? JSON.parse(local) : defaultProfile(user.id));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Persist to localStorage as a resilience layer
  useEffect(() => {
    if (profile && user) {
      localStorage.setItem(`naija_profile_${user.id}`, JSON.stringify(profile));
    }
  }, [profile, user]);

  const updateProfile = useCallback(async (updates: Partial<LearningProfile>) => {
    if (!user || !profile) return;
    const merged = { ...profile, ...updates };
    setProfile(merged);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("learning_profiles")
        .upsert({ ...merged, user_id: user.id }, { onConflict: "user_id" });
    } catch { /* persisted in localStorage */ }
  }, [user, profile]);

  const addXP = useCallback(async (accuracy: number, avgDifficulty: number): Promise<number> => {
    if (!user || !profile) return 0;
    const gained = getXPForAttempt(accuracy, avgDifficulty);
    const today = new Date().toISOString().split("T")[0];
    // Update streak
    const lastDate = profile.last_active_date;
    let streak = profile.streak_days;
    if (lastDate) {
      const last = new Date(lastDate);
      last.setHours(0, 0, 0, 0);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const diff = Math.round((now.getTime() - last.getTime()) / 86400000);
      if (diff === 1) streak += 1;
      else if (diff > 1) streak = 1;
    } else {
      streak = 1;
    }
    await updateProfile({
      xp: profile.xp + gained,
      streak_days: streak,
      last_active_date: today,
    });
    return gained;
  }, [user, profile, updateProfile]);

  const completeOnboarding = useCallback(async (style: LearningStyle) => {
    await updateProfile({ learning_style: style, onboarding_done: true });
  }, [updateProfile]);

  return (
    <Ctx.Provider value={{ profile, loading, updateProfile, addXP, completeOnboarding, refreshProfile: load }}>
      {children}
    </Ctx.Provider>
  );
}

export const useLearningProfile = () => useContext(Ctx);

// ── Mastery update helper (exported for use in quiz route) ──────────────────
export async function updateTopicMastery(
  userId: string,
  topic: string,
  newAccuracy: number,
): Promise<void> {
  try {
    // Fetch existing mastery
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from("topic_mastery")
      .select("*")
      .eq("user_id", userId)
      .eq("topic", topic)
      .maybeSingle();

    let newScore: number;
    let newAttempts: number;

    if (existing) {
      // Weighted rolling average: new score counts 2× recent
      const attempts = existing.attempts + 1;
      newScore = Math.round((existing.mastery_score * existing.attempts + newAccuracy * 2) / (attempts + 1));
      newAttempts = attempts;
    } else {
      newScore = Math.round(newAccuracy);
      newAttempts = 1;
    }

    const nextReview = getNextReviewDate(newScore).toISOString().split("T")[0];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("topic_mastery").upsert(
      {
        user_id: userId,
        topic,
        mastery_score: Math.min(100, Math.max(0, newScore)),
        attempts: newAttempts,
        last_practiced: new Date().toISOString(),
        next_review: nextReview,
      },
      { onConflict: "user_id,topic" },
    );
  } catch (e) {
    console.warn("Could not update topic mastery:", e);
  }
}
