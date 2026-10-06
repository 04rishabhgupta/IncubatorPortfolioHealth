import type React from 'react';
import { FittTracker } from '@/types';
import styles from './fitt.module.css';
import { cx, fmtCr } from './helpers';

import { DonutChartComponent, HorizontalBarChartComponent } from './charts';

export function CompanyFundingTab({ tracker }: { tracker: FittTracker }) {
  const b = tracker.baseline;

  return (
    <section className={styles.panel}>
      <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
        {b.founders.map(f => (
          <div className={cx(styles.card, styles.founder)} key={f.name}>
            <b>{f.name}</b><br />
            {f.role} &middot;{' '}
            {f.commitment === 'PART_TIME'
              ? <span style={{ color: 'var(--weak)' }}>part-time</span>
              : 'full-time'}
            <br />
            <span className={styles.note}>{f.note}{f.flag ? ` · ${f.flag}` : ''}</span>
          </div>
        ))}
      </div>

      <div className={styles.card}>
        <p className={styles.lbl}>Cap table (fully diluted, as-converted)</p>
        <DonutChartComponent
          data={b.capTable.map(c => ({
            name: c.holder,
            value: c.pct,
            color: c.color,
          }))}
          centerLabel="Equity"
          centerValue="100%"
          height={240}
        />
        {b.capTableNote && <p className={styles.note} style={{ marginTop: 8 }}>{b.capTableNote}</p>}
      </div>

      <div className={cx(styles.grid, styles.g2)}>
        <div className={styles.card}>
          <p className={styles.lbl}>Funding ledger (₹ Cr)</p>
          <HorizontalBarChartComponent
            data={b.funding.map(f => ({
              label: f.label,
              value: f.amountCr,
              max: b.fundingWidthDenominatorCr,
              color: f.kind === 'GRANT' ? '#16A34A' : f.kind === 'SIGNING' ? '#A1A1AA' : '#2563EB',
              unit: ' Cr',
              badge: f.kind === 'GRANT' ? 'Grant' : f.kind === 'SIGNING' ? 'Signing' : 'Equity',
            }))}
            valuePrefix="₹"
            valueSuffix=" Cr"
            height={200}
          />
        </div>
        <div className={styles.card}>
          <p className={styles.lbl}>Valuation</p>
          <div style={{ fontSize: 14 }}>
            Round 1 post-money <b>{fmtCr(b.roundPostMoneyCr)}</b> &rarr; current pre-money <b>{fmtCr(b.currentPreMoneyCr)}</b>{' '}
            <span className={cx(styles.pill, styles.pDanger)}>Down round</span>
          </div>
          <p className={styles.lbl} style={{ marginTop: 18 }}>Use of funds (current round)</p>
          <DonutChartComponent
            data={b.useOfFunds.map(u => ({
              name: u.label,
              value: u.pct,
              color: u.color,
            }))}
            centerLabel="Funds"
            centerValue="100%"
            height={180}
            innerRadius={45}
            outerRadius={68}
          />
        </div>
      </div>

      <div className={styles.card}>
        <p className={styles.lbl}>Identity and IP facts</p>
        <table className={styles.table}>
          <tbody>
            <tr><td style={{ width: 220 }} className={styles.note}>CIN</td><td>{b.cin} &middot; {b.roc} &middot; incorporated {b.incorporatedOn}</td></tr>
            <tr><td className={styles.note}>Locations</td><td>{b.locations}</td></tr>
            <tr><td className={styles.note}>IP status</td><td>{b.ipStatusNote}</td></tr>
            <tr><td className={styles.note}>Tech transfer</td><td>{b.techTransferNote}</td></tr>
            <tr><td className={styles.note}>Total raised</td><td>{b.totalRaisedNote}</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
