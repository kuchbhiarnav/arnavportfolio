export interface Evidence { label: string; href: string }
export interface Capability { name: string; evidence: Evidence[] }
export interface CapabilityGroup { id: string; title: string; blurb: string; items: Capability[] }

const gw = '/projects/groundwater-arsenic-decision-support';
const pi = '/projects/parametric-insurance-plutas-insure';

/** Each capability links to the work where it was used. Nothing appears here without a pointer to evidence. */
export const capabilityGroups: CapabilityGroup[] = [
  {
    id: 'understand',
    title: 'Understand complex systems',
    blurb: 'Climate, groundwater, environmental and business data: pipelines, statistical modelling and research.',
    items: [
      { name: 'Python', evidence: [{ label: 'ETL and preprocessing, groundwater case study', href: `${gw}#contribution` }, { label: 'Python data collection in the GSA 2024 abstract', href: '/research/gsa-connects-2024-climate-resilient-dss' }] },
      { name: 'SQL and MySQL', evidence: [{ label: 'Ad-hoc SQL analysis project', href: '/projects/project/ad-hoc-analysis-consumer-goods' }, { label: 'MySQL storage in the GSA 2025 abstract', href: '/research/gsa-connects-2025-arsenic-mitigation' }] },
      { name: 'ETL and data pipelines', evidence: [{ label: 'Real-time arsenic and sensor pipelines', href: `${gw}#contribution` }] },
      { name: 'Statistical and machine-learning classification', evidence: [{ label: 'Tubewell safety classification', href: `${gw}#contribution` }, { label: 'Deepfake detection paper', href: '/research/deepfake-detection-neural-networks' }] },
      { name: 'Research and publication', evidence: [{ label: 'GSA Connects 2024 and 2025', href: '/research' }] },
    ],
  },
  {
    id: 'usable',
    title: 'Make information usable',
    blurb: 'Dashboards, decision-support tools, wireframes and interfaces that non-specialists can use.',
    items: [
      { name: 'Power BI', evidence: [{ label: 'Groundwater decision-support dashboards', href: `${gw}#contribution` }, { label: 'Telangana Tourism Dashboard', href: '/projects/project/telangana-tourism-dashboard' }, { label: 'CodeX Product Dashboard', href: '/projects/project/codex-product-dashboard' }] },
      { name: 'Excel, Power Query, Power Pivot and DAX', evidence: [{ label: 'AtliQ Hardware reports', href: '/projects/project/atliq-hardware-excel-reports' }] },
      { name: 'Figma wireframing and prototyping', evidence: [{ label: 'Hydrogeological visualisation wireframes', href: `${gw}#contribution` }, { label: 'Plutas Insure wireframes and prototypes', href: `${pi}#contribution` }] },
      { name: 'UI/UX strategy and web delivery (WordPress, Hostinger)', evidence: [{ label: 'DigiSafe role', href: '/about#experience' }] },
    ],
  },
  {
    id: 'forward',
    title: 'Help ideas move forward',
    blurb: 'Market research, founder’s-office execution, stakeholder communication, investor materials and positioning.',
    items: [
      { name: 'Market, regulatory and ecosystem research', evidence: [{ label: 'Parametric insurance business case', href: `${pi}#contribution` }] },
      { name: 'Investor and competition materials', evidence: [{ label: 'Pitch decks, business plans and investment reports', href: `${pi}#contribution` }] },
      { name: 'Brand storytelling and PR', evidence: [{ label: 'Climate-tech and insurtech positioning', href: `${pi}#contribution` }] },
      { name: 'Stakeholder coordination and project management', evidence: [{ label: 'Chief of Staff–style support, DigiSafe', href: '/about#experience' }] },
    ],
  },
];

/** Listed on the CV but with no linked work yet. Shown plainly as such, not as evidenced skills. */
export const alsoListed = ['R', 'Power Automate', 'Microsoft Dynamics 365 Business Central', 'Wix', 'N8N', 'Flowise'];
