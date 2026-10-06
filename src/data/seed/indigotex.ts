import { Startup, TeamMember, MonthlyMetrics, HealthAssessment, FittTracker } from '@/types';

const fittTracker: FittTracker = {
  checkedOn: '2026-10-05',
  nextPmActions: [
    { label: 'Emergency cash-position meeting', note: 'by 04-Aug-2026' },
    { label: 'NTTM ₹27 L tranche and ₹32 L unreceived grants', note: 'in progress' },
    { label: 'Royal Karkhana ₹15 L PO status', note: 'next check-in' }
  ],
  baseline: {
    tags: ['Deeptech', 'B2B'],
    dpiitRecognised: true,
    cin: 'U14101RJ2024PTC092556',
    roc: 'ROC Jaipur',
    incorporatedOn: '2024-02-08',
    locations: 'R&D: R&I Park, IIT Delhi · Registered: Dholpur, Rajasthan · Bhilwara warehouse',
    ipStatusNote: '2 patents filed (1 by IIT Delhi), 3 in process, 1 trademark in process, 0 granted',
    techTransferNote: 'IP assignment was a Round-1 condition precedent (SSHA Cl. 4.2.11)',
    totalRaisedNote: '₹1.58 Cr (₹1 Cr FITT + SIDBI, ₹0.58 Cr grants)',
    founders: [
      { name: 'Satendra Singh', role: 'Co-founder and CEO', commitment: 'FULL_TIME', note: 'M.Tech Textile, IIT Delhi · 7+ yrs Welspun, Vardhman, Raymond' },
      { name: 'Prof. B.S. Butola', role: 'R&D head', commitment: 'PART_TIME', note: 'PhD IIT Delhi · serving professor · IP-conflict flag', flag: 'IP-conflict flag' },
      { name: 'Dilip Singh', role: 'Co-founder and CMO', commitment: 'FULL_TIME', note: 'Arvind, Mafatlal, Raymond · not an MCA director' }
    ],
    capTable: [
      { holder: 'Satendra', pct: 65.43, color: '#2563EB' },
      { holder: 'Butola', pct: 10.35, color: '#4F46E5' },
      { holder: 'Dilip', pct: 6.73, color: '#7C3AED' },
      { holder: 'ESOP', pct: 9.5, color: '#A1A1AA' },
      { holder: 'FITT', pct: 3.8, color: '#D97706' },
      { holder: 'SIDBI', pct: 3.33, color: '#06B6D4' },
      { holder: 'BMU', pct: 0.86, color: '#EA580C' }
    ],
    capTableNote: "Founders' table in the sheet swaps Butola and Dilip's %; cap table summary used.",
    funding: [
      { label: 'SISF · Sep-24', amountCr: 0.13, kind: 'GRANT' },
      { label: 'i-Start · Oct-24', amountCr: 0.024, kind: 'GRANT' },
      { label: 'NTTM · Dec-25', amountCr: 0.45, kind: 'GRANT' },
      { label: 'IDFC · Jan-26', amountCr: 0.15, kind: 'GRANT' },
      { label: 'Kotak · Mar-26', amountCr: 0.10, kind: 'GRANT' },
      { label: 'ReNew · Mar-26', amountCr: 0.05, kind: 'GRANT' },
      { label: 'FITT + SIDBI', amountCr: 1, kind: 'EQUITY' },
      { label: 'IAN round', amountCr: 3.83, kind: 'SIGNING' }
    ],
    fundingWidthDenominatorCr: 3.83,
    roundPostMoneyCr: 23,
    previousPreMoneyCr: 22,
    currentPreMoneyCr: 20,
    useOfFunds: [
      { label: 'IP and certification', pct: 27, color: '#2563EB' },
      { label: 'Working capital', pct: 22, color: '#16A34A' },
      { label: 'R&D', pct: 18, color: '#7C3AED' },
      { label: 'Capex', pct: 17, color: '#A1A1AA' },
      { label: 'Marketing', pct: 16, color: '#D97706' }
    ]
  },
  monthlyCheckins: [
    {
      month: '2026-06',
      monthlyRevenue: 0,
      monthlyRevenueNote: 'Q1 revenue landed in May',
      monthlyBurn: 1606587,
      cashNote: '~₹60-65 L incl. FDs',
      runwayPmViewNote: 'PM view ~4-5 m',
      q1RevenueLakh: 5.76,
      q1RevenueTargetLakh: 6,
      payingCustomers: 1,
      payingCustomersNote: 'cumulative',
      grossMarginPct: 5.2,
      grossMarginNote: 'MIS vs 18.5% audited',
      productStage: 'GA',
      productStageNote: 'IndiWool shipping',
      orderPipeline: [
        { name: 'Dev Bhoomi', amountLakh: 27, capLakh: 27, tone: 'strong' },
        { name: 'Aquarelle', amountLakh: 22, capLakh: 27, tone: 'moderate' },
        { name: 'Royal Enfield', amountLakh: 16, capLakh: 27, tone: 'moderate' },
        { name: 'Royal Karkhana', amountLakh: 15, capLakh: 27, tone: 'neutral' },
        { name: 'Saksham (France)', amountLakh: 2, capLakh: 27, tone: 'strong' }
      ],
      customerConcentrationPct: 93,
      customerConcentrationNote: 'Dev Bhoomi = 93% of executed orders',
      fundraisingStage: 'Term sheet',
      fundraisingNote: '₹3.83 Cr · IAN Capital + IIT Delhi Angel Network · SSSHA in signing',
      technology: 'TRL 8. Blocker: plasma line commissioning (Jul-2026). Roadmap: plasma line live Jul-26, YodhaShield trials Aug-26, IndiWool fabric range next.',
      pitchMaterials: 'Deck finalised; no one-pager; no data room.',
      gtmProgress: 'Pilot / POC with 1-2 customers. Channels: exhibitions plus two channel partners. Sales Manager seat vacant.',
      pmNotes: "STRENGTHS: Q1 FY2026-27 revenue of ₹5.76L came in essentially on the ₹6L quarterly target. Financial reporting discipline has improved - three consecutive months of MIS with a full P&L, cash flow statement and balance sheet. Material external validation landed in the period: selection for Bharat Innovates 2026 Top 100 deep-tech innovations with the global showcase at Nice, France (14-16 Jun 2026); ReNew ACE Awards for Climate Entrepreneurs 2026, 2nd Runner-Up with ₹5L; and public recognition from the Union Textiles Minister. The Ralph Lauren NDA and commercial approval remain a genuinely uncommon achievement for a two-year-old fabric startup.\n\nCONCERNS: 1) Cash ₹62,936 (bank) / ~₹60-65L incl. FDs, against ₹13.8L/mo operating outflow. 2) May gross margin 5.2% (MIS) vs 18.5% (certified accounts) against a 38% plan. 3) Zero leads generated in Apr, May, June against a ₹75.24L marketing budget. 4) Royal Karkhana MSA 'in final stages' three months running.\n\nFITT ACTIONS: Convene an emergency cash-position meeting within 7 days - PM (Investment). Push grant drawdown on the NTTM second tranche (₹27L) and the balance of the ₹32L unreceived sanctioned grants - PM, by 15-Aug-2026. FITT TTO to produce the executed IIT Delhi licence, an FTO opinion and all patent application numbers - FITT Legal/TTO, by 31-Aug-2026. Named-buyer introductions and a Sales Manager candidate pipeline - PM, by 30-Sep-2026. COGS and BOM teardown session with an external denim-costing mentor - PM, by 31-Aug-2026.\n\nMILESTONES TO CHECK NEXT MONTH: 1) Royal Karkhana ₹15L PO status. 2) Bank statement and FD schedule for Jul-2026. 3) In-house plasma line live at 4,000 m/day, evidenced by an output log. 4) BOM/COGS breakdown for May-26.\n\nFOUNDER QUOTES: 'Wool denim fabric sample development was going on and channel partners will be onboarded once we have fabric samples available' (June-26); 'MSA with Royal Karkhana in final stages' (April, May AND June-26); 'POC completed at Royal Karkhana: PO expected: Oct-2026' (April, May AND June-26); 'Leads generated: 0' (April, May AND June-26); 'Runway (months): 0' (June-26 cash flow statement). From published interview: 'Our wool denim is suitable for a wide temperature range of 3 degrees C to 33 degrees C' (The Indian Textile Journal, October 2025)."
    }
  ],
  sixMonthReviews: [
    {
      cycle: 'April 2026',
      overallPct: 76.2,
      sections: [
        {
          label: 'Team', weightPct: 20, total: 16, max: 20,
          params: [
            { label: 'Domain expertise', score: 5, max: 5, evidence: 'Prof. B.S. Butola: PhD Textile Technology IIT Delhi (2005), 35+ years academia and industry, co-inventor. Satendra Singh: M.Tech Textile Engineering IIT Delhi, 7+ years at Welspun/Vardhman/Raymond, named inventor of IndiWool. Domain match is exact - this is their own science, not a licensed-in idea. Bus-factor risk: the PhD depth sits with the part-time faculty co-founder.' },
            { label: 'Team completeness', score: 4, max: 5, evidence: "Broad bench: technology (Butola, Satendra), marketing (Dilip Singh), production (Deepak Gupta, 40 yrs), branding (Mohit Ahirwar, M.Des IIT Delhi), business advisory (Sanjeet Gulia, ex-Aditya Birla GBTL/Banswara Syntex), defence textiles (V Mathivanan ex-DRDO, Arun Prasath ex-Shiva Tex). NOT a 5 because Sales Manager, Accountant and Sourcing/Supply Chain Manager are all still 'Need to hire'." },
            { label: 'Track record', score: 4, max: 5, evidence: "Satendra Singh: IIT Delhi M.Tech thesis to commercially sold product. Dev Bhoomi ₹27L order executed; France export order executed; Ralph Lauren NDA signed 22-Jul-2025; Lakme Fashion Week x FDCI runway collection; in-house plasma machine fabricated for ₹22L. No prior exit; no prior startup." },
            { label: 'Commitment', score: 3, max: 5, evidence: 'Satendra Singh (CEO) and Dilip Singh (CMO) both full-time on payroll from Feb-2025. Prof. Butola is a serving IIT Delhi professor budgeted at 6 hours/week from Apr-2027, and one core patent is filed in IIT Delhi’s name - the classic faculty IP-conflict pattern. Re-score to 5 when the executed TTO licence is produced.' }
          ]
        },
        {
          label: 'Technology', weightPct: 20, total: 16, max: 20,
          params: [
            { label: 'Innovation level / novelty', score: 5, max: 5, evidence: "Equivalents searched: Nikke Textiles (Japan) and Tirupati (India) both produce wool denim; neither machine-washable; both approx. 250 L/kg water. Corroborated by The Woolmark Company's Wool Denim Project invitation and Bharat Innovates 2026 Top 100 selection." },
            { label: 'IP status / protectability', score: 3, max: 5, evidence: '2 patents filed, 3 more plus 1 trademark in process; 1 filed by IIT Delhi; 0 granted yet.' },
            { label: 'Technical validation / PoC', score: 5, max: 5, evidence: "Dev Bhoomi ₹27L executed; Saksham (France) ₹2L executed; Royal Enfield ₹16L and Aquarelle ₹22L in progress. Ralph Lauren and Impulse commercial approval; Pepe Jeans and Levi's Wellthread in product trials. Intertek testing budgeted ₹5.25L; reports not on file." },
            { label: 'Supply chain / import risk', score: 3, max: 5, evidence: 'Core input (fine merino wool) is effectively 100% imported; India produced 43-46 mn kg vs 92.2 mn kg imported in FY2023-24. Scored 3 rather than 1 because the plasma technology exists precisely to make coarse indigenous wool apparel-grade, though unproven at commercial scale. Manufacturing (dyeing, weaving, processing) outsourced within India; plasma machine fabricated in-house.' }
          ]
        },
        {
          label: 'Market', weightPct: 15, total: 11, max: 15,
          params: [
            { label: 'Problem severity / urgency', score: 3, max: 5, evidence: "For the current product, the pain is real but discretionary - a premium fashion and comfort problem, not a loss-of-life problem. For the future defence product it is a 5: soldiers at Siachen at up to minus 60°C in kit India imports at ₹400-800 Cr/year. Scored on what is being sold today." },
            { label: 'Competitive landscape', score: 4, max: 5, evidence: 'Two named rivals: Nikke Textiles (Japan) ₹2,500-4,350/m and Tirupati (India) ₹1,530-2,070/m; neither machine-washable; both ~250 L/kg water (Indigotex claimed 80 L/kg) at ₹600-1,850/m. Shiva Texyarn holds a ₹110 Cr MoD ECWCS contract.' },
            { label: 'Regulatory / policy tailwind', score: 4, max: 5, evidence: 'NTTM/GREAT grant ₹45L (first tranche ₹18L, Dec-2025); DPIIT SISF ₹13L; i-Start Rajasthan ₹2.4L; DRDO DIA-CoE support; Bharat Innovates 2026 Top 100. Not a 5 - no procurement mandate, no PLI or iDEX participation yet.' }
          ]
        },
        {
          label: 'Traction', weightPct: 15, total: 13, max: 15,
          params: [
            { label: 'Customer status / revenue stage', score: 3, max: 5, evidence: "Executed and paid: Dev Bhoomi ₹27L and Saksham (France) ₹2L. In progress: Royal Enfield ₹16L and Aquarelle ₹22L. Q1 FY2026-27 revenue ₹5,75,652, all in May, nil April and June. No ARR - per-order fabric supply model. None of this counted as verified revenue: no bank statement, invoice or GST return produced." },
            { label: 'Awards / grants / recognition', score: 5, max: 5, evidence: "Six funding awards totalling ₹90.4L sanctioned. Recognition: Startup Mahakumbh 2025 winner; Startup MahaRathi Challenge; ReNew ACE Awards 2026 2nd Runner-Up; Bharat Innovates 2026 Top 100 with global showcase in Nice, France; Woolmark Wool Denim Project invitation; Lakme Fashion Week x FDCI showcase; Indian Textile Journal feature; Union Textiles Minister recognition. Strongest line in the file - unambiguously a 5." },
            { label: 'Co-investment / external interest', score: 5, max: 5, evidence: 'Round 1 closed (FITT+SIDBI, ₹1 Cr, Jan-26); Round 2 in signing (₹3.83 Cr).' }
          ]
        },
        {
          label: 'Business model', weightPct: 10, total: 11, max: 20,
          params: [
            { label: 'Revenue model', score: 3, max: 5, evidence: 'Primary stream: IndiWool Denim, ₹600-1,850/metre, ₹29L executed/in-progress orders. Secondary streams budgeted: plasma job-work ₹80/m from Oct-2026, ECOTEX wool fabrics Q4 FY2026-27, YodhaShield garments FY2027-28.' },
            { label: 'Gross margin potential', score: 3, max: 5, evidence: 'Plan: 38% IndiWool, 45% ECOTEX, 65-75% plasma job-work, 60-70% YodhaShield, 45% blended FY2026-27. Actual May-26: ₹5,75,652 revenue less ₹5,45,600 COGS = 5.2%.' },
            { label: 'Scalability of model', score: 3, max: 5, evidence: 'Dyeing, weaving and processing outsourced; raw material bought on credit. Moderated plan requires ₹2.64 Cr working capital FY2026-27, ₹6.97 Cr FY2027-28, ₹8 Cr capex for 25,000 m/day in-house dyeing plus plasma.' },
            { label: 'Capital efficiency / breakeven', score: 2, max: 5, evidence: "Reserves moved from -₹9.80L (30-Apr-26) to -₹42.47L (30-Jun-26). Cash fell from ₹80.78L to ₹62,936 in one quarter. Plan claims EBITDA-positive at ₹0.14 Cr on ₹6.24 Cr FY2026-27 revenue; Q1 delivered ₹5.76L, under 1% of the full-year target with a quarter gone. Funding required (₹4.13 Cr) is nearly 3x the stated ask (₹1.5 Cr)." }
          ]
        },
        {
          label: 'Impact', weightPct: 10, total: 12, max: 15,
          params: [
            { label: 'National / strategic importance', score: 4, max: 5, evidence: "Defence import substitution: India imports ECWCS/mountaineering kit at ~₹400-800 Cr/year; YodhaShield targets this, funded by NTTM (₹45L) with DRDO support. Indigenous wool: India's world third-largest sheep population produces only 43-46 mn kg vs 92.2 mn kg imported. Scored 4 - both remain intent; YodhaShield launches Q3 FY2027-28." },
            { label: 'SDG / ESG alignment', score: 5, max: 5, evidence: 'ECOTEX PLASMA claimed savings vs conventional Superwash: 100% water (170 L/kg to 0), 85% energy, 88% emissions, 100% chemicals, 100% wastewater (founder-supplied). Fabric blends wool with cotton, lyocell, hemp.' },
            { label: 'Employment / ecosystem impact', score: 3, max: 5, evidence: 'Fund plan runs to roughly 13-14 positions through Dec-2027, including an MT programme taking 2 trainees from MLV Textile & Engineering College, Bhilwara.' }
          ]
        },
        {
          label: 'Fundability', weightPct: 10, total: 10, max: 15,
          params: [
            { label: 'Fundability assessment', score: 4, max: 5, evidence: 'Lead confirmed (IAN, SEBI Cat-I AIF) but priced below Round-1 - a down round.' },
            { label: 'Exit pathway visibility', score: 3, max: 5, evidence: '5-yr exit period; buyback @ higher of FMV or 3x subscription (SSHA Cl.13).' },
            { label: 'Moat durability', score: 3, max: 5, evidence: 'IP assignment was a Round-1 Condition Precedent; INDIWOOL DENIM device mark application in process.' }
          ]
        }
      ],
      supporting: [
        { label: 'Unit economics', score: 6, max: 20, evidence: 'CAC/LTV Efficiency 1/5 (CAC not tracked; 0 leads Apr-Jun). Customer Retention/NRR 1/5 (no retention data; no repeat order). Pricing Power 2/5 (priced below both rivals; May-26 gross margin 5.2% shows pricing does not cover cost). Contribution Margin 2/5 (₹30,052 contribution on ₹5,75,652 revenue in May-26).' },
        { label: 'Financial health', score: 9, max: 20, evidence: 'Revenue Traction Stage 2/5 (₹5,75,652 for all of Q1, nil April and June). Runway Health 3/5 (~₹60-65L liquid incl. FDs vs ₹13.78L/mo burn, ~4-5mo; round in signing). Financial Controls & MIS 2/5 (MIS vs certified accounts disagree by ₹36.5L assets, unreconciled). Gross Margin 2/5 (certified-accounts margin 18.5% vs MIS margin 5.2%, unreconciled).' },
        { label: 'Valuation', score: 10, max: 15, evidence: 'Valuation Methodology 4/5 (IBBI RV, FCFE/DCF, Ke=28.30% CAPM; single-method, no market cross-check). Comparable Transactions 2/5 (no deal comps; beta-only comps). Use of Funds Clarity 4/5 (detailed line-item budget; not tied to measurable milestones, total doesn’t reconcile to the ₹1.5 Cr ask).' }
      ],
      porter: [
        { label: 'New entrants', score: 3, max: 10, evidence: "Capital Capex Hurdle 2/5 (own plasma machine fabricated for ₹22L; full-scale replication ~₹8 Cr capex). Regulatory Entry Barrier 1/5 (no licensing regime gating fabric manufacture/sale in India)." },
        { label: 'Supplier power', score: 7, max: 10, evidence: 'Input Source Concentration 4/5 (merino wool is auction-traded with many trading houses; origin concentrated in Australia/NZ). Tech Dependency Risk 3/5 (does not depend on any foreign licensor).' },
        { label: 'Buyer power', score: 3, max: 10, evidence: "Customer Switching Cost 2/5 (fabric is a switchable input). Revenue Concentration Risk 1/5 (Dev Bhoomi ~93% of executed order value; no repeat order)." },
        { label: 'Substitutes', score: 6, max: 10, evidence: 'Substitute Performance Gap 3/5 (fleece-lined denim, thermal layering, conventional Superwash deliver 50-70% of value at lower cost). IP Moat Depth 3/5 (two patent filings, none granted, one held by IIT Delhi).' },
        { label: 'Rivalry', score: 7, max: 10, evidence: 'Rival Density Index 3/5 (SSHA Schedule XII names exactly 2 competitors). Differentiation Clarity 4/5 (water-use claim inconsistent: 80 L/kg deck vs 150 L/kg signed SSHA Sch. XII).' }
      ],
      marketSizing: {
        tamCr: 12000,
        samCr: 1800,
        somCr: 70,
        cagrPct: 5,
        note: "TAM: India denim fabric market ~₹10,800 Cr plus ₹400-800 Cr ECWCS procurement plus wool/wool-blend suiting via ECOTEX. SAM: ~10% premium/sustainable slice of denim plus ~15% premium machine-washable slice of wool exports plus ₹500 Cr addressable ECWCS. SOM: 3-year capture to FY2028-29. CAGR 5.04% (IMARC), growing market."
      }
    }
  ],
  swot: {
    strengths: ['Novel patented science', 'Deep, domain-matched team', 'Commercially validated product', '₹90.4 L in awards and grants', 'Quantified sustainability edge'],
    weaknesses: ['Runway effectively zero', 'Gross margin below plan', 'Sales engine not running', 'No unit economics', 'Fundraise materials incomplete'],
    opportunities: ['Two POs at the gate', 'Woolmark Wool Denim Project', '₹32 L undrawn grants', 'Named global accounts at trials', 'ECWCS import substitution'],
    threats: ['Defence ECWCS window closing', '93% revenue concentration', 'Merino import exposure', 'Zero switching cost for buyers', 'Core patent with IIT Delhi']
  },
  valueChain: [
    { stage: 'Raw material', score: 3, max: 5, bottleneck: false },
    { stage: 'IP / tech transfer', score: 2, max: 5, bottleneck: true },
    { stage: 'Core R&D', score: 4, max: 5, bottleneck: false },
    { stage: 'Manufacturing', score: 2, max: 5, bottleneck: true },
    { stage: 'Certification', score: 3, max: 5, bottleneck: false },
    { stage: 'Sales and distribution', score: 1, max: 5, bottleneck: true },
    { stage: 'Deployment', score: 3, max: 5, bottleneck: false },
    { stage: 'After-sales', score: 2, max: 5, bottleneck: false }
  ],
  dueDiligence: [
    {
      label: 'LDD 1 · Corporate',
      items: [
        { item: 'Company incorporated as Pvt Ltd / LLP?', status: 'COMPLIANT', reference: 'MCA master data', notes: 'Indigotex Private Limited, CIN U14101RJ2024PTC092556, ROC Jaipur, incorporated 08-Feb-2024, status Active. Directors: Satendra Singh and Bhupendra Singh Butola (Apurva Raj Singh resigned).' },
        { item: 'Registered address matches operations?', status: 'ISSUE', reference: 'MCA master data vs pitch deck / MIS', notes: 'MCA registered office: 47, Hajipur, Saipau, Dholpur, Rajasthan. Operations: R&I Park, IIT Delhi; Bhilwara warehouse. MCA industrial classification U14101 (mining of sand and clay).' },
        { item: 'DPIIT recognition obtained?', status: 'COMPLIANT', reference: 'Startup India portal', notes: 'DPIIT recognized. SISF grant of ₹13L received Sept-2024.' },
        { item: 'All founders are Indian residents?', status: 'COMPLIANT', reference: 'PAN / Aadhaar', notes: 'All three founders are Indian residents; both MCA-listed directors hold Indian addresses.' },
        { item: 'No pending MCA compliance filings?', status: 'ISSUE', reference: 'MCA filing history', notes: 'Last AGM held 30-Sep-2025; balance sheet filed for year ended 31-Mar-2025. FY2025-26 audited accounts not on file.' },
        { item: 'Regulatory licenses / sector permits obtained?', status: 'COMPLIANT', reference: 'GST portal', notes: 'No sector licence or permit is required to manufacture and sell fabric in India.' },
        { item: 'FDI compliance (if foreign investment)?', status: 'WAIVED', reference: '-', notes: 'No foreign investment. Cap table comprises founder capital plus the FITT-SIDBI ₹1 Cr and domestic grants.' }
      ]
    },
    {
      label: 'LDD 2 · IP and tech',
      items: [
        { item: "IP ownership clearly with startup (not with founders personally or IIT)?", status: 'ISSUE', reference: 'Pitch deck IP slide; fund utilization plan', notes: "Of two patents filed, one has IIT Delhi as applicant. No executed licence agreement on file." },
        { item: "All patents / trademarks in startup's name?", status: 'ISSUE', reference: 'IP India portal - unable to search', notes: '2 patents filed, 3 patents plus 1 trademark in process, none granted yet. Trademarks: INDIWOOL DENIM, ECOTEX PLASMA.' },
        { item: 'Tech transfer agreement executed with IIT?', status: 'ISSUE', reference: 'IIT Delhi TTO', notes: 'Tech transfer/licence agreement between Indigotex and IIT Delhi not yet produced to FITT.' },
        { item: 'No open-source licence violations?', status: 'WAIVED', reference: '-', notes: 'No software product and no open-source components. Physical materials and process business.' },
        { item: 'Employee / contractor IP assignment agreements signed?', status: 'ISSUE', reference: '-', notes: 'Process executed via third-party dye houses and weavers in the Bhilwara cluster; no confidentiality controls evidenced.' },
        { item: 'No ongoing IP litigation or disputes?', status: 'COMPLIANT', reference: '-', notes: 'No litigation or infringement claim disclosed.' }
      ]
    },
    {
      label: 'LDD 3 · Employment',
      items: [
        { item: 'All founders have employment agreements with startup?', status: 'COMPLIANT', reference: '-', notes: 'Founders on payroll from Feb-2025. No employment agreements, vesting schedules or non-compete terms produced.' },
        { item: 'All key employees on formal payroll?', status: 'ISSUE', reference: 'Fund utilization plan, Staff-Salaries sheet', notes: 'Headcount under 10; ESIC/PF registration not yet triggered. Sales Manager, Accountant and Sourcing Manager roles budgeted, hiring in progress.' },
        { item: 'ESOPs granted under a board-approved ESOP policy?', status: 'ISSUE', reference: 'Fund utilization plan, Legal Compliance line', notes: 'No ESOP policy document exists yet; drafting budgeted for FY2026-27.' },
        { item: 'No pending employment disputes / terminations?', status: 'COMPLIANT', reference: '-', notes: 'Apurva Raj Singh is listed as a past director in MCA records.' },
        { item: 'Founder equity reflected in SHA / SHA in place?', status: 'COMPLIANT', reference: 'FITT-SIDBI Investment Agreement', notes: 'Founder equity reflected in the executed SSHA Schedule III.' }
      ]
    },
    {
      label: 'LDD 4 · Contracts',
      items: [
        { item: 'All customer contracts signed (not just LOIs)?', status: 'ISSUE', reference: 'Pitch deck traction slide; Apr/May/Jun-26 MIS', notes: "Executed and paid: Dev Bhoomi ₹27L, Saksham ₹2L. NOT signed: Royal Karkhana MSA 'in final stages' three months running. No signed contract, PO or invoice copy provided to FITT." },
        { item: 'No significant undisclosed liabilities?', status: 'COMPLIANT', reference: 'Jun-26 balance sheet', notes: 'Current liabilities of ₹23,77,900.87 at 30-Jun-2026 are disclosed and reconcile to the MIS balance sheet.' },
        { item: 'Vendor / supplier contracts reviewed for exclusivity or lock-in?', status: 'COMPLIANT', reference: '-', notes: 'Dyeing, weaving and processing are outsourced job-work; no exclusivity or minimum-purchase lock-in identified.' },
        { item: 'Lease agreements reviewed (if office / lab space)?', status: 'COMPLIANT', reference: '-', notes: 'Three premises identified: IIT Delhi R&I Park, Bhilwara warehouse, Bhilwara accommodation.' }
      ]
    },
    {
      label: 'FDD 1 · Financial records',
      items: [
        { item: 'Audited financial statements available (if > 1 year old)?', status: 'ISSUE', reference: 'MCA filing history', notes: 'FY2025-26 audited financial statements are due and have NOT been produced to FITT.' },
        { item: 'MIS / management accounts reviewed for last 6 months?', status: 'ISSUE', reference: 'MIS_Indigotex Apr-26, May-26, Jun-26', notes: "Only three months provided, not six. Quality defects: all three decks labelled 'Reporting Period: April-2026'; revenue booked to a 'SaaS Revenue' line in a fabric business." },
        { item: 'Bank statements verified for last 6 months?', status: 'COMPLIANT', reference: '-', notes: 'Bank position reconciles with MIS cash-flow statements for the review period.' },
        { item: 'Revenue is recognised correctly (not just invoiced)?', status: 'ISSUE', reference: 'May-26 MIS P&L and sales-order slide', notes: "May-26 revenue of ₹5,75,652 booked under a 'SaaS Revenue' line item. Receivables of ₹1.25L at both 31-May and 30-Jun." },
        { item: 'GST filings up to date?', status: 'COMPLIANT', reference: 'GST portal', notes: 'CA compliance budgeted at ₹10,000-15,000/month.' }
      ]
    },
    {
      label: 'FDD 2 · Unit economics',
      items: [
        { item: 'COGS breakdown verified (not just stated)?', status: 'ISSUE', reference: 'May-26 MIS P&L', notes: 'No BOM or cost breakdown provided. Single consolidated line: COGS ₹5,45,600 against revenue ₹5,75,652 in May-26.' },
        { item: 'Gross margin calculation verified independently?', status: 'ISSUE', reference: 'Independent calculation', notes: '(₹5,75,652 - ₹5,45,600) / ₹5,75,652 = 5.2% (May-2026).' },
        { item: 'CAC tracked and verified?', status: 'ISSUE', reference: 'Apr/May/Jun-26 MIS, Deal Conversion Funnel', notes: 'Leads generated were 0 in each of April, May and June 2026; CAC tracking not yet in place.' },
        { item: 'LTV calculated correctly?', status: 'ISSUE', reference: '-', notes: 'No repeat-order history yet from either paying customer; LTV tracking to be established.' },
        { item: 'Burn rate verified against bank statements?', status: 'COMPLIANT', reference: 'Jun-26 MIS cash flow statement', notes: 'June cash outflow of ₹16,06,586.90 reconciles with the MIS cash-flow statement.' }
      ]
    },
    {
      label: 'FDD 3 · Cap table',
      items: [
        { item: 'Cap table up to date and provided?', status: 'COMPLIANT', reference: '-', notes: 'Cap table is up to date, per the executed SSHA Schedule III.' },
        { item: 'All previous investment agreements / SHAs available?', status: 'COMPLIANT', reference: 'FITT-SIDBI Investment Agreement', notes: 'Executed FITT-SIDBI SSHA (03-Jan-2026) on file; draft IAN SSSHA (20-Jul-2026) in signing.' },
        { item: 'Liquidation preference and anti-dilution terms reviewed?', status: 'COMPLIANT', reference: '-', notes: '1x non-participating liquidation preference; broad-based weighted-average anti-dilution.' },
        { item: 'ESOP pool size and grants disclosed?', status: 'ISSUE', reference: 'Fund utilization plan, Legal Compliance line', notes: 'There is no ESOP pool and no options have been granted.' },
        { item: 'No debt outstanding that ranks senior to equity?', status: 'COMPLIANT', reference: 'Jun-26 balance sheet', notes: 'No borrowings on the 30-Jun-2026 balance sheet.' },
        { item: 'Prior valuation and dilution history verified?', status: 'COMPLIANT', reference: '-', notes: 'Round 1: ₹22 Cr pre-money (Jan-2026). Current round: ₹20 Cr per the IBBI registered valuer (31-May-2026).' }
      ]
    }
  ],
  supportLog: [
    { n: 1, date: '12-Jul-2026', type: 'Market Linkage', title: 'Market linkage', action: "Broker named-buyer introductions using the FITT network and advisor Sanjeet Gulia's Aditya Birla (GBTL) and Banswara Syntex relationships. Precondition agreed with founder: complete the IndiWool fabric sample range (10-100% wool variants) first so channel partners have something to sell. Target 6 warm buyer conversations by 30-Sep-2026.", outcome: 'Opened 12-Jul-2026; sequencing agreed with founder on fabric sample range. Updated 28-Jul-2026: no introductions made yet.', status: 'In Progress', owner: 'FITT PM (Investment)', source: 'WEAKNESS 3 - sales engine not running; leads generated = 0 in each of Apr, May and Jun-26. Value Chain stage 6 scored 1/5 and named primary bottleneck.' },
    { n: 2, date: '10-Jan-2026', type: 'Legal / IP Advisory', title: 'Legal / IP advisory', action: 'FITT Legal and the IIT Delhi TTO to produce: (1) the executed licence agreement for the IIT Delhi-held indigo-on-wool dyeing patent, with fee schedule, exclusivity scope, territory, field of use and term; (2) a freedom-to-operate opinion; (3) the full schedule of patent application numbers including confirmation of whether the May-2026 international filing was made.', outcome: 'Opened 10-Jan-2026 alongside Round-1 closing. Updated 28-Jul-2026: request routed to FITT Legal and TTO.', status: 'Pending', owner: 'FITT Legal / TTO', source: "THREAT 5 - core patent held by IIT Delhi, ungranted, no executed licence produced. Also Red Flag 'critical tech licensed from institution, not transferred' = Yes. Value Chain stage 2 scored 2/5, bottleneck #2." },
    { n: 3, date: '15-Dec-2025', type: 'Grant Application Support', title: 'Grant drawdown support', action: 'Accelerate drawdown of the INR 27L second tranche of the NTTM / GREAT grant from the Ministry of Textiles, and of the balance of the INR 32L of sanctioned-but-unreceived grant money across Kotak BizLabs and NTTM. Prepare the utilisation certificate and milestone evidence pack required for the NTTM tranche release.', outcome: 'Opened 15-Dec-2025 on receipt of the NTTM first tranche. Updated 28-Jul-2026: second-tranche drawdown in progress.', status: 'In Progress', owner: 'FITT PM (Investment)', source: 'WEAKNESS 1 - runway effectively zero (INR 62,936 cash at 30-Jun-26 against INR 13.78L monthly operating outflow). Directly exploits OPPORTUNITY 3. 6MR I3 Runway Health scored 1/5.' },
    { n: 4, date: '29-May-2026', type: 'Valuation Advisory', title: 'Valuation advisory', action: 'Build a defensible pre-money valuation using the SOP triangulation method: stage benchmark, revenue multiple and comparable transactions. Establish and document the FITT-SIDBI round’s pre/post-money and resulting cap table as the anchor point. Openly disclose the absence of Indian wool-denim transaction comparables rather than papering over it.', outcome: 'Opened 29-May-2026, engagement letter date for the IBBI registered valuer. Updated 28-Jul-2026.', status: 'Pending', owner: 'FITT PM (Investment)', source: 'WEAKNESS 5 - fundraise materials in development; 6MR I4 Valuation Methodology and Comparable Transactions both scored low.' },
    { n: 5, date: '18-Jun-2026', type: 'Pitch Prep / Deck Review', title: 'Pitch prep / deck review', action: "Rework the pitch deck: reconcile the INR 1.5 Cr ask with the business plan's INR 4.13 Cr 24-month requirement; replace the top-down USD 345B winterwear TAM with a bottom-up India build; add a unit-economics slide; add a cap table and valuation slide; correct the 'Growing Traction' slide, whose line items sum to INR 67L against a stated total of INR 29L.", outcome: 'Opened 18-Jun-2026 ahead of the Bharat Innovates global showcase. Updated 28-Jul-2026: deck reviewed, findings issued.', status: 'Pending', owner: 'FITT PM (Investment)', source: "WEAKNESS 5 - deck ask under review against the company's own funding requirement." },
    { n: 6, date: '28-Jul-2026', type: 'Mentorship Session', title: 'COGS and BOM teardown', action: 'Arrange a COGS and BOM teardown with an external denim-costing specialist to diagnose the gap between the 38% planned gross margin and the 5.2% realised in May-26. Decompose cost into wool, blending fibre, spinning, dyeing job-work, weaving job-work, finishing, inspection, packing and freight, and rebuild the price list by customer segment on the result.', outcome: 'Opened 28-Jul-2026. Mentor to be identified from the FITT textile network.', status: 'Pending', owner: 'FITT PM (Investment)', source: 'WEAKNESS 2 - gross margin collapse against plan. 6MR I3 Gross Margin 1/5, I2 Contribution Margin 2/5 and Pricing Power 2/5. FDD 2 items on COGS and gross margin both flagged ‘issue found’.' },
    { n: 7, date: '15-Apr-2026', type: 'Technology Validation', title: 'Technology validation', action: 'Commission independent third-party verification (Intertek, already budgeted at INR 5.25L in the fund plan) of the headline technical claims currently used in investor and buyer material: 80 L/kg water consumption versus 250 L/kg for named competitors, plasma processing cost of INR 5.5/kg versus INR 150/kg for Superwash, and the 3 to 33 degrees C comfort range. Also obtain test reports for each fabric variant in the range.', outcome: 'Opened 15-Apr-2026, aligned to the Intertek testing budget line. Updated 28-Jul-2026: commissioning not yet started.', status: 'Pending', owner: 'FITT PM (Investment)', source: '6MR L5 Differentiation Clarity held at 4/5 solely because every quantified claim is founder-supplied with no third-party report behind it. Also required for the Woolmark and RWS certifications and for premium brand accounts.' },
    { n: 8, date: '20-Mar-2026', type: 'Government Interface', title: 'Government interface', action: 'Brief the founder on the realistic ECWCS procurement pathway and assess iDEX problem-statement fit for YodhaShield, given that Shiva Texyarn holds a INR 110 Cr MoD order for 75,000 sets over five years and Aroo, Arnaf Industries, Aeronav and Arrow Garments signed DRDO limited-series-production MoAs in Dec-2024. Leverage the existing DRDO relationship through the DIA-CoE at IIT Delhi.', outcome: 'Opened 20-Mar-2026 following the NTTM sanction. Updated 28-Jul-2026.', status: 'Pending', owner: 'FITT PM (Investment)', source: "THREAT 1 - defence ECWCS competitive window ahead of YodhaShield's Q3 FY2027-28 launch. Also OPPORTUNITY 5 - iDEX route, given existing DRDO support and MoT NTTM funding." },
    { n: 9, date: '12-Feb-2026', type: 'Network Introduction', title: 'Sales Manager hiring', action: 'Source Sales Manager candidates through the IIT Delhi and MLV Textile & Engineering College (Bhilwara) alumni networks. The role has been budgeted at INR 1.35L-1.50L per month since Mar-2025 and is the largest single salary line in the plan, yet remains unfilled 16 months later while zero leads are being generated.', outcome: 'Opened 12-Feb-2026 against the budgeted Sales Manager role. Updated 28-Jul-2026: hire pending cash position.', status: 'In Progress', owner: 'FITT PM (Investment)', source: 'WEAKNESS 3 - sales engine not running. Value Chain stage 6 primary bottleneck. Also 6MR E Team Completeness held at 4/5 because revenue-generating seats are empty.' },
    { n: 10, date: '20-Jul-2026', type: 'Investor Connect', title: 'Investor connect', action: "HELD DELIBERATELY. No investor introductions to be made until Support Log items #5 (IIT Delhi licence and patent numbers), #7 (valuation basis and cap table), #8 (deck rework) and #9 (COGS/BOM) are closed. An introduction made in the current state - zero cash, 5.2% realised margin, unverifiable IP, no cap table - would burn both the relationship and the FITT referral.", outcome: 'Opened 20-Jul-2026, aligned to the draft IAN SSSHA date. Held deliberately pending Legal review.', status: 'Pending', owner: 'FITT PM (Investment)', source: "WEAKNESS 5 - fundraise not investor-ready. 6MR K Fundability scored 3/5: 'near-fundable, 3-6 months to VC-ready with FITT support'.", heldReason: 'This action is held deliberately until the licence, valuation, deck and COGS items close. Connecting an investor-mentor now is allowed, but check with the PM first.' },
    { n: 11, date: '15-Jul-2026', type: 'Other', title: 'Governance and reporting clean-up', action: "Governance and reporting clean-up. (a) Rectify the MCA position: NIC code U14101 (mining of sand and clay) does not describe a textile business, and the registered office sits at the founder's home village rather than the operating premises. (b) Collect the outstanding document set - cap table, SHA, Investment Agreement, audited FY2025-26 accounts, bank statements, GST returns, DPIIT certificate, incubation agreement. (c) Issue a corrected MIS template that fixes the 'SaaS Revenue' line, removes the unused placeholders, and adds repeat-order and lead-funnel tracking.", outcome: 'Opened 15-Jul-2026 when reporting compliance was chased under the Investment Agreement. Updated 28-Jul-2026: document request issued, 15-Aug-2026 deadline.', status: 'In Progress', owner: 'FITT PM (Investment)', source: 'LDD 1 (registered address, MCA filings), FDD 1 (audited accounts, MIS quality, bank statements) and FDD 3 (cap table, SHA, dilution history).' }
  ],
  mentorSuggestions: {
    1: [{ mentorId: 'm11', fit: 'h', why: 'B2B Sales and Product Strategy; Delhi NCR, high availability' }, { mentorId: 'm9', fit: 'm', why: 'Strategic Partnerships in deeptech hardware; can open supplier-side buyer doors' }, { mentorId: 'm5', fit: 'm', why: 'Go-to-Market and B2B Sales, but at full capacity (3 of 3)' }],
    2: [{ mentorId: 'm4', fit: 'h', why: 'IP & Patents and Legal; licence terms, FTO opinion, patent schedule' }],
    3: [{ mentorId: 'm13', fit: 'h', why: 'Fundraising plus ESG & Impact; fits the sustainability grant story' }, { mentorId: 'm10', fit: 'm', why: 'Early-stage fundraising, high availability' }, { mentorId: 'm2', fit: 'm', why: 'Deeptech fundraising and financial modelling; low availability' }],
    4: [{ mentorId: 'm2', fit: 'h', why: 'Financial Modelling and deeptech fundraising; Delhi NCR' }, { mentorId: 'm10', fit: 'l', why: 'Fundraising only, no valuation depth' }],
    5: [{ mentorId: 'm2', fit: 'h', why: 'Investor lens on the ask, TAM and unit-economics slides' }, { mentorId: 'm10', fit: 'm', why: 'Early-stage pitch coaching' }, { mentorId: 'm14', fit: 'm', why: 'Marketing; brand and narrative on the traction slide' }],
    6: [{ mentorId: 'm9', fit: 'm', why: 'Supply Chain; can break down job-work and freight costs' }, { mentorId: 'm2', fit: 'm', why: 'Financial Modelling for the price list rebuild' }],
    7: [{ mentorId: 'm9', fit: 'l', why: 'Hardware supply chains; closest fit for third-party testing' }],
    8: [{ mentorId: 'm3', fit: 'h', why: 'Government Contracts and MoD procurement; Defence sector' }, { mentorId: 'm9', fit: 'l', why: 'Supply Chain for defence-grade sourcing' }],
    9: [{ mentorId: 'm7', fit: 'm', why: 'HR & Talent, but AI/ML focus and low availability' }, { mentorId: 'm11', fit: 'm', why: 'Has built a B2B sales team; Delhi NCR' }],
    10: [{ mentorId: 'm2', fit: 'h', why: 'Active deeptech investor; Seed and Series A' }, { mentorId: 'm13', fit: 'h', why: 'Climate / sustainability angel investor' }],
    11: [{ mentorId: 'm4', fit: 'h', why: 'Legal; MCA rectification and document set' }, { mentorId: 'm2', fit: 'm', why: 'Financial Modelling; MIS template and reporting' }]
  },
  mentorGaps: {
    6: 'No denim-costing specialist in the mentor pool. The sheet asks for one from the FITT textile network, so add one to the pool first.',
    7: 'No textile testing or certification mentor in the pool. Intertek testing is the main route; a mentor is optional here.',
    9: 'No dedicated talent or recruiting mentor with textile reach.'
  },
  redFlags: [
    { text: 'Founder part-time / active IP conflict', value: true, evidence: "Prof. B.S. Butola is a serving professor in IIT Delhi's Dept of Textile & Fibre Engineering, budgeted 6 hrs/week from Apr-2027. One core patent is filed in IIT Delhi's name. Exclusive licence and FTO claimed by the founder; no executed agreement on file." },
    { text: 'Revenue claimed, no bank / GST evidence', value: true, evidence: 'May-26 revenue of ₹5,75,652 is from the MIS. No bank statement, invoice, or GST return on file.' },
    { text: 'Single customer over 80% of revenue', value: true, evidence: 'Dev Bhoomi accounts for ₹27L of ₹29L executed order value (~93%), per the pitch deck traction slide.' },
    { text: 'Critical tech licensed from IIT, not transferred', value: true, evidence: 'Indigo-on-wool dyeing patent is filed by IIT Delhi; licensing fee payments budgeted FY2026-27 and FY2027-28.' },
    { text: 'Team split or co-founder dispute', value: false, evidence: 'No indication of any dispute. Noted for the record: co-founder & CMO Dilip Singh is not listed as a director on MCA.' },
    { text: 'Cash runway under 3 months (PM view)', value: false, evidence: 'Liquid position ~₹60-65L incl. FDs, not ₹0.63L bank-only; ~4-5mo runway.' },
    { text: 'Regulatory non-compliance', value: false, evidence: 'No sector regulator applies to fabric manufacture/sale in India. MCA NIC code is U14101 (mining of sand and clay).' },
    { text: 'Import dependency over 80%, single source', value: true, evidence: 'Fine merino wool is the core input and is effectively 100% imported. India produced 43-46 million kg of raw wool against 92.2 million kg imported in FY2023-24.' }
  ],
  needsAttention: [
    { key: 'runway', issue: 'Runway 0.04 months', critical: true, tag: 'Bank cash only', cause: '₹0.63 L in bank against ₹16.07 L cash outflow in June 2026.', effect: "Payroll and vendor dues can't be met without breaking FDs or bringing in new money.", fix: 'Confirm the FD balance, draw the ₹27 L NTTM second tranche, and close the ₹3.83 Cr round.' },
    { key: 'milestones', issue: '2 milestones overdue', critical: false, tag: 'Jul and Aug 2026', cause: 'In-house plasma line (4,000 m/day) and YodhaShield manikin / field trials not evidenced.', effect: "Machine-washability stays unproven; the Royal Karkhana ₹15 L PO can't be taken at volume.", fix: 'Share the plasma output log and set revised dates with delay reasons.' },
    { key: 'founder_update', issue: 'No founder update for >35 days', critical: false, tag: 'Last MIS: June 2026', cause: 'July, August and September MIS packs not received.', effect: 'Cash, revenue and runway figures are three months stale; reporting under the investment agreement is late.', fix: 'Send July to September MIS with bank statements and the FD schedule.' },
    { key: 'concentration', issue: 'One customer is 93% of revenue', critical: false, tag: 'FITT red flag', cause: 'Dev Bhoomi is ₹27 L of ₹29 L executed orders; zero new leads for three months.', effect: 'Losing one buyer wipes out revenue and weakens the fundraise.', fix: 'Convert the Royal Karkhana and Aquarelle pipeline and hire the Sales Manager.' }
  ]
};

export const indigotexStartup: Startup = {
  id: 's31',
  name: 'Indigotex Private Limited',
  oneLiner: 'Indigo-dyed wool denim (IndiWool) and waterless atmospheric-plasma wool finishing (ECOTEX PLASMA)',
  sector: 'ADVANCED_MATERIALS',
  stage: 'LATE_INCUBATION',
  cohort: 'FITT-SIDBI 2026',
  foundedOn: '2024-02-08',
  website: 'https://indigotex.co.in',
  city: 'New Delhi',
  managerId: 'im1',
  associateId: null,
  trl: 8,
  trlUpdatedOn: '2026-06-30',
  ipStatus: 'FILED',
  ipOwnershipClear: false,
  commercialSignal: 'PAYING',
  grantSanctioned: 9040000,
  grantDisbursed: 6340000,
  founderToken: 's31-token-indigotex',
  archived: false,
  regTags: [],
  fittTracker
};

export const indigotexTeam: TeamMember[] = [
  { id: 't-s31-1', startupId: 's31', name: 'Satendra Singh', role: 'Co-founder and CEO', isFounder: true, fullTime: true, equityPct: 65.43, email: 'satendra.singh@indigotex.demo' },
  { id: 't-s31-2', startupId: 's31', name: 'Prof. B.S. Butola', role: 'R&D head and Technical Director', isFounder: true, fullTime: false, equityPct: 10.35, email: 'b.s.butola@indigotex.demo' },
  { id: 't-s31-3', startupId: 's31', name: 'Dilip Singh', role: 'Co-founder and CMO', isFounder: true, fullTime: true, equityPct: 6.73, email: 'dilip.singh@indigotex.demo' }
];

export const indigotexMetrics: MonthlyMetrics[] = [
  {
    id: 's31-m-2026-05',
    startupId: 's31',
    month: '2026-05',
    cashBalance: 3000000,
    monthlyBurn: 1378000,
    monthlyRevenue: 575652,
    customerConversations: 0,
    pilots: 0,
    lois: 2,
    payingCustomers: 1,
    teamFullTime: 2,
    teamPartTime: 1,
    source: 'SEED',
    recordedOn: '2026-05-31T10:00:00Z'
  },
  {
    id: 's31-m-2026-06',
    startupId: 's31',
    month: '2026-06',
    cashBalance: 62936,
    monthlyBurn: 1606587,
    monthlyRevenue: 0,
    customerConversations: 0,
    pilots: 0,
    lois: 2,
    payingCustomers: 1,
    teamFullTime: 2,
    teamPartTime: 1,
    source: 'SEED',
    recordedOn: '2026-06-30T10:00:00Z'
  }
];

export const indigotexAssessment: HealthAssessment = {
  id: 's31-a-2026-06',
  startupId: 's31',
  month: '2026-06',
  profile: 'ACCELERATION',
  dimensions: {
    TECH: { autoScore: 76, finalScore: 76, autoReason: 'FITT 6-month review, April 2026 cycle' },
    TEAM: { autoScore: 76, finalScore: 76, autoReason: 'FITT 6-month review, April 2026 cycle' },
    DISCOVERY: { autoScore: 76, finalScore: 76, autoReason: 'FITT 6-month review, April 2026 cycle' },
    CASH: { autoScore: 76, finalScore: 76, autoReason: 'FITT 6-month review, April 2026 cycle' },
    EXECUTION: { autoScore: 76, finalScore: 76, autoReason: 'FITT 6-month review, April 2026 cycle' },
    IP: { autoScore: 76, finalScore: 76, autoReason: 'FITT 6-month review, April 2026 cycle' },
    ENGAGEMENT: { autoScore: 76, finalScore: 76, autoReason: 'FITT 6-month review, April 2026 cycle' },
    REVENUE: { autoScore: 76, finalScore: 76, autoReason: 'FITT 6-month review, April 2026 cycle' }
  },
  total: 76,
  band: 'HEALTHY',
  delta3m: null,
  strengths: 'Novel patented science, deep domain-matched team, commercially validated product, ₹90.4 L in awards and grants.',
  concerns: 'Runway effectively zero, gross margin below plan, sales engine not running, revenue concentrated in one customer.',
  actions: [],
  status: 'APPROVED',
  preparedBy: 'im1',
  submittedOn: '2026-07-28',
  approvedBy: 'im1',
  approvedOn: '2026-07-28'
};
