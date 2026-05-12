import type { LearningStyle } from "@/lib/adaptive-engine";
import {
  getLearningStylePromptHint,
  LEARNING_STYLE_LABELS,
} from "@/lib/adaptive-engine";

type Message = { role: "user" | "assistant" | "system"; content: string };

export type CoachContext = {
  learningStyle: LearningStyle | null;
  weakTopics: string[];
  strongTopics: string[];
  xp: number;
  level: string;
  streakDays: number;
  totalQuizzes: number;
  reviewDueTopics: string[];
};

function buildCoachSystemPrompt(ctx: CoachContext): string {
  const styleName = ctx.learningStyle ? LEARNING_STYLE_LABELS[ctx.learningStyle] : "unknown";
  const styleHint = ctx.learningStyle ? getLearningStylePromptHint(ctx.learningStyle) : "";

  const weakList  = ctx.weakTopics.length  ? ctx.weakTopics.join(", ")  : "none identified yet";
  const strongList = ctx.strongTopics.length ? ctx.strongTopics.join(", ") : "none yet";
  const reviewList = ctx.reviewDueTopics.length ? ctx.reviewDueTopics.join(", ") : "none due today";

  return `You are Amaka, a warm, encouraging, and highly effective Nigerian Chemistry coach for senior secondary school students.
Your job is NOT to teach Chemistry directly — instead, you help students:
- Plan and organise their studies strategically
- Identify and overcome weaknesses
- Stay motivated and build good study habits
- Set achievable goals for WAEC/NECO success

STUDENT PROFILE:
- Learning style: ${styleName}
- ${styleHint}
- Current XP level: ${ctx.level} (${ctx.xp} XP total)
- Study streak: ${ctx.streakDays} day${ctx.streakDays !== 1 ? "s" : ""}
- Total quizzes completed: ${ctx.totalQuizzes}
- Weak topics (accuracy < 65%): ${weakList}
- Strong topics (≥ 80%): ${strongList}
- Topics due for spaced-repetition review today: ${reviewList}

COACHING STYLE:
- Be warm, encouraging, and Nigerian in tone — use "ehen!", "well done!", "you can do it!" naturally
- Be specific — name the student's actual weak topics in your advice
- Keep responses concise but impactful (3-5 sentences max per point)
- When asked for a study plan, generate a structured 7-day plan with specific topics and methods
- Celebrate milestones (streaks, XP levels, topic mastery) enthusiastically
- Gently but firmly address weak areas without discouraging the student
- Always end with an actionable next step

BOUNDARIES:
- If asked a specific Chemistry question, say: "That's a Chemistry question — ask your AI Tutor for a full explanation! I'm here to help you plan, not teach the content."
- Stay focused on study strategy, motivation, and planning.`;
}

type Provider = {
  name: string;
  apiKey?: string;
  baseUrl: string;
  model: string;
};

function getProviders(): Provider[] {
  return [
    {
      name: "Groq",
      apiKey: import.meta.env.VITE_GROQ_API_KEY,
      baseUrl: "https://api.groq.com/openai/v1",
      model: import.meta.env.VITE_GROQ_MODEL || "llama-3.3-70b-versatile",
    },
    {
      name: "OpenAI",
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      baseUrl: "https://api.openai.com/v1",
      model: import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini",
    },
    {
      name: "Lovable",
      apiKey: import.meta.env.VITE_LOVABLE_API_KEY,
      baseUrl: "https://ai.gateway.lovable.dev/v1",
      model: import.meta.env.VITE_LOVABLE_MODEL || "gpt-4o-mini",
    },
  ];
}

function isConfigured(apiKey?: string) {
  return Boolean(apiKey && apiKey !== "dummy-key" && !apiKey.includes("your-"));
}

async function callProvider(provider: Provider, messages: Message[]): Promise<string | null> {
  if (!isConfigured(provider.apiKey)) return null;
  try {
    const res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        temperature: 0.75,
        max_tokens: 1200,
      }),
    });
    if (!res.ok) { console.warn(`${provider.name} error`, res.status); return null; }
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    return typeof content === "string" && content.trim() ? content : null;
  } catch (e) {
    console.warn(`${provider.name} failed`, e);
    return null;
  }
}

export const askCoach = async ({
  data,
}: {
  data: { messages: Message[]; context: CoachContext };
}): Promise<string> => {
  try {
    const systemPrompt = buildCoachSystemPrompt(data.context);
    const fullMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...data.messages,
    ];

    for (const provider of getProviders()) {
      const response = await callProvider(provider, fullMessages);
      if (response) return response;
    }

    // Offline fallback — generate a helpful static response
    return buildOfflineFallback(data.context);
  } catch (e) {
    console.error("Coach error:", e);
    return "I'm having a little trouble connecting right now. Check your internet connection and try again!";
  }
};

function buildOfflineFallback(ctx: CoachContext): string {
  const lines: string[] = [
    "**Amaka here! 👩‍🏫** The AI connection is a bit slow right now, but here's some advice based on your profile:",
    "",
  ];

  if (ctx.weakTopics.length > 0) {
    lines.push(`**📌 Priority this week:** Focus on **${ctx.weakTopics[0]}** — it's your weakest area. Spend 30 minutes daily on it.`);
    lines.push("");
  }

  if (ctx.streakDays > 0) {
    lines.push(`**🔥 Your streak:** You're on a ${ctx.streakDays}-day streak — ehen! Don't break it today.`);
    lines.push("");
  }

  if (ctx.reviewDueTopics.length > 0) {
    lines.push(`**📅 Review due:** Don't forget to revise **${ctx.reviewDueTopics.slice(0, 2).join(" and ")}** today.`);
    lines.push("");
  }

  lines.push("**✅ Next step:** Head to the Quiz page and practice one topic for 15 minutes. Consistency is everything!");

  return lines.join("\n");
}
