import { Startup, User } from '@/types';
import styles from './fitt.module.css';
import { monthLabel, SECTOR_LABELS, STAGE_LABELS } from './helpers';

function displayDomain(url?: string) {
  if (!url) return null;
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export function Header({ startup, manager, associate }: { startup: Startup; manager?: User; associate?: User }) {
  const tracker = startup.fittTracker;
  if (!tracker) return null;
  const redFlagCount = tracker.redFlags.filter(f => f.value).length;
  const lastCheckin = tracker.monthlyCheckins[tracker.monthlyCheckins.length - 1];
  const lastReview = tracker.sixMonthReviews[tracker.sixMonthReviews.length - 1];
  const domain = displayDomain(startup.website);

  return (
    <div className={styles.card}>
      <div className={styles.headerCard}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{startup.name}</div>
          <div style={{ color: 'var(--text-2)', marginTop: 2 }}>{startup.oneLiner}</div>
          <div>
            <span className={styles.chip}>{SECTOR_LABELS[startup.sector] || startup.sector}</span>
            {tracker.baseline.tags.map(t => <span className={styles.chip} key={t}>{t}</span>)}
            <span className={styles.chip}>TRL {startup.trl}</span>
            <span className={styles.chip}>{STAGE_LABELS[startup.stage] || startup.stage}</span>
            {tracker.baseline.dpiitRecognised && <span className={styles.chip}>DPIIT recognised</span>}
            {domain && <span className={styles.chip}>{domain}</span>}
          </div>
        </div>
        <div className={styles.textRight}>
          Manager: <b style={{ color: 'var(--text)' }}>{manager?.label || 'Unassigned'}</b><br />
          Associate: <b style={{ color: 'var(--text)' }}>{associate?.label || 'To be assigned'}</b><br />
          {lastCheckin && <>Last check-in: {monthLabel(lastCheckin.month)}</>}
          {lastReview && <> · Review cycle: {lastReview.cycle}</>}
          <br />
          <span className={`${styles.pill} ${styles.pDanger}`}>{redFlagCount} of {tracker.redFlags.length} red flags</span>
        </div>
      </div>
    </div>
  );
}
