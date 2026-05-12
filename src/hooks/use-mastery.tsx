import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { TOPICS } from "@/lib/topics";
import {
  calculateMastery,
  getMasteryLevel,
  isDueForReview,
  type MasteryLevel,
} from "@/lib/adaptive-engine";

// ── Types ────────────────────────────────────────────────────────────────────
export type TopicMasteryData = {
  topic: string;
  mastery_score: number;
  attempts: number;
  level: MasteryLevel;
  last_practiced: string | null;
  next_review: string | null;
  isDue: boolean;
};

type UseMasteryReturn = {
  masteryByTopic: TopicMasteryData[];
  weakTopics: TopicMasteryData[];
  strongTopics: TopicMasteryData[];
  topicsNeedingReview: TopicMasteryData[];
  loading: boolean;
  refresh: () => Promise<void>;
};

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useMastery(): UseMasteryReturn {
  const { user } = useAuth();
  const [masteryByTopic, setMasteryByTopic] = useState<TopicMasteryData[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    try {
      // Try topic_mastery table first
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: masteryRows, error } = await (supabase as any)
        .from("topic_mastery")
        .select("*")
        .eq("user_id", user.id);

      if (!error && masteryRows) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = TOPICS.map((topic) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const row = (masteryRows as any[]).find((r: any) => r.topic === topic);
          const score = row?.mastery_score ?? 0;
          const attempts = row?.attempts ?? 0;
          return {
            topic,
            mastery_score: score,
            attempts,
            level: getMasteryLevel(score, attempts),
            last_practiced: row?.last_practiced ?? null,
            next_review: row?.next_review ?? null,
            isDue: row?.next_review ? isDueForReview(row.next_review) : false,
          } satisfies TopicMasteryData;
        });
        setMasteryByTopic(mapped);
      } else {
        // Fallback: compute mastery from quiz_attempts
        const { data: attempts } = await supabase
          .from("quiz_attempts")
          .select("topic, accuracy")
          .eq("user_id", user.id);

        const mapped = TOPICS.map((topic) => {
          const topicAttempts = (attempts ?? []).filter((a) => a.topic === topic);
          const accuracies = topicAttempts.map((a) => Number(a.accuracy));
          const score = calculateMastery(accuracies);
          return {
            topic,
            mastery_score: score,
            attempts: topicAttempts.length,
            level: getMasteryLevel(score, topicAttempts.length),
            last_practiced: null,
            next_review: null,
            isDue: false,
          } satisfies TopicMasteryData;
        });
        setMasteryByTopic(mapped);
      }
    } catch {
      setMasteryByTopic(TOPICS.map((topic) => ({
        topic,
        mastery_score: 0,
        attempts: 0,
        level: "not-started" as MasteryLevel,
        last_practiced: null,
        next_review: null,
        isDue: false,
      })));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const weakTopics = masteryByTopic.filter(
    (t) => t.attempts > 0 && t.mastery_score < 65,
  ).sort((a, b) => a.mastery_score - b.mastery_score);

  const strongTopics = masteryByTopic.filter(
    (t) => t.mastery_score >= 80,
  ).sort((a, b) => b.mastery_score - a.mastery_score);

  const topicsNeedingReview = masteryByTopic.filter((t) => t.isDue);

  return { masteryByTopic, weakTopics, strongTopics, topicsNeedingReview, loading, refresh: load };
}
