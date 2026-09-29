import type React from 'react';
import { FittTracker } from '@/types';
import styles from './fitt.module.css';
import { cx, fmtLakh, monthLabel } from './helpers';

import { HorizontalBarChartComponent, GaugeChartComponent } from './charts';

export function MonthlyCheckinTab({ tracker }: { tracker: FittTracker }) {
  const checkin = tracker.monthlyCheckins[tracker.monthlyCheckins.length - 1];
  const stages: Array<'Deck' | 'Pitching' | 'Term sheet' | 'Closed'> = ['Deck', 'Pitching', 'Term sheet', 'Closed'];

  return (
    <section className={styles.panel}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span className={styles.note}>Month</span>
        <select className={styles.monthSelect} defaultValue={checkin.month}>
          <option value={checkin.month}>{monthLabel(checkin.month)}</option>
        </select>
        <span className={styles.note}>Future months are appended here; charts become trends.</span>
      </div>

      <div className={cx(styles.grid, styles.kpis)}>
        <div className={styles.kpi}><span>Monthly revenue</span><b>{fmtLakh(checkin.monthlyRevenue)}</b><small>{checkin.monthlyRevenueNote}</small></div>
        <div className={styles.kpi}><span>Monthly burn</span><b>{fmtLakh(checkin.monthlyBurn)}</b></div>
        <div className={styles.kpi}><span>Paying customers</span><b>{checkin.payingCustomers}</b><small>{checkin.payingCustomersNote}</small></div>
        <div className={styles.kpi}><span>Gross margin</span><b>{checkin.grossMarginPct}%</b><small>{checkin.grossMarginNote}</small></div>
        <div className={styles.kpi}><span>Product stage</span><b>{checkin.productStage}</b><small>{checkin.productStageNote}</small></div>
      </div>

      <div className={cx(styles.grid, styles.g2)}>
        <div className={styles.card}>
          <p className={styles.lbl}>Order pipeline (₹ lakh)</p>
          <HorizontalBarChartComponent
            data={checkin.orderPipeline.map(o => ({
              label: o.name,
              value: o.amountLakh,
              max: o.capLakh,
              color: o.tone === 'strong' ? '#2E7D4F' : o.tone === 'moderate' ? '#B8860B' : '#9AA39D',
              unit: ' L',
              badge: o.tone === 'strong' ? 'Executed' : o.tone === 'moderate' ? 'In Progress' : 'PO Awaited',
            }))}
            valuePrefix="₹"
            valueSuffix="L"
            height={200}
          />
        </div>
        <div className={styles.card}>
          <p className={styles.lbl}>Customer concentration</p>
          <GaugeChartComponent
            value={checkin.customerConcentrationPct}
            title="Single Buyer Risk"
            subtitle={checkin.customerConcentrationNote}
            threshold={50}
            dangerAbove
          />
          <p className={styles.lbl} style={{ marginTop: 18 }}>Fundraising status</p>
          <div>
            {stages.map(s => (
              <span key={s} className={cx(styles.chip, s === checkin.fundraisingStage && styles.chipInfo)}>{s}</span>
            ))}
          </div>
          <div style={{ fontSize: 13, marginTop: 8 }}>{checkin.fundraisingNote}</div>
        </div>
      </div>

      <div className={styles.card}>
        <details className={styles.details} open>
          <summary>Technology</summary>
          <p className={styles.note}>{checkin.technology}</p>
        </details>
        <details className={styles.details}>
          <summary>Pitch materials</summary>
          <p className={styles.note}>{checkin.pitchMaterials}</p>
        </details>
        <details className={styles.details}>
          <summary>GTM progress</summary>
          <p className={styles.note}>{checkin.gtmProgress}</p>
        </details>
        <details className={styles.details}>
          <summary>PM notes</summary>
          <p className={styles.note}>{checkin.pmNotes}</p>
        </details>
      </div>
    </section>
  );
}
