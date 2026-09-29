import { FittTracker } from '@/types';
import styles from './fitt.module.css';
import { band, cx } from './helpers';

import { HorizontalBarChartComponent } from './charts';

export function StrategyTab({ tracker }: { tracker: FittTracker }) {
  const s = tracker.swot;
  return (
    <section className={styles.panel}>
      <div className={cx(styles.grid, styles.g2e)}>
        <div className={styles.swot} style={{ background: 'var(--ok-bg)' }}>
          <b style={{ color: 'var(--strong)' }}>Strengths</b>
          <ol>{s.strengths.map((t, i) => <li key={i}>{t}</li>)}</ol>
        </div>
        <div className={styles.swot} style={{ background: 'var(--danger-bg)' }}>
          <b style={{ color: 'var(--weak)' }}>Weaknesses</b>
          <ol>{s.weaknesses.map((t, i) => <li key={i}>{t}</li>)}</ol>
        </div>
        <div className={styles.swot} style={{ background: 'var(--info-bg)' }}>
          <b style={{ color: 'var(--info-text)' }}>Opportunities</b>
          <ol>{s.opportunities.map((t, i) => <li key={i}>{t}</li>)}</ol>
        </div>
        <div className={styles.swot} style={{ background: 'var(--warn-bg)' }}>
          <b style={{ color: 'var(--warn-text)' }}>Threats</b>
          <ol>{s.threats.map((t, i) => <li key={i}>{t}</li>)}</ol>
        </div>
      </div>

      <div className={styles.card}>
        <div className="flex items-center justify-between mb-2">
          <p className={styles.lbl} style={{ margin: 0 }}>Value chain &middot; score 1-5 &middot; red outline = bottleneck</p>
          <span className="text-xs font-mono text-gray-500">6 Stages Diagnostic</span>
        </div>
        <div className={styles.vc}>
          {tracker.valueChain.map((v, i) => (
            <div className={cx(styles.vcs, v.bottleneck && styles.vcsBn)} key={v.stage}>
              <div className={styles.note}>Stage {i + 1}</div>
              <div style={{ fontWeight: 500 }}>{v.stage}</div>
              <div className={styles.track}>
                <i className={band(v.score, v.max)} style={{ width: `${(v.score / v.max) * 100}%` }} />
              </div>
              {v.score}/{v.max}{v.bottleneck ? ' · bottleneck' : ''}
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-[#E3E7E0]">
          <p className={styles.lbl}>Value chain performance breakdown</p>
          <HorizontalBarChartComponent
            data={tracker.valueChain.map((v, i) => ({
              label: `${i + 1}. ${v.stage}`,
              value: v.score,
              max: v.max,
              color: v.bottleneck ? '#B42318' : (v.score >= 4 ? '#2E7D4F' : '#B8860B'),
              badge: v.bottleneck ? 'Bottleneck' : undefined,
            }))}
            height={220}
          />
        </div>
      </div>
    </section>
  );
}
