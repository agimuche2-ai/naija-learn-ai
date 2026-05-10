import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are NaijaTutor, a warm, patient Chemistry tutor for senior secondary school (SSS 1-3) students in Nigeria following the WAEC/NECO syllabus.

Rules:
- Explain in clear, simple English. Use Nigerian context where helpful.
- Break concepts into short steps. Use bullet points and short paragraphs.
- For calculations, show all steps with units.
- For complex structures or diagrams, include a placeholder like: [IMAGE: Description of the diagram].
- Use markdown for structure. Use **bold** for key terms.
- When relevant, mention WAEC/NECO exam tips.
- If a question is outside Chemistry, politely redirect.
- Keep answers focused.`;

function providerConfig() {
  const groqKey = Deno.env.get("GROQ_API_KEY");
  if (groqKey) {
    return {
      name: "Groq",
      apiKey: groqKey,
      baseUrl: "https://api.groq.com/openai/v1",
      model: Deno.env.get("GROQ_MODEL") || "openai/gpt-oss-20b",
    };
  }

  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  if (openAiKey) {
    return {
      name: "OpenAI",
      apiKey: openAiKey,
      baseUrl: "https://api.openai.com/v1",
      model: Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini",
    };
  }

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (lovableKey) {
    return {
      name: "Lovable",
      apiKey: lovableKey,
      baseUrl: "https://ai.gateway.lovable.dev/v1",
      model: Deno.env.get("LOVABLE_MODEL") || "gpt-4o-mini",
    };
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const provider = providerConfig();
    if (!provider) throw new Error("No AI provider configured. Set GROQ_API_KEY first.");

    const resp = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: provider.model,
        stream: true,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const text = await resp.text();
      console.error(`${provider.name} AI gateway error`, resp.status, text);
      return new Response(JSON.stringify({ error: `${provider.name} AI gateway error` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(resp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("ai-tutor error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
