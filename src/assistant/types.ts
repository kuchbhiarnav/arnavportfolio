export interface Source { id: string; title: string; url: string }

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sources?: Source[];
  /** How an assistant message was produced, shown to the visitor so search results are never mistaken for AI generation. */
  mode?: 'search' | 'ai' | 'nav';
  notice?: string;
  streaming?: boolean;
}

export type Phase = 'idle' | 'loading' | 'thinking' | 'streaming' | 'listening';
/** orb = the centred microphone button (default); bar = the expanded pill input; panel = conversation above the pill. */
export type View = 'orb' | 'bar' | 'panel';

export const SUGGESTIONS = [
  'Give me a 30-second introduction to Arnav.',
  'What has he worked on in climate technology?',
  'Explain the groundwater research.',
  'Show me his product design experience.',
  'Which projects demonstrate Python and SQL?',
  'How does his experience relate to this role?',
  'Take me to his CV.',
  'How can I contact him?',
] as const;
