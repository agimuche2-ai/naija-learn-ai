import { useCallback, useEffect, useRef, useState } from "react";

// ── Web Speech API type stubs (not in standard TS DOM lib) ────────────────────
interface SpeechRecognitionResultItem { readonly transcript: string; readonly confidence: number; }
interface SpeechRecognitionResult { readonly isFinal: boolean; readonly length: number; [index: number]: SpeechRecognitionResultItem; }
interface SpeechRecognitionResultList { readonly length: number; [index: number]: SpeechRecognitionResult; }
interface SpeechRecognitionEventData { readonly resultIndex: number; readonly results: SpeechRecognitionResultList; }
interface SpeechRecognitionErrorData { readonly error: string; readonly message: string; }

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((e: SpeechRecognitionEventData) => void) | null;
  onerror: ((e: SpeechRecognitionErrorData) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}


// ── Types ──────────────────────────────────────────────────────────────────────
export type VoiceState = "idle" | "listening" | "speaking" | "error";

type UseVoiceOptions = {
  language?: string;           // e.g. "en-NG", "en-GB"
  rate?: number;               // 0.1–10, default 0.95
  pitch?: number;              // 0–2, default 1
  voiceName?: string;          // preferred TTS voice substring
  onTranscript?: (text: string) => void;   // called when STT finalises
  onError?: (msg: string) => void;
};

type UseVoiceReturn = {
  state: VoiceState;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  transcript: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function getBestVoice(voices: SpeechSynthesisVoice[], preferred?: string): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  if (preferred) {
    const match = voices.find(v => v.name.toLowerCase().includes(preferred.toLowerCase()));
    if (match) return match;
  }
  // Prefer English (Nigeria) or English (GB/US) for NaijaTutor
  const nigerianVoice = voices.find(v => v.lang === "en-NG");
  if (nigerianVoice) return nigerianVoice;
  const gbVoice = voices.find(v => v.lang === "en-GB");
  if (gbVoice) return gbVoice;
  const usVoice = voices.find(v => v.lang === "en-US");
  if (usVoice) return usVoice;
  // Fallback: any English voice
  const anyEn = voices.find(v => v.lang.startsWith("en"));
  return anyEn ?? voices[0];
}

// Strip markdown formatting so TTS doesn't read asterisks aloud
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/>\s/g, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim();
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export function useVoice({
  language = "en-NG",
  rate = 0.92,
  pitch = 1.05,
  voiceName,
  onTranscript,
  onError,
}: UseVoiceOptions = {}): UseVoiceReturn {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // ── Check support ────────────────────────────────────────────────────────────
  const SpeechRecognitionCtor: SpeechRecognitionCtor | undefined =
    typeof window !== "undefined"
      ? (window.SpeechRecognition ?? window.webkitSpeechRecognition)
      : undefined;
  const hasSpeechSynthesis = typeof window !== "undefined" && "speechSynthesis" in window;
  const isSupported = Boolean(SpeechRecognitionCtor) && hasSpeechSynthesis;

  // ── Load voices ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasSpeechSynthesis) return;
    const load = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, [hasSpeechSynthesis]);

  // ── STT ──────────────────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!SpeechRecognitionCtor) { onError?.("Speech recognition not supported."); return; }
    if (hasSpeechSynthesis) window.speechSynthesis.cancel(); // stop any TTS first

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => setState("listening");
    recognition.onresult = (e: SpeechRecognitionEventData) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setTranscript(final || interim);
      if (final) {
        onTranscript?.(final.trim());
        setState("idle");
      }
    };
    recognition.onerror = (e: SpeechRecognitionErrorData) => {
      setState("error");
      onError?.(`Speech error: ${e.error}`);
      setTimeout(() => setState("idle"), 2000);
    };
    recognition.onend = () => {
      if (state === "listening") setState("idle");
    };

    recognition.start();
  }, [SpeechRecognitionCtor, hasSpeechSynthesis, language, onTranscript, onError, state]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setState("idle");
  }, []);

  // ── TTS ──────────────────────────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (!hasSpeechSynthesis) return;
    window.speechSynthesis.cancel();

    const clean = stripMarkdown(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.lang = language;

    const voice = getBestVoice(voicesRef.current, voiceName);
    if (voice) utterance.voice = voice;

    utterance.onstart = () => setState("speaking");
    utterance.onend = () => setState("idle");
    utterance.onerror = () => setState("idle");
    utteranceRef.current = utterance;

    window.speechSynthesis.speak(utterance);
  }, [hasSpeechSynthesis, language, pitch, rate, voiceName]);

  const stopSpeaking = useCallback(() => {
    if (hasSpeechSynthesis) window.speechSynthesis.cancel();
    setState("idle");
  }, [hasSpeechSynthesis]);

  // ── Cleanup on unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if (hasSpeechSynthesis) window.speechSynthesis.cancel();
    };
  }, [hasSpeechSynthesis]);

  return { state, isSupported, startListening, stopListening, speak, stopSpeaking, transcript };
}
