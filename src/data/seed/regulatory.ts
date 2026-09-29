import { RegulatoryItem } from '@/types';
export const regulatory: RegulatoryItem[] = [
  {
    "id": "R1",
    "title": "Draft guidance on clinical performance evidence for point-of-care diagnostic devices",
    "authority": "CDSCO",
    "kind": "RISK",
    "status": "CONSULTATION",
    "publishedOn": "2026-09-01",
    "consultationClosesOn": "2026-11-15",
    "summary": "New documentation requirements for clinical evidence for IVDs.",
    "sectors": [
      "MEDTECH"
    ],
    "directTags": [
      "IVD",
      "MEDICAL_DEVICE"
    ],
    "indirectTags": [],
    "whatToCheck": [
      "Review clinical validation protocol",
      "Check sample sizes"
    ],
    "isSample": true
  },
  {
    "id": "R2",
    "title": "Phased deadline for consent management under personal data protection rules",
    "authority": "MeitY",
    "kind": "RISK",
    "status": "NOTIFIED",
    "publishedOn": "2026-08-15",
    "effectiveOn": "2027-01-01",
    "summary": "Mandatory consent managers for personal and health data.",
    "sectors": [
      "AI_ML",
      "MEDTECH",
      "AGRITECH",
      "CYBERSECURITY"
    ],
    "directTags": [
      "PERSONAL_DATA",
      "HEALTH_DATA"
    ],
    "indirectTags": [
      "FARMER_DATA"
    ],
    "whatToCheck": [
      "Audit current consent flow",
      "Identify data processors"
    ],
    "isSample": true
  },
  {
    "id": "R3",
    "title": "Revised type-certification requirements for small and medium drones",
    "authority": "DGCA",
    "kind": "RISK",
    "status": "NOTIFIED",
    "publishedOn": "2026-09-10",
    "effectiveOn": "2026-12-01",
    "summary": "Stricter type-certification processes for drones.",
    "sectors": [
      "UAV"
    ],
    "directTags": [
      "DRONE_OPERATIONS"
    ],
    "indirectTags": [],
    "whatToCheck": [
      "Check component origins",
      "Prepare documentation"
    ],
    "isSample": true
  },
  {
    "id": "R4",
    "title": "Updated restricted list for imported drone components",
    "authority": "DGFT",
    "kind": "RISK",
    "status": "NOTIFIED",
    "publishedOn": "2026-09-05",
    "effectiveOn": "2026-11-01",
    "summary": "Ban on specific imported modules.",
    "sectors": [
      "UAV"
    ],
    "directTags": [
      "IMPORTED_COMPONENTS"
    ],
    "indirectTags": [
      "IMPORTED_COMPONENTS"
    ],
    "whatToCheck": [
      "Review BOM"
    ],
    "isSample": true
  },
  {
    "id": "R5",
    "title": "Shorter incident-reporting timelines for vendors to critical infrastructure",
    "authority": "CERT-In",
    "kind": "RISK",
    "status": "NOTIFIED",
    "publishedOn": "2026-09-20",
    "effectiveOn": "2026-12-15",
    "summary": "Must report incidents within 6 hours.",
    "sectors": [
      "CYBERSECURITY"
    ],
    "directTags": [
      "CRITICAL_INFRA"
    ],
    "indirectTags": [
      "FINANCIAL_SECTOR_CLIENT"
    ],
    "whatToCheck": [
      "Update incident response plan"
    ],
    "isSample": true
  },
  {
    "id": "R6",
    "title": "Advisory on testing and labelling of AI models used in high-risk domains",
    "authority": "MeitY",
    "kind": "RISK",
    "status": "CONSULTATION",
    "publishedOn": "2026-09-15",
    "consultationClosesOn": "2026-11-30",
    "summary": "Proposed mandatory bias testing.",
    "sectors": [
      "AI_ML"
    ],
    "directTags": [
      "AI_MODEL"
    ],
    "indirectTags": [
      "HEALTH_DATA"
    ],
    "whatToCheck": [
      "Review testing pipelines"
    ],
    "isSample": true
  },
  {
    "id": "R7",
    "title": "Validation framework for AI-based diagnostic tools",
    "authority": "ICMR",
    "kind": "RISK",
    "status": "CONSULTATION",
    "publishedOn": "2026-09-01",
    "consultationClosesOn": "2026-10-31",
    "summary": "New standard for AI diagnostics.",
    "sectors": [
      "AI_ML",
      "MEDTECH"
    ],
    "directTags": [
      "AI_MODEL",
      "HEALTH_DATA"
    ],
    "indirectTags": [],
    "whatToCheck": [
      "Align with validation metrics"
    ],
    "isSample": true
  },
  {
    "id": "R8",
    "title": "Data-sharing standards for agri-advisory platforms",
    "authority": "Ministry of Agriculture",
    "kind": "RISK",
    "status": "NOTIFIED",
    "publishedOn": "2026-08-20",
    "effectiveOn": "2027-01-15",
    "summary": "Mandatory interoperability standards.",
    "sectors": [
      "AGRITECH"
    ],
    "directTags": [
      "FARMER_DATA"
    ],
    "indirectTags": [],
    "whatToCheck": [
      "Check API standards"
    ],
    "isSample": true
  },
  {
    "id": "R9",
    "title": "QR-based traceability for certified seed lots",
    "authority": "Ministry of Agriculture",
    "kind": "RISK",
    "status": "NOTIFIED",
    "publishedOn": "2026-09-25",
    "effectiveOn": "2026-12-01",
    "summary": "Mandatory QR tracking.",
    "sectors": [
      "AGRITECH"
    ],
    "directTags": [
      "SEED_SUPPLY"
    ],
    "indirectTags": [],
    "whatToCheck": [
      "Integrate QR generation"
    ],
    "isSample": true
  },
  {
    "id": "R10",
    "title": "New application window for chip-design incentive support",
    "authority": "MeitY",
    "kind": "OPPORTUNITY",
    "status": "NOTIFIED",
    "publishedOn": "2026-09-01",
    "consultationClosesOn": "2026-12-31",
    "summary": "Grants available for DLI.",
    "sectors": [
      "SEMICONDUCTOR"
    ],
    "directTags": [
      "CHIP_DESIGN"
    ],
    "indirectTags": [],
    "whatToCheck": [
      "Prepare proposal"
    ],
    "isSample": true
  },
  {
    "id": "R11",
    "title": "Mandatory certification for connected IoT sensors",
    "authority": "BIS",
    "kind": "RISK",
    "status": "CONSULTATION",
    "publishedOn": "2026-09-10",
    "consultationClosesOn": "2026-12-10",
    "summary": "New BIS standards.",
    "sectors": [
      "SEMICONDUCTOR",
      "AGRITECH"
    ],
    "directTags": [
      "IOT_DEVICE"
    ],
    "indirectTags": [
      "IOT_DEVICE"
    ],
    "whatToCheck": [
      "Check current certifications"
    ],
    "isSample": true
  },
  {
    "id": "R12",
    "title": "Relaxed prior-experience criteria for startups in defence procurement",
    "authority": "Ministry of Defence",
    "kind": "OPPORTUNITY",
    "status": "NOTIFIED",
    "publishedOn": "2026-09-15",
    "effectiveOn": "2026-11-20",
    "summary": "Startups exempted from turnover criteria.",
    "sectors": [
      "UAV",
      "CYBERSECURITY"
    ],
    "directTags": [
      "GOVT_BUYER"
    ],
    "indirectTags": [],
    "whatToCheck": [
      "Identify upcoming tenders"
    ],
    "isSample": true
  }
];
