import type { APIRoute } from 'astro';
import { loadKnowledge } from '../../lib/knowledge-source';

// Built once at build time and served as a static file: the browser downloads it only when the assistant is first used.
export const GET: APIRoute = async () => {
  const kb = await loadKnowledge();
  return new Response(JSON.stringify(kb), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
