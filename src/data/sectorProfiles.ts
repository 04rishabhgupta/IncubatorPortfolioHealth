import { Sector } from '@/types';

/**
 * Sector Intelligence reference data.
 *
 * Everything in this file is the curated baseline for the Sector Intelligence page.
 * Live headlines (news, regulation updates, funding calls, competitor moves) are fetched
 * separately at runtime by /api/sector-intel — see src/lib/sectorFeed.ts.
 *
 * Market figures: only figures with a named source are recorded. Each figure carries
 * the source and a link so users can verify it. Where no verified figure exists yet,
 * the value is left out and the UI shows "Not tracked yet" with a research link.
 * Update `asOf` whenever a figure is refreshed.
 */

export interface MarketFigure {
  label: string; // e.g. 'India market opportunity'
  value: string; // e.g. '$35B'
  period: string; // e.g. 'by 2030'
  source: string; // e.g. 'Bain & Company, 2026'
  url: string;
}

export interface Regulator {
  name: string;
  role: string;
  url: string;
}

export interface FundingScheme {
  name: string;
  body: string;
  what: string;
  url: string;
}

export interface SectorProfile {
  sector: Sector;
  label: string;
  shortLabel: string;
  tagline: string;
  accent: string; // tailwind-safe hex used for the tile accent
  /** Search phrase used for live headlines. Keep it short and specific. */
  keywords: string;
  /** Regex fragments (case-insensitive); a live headline must match one to be shown. */
  matchTerms: string[];
  market: {
    india: MarketFigure[];
    global: MarketFigure[];
    growthSignal: 'Strong' | 'Steady' | 'Cautious';
    drivers: string[];
    headwinds: string[];
    asOf: string;
  };
  regulators: Regulator[];
  funding: FundingScheme[];
  competitors: string[]; // notable Indian players to watch
}

const search = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

/** Schemes open to deep-tech startups regardless of sector. */
export const CROSS_SECTOR_FUNDING: FundingScheme[] = [
  {
    name: 'Startup India Seed Fund Scheme (SISFS)',
    body: 'DPIIT',
    what: 'Seed grants and convertible debt routed through approved incubators for proof of concept, prototype and market entry.',
    url: 'https://seedfund.startupindia.gov.in',
  },
  {
    name: 'Fund of Funds for Startups (FFS)',
    body: 'SIDBI',
    what: 'Government capital invested through SEBI-registered AIFs that back early-stage startups.',
    url: 'https://www.sidbi.in',
  },
  {
    name: 'Technology Development Board (TDB) financing',
    body: 'DST',
    what: 'Soft loans and equity support for commercialising indigenous technology.',
    url: 'https://tdb.gov.in',
  },
];

export const SECTOR_PROFILES: SectorProfile[] = [
  {
    sector: 'MEDTECH',
    label: 'HealthTech & MedTech',
    shortLabel: 'HealthTech',
    tagline: 'Medical devices, diagnostics and digital health',
    accent: '#DC2626',
    keywords: 'medtech OR healthtech OR "medical devices"',
    matchTerms: ['medtech', 'health ?tech', 'medical device', 'diagnostic', 'cdsco', 'healthcare', 'hospital', 'clinical'],
    market: {
      india: [
        {
          label: 'India medtech market opportunity',
          value: '$35B',
          period: 'by 2030',
          source: 'Bain & Company, 2026',
          url: 'https://www.digitalhealthnews.com/india-s-medtech-opportunity-could-reach-35-billion-by-2030-bain-report-',
        },
        {
          label: 'India medical device exports',
          value: '$4B',
          period: 'FY2025',
          source: 'Bain & Company, 2026',
          url: 'https://www.digitalhealthnews.com/india-s-medtech-opportunity-could-reach-35-billion-by-2030-bain-report-',
        },
      ],
      global: [
        {
          label: 'Asia-Pacific medtech demand',
          value: '$132B',
          period: 'by 2030 · 6.9% CAGR',
          source: 'Bain & Company, 2026',
          url: 'https://www.digitalhealthnews.com/india-s-medtech-opportunity-could-reach-35-billion-by-2030-bain-report-',
        },
      ],
      growthSignal: 'Strong',
      drivers: [
        'Import substitution push and PLI support for domestic device manufacturing',
        'ABDM digital health rails creating demand for interoperable products',
        'Rising diagnostics and imaging demand outside metro cities',
      ],
      headwinds: [
        'Longer CDSCO approval cycles for higher-risk device classes',
        'Hospital procurement is price-sensitive and slow to pay',
        'Clinical validation costs are front-loaded',
      ],
      asOf: '2026-07',
    },
    regulators: [
      { name: 'CDSCO', role: 'Medical device and IVD licensing under MDR 2017', url: 'https://cdsco.gov.in' },
      { name: 'ICMR', role: 'Clinical research ethics and validation studies', url: 'https://www.icmr.gov.in' },
      { name: 'National Health Authority (ABDM)', role: 'Digital health standards and integrations', url: 'https://abdm.gov.in' },
      { name: 'MeitY (DPDP Act)', role: 'Personal and health data protection', url: 'https://www.meity.gov.in' },
    ],
    funding: [
      {
        name: 'Biotechnology Ignition Grant (BIG)',
        body: 'BIRAC',
        what: 'Early-stage grant for proof of concept in biotech and medtech.',
        url: 'https://birac.nic.in',
      },
      {
        name: 'PRIP scheme',
        body: 'Department of Pharmaceuticals',
        what: 'Support for research and innovation in pharma and medtech.',
        url: 'https://pharma-dept.gov.in',
      },
    ],
    competitors: ['Qure.ai', 'Niramai', 'Tricog', 'SigTuple', 'Forus Health'],
  },
  {
    sector: 'AGRITECH',
    label: 'AgriTech',
    shortLabel: 'AgriTech',
    tagline: 'Farm inputs, supply chain, precision agriculture',
    accent: '#16A34A',
    keywords: 'agritech OR "agri tech" OR "precision agriculture"',
    matchTerms: ['agri', 'farm', 'crop', 'kisan', 'fertili[sz]er', 'seed', 'dairy', 'food'],
    market: {
      india: [
        {
          label: 'India agritech market opportunity',
          value: '$35B',
          period: 'by 2025 (2020 estimate)',
          source: 'Bain & Company, 2020',
          url: 'https://www.consultancy.in/news/3644/indias-agritech-sector-could-touch-35-billion-by-2025-says-bain',
        },
      ],
      global: [],
      growthSignal: 'Steady',
      drivers: [
        'Digital Public Infrastructure for agriculture and farmer registries',
        'Drone and sensor adoption for spraying and crop monitoring',
        'Formal credit and warehouse-receipt finance reaching smallholders',
      ],
      headwinds: [
        'Fragmented landholdings make unit economics hard',
        'Seasonal and weather-linked revenue',
        'Funding has concentrated in fewer, later-stage players',
      ],
      asOf: '2026-10',
    },
    regulators: [
      { name: 'Ministry of Agriculture & Farmers Welfare', role: 'Schemes, input regulation and digital agriculture', url: 'https://agriwelfare.gov.in' },
      { name: 'ICAR', role: 'Agricultural research and technology validation', url: 'https://icar.org.in' },
      { name: 'FSSAI', role: 'Food safety and standards', url: 'https://www.fssai.gov.in' },
      { name: 'PPV&FR Authority', role: 'Plant variety and farmers’ rights protection', url: 'https://plantauthority.gov.in' },
    ],
    funding: [
      {
        name: 'RKVY-RAFTAAR Agribusiness Incubation',
        body: 'Ministry of Agriculture',
        what: 'Grants for agri startups through designated agribusiness incubators.',
        url: 'https://rkvy.da.gov.in',
      },
      {
        name: 'AgriSURE Fund',
        body: 'NABARD',
        what: 'Blended capital fund for agri and rural startups.',
        url: 'https://www.nabard.org',
      },
    ],
    competitors: ['DeHaat', 'Ninjacart', 'CropIn', 'Arya.ag', 'Fasal'],
  },
  {
    sector: 'AI_ML',
    label: 'AI / ML',
    shortLabel: 'AI / ML',
    tagline: 'Foundation models, applied AI and data platforms',
    accent: '#7C3AED',
    keywords: '"artificial intelligence" OR "AI startup" OR GenAI',
    matchTerms: ['\\bAI\\b', 'genai', 'artificial intelligence', '\\bLLMs?\\b', 'machine learning', 'deep ?learning'],
    market: {
      india: [
        {
          label: 'India AI market',
          value: '$17B',
          period: 'by 2027 (~3x)',
          source: 'BCG–NASSCOM, 2025',
          url: 'https://www.angelone.in/news/market-updates/india-s-ai-market-projected-to-triple-to-17-billion-by-2027-report',
        },
      ],
      global: [
        {
          label: 'Worldwide AI spending',
          value: '$632B',
          period: 'by 2028',
          source: 'IDC, 2024',
          url: search('IDC worldwide AI spending 632 billion 2028'),
        },
      ],
      growthSignal: 'Strong',
      drivers: [
        'IndiaAI Mission compute subsidies and datasets',
        'Enterprise adoption of GenAI across BFSI, retail and healthcare',
        'Large, low-cost engineering talent pool',
      ],
      headwinds: [
        'GPU access and inference costs',
        'Evolving rules on AI safety, deepfakes and data use',
        'Competition from global model providers',
      ],
      asOf: '2025-06',
    },
    regulators: [
      { name: 'MeitY', role: 'IT Rules, AI advisories and DPDP Act', url: 'https://www.meity.gov.in' },
      { name: 'IndiaAI Mission', role: 'Compute, datasets and safety institute', url: 'https://indiaai.gov.in' },
      { name: 'Data Protection Board of India', role: 'DPDP Act enforcement', url: 'https://www.meity.gov.in' },
    ],
    funding: [
      {
        name: 'IndiaAI Mission programmes',
        body: 'MeitY',
        what: 'Subsidised GPU compute, startup financing and innovation challenges.',
        url: 'https://indiaai.gov.in',
      },
      {
        name: 'MeitY Startup Hub (SAMRIDH, TIDE 2.0)',
        body: 'MeitY',
        what: 'Accelerator-linked matching investment and incubator grants for tech startups.',
        url: 'https://msh.meity.gov.in',
      },
    ],
    competitors: ['Sarvam AI', 'Krutrim', 'Gnani.ai', 'Uniphore', 'Fractal'],
  },
  {
    sector: 'CYBERSECURITY',
    label: 'Cybersecurity',
    shortLabel: 'Cyber',
    tagline: 'Threat detection, identity, data security',
    accent: '#06B6D4',
    keywords: 'cybersecurity OR "cyber security" OR ransomware',
    matchTerms: ['cyber', 'ransomware', 'malware', 'breach', 'hack', 'phishing', 'cert-in', 'fraud'],
    market: {
      india: [
        {
          label: 'India cybersecurity industry',
          value: '$13.6B',
          period: 'by 2025',
          source: 'DSCI (via IndBiz)',
          url: 'https://indbiz.gov.in/indian-cybersecurity-sector-to-hit-us13-6bn-by-2025-report',
        },
      ],
      global: [
        {
          label: 'Global information security spending',
          value: '$212B',
          period: '2025',
          source: 'Gartner, 2024',
          url: search('Gartner forecast information security spending 2025 212 billion'),
        },
      ],
      growthSignal: 'Strong',
      drivers: [
        'CERT-In incident-reporting rules and DPDP Act compliance',
        'Sector regulators (RBI, SEBI, IRDAI) tightening cyber requirements',
        'Rising ransomware and fraud incidents',
      ],
      headwinds: [
        'Long enterprise and government sales cycles',
        'Crowded market dominated by global vendors',
        'Talent shortage for senior security roles',
      ],
      asOf: '2026-10',
    },
    regulators: [
      { name: 'CERT-In', role: 'Incident reporting and cyber directions', url: 'https://www.cert-in.org.in' },
      { name: 'NCIIPC', role: 'Critical information infrastructure protection', url: 'https://nciipc.gov.in' },
      { name: 'MeitY (DPDP Act)', role: 'Data protection obligations', url: 'https://www.meity.gov.in' },
      { name: 'RBI', role: 'Cyber security framework for regulated entities', url: 'https://www.rbi.org.in' },
    ],
    funding: [
      {
        name: 'iDEX (Innovations for Defence Excellence)',
        body: 'Ministry of Defence',
        what: 'Grants and procurement pathway for defence and cyber challenges.',
        url: 'https://idex.gov.in',
      },
      {
        name: 'MeitY Startup Hub (SAMRIDH, TIDE 2.0)',
        body: 'MeitY',
        what: 'Accelerator-linked matching investment and incubator grants for tech startups.',
        url: 'https://msh.meity.gov.in',
      },
    ],
    competitors: ['Quick Heal', 'Securonix', 'CloudSEK', 'Sequretek', 'Innefu Labs'],
  },
  {
    sector: 'UAV',
    label: 'Drones & UAV',
    shortLabel: 'Drones',
    tagline: 'Drone platforms, payloads and drone services',
    accent: '#2563EB',
    keywords: 'drone OR UAV OR "unmanned aerial"',
    matchTerms: ['drone', '\\buav', 'unmanned', 'dgca', 'counter-drone'],
    market: {
      india: [
        {
          label: 'India drone (UAV) market',
          value: '$1.39B',
          period: 'by 2030 · from $0.47B (2025), 24.4% CAGR',
          source: 'Research and Markets, Oct 2025',
          url: 'https://www.globenewswire.com/news-release/2025/10/15/3166847/28124/en/India-Drone-Civil-amp-Commercial-Defense-amp-Government-Market-Forecast-to-2030-Regulatory-Frameworks-Government-Initiatives-Precision-Farming-Focus-and-Surveillance-Demand.html',
        },
      ],
      global: [
        {
          label: 'Global UAV market',
          value: '$163B',
          period: 'by 2030',
          source: 'SecurityWorldMarket',
          url: 'https://www.securityworldmarket.com/na/News/Business-News/global-market-for-uavs-predicted-to-reach-163-billion-by-2030',
        },
      ],
      growthSignal: 'Strong',
      drivers: [
        'Liberalised Drone Rules 2021 and Digital Sky approvals',
        'PLI incentives for drones and components',
        'Defence indigenisation and agri-spraying demand',
      ],
      headwinds: [
        'Import restrictions make some components hard to source',
        'Airspace zoning limits commercial operations',
        'Government buyers dominate demand',
      ],
      asOf: '2025-10',
    },
    regulators: [
      { name: 'DGCA', role: 'Type certification and remote pilot certificates', url: 'https://www.dgca.gov.in' },
      { name: 'Ministry of Civil Aviation', role: 'Drone Rules 2021 and policy', url: 'https://www.civilaviation.gov.in' },
      { name: 'Digital Sky Platform', role: 'Registration, airspace map and permissions', url: 'https://digitalsky.dgca.gov.in' },
    ],
    funding: [
      {
        name: 'PLI scheme for drones and drone components',
        body: 'Ministry of Civil Aviation',
        what: 'Production-linked incentive on value addition by eligible manufacturers.',
        url: 'https://www.civilaviation.gov.in',
      },
      {
        name: 'iDEX (Innovations for Defence Excellence)',
        body: 'Ministry of Defence',
        what: 'Grants and procurement pathway for defence challenges, including UAV and counter-drone.',
        url: 'https://idex.gov.in',
      },
    ],
    competitors: ['ideaForge', 'Garuda Aerospace', 'Asteria Aerospace', 'NewSpace Research', 'Skye Air'],
  },
  {
    sector: 'SEMICONDUCTOR',
    label: 'Semiconductors',
    shortLabel: 'Semis',
    tagline: 'Chip design, fabs, OSAT and electronics',
    accent: '#EA580C',
    keywords: 'semiconductor OR "chip design" OR OSAT',
    matchTerms: ['semiconductor', '\\bchips?\\b', '\\bfabs?\\b', 'osat', 'foundry', 'silicon'],
    market: {
      india: [
        {
          label: 'India semiconductor market',
          value: '~$108B',
          period: 'by 2030',
          source: 'India Briefing, 2025',
          url: 'https://www.india-briefing.com/news/indias-semiconductor-market-to-hit-us108-billion-by-2030-report-36926.html',
        },
      ],
      global: [
        {
          label: 'Global semiconductor market',
          value: '$700.9B',
          period: '2025 forecast',
          source: 'WSTS, 2025',
          url: search('WSTS semiconductor market forecast 2025 700.9 billion'),
        },
      ],
      growthSignal: 'Strong',
      drivers: [
        'India Semiconductor Mission fab, OSAT and display incentives',
        'Design Linked Incentive (DLI) scheme for chip design startups',
        'Electronics manufacturing growth creating local demand',
      ],
      headwinds: [
        'Very high capital needs and long time to revenue',
        'Dependence on imported EDA tools and IP',
        'Global supply cycles and export controls',
      ],
      asOf: '2025-08',
    },
    regulators: [
      { name: 'India Semiconductor Mission (ISM)', role: 'Fab, OSAT and DLI schemes', url: 'https://ism.gov.in' },
      { name: 'MeitY', role: 'Electronics and semiconductor policy', url: 'https://www.meity.gov.in' },
      { name: 'BIS', role: 'Compulsory registration and standards for electronics', url: 'https://www.bis.gov.in' },
    ],
    funding: [
      {
        name: 'Design Linked Incentive (DLI) scheme',
        body: 'India Semiconductor Mission',
        what: 'Financial support and design infrastructure for semiconductor design startups.',
        url: 'https://ism.gov.in',
      },
      {
        name: 'Chips to Startup (C2S) programme',
        body: 'MeitY',
        what: 'Chip design training and prototyping support with academic partners.',
        url: 'https://www.meity.gov.in',
      },
    ],
    competitors: ['Mindgrove Technologies', 'InCore Semiconductors', 'Netrasemi', 'Saankhya Labs', 'Agnit Semiconductors'],
  },
  {
    sector: 'ADVANCED_MATERIALS',
    label: 'Advanced Materials',
    shortLabel: 'Materials',
    tagline: 'Specialty materials, composites, textiles and nanotech',
    accent: '#4F46E5',
    keywords: '"advanced materials" OR graphene OR composites OR "technical textiles"',
    matchTerms: ['material', 'graphene', 'composite', 'textile', 'nano', 'polymer', 'battery', 'carbon fib'],
    market: {
      india: [],
      global: [],
      growthSignal: 'Steady',
      drivers: [
        'National Technical Textiles Mission and defence indigenisation',
        'EV, battery and clean-energy supply chains needing new materials',
        'Import substitution in specialty chemicals and composites',
      ],
      headwinds: [
        'Long qualification cycles with industrial buyers',
        'Pilot-to-production scale-up is capital-intensive',
        'IP often sits with institutions and needs licensing',
      ],
      asOf: '2026-10',
    },
    regulators: [
      { name: 'BIS', role: 'Product standards and quality control orders', url: 'https://www.bis.gov.in' },
      { name: 'DPIIT', role: 'Industrial policy and startup recognition', url: 'https://dpiit.gov.in' },
      { name: 'DST', role: 'Materials research programmes', url: 'https://dst.gov.in' },
      { name: 'DRDO', role: 'Defence materials development and ToT', url: 'https://www.drdo.gov.in' },
    ],
    funding: [
      {
        name: 'National Technical Textiles Mission',
        body: 'Ministry of Textiles',
        what: 'Research, startup grants and market development for technical textiles.',
        url: 'https://texmin.nic.in',
      },
      {
        name: 'iDEX (Innovations for Defence Excellence)',
        body: 'Ministry of Defence',
        what: 'Grants and procurement pathway for defence material challenges.',
        url: 'https://idex.gov.in',
      },
    ],
    competitors: ['Log9 Materials', 'Nopo Nanotechnologies', 'Tata Advanced Materials'],
  },
];

export function getSectorProfile(sector: string): SectorProfile | undefined {
  return SECTOR_PROFILES.find((p) => p.sector === sector);
}

export function researchLink(profile: SectorProfile, scope: 'India' | 'global') {
  return search(`${profile.label} market size ${scope} latest report`);
}
