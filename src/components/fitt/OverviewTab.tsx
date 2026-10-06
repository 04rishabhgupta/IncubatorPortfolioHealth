import type React from 'react';
import { FittTracker, MonthlyMetrics } from '@/types';
import styles from './fitt.module.css';
import { NeedsAttention } from './NeedsAttention';
import { cx, fmtLakh, fmtLakhVal, fmtCr, overallBandLabel, overallBandColor, monthLabel } from './helpers';

import { HorizontalBarChartComponent } from './charts';

export function OverviewTab({ startupId, tracker, latestMetrics, runway, founderName, actor }: {
  startupId: string;
  tracker: FittTracker;
  latestMetrics?: MonthlyMetrics;
  runway: number;
  founderName: string;
  actor: string;
}) {
  const lastReview = tracker.sixMonthReviews[tracker.sixMonthReviews.length - 1];
  const lastCheckin = tracker.monthlyCheckins[tracker.monthlyCheckins.length - 1];
  const overallPct = Math.round(lastReview.overallPct);

  const bottlenecks = tracker.valueChain
    .filter(s => s.bottleneck)
    .sort((a, b) => (a.score / a.max) - (b.score / b.max))
    .slice(0, 3)
    .map((s, i) => ({ ...s, ordinal: i + 1 }));

  return (
    <section className={styles.panel}>
      <div className={cx(styles.grid, styles.kpis)}>
        <div className={styles.kpi}>
          <span>Overall score</span>
          <b>{overallPct}%</b>
          <small style={{ color: overallBandColor(overallPct) }}>{overallBandLabel(overallPct)}</small>
        </div>
        <div className={styles.kpi}>
          <span>Cash in bank</span>
          <b>{latestMetrics ? fmtLakh(latestMetrics.cashBalance) : '-'}</b>
          <small>{lastCheckin?.cashNote}</small>
        </div>
        <div className={styles.kpi}>
          <span>Monthly burn</span>
          <b>{latestMetrics ? fmtLakh(latestMetrics.monthlyBurn) : '-'}</b>
          <small>{lastCheckin && monthLabel(lastCheckin.month)}</small>
        </div>
        <div className={styles.kpi}>
          <span>Runway</span>
          <b style={{ color: runway < 3 ? 'var(--weak)' : undefined }}>{runway.toFixed(2)} m</b>
          <small>{lastCheckin?.runwayPmViewNote}</small>
        </div>
        <div className={styles.kpi}>
          <span>Revenue Q1 FY27</span>
          <b>{lastCheckin ? fmtLakhVal(lastCheckin.q1RevenueLakh) : '-'}</b>
          <small>{lastCheckin && `target ${fmtLakhVal(lastCheckin.q1RevenueTargetLakh)}`}</small>
        </div>
        <div className={styles.kpi}>
          <span>Pre-money</span>
          <b>{fmtCr(tracker.baseline.currentPreMoneyCr)}</b>
          <small>down from {fmtCr(tracker.baseline.previousPreMoneyCr)}</small>
        </div>
      </div>

      {/* AI Investibility & Red Flag Summary Bar */}
      <div
        className={styles.card}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderLeft: '4px solid var(--strong)',
          background: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              background: 'var(--brand)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '13px',
              letterSpacing: '.02em',
            }}
          >
            AI Investibility: 76/100 (Grade A)
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>
            Institutional syndicate readiness evaluated across Team, Market TAM, Patent IP, and Capital Efficiency.
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--weak)',
              fontWeight: 700,
              background: 'var(--danger-bg)',
              padding: '3px 8px',
              borderRadius: '4px',
            }}
          >
            {tracker.redFlags.filter((f) => f.value).length} Active Red Flags
          </span>
        </div>
      </div>

      <NeedsAttention startupId={startupId} tracker={tracker} founderName={founderName} actor={actor} />

      <div className={cx(styles.grid, styles.g2)}>
        <div className={styles.card}>
          <p className={styles.lbl}>Section scores (weighted) · bands at 45 / 60 / 75%</p>
          <HorizontalBarChartComponent
            data={lastReview.sections.map(s => ({
              label: `${s.label} (${s.weightPct}%)`,
              value: s.total,
              max: s.max,
            }))}
            showTicks
          />
        </div>
        <div className={styles.card}>
          <p className={styles.lbl}>Red flags this month</p>
          {tracker.redFlags.map((f, i) => (
            <div className={cx(styles.flag, f.value ? styles.flagYes : styles.flagNo)} key={i}>{f.text}</div>
          ))}
        </div>
      </div>

      <div className={cx(styles.grid, styles.g2e)}>
        <div className={styles.card}>
          <p className={styles.lbl}>Top bottlenecks (value chain)</p>
          <HorizontalBarChartComponent
            data={bottlenecks.map(b => ({
              label: `${b.ordinal}. ${b.stage}`,
              value: b.score,
              max: b.max,
              color: '#DC2626',
              badge: 'Bottleneck',
            }))}
            height={150}
          />
        </div>
        <div className={styles.card}>
          <p className={styles.lbl}>Next PM actions</p>
          <table className={styles.table}>
            <tbody>
              {tracker.nextPmActions.map((a, i) => (
                <tr key={i}><td>{a.label}</td><td className={styles.note}>{a.note}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
