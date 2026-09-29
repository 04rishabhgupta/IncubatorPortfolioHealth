import styles from './fitt.module.css';
import { band } from './helpers';

export interface BarRow {
  name: string;
  value: number;
  max: number;
  cls?: string;
  raw?: boolean; // show raw value instead of "value/max"
}

export function Bars({ rows, width = 150, ticks = false }: { rows: BarRow[]; width?: number; ticks?: boolean }) {
  return (
    <div>
      {rows.map((r, i) => {
        const pct = r.max > 0 ? (r.value / r.max) * 100 : 0;
        const cls = r.cls || band(r.value, r.max);
        return (
          <div className={styles.row} key={i}>
            <span className={styles.name} style={{ width }}>{r.name}</span>
            <div className={styles.track}>
              <i className={cls} style={{ width: `${pct}%` }} />
              {ticks && [45, 60, 75].map(t => (
                <span key={t} className={styles.tick} style={{ left: `${t}%` }} />
              ))}
            </div>
            <span className={styles.val}>{r.raw ? r.value : `${r.value}/${r.max}`}</span>
          </div>
        );
      })}
    </div>
  );
}
