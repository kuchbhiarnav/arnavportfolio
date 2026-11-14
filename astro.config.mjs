// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import { fileURLToPath } from 'node:url';
import sitemap from '@astrojs/sitemap';

// Canonical origin, e.g. https://example.com. Unset => no canonical/OG absolute URLs and no sitemap
// (see docs/05-setup-and-environment.md). Never guess a domain.
const site = process.env.SITE_URL || undefined;

export default defineConfig({
  site,
  // Static by default. Only /api/* routes opt out with `export const prerender = false`.
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  // Deployed on Vercel. The two /api routes still import the Cloudflare-only module, so it is aliased to a small shim:
  // AI mode stays off (its usage gate is a Cloudflare Durable Object) and the assistant answers from the in-browser search.
  adapter: vercel(),
  vite: { resolve: { alias: { 'cloudflare:workers': fileURLToPath(new URL('./src/lib/cloudflare-workers-shim.ts', import.meta.url)) } } },
  // The site keeps no server-side sessions, so don't provision the adapter's default KV binding.
  session: false,
  integrations: [react(), ...(site ? [sitemap()] : [])],
  // Old static URLs keep working (brief §5). 301s, one per retired page.
  redirects: {
    '/index.html': '/',
    // The Résumé page was removed: the CV PDF is the single source.
    '/resume': '/cv/Arnav-Patnaik-CV.pdf',
    '/resume.html': '/cv/Arnav-Patnaik-CV.pdf',
    '/about.html': '/about',
    '/projects.html': '/projects',
    '/insights.html': '/research',
    '/insights-detail.html': '/research/gsa-connects-2025-arsenic-mitigation',
    '/insights-detail-2.html': '/research/gsa-connects-2024-climate-resilient-dss',
    '/insights-detail-3.html': '/research/deepfake-detection-neural-networks',
    '/privacy-policy.html': '/privacy',
    '/terms-of-service.html': '/terms',
    // The Work section became Projects.
    '/work': '/projects',
    '/work/groundwater-arsenic-decision-support': '/projects/groundwater-arsenic-decision-support',
    '/work/parametric-insurance-plutas-insure': '/projects/parametric-insurance-plutas-insure',
    '/work/project/ad-hoc-analysis-consumer-goods': '/projects/project/ad-hoc-analysis-consumer-goods',
    '/work/project/atliq-hardware-excel-reports': '/projects/project/atliq-hardware-excel-reports',
    '/work/project/telangana-tourism-dashboard': '/projects/project/telangana-tourism-dashboard',
    '/work/project/codex-product-dashboard': '/projects/project/codex-product-dashboard',
  },
  devToolbar: { enabled: false },
});
