import { FittTracker } from '@/types';
import styles from './fitt.module.css';
import { Bars } from './Bars';
import { cx } from './helpers';
import { RadarChartComponent, FunnelChartComponent, HorizontalBarChartComponent } from './charts';

export function SixMonthReviewTab({ tracker }: { tracker: FittTracker }) {
  const review = tracker.sixMonthReviews[tracker.sixMonthReviews.length - 1];
  const porterTotal = review.porter.reduce((a, p) => a + p.score, 0);
  const porterMax = review.porter.reduce((a, p) => a + p.max, 0);
  const ms = review.marketSizing;

  return (
    <section className={styles.panel}>
      <div className={cx(styles.grid, styles.g2e)}>
        <div className={styles.card}>
          <p className={styles.lbl}>Supporting scores (not weighted)</p>
          <HorizontalBarChartComponent
            data={review.supporting.map(p => ({ label: p.label, value: p.score, max: p.max }))}
            height={240}
          />
        </div>
        <div className={styles.card}>
          <div className="flex items-center justify-between mb-1">
            <p className={styles.lbl} style={{ margin: 0 }}>Porter&rsquo;s 5 forces</p>
            <span className="text-xs font-mono font-bold bg-[#EAF4EE] text-[#1E4133] px-2 py-0.5 rounded">
              {porterTotal} / {porterMax} pts
            </span>
          </div>
          <RadarChartComponent
            data={review.porter.map(p => ({
              dimension: p.label,
              score: p.score,
              fullMark: p.max,
            }))}
            height={260}
          />
        </div>
      </div>

      <div className={cx(styles.grid, styles.g2e)}>
        <div className={styles.card}>
          <p className={styles.lbl}>Market sizing (₹ Cr)</p>
          <FunnelChartComponent
            stages={[
              { label: 'TAM', name: 'Total Addressable Market', value: ms.tamCr },
              { label: 'SAM', name: 'Serviceable Addressable Market', value: ms.samCr },
              { label: 'SOM', name: 'Serviceable Obtainable Market', value: ms.somCr },
            ]}
            cagr={ms.cagrPct}
            note={ms.note}
          />
        </div>
        <div className={styles.card}>
          <p className={styles.lbl}>Section detail</p>
          {review.sections.map((s, i) => (
            <details className={styles.details} key={s.label} open={i === 0}>
              <summary>{s.label} · {s.total} / {s.max}</summary>
              <Bars width={150} rows={s.params.map(p => ({ name: p.label, value: p.score, max: p.max }))} />
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
