import type React from 'react';
import { FittDDSection, FittTracker } from '@/types';
import styles from './fitt.module.css';
import { cx } from './helpers';

function counts(items: FittDDSection['items']) {
  const compliant = items.filter(i => i.status === 'COMPLIANT').length;
  const issue = items.filter(i => i.status === 'ISSUE').length;
  const waived = items.filter(i => i.status === 'WAIVED').length;
  return { compliant, issue, waived, total: items.length };
}

const STATUS_LABEL: Record<string, string> = { COMPLIANT: 'Compliant', ISSUE: 'Issue found', WAIVED: 'Waived' };

export function DueDiligenceTab({ tracker }: { tracker: FittTracker }) {
  const all = tracker.dueDiligence.flatMap(s => s.items);
  const totals = counts(all);

  return (
    <section className={styles.panel}>
      <div className={cx(styles.grid, styles.kpis)}>
        <div className={styles.kpi}><span>Compliant</span><b style={{ color: 'var(--strong)' }}>{totals.compliant}</b></div>
        <div className={styles.kpi}><span>Issue found</span><b style={{ color: 'var(--weak)' }}>{totals.issue}</b></div>
        <div className={styles.kpi}><span>Waived</span><b>{totals.waived}</b></div>
      </div>

      <div className={styles.card}>
        <p className={styles.lbl}>By section &middot; expand for checklist items</p>
        {tracker.dueDiligence.map(sec => {
          const c = counts(sec.items);
          return (
            <details className={styles.details} key={sec.label}>
              <summary>
                <div className={styles.row} style={{ display: 'inline-flex', width: 'calc(100% - 20px)', margin: 0 }}>
                  <span className={styles.name} style={{ width: 190 }}>{sec.label}</span>
                  <div className={styles.stack} style={{ flex: 1, height: 12 }}>
                    <i style={{ width: `${(c.compliant / c.total) * 100}%`, background: 'var(--strong)' }} />
                    <i style={{ width: `${(c.issue / c.total) * 100}%`, background: 'var(--weak)' }} />
                    <i style={{ width: `${(c.waived / c.total) * 100}%`, background: 'var(--grey)' }} />
                  </div>
                  <span className={styles.val} style={{ width: 70 }}>{c.issue} issues</span>
                </div>
              </summary>
              <table className={styles.table} style={{ marginTop: 8 }}>
                <thead>
                  <tr><th>Item</th><th>Status</th><th>Reference</th><th>Notes</th></tr>
                </thead>
                <tbody>
                  {sec.items.map((it, i) => (
                    <tr key={i}>
                      <td>{it.item}</td>
                      <td style={{ color: it.status === 'ISSUE' ? 'var(--weak)' : it.status === 'COMPLIANT' ? 'var(--strong)' : 'var(--text-2)' }}>{STATUS_LABEL[it.status]}</td>
                      <td className={styles.note}>{it.reference}</td>
                      <td className={styles.note}>{it.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          );
        })}
        <div className={styles.legend}>
          <span style={{ '--c': 'var(--strong)' } as React.CSSProperties}>Compliant</span>
          <span style={{ '--c': 'var(--weak)' } as React.CSSProperties}>Issue found</span>
          <span style={{ '--c': 'var(--grey)' } as React.CSSProperties}>Waived</span>
        </div>
      </div>
    </section>
  );
}
