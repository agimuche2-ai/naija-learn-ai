import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

type Message = { role: "user" | "assistant" | "system"; content: string };
type TutorRequest = { messages: Message[] };
type StudyMaterial = {
  title: string;
  topic: string;
  content: string;
  class_level: string;
  category: string;
};

type ChatProvider = {
  name: string;
  apiKey?: string;
  baseUrl: string;
  model: string;
};

const TERM_CATEGORIES = ["First Term", "Second Term", "Third Term"];

const CHEMISTRY_TUTOR_SYSTEM = `You are NaijaTutor, an expert Chemistry tutor for Nigerian senior secondary school students (SS1-SS3).

CORE PRINCIPLES:
- Explain concepts in simple, clear language accessible to SSS students
- Follow the WAEC/NECO Chemistry syllabus closely
- Use real-world examples relevant to Nigerian context
- Show step-by-step solutions for calculations
- Always define technical terms before using them
- Encourage critical thinking with guiding questions
- If unsure, admit it and suggest checking authoritative sources

CHEMISTRY EXPERTISE:
- Atomic structure, bonding, and periodicity
- Stoichiometry, mole concept, and chemical equations
- Gas laws, kinetics, and equilibrium
- Acids, bases, pH, and titrations
- Redox reactions and electrolysis
- Organic chemistry and hydrocarbons
- Industrial processes such as Haber, Contact, and Solvay
- Environmental chemistry
- Practical lab techniques`;

function isConfigured(apiKey?: string) {
  return Boolean(apiKey && apiKey !== "dummy-key" && !apiKey.includes("your-"));
}

function getProviders(): ChatProvider[] {
  return [
    {
      name: "Groq",
      apiKey: process.env.GROQ_API_KEY,
      baseUrl: "https://api.groq.com/openai/v1",
      model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
    },
    {
      name: "OpenAI",
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: "https://api.openai.com/v1",
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    },
    {
      name: "Lovable",
      apiKey: process.env.LOVABLE_API_KEY,
      baseUrl: "https://ai.gateway.lovable.dev/v1",
      model: process.env.LOVABLE_MODEL || "gpt-4o-mini",
    },
  ];
}

async function callChatProvider(
  provider: ChatProvider,
  messages: Message[],
): Promise<string | null> {
  if (!isConfigured(provider.apiKey)) return null;

  try {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: "system", content: CHEMISTRY_TUTOR_SYSTEM }, ...messages],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      console.warn(`${provider.name} API error`, response.status, await response.text());
      return null;
    }

    const json = await response.json();
    const aiAnswer = json?.choices?.[0]?.message?.content;
    return typeof aiAnswer === "string" && aiAnswer.trim() ? aiAnswer : null;
  } catch (error) {
    console.warn(`${provider.name} API request failed`, error);
    return null;
  }
}

function keywordsFor(text: string) {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9]/gi, ""))
    .filter((word) => word.length > 2);
}

function findBestMaterial(materials: StudyMaterial[], userMessage: string) {
  const keywords = keywordsFor(userMessage);
  let bestMatch: StudyMaterial | null = null;
  let bestScore = 0;

  for (const material of materials) {
    let score = 0;
    const title = material.title.toLowerCase();
    const topic = material.topic.toLowerCase();
    const content = material.content.toLowerCase();

    for (const keyword of keywords) {
      if (title.includes(keyword)) score += 6;
      if (topic.includes(keyword)) score += 4;
      if (content.includes(keyword)) score += 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = material;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

async function getLocalDatabaseFallback(userMessage: string): Promise<string | null> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";

  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: materials, error } = await supabase
      .from("study_materials")
      .select("title, topic, content, class_level, category")
      .in("category", TERM_CATEGORIES);

    if (error || !materials?.length) return null;

    const typedMaterials = materials as StudyMaterial[];
    const bestMatch = findBestMaterial(typedMaterials, userMessage);

    if (bestMatch) {
      return [
        "**AI provider is unavailable, so I am using the local Chemistry library for now.**",
        "",
        `**${bestMatch.class_level} ${bestMatch.category}: ${bestMatch.title}**`,
        "",
        bestMatch.content.substring(0, 2400),
        "",
        "---",
        "Ask again after the AI API is configured if you want a more conversational explanation or step-by-step tutoring.",
      ].join("\n");
    }

    const topics = typedMaterials
      .slice(0, 8)
      .map((material) => `- ${material.class_level} ${material.category}: ${material.title}`)
      .join("\n");

    return [
      "**AI provider is unavailable, and I could not find a close local-library match for that question.**",
      "",
      "You can try one of these local library topics:",
      topics,
    ].join("\n");
  } catch (error) {
    console.warn("Local database fallback failed", error);
    return null;
  }
}

function validateTutorRequest(input: TutorRequest): TutorRequest {
  if (!input || !Array.isArray(input.messages)) {
    throw new Error("Tutor request must include messages.");
  }

  return {
    messages: input.messages
      .filter((message) => message && typeof message.content === "string")
      .map((message) => ({
        role: message.role === "assistant" || message.role === "system" ? message.role : "user",
        content: message.content,
      })),
  };
}

export const askTutor = createServerFn({ method: "POST" })
  .inputValidator(validateTutorRequest)
  .handler(async ({ data }) => {
    try {
      const userMessage = data.messages[data.messages.length - 1]?.content || "";

      for (const provider of getProviders()) {
        const aiResponse = await callChatProvider(provider, data.messages);
        if (aiResponse) return aiResponse;
      }

      const localFallback = await getLocalDatabaseFallback(userMessage);
      if (localFallback) return localFallback;

      return "I could not reach the AI tutor provider right now. Check that GROQ_API_KEY, OPENAI_API_KEY, or LOVABLE_API_KEY is configured on the server, then try again.";
    } catch (error) {
      console.error("Tutor error:", error);
      return "I encountered an error while processing your question. Please try again or refresh the page. If this continues, check that the server is running.";
    }
  });
