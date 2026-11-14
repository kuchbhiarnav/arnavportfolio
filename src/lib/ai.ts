/** Shared types for the AI assistant's model call (Gemini). */
export type AiErrorCode = 'quota' | 'timeout' | 'blocked' | 'unavailable';
export class AiError extends Error {
  code: AiErrorCode;
  constructor(code: AiErrorCode, message?: string) { super(message ?? code); this.code = code; }
}

export interface ChatContent { role: string; parts?: { text?: string }[] }

export interface StreamOptions {
  apiKey: string;
  model: string;
  system: string;
  contents: ChatContent[];
  signal: AbortSignal;
  maxOutputTokens: number;
}
