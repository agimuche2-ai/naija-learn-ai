import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, RefreshCcw, Send, Sparkles, User } from "lucide-react";
import { askTutor } from "@/functions/tutor";

export const Route = createFileRoute("/_app/tutor")({
  component: TutorPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Explain why HF has a higher boiling point than HCl.",
  "Walk me through balancing C3H8 + O2 -> CO2 + H2O.",
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
      setMessages((prev) => [...prev, { role: "assistant", content: answer as string }]);
    } catch (error) {
      console.error(error);
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
                    {SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => ask(suggestion)}
                        className="rounded-xl border border-border bg-card px-4 py-2 text-left text-sm transition hover:border-primary hover:bg-primary/5"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message, index) => <Bubble key={index} msg={message} />)
            )}

            {streaming && messages[messages.length - 1]?.role === "user" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
              </div>
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              ask(input);
            }}
            className="flex items-end gap-2 border-t border-border bg-secondary/30 p-3"
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  ask(input);
                }
              }}
              rows={1}
              placeholder="Ask a Chemistry question..."
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

  const renderContent = (text: string) => {
    return text.split("\n").map((line, index) => {
      if (line.includes("[IMAGE:")) {
        const desc = line.match(/\[IMAGE: (.*?)\]/)?.[1] || "Diagram";
        return (
          <div key={index} className="my-4 overflow-hidden rounded-xl border border-border bg-card/50">
            <div className="flex h-32 items-center justify-center bg-secondary/30">
              <div className="text-center">
                <Sparkles className="mx-auto mb-2 h-6 w-6 text-primary/40" />
                <p className="px-4 text-xs italic text-muted-foreground">{desc}</p>
              </div>
            </div>
          </div>
        );
      }

      let parts: ReactNode[] = [line];
      const boldRegex = /\*\*(.*?)\*\*/g;
      const italicRegex = /\*(.*?)\*/g;

      const processBold = (value: string): ReactNode[] => {
        const result: ReactNode[] = [];
        let lastIndex = 0;
        let match;

        while ((match = boldRegex.exec(value)) !== null) {
          result.push(value.slice(lastIndex, match.index));
          result.push(
            <strong key={`b-${match.index}`} className="font-bold text-foreground">
              {match[1]}
            </strong>,
          );
          lastIndex = boldRegex.lastIndex;
        }

        result.push(value.slice(lastIndex));
        return result;
      };

      const processItalic = (elements: ReactNode[]): ReactNode[] => {
        const result: ReactNode[] = [];

        elements.forEach((element, elementIndex) => {
          if (typeof element !== "string") {
            result.push(element);
            return;
          }

          let lastIndex = 0;
          let match;
          while ((match = italicRegex.exec(element)) !== null) {
            result.push(element.slice(lastIndex, match.index));
            result.push(
              <em key={`i-${elementIndex}-${match.index}`} className="italic opacity-90">
                {match[1]}
              </em>,
            );
            lastIndex = italicRegex.lastIndex;
          }
          result.push(element.slice(lastIndex));
        });

        return result;
      };

      parts = processItalic(processBold(line));

      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        return (
          <li key={index} className="mb-1 ml-4 list-disc">
            {parts}
          </li>
        );
      }

      if (line.startsWith("### ")) {
        return (
          <h3 key={index} className="mb-2 mt-4 text-lg font-bold">
            {line.slice(4)}
          </h3>
        );
      }

      if (line.startsWith("## ")) {
        return (
          <h2 key={index} className="mb-2 mt-5 text-xl font-bold">
            {line.slice(3)}
          </h2>
        );
      }

      if (!line.trim()) return <div key={index} className="h-2" />;

      return (
        <p key={index} className="mb-2 leading-relaxed">
          {parts}
        </p>
      );
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
