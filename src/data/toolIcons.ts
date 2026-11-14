import type { ImageMetadata } from 'astro';
import { row1, row2 } from './skills';
import claude from '../assets/tools/claude.svg';
import chatgpt from '../assets/tools/chatgpt.svg';
import microsoft from '../assets/tools/microsoft.svg';
import wix from '../assets/tools/wix.png';

/** Logos for the Tools sections of case-study and project pages. The home-page skills strip is separate. */
export const toolIcons = new Map<string, ImageMetadata>([...row1, ...row2].map((s) => [s.name, s.img]));
for (const [name, img] of [['Claude', claude], ['ChatGPT', chatgpt], ['Microsoft PowerPoint', microsoft], ['Microsoft Word', microsoft], ['Microsoft Excel', microsoft], ['Wix', wix], ['Power BI', microsoft]] as const) toolIcons.set(name, img);

/** Logo for a tool name; "Microsoft Excel – Power Query" falls back to the Excel logo. */
export const iconFor = (name: string) => toolIcons.get(name) ?? toolIcons.get(name.split(' – ')[0]!);
/** Letters for the placeholder tile when a tool has no logo. */
export const initials = (name: string) => name.replace(/^Microsoft /, '').split(/\s+/).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');
