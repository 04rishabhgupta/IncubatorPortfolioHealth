import styles from './fitt.module.css';

export function band(v: number, max: number): string {
  const p = max > 0 ? v / max : 0;
  if (p >= 0.75) return styles.bS;
  if (p >= 0.6) return styles.bM;
  if (p >= 0.45) return styles.bW;
  return styles.bK;
}

export function initials(name: string): string {
  const stripped = name.replace(/^(Dr\.|Col\.)\s*/, '');
  return stripped.split(/\s+/).map(w => w[0]).slice(0, 2).join('');
}

export function statusDotClass(status: string): string {
  if (status === 'In Progress') return styles.stIn;
  if (status === 'Done') return styles.stDone;
  return styles.stPending;
}

export function cx(...parts: (string | false | undefined | null)[]): string {
  return parts.filter(Boolean).join(' ');
}

export function fmtLakh(rupees: number): string {
  if (rupees === 0) return '₹0';
  return `₹${(rupees / 100000).toFixed(2)} L`;
}

export function fmtLakhVal(lakhs: number): string {
  const rounded = Math.round(lakhs * 100) / 100;
  const str = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0$/, '');
  return `₹${str} L`;
}

export function fmtCr(cr: number): string {
  return `₹${cr} Cr`;
}

export function overallBandLabel(pct: number): string {
  if (pct >= 75) return 'Strong';
  if (pct >= 60) return 'Moderate';
  if (pct >= 45) return 'Watch';
  return 'Weak';
}

export function overallBandColor(pct: number): string {
  if (pct >= 75) return 'var(--strong)';
  if (pct >= 60) return 'var(--moderate)';
  if (pct >= 45) return 'var(--watch)';
  return 'var(--weak)';
}

const GEO_LABELS: Record<string, string> = {
  DELHI_NCR: 'Delhi NCR',
  NORTH: 'North',
  SOUTH: 'South',
  WEST: 'West',
  EAST: 'East',
  PAN_INDIA: 'Pan-India',
  INTERNATIONAL: 'International',
};

export function geoLabel(geo: string): string {
  return GEO_LABELS[geo] || geo;
}

const AVAIL_LABELS: Record<string, string> = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' };

export function availLabel(avail: string): string {
  return AVAIL_LABELS[avail] || avail;
}

export const SECTOR_LABELS: Record<string, string> = {
  AI_ML: 'AI / ML',
  MEDTECH: 'Medtech',
  AGRITECH: 'Agritech',
  CYBERSECURITY: 'Cybersecurity',
  UAV: 'UAV',
  SEMICONDUCTOR: 'Semiconductor',
  ADVANCED_MATERIALS: 'Advanced materials',
};

export const STAGE_LABELS: Record<string, string> = {
  PRE_INCUBATION: 'Pre-incubation',
  EARLY_INCUBATION: 'Early incubation',
  MID_INCUBATION: 'Mid incubation',
  LATE_INCUBATION: 'Late incubation',
  ACCELERATION: 'Acceleration',
  GRADUATED: 'Graduated',
};

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${names[m - 1]} ${y}`;
}
