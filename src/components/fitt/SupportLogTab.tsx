'use client';

import { useState } from 'react';
import { FittSupportTask, FittTracker, Mentor, MentorMatch, MentorRequest } from '@/types';
import styles from './fitt.module.css';
import { cx, initials, statusDotClass } from './helpers';
import { requestsForStartup } from './mentorData';

type StatusFilter = 'all' | 'Pending' | 'In Progress' | 'Done';

const COLUMNS: { key: 'Pending' | 'In Progress' | 'Done'; label: string }[] = [
  { key: 'Pending', label: 'Pending' },
  { key: 'In Progress', label: 'In progress' },
  { key: 'Done', label: 'Done' },
];

export function SupportLogTab({
  startupId,
  tracker,
  mentors,
  mentorRequests,
  onOpenTask,
  onOpenHub,
}: {
  startupId: string;
  tracker: FittTracker;
  mentors: Mentor[];
  mentorMatches: MentorMatch[];
  mentorRequests: MentorRequest[];
  onOpenTask: (n: number) => void;
  onOpenHub: () => void;
}) {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const cols = COLUMNS.filter(c => filter === 'all' || filter === c.key);
  const conns = requestsForStartup(startupId, mentorRequests);

  const chipFor = (t: FittSupportTask) => {
    if (t.heldReason) return <span className={cx(styles.tchip, styles.tchipHold)}>On hold</span>;
    const taskConns = conns.filter(c => c.fittTaskN === t.n);
    if (taskConns.length > 0) {
      const first = mentors.find(m => m.id === taskConns[0].mentorId);
      return <span className={cx(styles.tchip, styles.tchipOk)}>Mentor: {first?.name}{taskConns.length > 1 ? ` +${taskConns.length - 1}` : ''}</span>;
    }
    const sug = tracker.mentorSuggestions[t.n] || [];
    return <span className={styles.tchip}>{sug.length} mentor matches</span>;
  };

  return (
    <section className={styles.panel}>
      <div className={cx(styles.card, styles.slBar)}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Support log</div>
          <div className={styles.note}>{tracker.supportLog.length} FITT actions from the tracker. Select any card for full details or to connect a mentor.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className={styles.seg} role="group" aria-label="Filter by status">
            <button className={filter === 'all' ? styles.segOn : undefined} onClick={() => setFilter('all')}>All</button>
            <button className={filter === 'Pending' ? styles.segOn : undefined} onClick={() => setFilter('Pending')}>Pending</button>
            <button className={filter === 'In Progress' ? styles.segOn : undefined} onClick={() => setFilter('In Progress')}>In progress</button>
            <button className={filter === 'Done' ? styles.segOn : undefined} onClick={() => setFilter('Done')}>Done</button>
          </div>
          <button className={cx(styles.btn, styles.btnPrimary)} onClick={onOpenHub}>Mentor connect</button>
        </div>
      </div>

      <div className={styles.card}>
        <p className={styles.lbl}>Mentor connections</p>
        {conns.length === 0 ? (
          <div className={styles.note}>No mentors connected yet. Use &ldquo;Connect mentor&rdquo; on a task, or open Mentor connect.</div>
        ) : (
          <div>
            {conns.map(c => {
              const m = mentors.find(mm => mm.id === c.mentorId);
              const t = tracker.supportLog.find(tt => tt.n === c.fittTaskN);
              if (!m || !t) return null;
              return (
                <span className={styles.conn} key={c.id}>
                  <span className={styles.av}>{initials(m.name)}</span>
                  {m.name} <span className={styles.note}>&rarr; #{t.n} {t.title} &middot; requested {c.createdOn}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.board} style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}>
        {cols.map(col => {
          const items = tracker.supportLog.filter(t => t.status === col.key);
          return (
            <div className={styles.col} key={col.key}>
              <div className={styles.colH}><span className={cx(styles.dot, statusDotClass(col.key))} />{col.label} &middot; {items.length}</div>
              {items.length === 0 ? (
                <p className={styles.note} style={{ margin: '10px 2px 0' }}>No completed actions yet. Items move here when the PM closes them.</p>
              ) : items.map(t => (
                <button key={t.n} className={styles.tcard} aria-label={`${t.title}, ${t.status}. Open details`} onClick={() => onOpenTask(t.n)}>
                  <div className={styles.tt}>#{t.n} {t.title}</div>
                  <div className={styles.ts}>{t.action}</div>
                  <div className={styles.tm}><span>{t.date} &middot; {t.type}</span>{chipFor(t)}</div>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
