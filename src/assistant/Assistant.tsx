import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { SUGGESTIONS, type Message, type Phase, type Source, type View } from './types';
import { aiAvailable, askAi, loadKnowledge, sessionId, type Loaded } from './client';
import { composeLocalAnswer, spokenSummary } from './local-answer';
import { cleanForDisplay } from './stream';
import { isAllowedPath, parseIntent } from '../lib/intents';
import { VOICE_MESSAGES, recognitionSupported, speak, startListening, stopSpeaking, synthesisSupported, type Listener } from './voice';

const STORE = 'archive:assistant';
const uid = () => Math.random().toString(36).slice(2, 10);
const internal = (u: unknown): u is string => typeof u === 'string' && u.startsWith('/') && !u.startsWith('//');

const NOTICE: Record<string, string> = {
  quota: 'The AI daily limit has been reached, so these are the closest passages from the portfolio instead.',
  rate: 'You are asking quickly. Here are the closest passages from the portfolio while the AI catches up.',
  timeout: 'The AI took too long, so these are the closest passages from the portfolio instead.',
  blocked: 'The AI could not answer that, so these are the closest passages from the portfolio instead.',
  unavailable: 'AI answers are unavailable right now, so these are the closest passages from the portfolio instead.',
  disabled: 'AI answers are switched off, so these are passages from the portfolio.',
  invalid: 'That question could not be processed, so these are the closest passages from the portfolio.',
};

function restore(): { messages: Message[]; view: View; readAloud: boolean } {
  try {
    const raw = sessionStorage.getItem(STORE);
    if (!raw) return { messages: [], view: 'orb', readAloud: false };
    const o = JSON.parse(raw);
    const messages: Message[] = Array.isArray(o.messages)
      ? o.messages
          .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string' && typeof m.id === 'string')
          .slice(-20)
          .map((m: any): Message => ({
            id: m.id, role: m.role, text: m.text.slice(0, 4000), mode: ['search', 'ai', 'nav'].includes(m.mode) ? m.mode : undefined,
            notice: typeof m.notice === 'string' ? m.notice : undefined,
            sources: Array.isArray(m.sources) ? m.sources.filter((s: any) => internal(s?.url) && typeof s.title === 'string').slice(0, 6) : undefined,
          }))
      : [];
    const view: View = o.view === 'panel' && messages.length ? 'panel' : 'orb';
    return { messages, view, readAloud: o.readAloud === true };
  } catch { return { messages: [], view: 'orb', readAloud: false }; }
}

export default function Assistant() {
  const uidBase = useId();
  const [view, setView] = useState<View>('orb');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [status, setStatus] = useState('');
  const [voiceOk, setVoiceOk] = useState(false);
  const [ttsOk, setTtsOk] = useState(false);
  const [readAloud, setReadAloud] = useState(false);
  const [voiceNote, setVoiceNote] = useState('');
  const [ready, setReady] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listenerRef = useRef<Listener | null>(null);
  const kbRef = useRef<Loaded | null>(null);
  const lastSource = useRef<string | undefined>(undefined);
  const focusAfter = useRef(false);
  const busy = phase === 'loading' || phase === 'thinking' || phase === 'streaming';
  const listening = phase === 'listening';

  /* ---- mount: feature detection and restore ---- */
  useEffect(() => {
    const r = restore();
    setMessages(r.messages); setView(r.view); setReadAloud(r.readAloud);
    setVoiceOk(recognitionSupported()); setTtsOk(synthesisSupported());
    const lastA = [...r.messages].reverse().find((m) => m.role === 'assistant' && m.sources?.length);
    lastSource.current = lastA?.sources?.[0]?.url;
    setReady(true);
  }, []);

  /* ---- persist (conversation stays in this tab only) ---- */
  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(STORE, JSON.stringify({ messages: messages.filter((m) => !m.streaming).slice(-20), view, readAloud }));
    } catch { /* storage blocked: the conversation simply won't survive navigation */ }
  }, [messages, view, readAloud, ready]);

  /* ---- keep the bar above the on-screen keyboard and the consent banner ---- */
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const set = () => document.documentElement.style.setProperty('--kb', `${Math.max(0, window.innerHeight - vv.height - vv.offsetTop)}px`);
    set();
    vv.addEventListener('resize', set); vv.addEventListener('scroll', set);
    return () => { vv.removeEventListener('resize', set); vv.removeEventListener('scroll', set); document.documentElement.style.removeProperty('--kb'); };
  }, []);

  /* ---- open from anywhere: buttons, Ctrl/Cmd+K ---- */
  const open = useCallback((expand = true) => { focusAfter.current = true; setView((v) => (expand && v !== 'panel' ? 'panel' : v === 'orb' ? 'panel' : v)); queueMicrotask(() => inputRef.current?.focus()); }, []);
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;
  useEffect(() => {
    const onClick = (e: MouseEvent) => { if ((e.target as Element | null)?.closest('[data-open-assistant]')) { e.preventDefault(); setView((v) => (v === 'orb' || v === 'bar' ? 'panel' : v)); focusAfter.current = true; setTimeout(() => inputRef.current?.focus(), 0); document.dispatchEvent(new CustomEvent('archive:track', { detail: 'assistant_open' })); } };
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setView((v) => (v === 'orb' || v === 'bar' ? 'panel' : v)); focusAfter.current = true; setTimeout(() => inputRef.current?.focus(), 0); } };
    document.addEventListener('click', onClick); document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey); };
  }, []);
  useEffect(() => { if (focusAfter.current && view !== 'orb' && phase !== 'listening') { inputRef.current?.focus(); focusAfter.current = false; } }, [view, phase]);

  /* ---- keep the newest message in view ---- */
  useEffect(() => { const el = logRef.current; if (el) el.scrollTop = el.scrollHeight; }, [messages, view]);

  /* ---- always release the microphone, the network request and speech when leaving ---- */
  const stopAll = useCallback(() => { abortRef.current?.abort(); listenerRef.current?.abort(); listenerRef.current = null; stopSpeaking(); }, []);
  useEffect(() => { window.addEventListener('pagehide', stopAll); return () => { window.removeEventListener('pagehide', stopAll); stopAll(); }; }, [stopAll]);

  const patch = (id: string, p: Partial<Message>) => setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, ...p } : m)));

  const finish = useCallback((id: string, p: Partial<Message>, announce: string) => {
    patch(id, { ...p, streaming: false });
    setPhase('idle');
    setStatus(announce);
    if (p.sources?.[0]) lastSource.current = p.sources[0].url;
    if (readAloud && synthesisSupported() && p.text) speak(spokenSummary(p.text));
  }, [readAloud]);

  const ensureKb = useCallback(async () => (kbRef.current ??= await loadKnowledge()), []);

  /* ---- ask ---- */
  const submit = useCallback(async (raw: string) => {
    const q = raw.trim().slice(0, 500);
    if (!q || busy) return;
    stopSpeaking(); listenerRef.current?.abort(); listenerRef.current = null;
    const history = messagesRef.current.filter((m) => !m.streaming && m.text).slice(-6).map((m) => ({ role: m.role === 'user' ? ('user' as const) : ('model' as const), text: m.text.slice(0, 800) }));
    const aId = uid();
    setInput(''); setView('panel'); setStatus('');
    setMessages((ms) => [...ms.slice(-18), { id: uid(), role: 'user', text: q }, { id: aId, role: 'assistant', text: '', streaming: true }]);
    setPhase('loading');
    const ac = new AbortController(); abortRef.current = ac;

    let loaded: Loaded;
    try { loaded = await ensureKb(); } catch {
      finish(aId, { text: "I couldn't load the portfolio index just now. You can still use the menu to browse Work, Research or Contact.", mode: 'search', sources: [{ id: 'w', title: 'Work', url: '/projects' }, { id: 'r', title: 'Research & Insights', url: '/research' }, { id: 'c', title: 'Contact', url: '/contact' }] }, 'Could not load the portfolio index.');
      return;
    }

    /* 1. Navigation: deterministic and allowlisted only. */
    const intent = parseIntent(q, loaded.kb.nav, lastSource.current);
    if (intent.type === 'navigate' && isAllowedPath(intent.target.path, loaded.kb.nav)) {
      const t = intent.target;
      if (t.path.endsWith('.pdf')) {
        // The CV opens in a new tab. If the browser blocks the pop-up (for example after a voice command) the link below still works.
        const opened = window.open(t.path, '_blank', 'noopener,noreferrer');
        finish(aId, { text: opened ? 'Opening the CV in a new tab.' : 'Here is the CV. Your browser blocked the new tab, so use the link below.', mode: 'nav', sources: [{ id: `nav:${t.path}`, title: 'Open the CV (PDF)', url: t.path }] }, 'Opening the CV in a new tab.');
        return;
      }
      finish(aId, { text: `Opening ${t.label}.`, mode: 'nav', sources: [{ id: `nav:${t.path}`, title: t.label, url: t.path }] }, `Opening ${t.label}.`);
      setTimeout(() => { if (location.pathname + location.hash !== t.path) window.location.assign(t.path); }, 700);
      return;
    }
    if (intent.type === 'clarify') {
      finish(aId, { text: 'Which of these would you like to open?', mode: 'nav', sources: intent.options.map((o) => ({ id: `nav:${o.path}`, title: o.label, url: o.path })) }, 'Choose a page to open.');
      return;
    }

    const lastUser = [...history].reverse().find((h) => h.role === 'user')?.text ?? '';
    const local = () => composeLocalAnswer(loaded.search(q.split(/\s+/).length < 5 ? `${lastUser} ${q}` : q, 4), loaded.kb.nav);

    /* 2. Zero-API-cost mode: curated passages from the portfolio. */
    if (!(await aiAvailable())) {
      const a = local();
      finish(aId, { text: a.text, sources: a.sources, mode: a.matched ? 'search' : undefined }, `Answer ready. ${spokenSummary(a.text, 160)}`);
      return;
    }

    /* 3. AI mode, with a graceful fallback on every failure. */
    setPhase('thinking');
    let text = ''; let sources: Source[] = []; let cited: string[] = []; let failure: string | null = null;
    for await (const ev of askAi({ message: q, history, sessionId: sessionId() }, ac.signal)) {
      if (ev.t === 'meta') sources = [...sources, ...ev.sources.filter((n) => !sources.some((o) => o.id === n.id))];
      else if (ev.t === 'delta') { text += ev.text; setPhase('streaming'); patch(aId, { text, sources }); }
      else if (ev.t === 'done') cited = ev.cited;
      else if (ev.t === 'error') failure = ev.code;
    }
    if (ac.signal.aborted) { finish(aId, { text: text ? cleanForDisplay(text) : 'Stopped.', mode: text ? 'ai' : undefined, sources: [] }, 'Stopped.'); return; }
    if (failure || !text.trim()) {
      const a = local();
      const partial = text.trim() ? `${cleanForDisplay(text)}\n\n` : '';
      // A model or API failure is reported as such, never as "not in the portfolio". Passages are shown only when some actually matched.
      const body = a.matched ? a.text : "Arnav's portfolio assistant is temporarily unavailable. Please try again, or explore his work highlights and research directly.";
      finish(aId, { text: partial + body, sources: a.sources, mode: a.matched ? 'search' : undefined, notice: NOTICE[failure ?? 'unavailable'] }, `${NOTICE[failure ?? 'unavailable']} ${spokenSummary(a.text, 120)}`);
      return;
    }
    const shown = (cited.length ? sources.filter((s) => cited.includes(s.id)) : []);
    const finalSources = shown.length ? shown : sources.slice(0, 3);
    finish(aId, { text: cleanForDisplay(text), sources: finalSources, mode: 'ai' }, `Answer ready. ${spokenSummary(cleanForDisplay(text), 160)}`);
  }, [busy, ensureKb, finish]);

  const stop = () => { abortRef.current?.abort(); };

  /* ---- voice ---- */
  const toggleMic = () => {
    if (listening) { listenerRef.current?.stop(); return; }
    stopSpeaking(); setVoiceNote('');
    setView((v) => (v === 'orb' ? 'bar' : v === 'bar' && messagesRef.current.length ? 'panel' : v));
    listenerRef.current = startListening({
      onStart: () => { setPhase('listening'); setStatus('Listening. Speak your question, then edit it if needed.'); },
      onText: (t) => setInput(t),
      onEnd: () => { listenerRef.current = null; focusAfter.current = true; setPhase((p) => (p === 'listening' ? 'idle' : p)); setStatus('Stopped listening. Check the text, then press Ask.'); },
      onError: (e) => { setVoiceNote(VOICE_MESSAGES[e]); setStatus(VOICE_MESSAGES[e]); setPhase((p) => (p === 'listening' ? 'idle' : p)); },
    });
  };

  const clear = () => { stopAll(); setMessages([]); setPhase('idle'); setStatus('Conversation cleared.'); lastSource.current = undefined; try { sessionStorage.removeItem(STORE); } catch { /* ignore */ } inputRef.current?.focus(); };
  const minimise = () => { stopAll(); setPhase('idle'); setView('orb'); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (listening) { listenerRef.current?.abort(); setPhase('idle'); }
      else if (view === 'panel') setView('bar');
      else if (view === 'bar' && !busy) setView('orb');
    }
  };

  if (!ready) return <div className="assistant assistant--bar" aria-hidden="true" />;

  const phaseText = phase === 'loading' ? 'Loading the portfolio index…' : phase === 'thinking' ? 'Thinking…' : phase === 'listening' ? 'Listening…' : '';

  return (
    <div className={`assistant assistant--${view}`} onKeyDown={onKeyDown}>
      {view === 'panel' && (
        <section className="a-panel" aria-labelledby={`${uidBase}-t`}>
          <header className="a-head">
            <div>
              <h2 id={`${uidBase}-t`}>Ask Arnav's Archive</h2>
              <p>An AI guide to Arnav's portfolio. It answers about him in the third person, only from this site.</p>
            </div>
            <div className="a-head-actions">
              <button type="button" className="a-link" onClick={clear} disabled={!messages.length}>Clear conversation</button>
              <button type="button" className="a-icon" onClick={() => setView('bar')} aria-label="Collapse to the question bar"><span aria-hidden="true">▾</span></button>
              <button type="button" className="a-icon" onClick={minimise} aria-label="Minimise the assistant"><span aria-hidden="true">–</span></button>
            </div>
          </header>

          <div className="a-log" ref={logRef} role="log" aria-label="Conversation" aria-relevant="additions" tabIndex={0}>
            {messages.length === 0 && (
              <div className="a-welcome">
                <p>Ask about the work, the research or the experience, or tell me where to go ("show research", "take me to the CV").</p>
              </div>
            )}
            {messages.map((m) => (
              <article key={m.id} className={`a-msg a-msg--${m.role}`} aria-busy={m.streaming || undefined}>
                <h3 className="sr-only">{m.role === 'user' ? 'You asked' : 'Assistant answered'}</h3>
                {m.role === 'assistant' && m.mode && (
                  <p className="a-tag">{m.mode === 'ai' ? 'AI-generated from the portfolio. Check the sources.' : m.mode === 'search' ? 'Passages from the portfolio, not AI-generated' : 'Navigation'}</p>
                )}
                {m.notice && <p className="a-notice">{m.notice}</p>}
                {m.text
                  ? cleanForDisplay(m.text).split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)
                  : m.streaming ? <p className="a-wait">{phaseText || 'Working…'}</p> : null}
                {m.sources && m.sources.length > 0 && (
                  <div className="a-sources">
                    <span className="sr-only">Sources:</span>
                    <ul>{m.sources.filter((s) => internal(s.url)).map((s) => <li key={s.id + s.url}>{s.url.endsWith('.pdf') ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}<span className="sr-only"> (PDF, opens in a new tab)</span></a> : <a href={s.url}>{s.title}</a>}</li>)}</ul>
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="a-suggest">
            <p className="a-suggest-label" id={`${uidBase}-sg`}>Suggested questions</p>
            <ul className="a-chips" aria-labelledby={`${uidBase}-sg`}>
              {SUGGESTIONS.map((q) => <li key={q}><button type="button" onClick={() => submit(q)} disabled={busy}>{q}</button></li>)}
            </ul>
          </div>

          <footer className="a-foot">
            {ttsOk && (
              <button type="button" className="a-link" aria-pressed={readAloud} onClick={() => { setReadAloud((v) => { if (v) stopSpeaking(); return !v; }); }}>
                {readAloud ? 'Reading answers aloud: on' : 'Read answers aloud: off'}
              </button>
            )}
            <span>{voiceOk ? "Voice input uses your browser's speech recognition, which may send audio to an external service. " : ''}Answers can be wrong; check the sources.</span>
          </footer>
        </section>
      )}

      {view === 'orb' || listening ? (
        <div className={`a-orbwrap${listening ? ' is-listening' : ''}`}>
          {listening && <span className="a-live" aria-hidden="true">{input || 'Listening…'}</span>}
          <div className="a-orbrow">
            <span className="a-waves a-waves--l" aria-hidden="true"><i /><i /><i /><i /><i /></span>
            <button
              type="button" className="a-orb" onClick={listening ? toggleMic : () => { focusAfter.current = true; setView('panel'); }}
              aria-label={listening ? 'Stop voice input' : 'Ask about my work, research, or experience'}
              aria-keyshortcuts="Control+K Meta+K" aria-pressed={listening || undefined}
            >
              {voiceOk || listening ? <MicIcon size={26} /> : <PencilIcon size={24} />}
            </button>
            <span className="a-waves a-waves--r" aria-hidden="true"><i /><i /><i /><i /><i /></span>
          </div>
        </div>
      ) : (
        <form
          className="a-bar" onSubmit={(e) => { e.preventDefault(); submit(input); }} role="search" aria-label="Ask about Arnav's work"
          onBlur={(e) => { if (view === 'bar' && !input && !busy && !e.currentTarget.contains(e.relatedTarget as Node | null)) setView('orb'); }}
        >
          <span className="a-pencil" aria-hidden="true"><PencilIcon size={18} /></span>
          <label htmlFor={`${uidBase}-in`} className="sr-only">Ask about my work, research, or experience</label>
          <input
            id={`${uidBase}-in`} ref={inputRef} type="text" value={input} maxLength={500} enterKeyHint="send" autoComplete="off" spellCheck
            placeholder="Ask about my work, research, or experience…"
            aria-keyshortcuts="Control+K Meta+K"
            onChange={(e) => setInput(e.target.value)} onFocus={() => { if (view === 'bar' && messages.length) setView('panel'); }}
          />
          {voiceOk && (
            <button type="button" className="a-btn a-mic" onClick={toggleMic} aria-label="Start voice input" disabled={busy}>
              <MicIcon size={20} />
            </button>
          )}
          {busy && phase !== 'loading' ? (
            <button type="button" className="a-btn a-send" onClick={stop} aria-label="Stop answering"><span className="a-stop" aria-hidden="true" /></button>
          ) : (
            <button type="submit" className="a-btn a-send" disabled={!input.trim() || busy} aria-label="Ask"><SendIcon size={18} /></button>
          )}
        </form>
      )}
      <p className="sr-only" role="status" aria-live="polite">{status}</p>
      {(voiceNote || phaseText) && !listening && view !== 'panel' && <p className="a-inline" role="status">{voiceNote || phaseText}</p>}
      {voiceNote && view === 'panel' && <p className="a-inline" role="status">{voiceNote}</p>}
    </div>
  );
}

const MicIcon = ({ size }: { size: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V22h2v-3.08A7 7 0 0 0 19 12h-2Z" /></svg>
);
const PencilIcon = ({ size }: { size: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Zm9-13 4 4" /></svg>
);
const SendIcon = ({ size }: { size: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false"><path fill="currentColor" d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12 2-12 2 0 6.4Z" /></svg>
);
