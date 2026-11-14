import { z } from 'zod';

/** Everything the browser may send to /api/ask. Strict: unknown keys are rejected, sizes are bounded. */
export const LIMITS = { message: 500, historyTurns: 6, historyText: 800, body: 8 * 1024 } as const;

export const askSchema = z
  .object({
    message: z.string().trim().min(1).max(LIMITS.message),
    history: z.array(z.object({ role: z.enum(['user', 'model']), text: z.string().max(LIMITS.historyText) }).strict()).max(LIMITS.historyTurns).default([]),
    sessionId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/).optional(),
  })
  .strict();

export type AskRequest = z.infer<typeof askSchema>;

/** Stream protocol (newline-delimited JSON). Kept tiny and closed so the client can validate every line. */
export type StreamEvent =
  | { t: 'meta'; sources: { id: string; title: string; url: string }[] }
  | { t: 'delta'; text: string }
  | { t: 'done'; cited: string[] }
  | { t: 'error'; code: 'quota' | 'rate' | 'timeout' | 'blocked' | 'unavailable' | 'disabled' | 'invalid' };
