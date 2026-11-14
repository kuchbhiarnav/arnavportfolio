import { describe, expect, it } from 'vitest';
import { LineBuffer, cleanForDisplay, parseEvent } from '../src/assistant/stream';

describe('stream event validation', () => {
  it('accepts well-formed events', () => {
    expect(parseEvent('{"t":"delta","text":"hi"}')).toEqual({ t: 'delta', text: 'hi' });
    expect(parseEvent('{"t":"done","cited":["a.b"]}')).toEqual({ t: 'done', cited: ['a.b'] });
    expect(parseEvent('{"t":"error","code":"quota"}')).toEqual({ t: 'error', code: 'quota' });
  });
  it('rejects malformed and unknown events', () => {
    for (const bad of ['', 'not json', '[]', '{"t":"evil"}', '{"t":"delta"}', '{"t":"delta","text":5}', '{"t":"error","code":"anything"}', 'null']) expect(parseEvent(bad), bad).toBeNull();
  });
  it('drops sources that are not internal links', () => {
    const ev = parseEvent(JSON.stringify({ t: 'meta', sources: [
      { id: 'a', title: 'ok', url: '/projects' }, { id: 'b', title: 'ext', url: 'https://evil.example' }, { id: 'c', title: 'proto', url: '//evil.example' }, { id: 'd', title: 'js', url: 'javascript:alert(1)' }, { id: 'e' },
    ] }));
    expect(ev).toEqual({ t: 'meta', sources: [{ id: 'a', title: 'ok', url: '/projects' }] });
  });
  it('bounds delta size', () => {
    const ev = parseEvent(JSON.stringify({ t: 'delta', text: 'x'.repeat(10_000) }));
    expect(ev && ev.t === 'delta' && ev.text.length).toBe(4000);
  });
});

describe('line buffering', () => {
  it('reassembles lines split across chunks', () => {
    const b = new LineBuffer();
    expect(b.push('{"t":"del')).toEqual([]);
    expect(b.push('ta","text":"a"}\n{"t":"done","cited":[]}\n{"t":')).toEqual(['{"t":"delta","text":"a"}', '{"t":"done","cited":[]}']);
    expect(b.flush()).toEqual(['{"t":']);
  });
});

describe('citation markers', () => {
  it('are removed from display text, including a partial one still arriving', () => {
    expect(cleanForDisplay('He did X [case.a.outcomes] and Y [exp.plutas].')).toBe('He did X and Y.');
    expect(cleanForDisplay('He did X [case.a.out')).toBe('He did X');
    expect(cleanForDisplay('Keep [brackets] that are not ids')).toBe('Keep [brackets] that are not ids');
  });
});

describe('cleanForDisplay with several ids in one bracket', () => {
  it('removes comma-separated citation lists, including a half-streamed one', () => {
    expect(cleanForDisplay('He led it [exp.plutas, case.x.overview]. Next')).toBe('He led it. Next');
    expect(cleanForDisplay('He led it [exp.plutas, case.x')).toBe('He led it');
  });
});

describe('cleanForDisplay with markdown from the model', () => {
  it('turns bold and bullet markers into plain text', () => {
    expect(cleanForDisplay('Areas:\n* **Data:** pipelines\n- **Research:** papers')).toBe('Areas:\n• Data: pipelines\n• Research: papers');
  });
});
