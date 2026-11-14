import { AiError, type StreamOptions } from './ai';

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Streams text deltas from a Gemini model over the REST streaming endpoint. The key travels in the `x-goog-api-key` header only.
 * Bounded: at most one retry, and only before any text has been produced, so a retry can never duplicate or contradict output
 * the visitor has already seen. Every failure is reduced to a coarse AiError code. "Thought" parts are never shown to visitors, and
 * thinking is set to minimal so answers start in under a second.
 */
export async function* streamGemini(o: StreamOptions): AsyncGenerator<string> {
  let thinking = true;
  let serverRetries = 0;
  let produced = false;

  for (;;) {
    try {
      const res = await fetch(`${ENDPOINT}/${encodeURIComponent(o.model)}:streamGenerateContent?alt=sse`, {
        method: 'POST',
        signal: o.signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': o.apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: o.system }] },
          contents: o.contents.map((c) => ({ role: c.role === 'model' ? 'model' : 'user', parts: (c.parts ?? []).map((p) => ({ text: p.text ?? '' })) })),
          generationConfig: { maxOutputTokens: o.maxOutputTokens, temperature: 0.2, ...(thinking ? { thinkingConfig: { thinkingLevel: 'minimal' } } : {}) },
        }),
      });
      if (!res.ok || !res.body) {
        const s = res.status;
        console.error(`[gemini] model=${o.model} request failed: status=${s}`); // operator diagnostics only: never the key or visitor text
        if (s === 400 && thinking && !produced) { thinking = false; continue; } // this model may not accept the thinking option
        if (s === 429) throw new AiError('quota');
        if (s >= 500 && serverRetries < 1 && !produced) { serverRetries++; await sleep(400); continue; }
        throw new AiError('unavailable');
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line.startsWith('data:')) continue;
          let j: { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[]; promptFeedback?: { blockReason?: string }; error?: { code?: number } };
          try { j = JSON.parse(line.slice(5).trim()); } catch { continue; }
          if (j.error) throw new AiError(j.error.code === 429 ? 'quota' : 'unavailable');
          if (j.promptFeedback?.blockReason && !produced) throw new AiError('blocked');
          const cand = j.candidates?.[0];
          for (const p of cand?.content?.parts ?? []) if (p.text && !p.thought) { produced = true; yield p.text; }
          if (cand?.finishReason === 'SAFETY' && !produced) throw new AiError('blocked');
        }
      }
      return;
    } catch (err) {
      if (err instanceof AiError) throw err;
      if (o.signal.aborted) throw new AiError('timeout');
      if (!produced && serverRetries < 1) { serverRetries++; await sleep(400); continue; } // network error before any text
      throw new AiError('unavailable');
    }
  }
}
