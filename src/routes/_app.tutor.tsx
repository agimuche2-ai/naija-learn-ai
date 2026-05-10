import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Send, Sparkles, User, RefreshCcw } from "lucide-react";
import { askTutor } from "@/functions/tutor";

export const Route = createFileRoute("/_app/tutor")({
  component: TutorPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Explain why HF has a higher boiling point than HCl.",
  "Walk me through balancing C3H8 + O2 → CO2 + H2O.",
  "What is the difference between sigma and pi bonds?",
  "How do I calculate the pH of 0.01 M HCl?",
];

function TutorPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ask = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    const userMsg: Msg = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);

    try {
      const answer = await askTutor({ data: { messages: next } });
      
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: answer as string }
      ]);
    } catch (e) {
      console.error(e);
      toast.error("Tutor is currently busy. Please try again.");
    } finally {
      setStreaming(false);
    }
  };

  const reset = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-hero shadow-glow">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">AI Chemistry Tutor</h1>
          <p className="text-sm text-muted-foreground">
            Ask anything from the SSS Chemistry syllabus.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={reset} 
          className="ml-auto rounded-xl"
          disabled={messages.length === 0}
        >
          <RefreshCcw className="mr-2 h-4 w-4" /> Reset Chat
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div ref={scrollRef} className="h-[55vh] space-y-4 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-10">
                <div className="max-w-md text-center">
                  <p className="text-sm text-muted-foreground">Try a starter question:</p>
                  <div className="mt-4 grid gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => ask(s)}
                        className="rounded-xl border border-border bg-card px-4 py-2 text-left text-sm transition hover:border-primary hover:bg-primary/5"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((m, i) => <Bubble key={i} msg={m} />)
            )}
            {streaming && messages[messages.length - 1]?.role === "user" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex items-end gap-2 border-t border-border bg-secondary/30 p-3"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask(input);
                }
              }}
              rows={1}
              placeholder="Ask a Chemistry question…"
              className="max-h-32 flex-1 resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <Button
              type="submit"
              disabled={streaming || !input.trim()}
              className="bg-gradient-hero text-primary-foreground shadow-glow hover:opacity-95"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const mine = msg.role === "user";
  
  // Basic markdown-to-React renderer
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Handle [IMAGE: ...] placeholders
      if (line.includes('[IMAGE:')) {
        const desc = line.match(/\[IMAGE: (.*?)\]/)?.[1] || "Diagram";
        return (
          <div key={i} className="my-4 overflow-hidden rounded-xl border border-border bg-card/50">
            <div className="flex h-32 items-center justify-center bg-secondary/30">
              <div className="text-center">
                <Sparkles className="mx-auto mb-2 h-6 w-6 text-primary/40" />
                <p className="text-xs text-muted-foreground px-4 italic">{desc}</p>
              </div>
            </div>
          </div>
        );
      }

      // Handle Bold & Italics
      let parts: (string | JSX.Element)[] = [line];
      const boldRegex = /\*\*(.*?)\*\*/g;
      const italicRegex = /\*(.*?)\*/g;
      
      const processBold = (text: string): (string | JSX.Element)[] => {
        const result: (string | JSX.Element)[] = [];
        let lastIdx = 0;
        let match;
        while ((match = boldRegex.exec(text)) !== null) {
          result.push(text.slice(lastIdx, match.index));
          result.push(<strong key={`b-${match.index}`} className="font-bold text-foreground">{match[1]}</strong>);
          lastIdx = boldRegex.lastIndex;
        }
        result.push(text.slice(lastIdx));
        return result;
      };

      const processItalic = (elements: (string | JSX.Element)[]): (string | JSX.Element)[] => {
        const result: (string | JSX.Element)[] = [];
        elements.forEach((el, idx) => {
          if (typeof el === 'string') {
            let lastIdx = 0;
            let match;
            while ((match = italicRegex.exec(el)) !== null) {
              result.push(el.slice(lastIdx, match.index));
              result.push(<em key={`i-${idx}-${match.index}`} className="italic opacity-90">{match[1]}</em>);
              lastIdx = italicRegex.lastIndex;
            }
            result.push(el.slice(lastIdx));
          } else {
            result.push(el);
          }
        });
        return result;
      };

      parts = processItalic(processBold(line));

      // Handle bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return <li key={i} className="ml-4 list-disc mb-1">{parts}</li>;
      }
      
      // Handle headers
      if (line.startsWith('### ')) return <h3 key={i} className="mt-4 mb-2 text-lg font-bold">{line.slice(4)}</h3>;
      if (line.startsWith('## ')) return <h2 key={i} className="mt-5 mb-2 text-xl font-bold">{line.slice(3)}</h2>;

      if (!line.trim()) return <div key={i} className="h-2" />;
      
      return <p key={i} className="mb-2 leading-relaxed">{parts}</p>;
    });
  };

  return (
    <div className={`flex gap-3 ${mine ? "flex-row-reverse" : ""}`}>
      <div
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full shadow-sm ${
          mine ? "bg-primary text-primary-foreground" : "bg-gradient-hero text-primary-foreground"
        }`}
      >
        {mine ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-soft ${
          mine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
        }`}
      >
        {renderContent(msg.content)}
      </div>
    </div>
  );
}