import { useEffect, useRef } from "react";
import { Mic, MicOff, Square, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VoiceState } from "@/hooks/use-voice";

type Props = {
  state: VoiceState;
  isSupported: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  onMicClick: () => void;
  onStopSpeaking: () => void;
  autoSpeak?: boolean;
  onToggleAutoSpeak?: () => void;
  compact?: boolean;
};

export function VoiceButton({
  state,
  isSupported,
  isSpeaking,
  isListening,
  onMicClick,
  onStopSpeaking,
  autoSpeak,
  onToggleAutoSpeak,
  compact = false,
}: Props) {
  // Pulsing ring ref for the listening animation
  const ringRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ringRef.current) return;
    ringRef.current.style.animation = isListening
      ? "ping 1s cubic-bezier(0,0,0.2,1) infinite"
      : "none";
  }, [isListening]);

  if (!isSupported) return null;

  const micTitle = isListening ? "Stop listening" : "Speak to AI";
  const speakTitle = isSpeaking ? "Stop speaking" : "AI is not speaking";

  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "flex-wrap"}`}>
      {/* Mic button */}
      <div className="relative">
        {/* Pulse ring while listening */}
        {isListening && (
          <span
            ref={ringRef}
            className="absolute inset-0 rounded-full bg-destructive/40"
            style={{ animation: "ping 1s cubic-bezier(0,0,0.2,1) infinite" }}
          />
        )}
        <Button
          id="voice-mic-btn"
          type="button"
          size={compact ? "sm" : "default"}
          variant={isListening ? "destructive" : "outline"}
          onClick={onMicClick}
          title={micTitle}
          className={`relative z-10 rounded-full transition-all duration-200 ${
            isListening
              ? "bg-destructive text-destructive-foreground shadow-lg scale-110"
              : "hover:border-primary hover:text-primary"
          } ${compact ? "h-8 w-8 p-0" : "h-10 w-10 p-0"}`}
        >
          {isListening ? (
            <Square className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          ) : (
            <Mic className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          )}
        </Button>
      </div>

      {/* Stop-speaking button (only visible when AI is speaking) */}
      {isSpeaking && (
        <Button
          id="voice-stop-btn"
          type="button"
          size={compact ? "sm" : "default"}
          variant="outline"
          onClick={onStopSpeaking}
          title="Stop AI voice"
          className={`rounded-full border-primary text-primary animate-pulse ${
            compact ? "h-8 w-8 p-0" : "h-10 w-10 p-0"
          }`}
        >
          <VolumeX className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </Button>
      )}

      {/* Auto-speak toggle */}
      {onToggleAutoSpeak && (
        <Button
          id="voice-autospeak-btn"
          type="button"
          size={compact ? "sm" : "default"}
          variant={autoSpeak ? "secondary" : "ghost"}
          onClick={onToggleAutoSpeak}
          title={autoSpeak ? "Auto-speak ON — click to disable" : "Auto-speak OFF — click to enable"}
          className={`rounded-full ${compact ? "h-8 w-8 p-0" : "h-10 w-10 p-0"} ${
            autoSpeak ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Volume2 className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </Button>
      )}

      {/* State label */}
      {!compact && (
        <span className="text-xs text-muted-foreground select-none">
          {isListening
            ? "🎙️ Listening…"
            : isSpeaking
            ? "🔊 Speaking…"
            : state === "error"
            ? "❌ Mic error"
            : ""}
        </span>
      )}
    </div>
  );
}
