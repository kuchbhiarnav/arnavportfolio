import type { ImageMetadata } from 'astro';
import p1 from '../assets/covers/project1.png';
import p2 from '../assets/covers/project2.png';
import p3 from '../assets/covers/project3.png';
import p4 from '../assets/covers/project4.png';
import exceldots from '../assets/brand/exceldots-logo.png';
import plutas from '../assets/brand/plutas-logo.svg';

const note = ' Artwork only: the figures drawn on it are not project results.';

/** Supporting-project cover art. These are illustrations, not screenshots, and every alt text and caption says so. */
export const projectCovers: Record<string, { img: ImageMetadata; alt: string }> = {
  'ad-hoc-analysis-consumer-goods': { img: p1, alt: 'Illustrated cover for the ad-hoc analysis project: a globe of Asia-Pacific markets beside bar charts.' + note },
  'atliq-hardware-excel-reports': { img: p2, alt: 'Illustrated cover for the AtliQ Hardware Excel reports project: floating report pages and a bar chart.' + note },
  'telangana-tourism-dashboard': { img: p3, alt: 'Illustrated cover for the Telangana Tourism Dashboard project: a map of Telangana with charts.' + note },
  'codex-product-dashboard': { img: p4, alt: 'Illustrated cover for the CodeX Product Dashboard project: a dashboard with charts and drink cans.' + note },
};

/** Work Highlights get the organisation's logo as the cover: no stock imagery, no invented numbers. */
export const caseCovers: Record<string, { logo: ImageMetadata; alt: string }> = {
  'groundwater-arsenic-decision-support': { logo: exceldots, alt: 'Exceldots AB logo' },
  'parametric-insurance-plutas-insure': { logo: plutas, alt: 'Plutas.ai logo' },
};

/** Work Highlight videos: a silent 720p loop for the cards (hover) and a 1080p version with sound for the page. */
export const caseVideos: Record<string, { card: string; page: string; poster: string; label: string }> = {
  'groundwater-arsenic-decision-support': { card: '/media/projects/wh1', page: '/media/projects/wh1-hd.mp4', poster: '/media/projects/wh1.jpg', label: 'Video overview of the Bangladesh groundwater arsenic decision-support work' },
  'parametric-insurance-plutas-insure': { card: '/media/projects/wh2', page: '/media/projects/wh2-hd.mp4', poster: '/media/projects/wh2.jpg', label: 'Video overview of building Plutas Insure' },
};
