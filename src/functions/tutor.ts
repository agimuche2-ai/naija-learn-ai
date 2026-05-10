import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export const askTutor = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { messages: { role: string; content: string }[] } }) => {
    try {
      const userMessage = data.messages[data.messages.length - 1]?.content || "";

      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
      const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";

      if (!supabaseUrl || !supabaseKey) {
        return "I am having trouble connecting to the library right now. Please try again later.";
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Search the entire library for relevant content
      const { data: allMaterials } = await supabase
        .from("study_materials")
        .select("title, content, class_level, category");

      // Score each material by keyword relevance
      const keywords = userMessage
        .toLowerCase()
        .split(/\s+/)
        .filter((w: string) => w.length > 2);

      let bestMatch = null;
      let bestScore = 0;

      if (allMaterials && allMaterials.length > 0) {
        for (const mat of allMaterials) {
          let score = 0;
          for (const kw of keywords) {
            if (mat.title.toLowerCase().includes(kw)) score += 5;
            if (mat.content.toLowerCase().includes(kw)) score += 1;
          }
          if (score > bestScore) {
            bestScore = score;
            bestMatch = mat;
          }
        }
      }

      const context = bestMatch && bestScore > 0
        ? "From our " + bestMatch.class_level + " " + bestMatch.category + " notes on \"" + bestMatch.title + "\":\n\n" + bestMatch.content.substring(0, 3000)
        : "";

      // Try external AI first
      const apiKey = process.env.LOVABLE_API_KEY;

      if (apiKey && apiKey !== "dummy-key" && apiKey.length > 10) {
        try {
          const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: "Bearer " + apiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content: "You are NaijaTutor, a warm, patient Chemistry tutor for Nigerian senior secondary school students (SS1-SS3). Answer clearly using the Nigerian WAEC/NECO syllabus. Use simple language. If library context is provided, use it to give accurate answers.\n\n" + context,
                },
                ...data.messages,
              ],
            }),
          });

          if (resp.ok) {
            const json = await resp.json();
            const aiAnswer = json?.choices?.[0]?.message?.content;
            if (aiAnswer) return aiAnswer;
          }
        } catch (_e) {
          // Fall through to local fallback
        }
      }

      // Fallback: Return library context directly
      if (context) {
        return "Here is what I found in our Chemistry library:\n\n" + context + "\n\nFeel free to ask me to explain any part of this in more detail!";
      }

      // Final fallback: helpful suggestions
      return "I could not find a specific match for your question. Try asking about a topic like:\n\n- Electrolysis\n- Gas Laws\n- Organic Chemistry\n- Acids and Bases\n- The Periodic Table\n- Nuclear Chemistry\n\nI will search our library and give you the best notes!";
    } catch (_err) {
      return "I am temporarily unavailable. Please refresh the page and try again.";
    }
  });
