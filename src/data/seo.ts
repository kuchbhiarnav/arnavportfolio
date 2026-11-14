/** Search-result titles (and, where given, descriptions) per route. Anything not listed falls back to "<page title> | Arnav's Portfolio". */
export const seo: Record<string, { title: string; description?: string }> = {
  '/': {
    title: 'Arnav Patnaik | Product Strategy, Data & Analytics',
    description: 'Arnav Patnaik is a product strategy and business analytics professional working across climate-tech, insurtech, data analytics and research. Explore projects in parametric insurance, SQL, Power BI, climate intelligence and data-driven decision-making.',
  },
  '/about': { title: 'About Arnav Patnaik | Experience & Education' },
  '/projects': { title: 'Projects | Arnav Patnaik – Data & Product Strategy' },
  '/research': { title: 'Research & Insights | Arnav Patnaik' },
  '/projects/groundwater-arsenic-decision-support': { title: 'Bangladesh Groundwater Arsenic Analytics | Arnav Patnaik' },
  '/projects/parametric-insurance-plutas-insure': { title: 'Building Plutas Insure | Product Strategy & Insurtech' },
  '/projects/project/ad-hoc-analysis-consumer-goods': { title: 'AtliQ Hardware SQL Analytics | Arnav Patnaik' },
  '/projects/project/atliq-hardware-excel-reports': { title: 'AtliQ Hardware Sales & Financial Reporting | Arnav Patnaik' },
  '/projects/project/telangana-tourism-dashboard': { title: 'Telangana Tourism Analytics | Arnav Patnaik' },
  '/projects/project/codex-product-dashboard': { title: 'Consumer Insights & Marketing Analytics | Arnav Patnaik' },
};
