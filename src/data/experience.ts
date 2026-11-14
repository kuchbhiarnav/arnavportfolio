import type { Status } from './site';

export interface Bullet {
  text: string;
  /** Held back from public pages and the assistant until the conflict named in `note` is resolved. */
  hold?: boolean;
  note?: string;
}

export interface Role {
  id: string;
  org: string;
  title: string; // official title, never rewritten
  place: string;
  start: string; // YYYY-MM
  end: string | null; // null = ongoing
  summary: string; // short, no metrics
  /** CV bullets, verbatim, used by the résumé page. */
  bullets: Bullet[];
  caseStudy?: string;
  source: string;
  status: Status;
}

/** Roles from the CV (baseline). Overlaps are real and are drawn as parallel lanes, never as a sequence. */
export const roles: Role[] = [
  {
    id: 'plutas',
    org: 'Plutas.ai',
    title: "Program Manager (Founder's Office)",
    place: 'Pune, India',
    start: '2024-09',
    end: null,
    summary:
      'Market, regulatory and ecosystem research, product wireframing and investor materials for a B2B2C parametric insurance platform in India.',
    caseStudy: 'parametric-insurance-plutas-insure',
    source: 'CV (October 2026)',
    status: 'owner-supplied',
    bullets: [
      { text: 'Led strategic market, regulatory, and ecosystem research to define the business case for launching an end-to-end parametric insurance infrastructure platform in India, identifying climate, compliance, and distribution gaps.' },
      { text: 'Owned end-to-end product wireframing and prototyping for a B2B2C parametric insurance platform (Plutas Insure), aligning user experience, business logic, and technical feasibility.' },
      {
        text: 'Engineered large-scale climate data pipelines, processing 30+ years of historical weather data from IMD and ERA5 across ~19,000 Indian pincodes for risk modelling.',
        hold: true,
        note: 'The CV places this at Plutas.ai; the earlier résumé places it at DigiSafe. Held until confirmed.',
      },
      { text: 'Developed investor-grade pitch decks, business plans, and investment reports for global competitions and institutions, including the Tokyo Financial Innovation Awards, HDFC Ergo Technpreneur, and IIA Awards.' },
      { text: 'Led brand storytelling, PR strategy, and digital growth initiatives, strengthening B2B and B2B2C thought leadership in climate-tech and insurtech domains.' },
    ],
  },
  {
    id: 'digisafe',
    org: 'DigiSafe Insurance Broking',
    title: 'Data Consultant',
    place: 'Pune, India',
    start: '2024-08',
    end: '2025-04',
    summary:
      'UI/UX strategy for insurance brokerage and climate-risk applications, the company website, and a Chief of Staff–style support role.',
    source: 'CV (October 2026)',
    status: 'owner-supplied',
    bullets: [
      { text: 'Led UI/UX strategy for insurance brokerage and climate-risk applications, improving usability and customer journey clarity.' },
      { text: 'Designed and deployed the company website using WordPress and Hostinger, optimizing SEO, performance, and scalability.' },
      { text: 'Supported leadership in a Chief of Staff–style role, coordinating stakeholders, product strategy, and data governance to accelerate execution.' },
    ],
  },
  {
    id: 'exceldots',
    org: 'Exceldots AB',
    title: 'Data Analyst Intern (Remote, India)',
    place: 'Stockholm, Sweden',
    start: '2024-01',
    end: '2024-06',
    summary:
      'Data pipelines, classification and Power BI dashboards for groundwater arsenic decision support in Bangladesh.',
    caseStudy: 'groundwater-arsenic-decision-support',
    source: 'CV (October 2026)',
    status: 'owner-supplied',
    bullets: [
      { text: 'Designed high-impact Figma wireframes for hydrogeological and lithological data visualizations, improving stakeholder clarity and satisfaction by 20%.' },
      { text: 'Engineered real-time ETL pipelines to process arsenic contamination datasets and live sensor data across multiple districts in Bangladesh, improving data accuracy by 25% and reducing acquisition time by 40%.' },
      { text: 'Implemented advanced preprocessing for 6.37 million arsenic screening records, ensuring high-quality datasets for analysis.' },
      { text: 'Developed a custom statistical classification model to categorize tubewell safety based on international arsenic standards.' },
      { text: 'Built Power BI dashboards enabling a 20% increase in data-driven decision-making for groundwater safety interventions.' },
    ],
  },
  {
    id: 'feynn',
    org: 'Feynn Labs',
    title: 'Machine Learning Intern',
    place: 'Guwahati, India',
    start: '2022-05',
    end: '2022-07',
    summary: 'Air-quality data pipelines and clustering and classification models for Indian EV market segmentation.',
    source: 'Earlier résumé (not on the October 2026 CV)',
    status: 'owner-supplied',
    bullets: [],
  },
];

export interface Education {
  id: string;
  school: string;
  degree: string;
  place: string;
  start: string;
  end: string | null;
  detail?: string;
  source: string;
  status: Status;
}

export const education: Education[] = [
  {
    id: 'vub',
    school: 'Vrije Universiteit Brussel (VUB)',
    degree: "Master's in Management",
    place: 'Brussels, Belgium',
    start: '2026-09',
    end: null,
    source: 'CV (October 2026)',
    status: 'owner-supplied',
  },
  {
    id: 'cu',
    school: 'Chandigarh University',
    degree: 'Bachelor of Engineering in Computer Science and Engineering (Hons.), specialisation in Artificial Intelligence and Machine Learning, in association with IBM',
    place: 'Punjab, India',
    start: '2020-08',
    end: '2024-06',
    detail: 'CGPA 8.00, First Division with Distinction.',
    source: 'Degree certificate (issued 20 August 2024), checked 2026-11-07',
    status: 'verified',
  },
];

export const languages = [
  { name: 'English', level: 'Proficient' },
  { name: 'French', level: 'Beginner (A1)' },
];

export const interests = ['Travel', 'Street photography', 'Cooking', 'Learning languages'];
