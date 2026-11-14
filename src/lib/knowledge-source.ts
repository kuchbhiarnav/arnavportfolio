import { getCollection } from 'astro:content';
import { buildKnowledge, type KnowledgeBase } from './knowledge';

/** Loads the same content collections the pages render. Drafts and needs-review entries are dropped inside buildKnowledge. */
export async function loadKnowledge(): Promise<KnowledgeBase> {
  const [caseStudies, research, work] = await Promise.all([getCollection('caseStudies'), getCollection('research'), getCollection('work')]);
  return buildKnowledge({
    caseStudies: caseStudies.map((e) => ({ id: e.id, body: e.body, data: e.data })),
    research: research.map((e) => ({ id: e.id, body: e.body, data: e.data })),
    work: work.map((e) => ({ id: e.id, body: e.body, data: e.data })),
  });
}
