/** Browser speech features. Feature-detected; every path has a typed fallback. Nothing here records or stores audio. */

interface RecognitionLike {
  lang: string; interimResults: boolean; continuous: boolean; maxAlternatives: number;
  start(): void; stop(): void; abort(): void;
  onresult: ((e: any) => void) | null; onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null; onstart: (() => void) | null;
}
type RecognitionCtor = new () => RecognitionLike;

export function recognitionSupported(): boolean {
  return typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}
export function synthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

export type VoiceError = 'blocked' | 'silence' | 'no-mic' | 'network' | 'unsupported' | 'other';
export const VOICE_MESSAGES: Record<VoiceError, string> = {
  blocked: 'Microphone access was blocked. You can allow it in your browser settings, or type your question instead.',
  silence: "I didn't hear anything. Try again, or type your question.",
  'no-mic': 'No microphone was found. You can type your question instead.',
  network: "Your browser's speech recognition couldn't be reached. Please type your question instead.",
  unsupported: "This browser doesn't support voice input. Please type your question.",
  other: "Voice input didn't work. Please type your question instead.",
};
const MAP: Record<string, VoiceError> = {
  'not-allowed': 'blocked', 'service-not-allowed': 'blocked', 'no-speech': 'silence', 'audio-capture': 'no-mic', network: 'network',
};

export interface Listener { stop(): void; abort(): void }

/**
 * Starts one recognition session. Interim text streams to `onText(text, final)` so the visitor can edit the transcript.
 * The microphone is only opened here, from an explicit click, and released on stop/abort/end.
 */
export function startListening(cb: { onText(t: string, final: boolean): void; onEnd(): void; onError(e: VoiceError): void; onStart(): void }): Listener | null {
  const Ctor = ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) as RecognitionCtor | undefined;
  if (!Ctor) { cb.onError('unsupported'); return null; }
  const r = new Ctor();
  r.lang = document.documentElement.lang === 'en' ? 'en-US' : document.documentElement.lang || 'en-US';
  r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
  r.onstart = () => cb.onStart();
  r.onresult = (e) => {
    let text = ''; let final = false;
    for (let i = e.resultIndex; i < e.results.length; i++) { text += e.results[i][0].transcript; if (e.results[i].isFinal) final = true; }
    cb.onText(text.trim(), final);
  };
  r.onerror = (e) => { if (e.error !== 'aborted') cb.onError(MAP[e.error] ?? 'other'); };
  r.onend = () => cb.onEnd();
  try { r.start(); } catch { cb.onError('other'); return null; }
  return { stop: () => { try { r.stop(); } catch { /* already stopped */ } }, abort: () => { try { r.abort(); } catch { /* already stopped */ } } };
}

export function speak(text: string) {
  if (!synthesisSupported()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = document.documentElement.lang === 'en' ? 'en-US' : document.documentElement.lang || 'en-US';
  u.rate = 1;
  window.speechSynthesis.speak(u);
}
export function stopSpeaking() { if (synthesisSupported()) window.speechSynthesis.cancel(); }
