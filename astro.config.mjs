// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// Canonical origin. SITE_URL overrides it (for previews); the live domain is the default so canonical URLs, social previews
// and the sitemap are always present.
const site = process.env.SITE_URL || 'https://arnavpatnaik.in';

export default defineConfig({
  site,
  // Fully static.
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  // Deployed on Vercel. The site is fully static: there are no server routes.
  adapter: vercel(),
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
