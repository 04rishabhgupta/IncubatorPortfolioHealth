'use client';

import { useState } from 'react';
import { FittSupportTask, Mentor } from '@/types';
import styles from './fitt.module.css';
import { cx, initials } from './helpers';

const FIT_LABEL: Record<string, string> = { h: 'Strong fit', m: 'Partial fit', l: 'Weak fit' };
const FIT_CLASS: Record<string, string> = { h: styles.fitH, m: styles.fitM, l: styles.fitL };

export function MentorCard({
  mentor,
  fit,
  why,
  tasksLabel,
  best,
  load,
  fixedTaskN,
  fixedTaskTitle,
  alreadyRequested,
  openTasks,
  rankedTaskNs,
  onConnect,
}: {
  mentor: Mentor;
  fit?: 'h' | 'm' | 'l';
  why?: string;
  tasksLabel?: string;
  best?: boolean;
  load: number;
  fixedTaskN?: number;
  fixedTaskTitle?: string;
  alreadyRequested?: boolean;
  openTasks: FittSupportTask[];
  rankedTaskNs?: number[];
  onConnect: (taskN: number, note: string) => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState(false);

  const full = load >= mentor.maxActiveMatches;

  const orderedOptions = fixedTaskN
    ? []
    : rankedTaskNs
      ? [...openTasks].sort((a, b) => {
        const ai = rankedTaskNs.includes(a.n) ? 0 : 1;
        const bi = rankedTaskNs.includes(b.n) ? 0 : 1;
        return ai - bi;
      })
      : openTasks;

  const handleSend = () => {
    const taskN = fixedTaskN || Number(selectedTask);
    if (!taskN) {
      setError(true);
      return;
    }
    onConnect(taskN, note.trim());
    setFormOpen(false);
    setSelectedTask('');
    setNote('');
    setError(false);
  };

  return (
    <div className={cx(styles.mc, best && !full && styles.mcBest)}>
      <span className={styles.av} style={{ width: 38, height: 38, fontSize: 13 }}>{initials(mentor.name)}</span>
      <div className={styles.mi}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <b>{mentor.name}</b>
          {fit && <span className={cx(styles.fit, FIT_CLASS[fit])}>{FIT_LABEL[fit]}</span>}
        </div>
        <div className={styles.note}>{mentor.title} &middot; {mentor.geography.replace('_', ' ')} &middot; {mentor.availability.toLowerCase()} availability</div>
        <div className={styles.note}>{mentor.expertise.join(' · ')}</div>
        {why && <div className={styles.why}>{why}</div>}
        {tasksLabel && <div className={styles.why}>Helps with: {tasksLabel}</div>}
        <div className={styles.cap}>Capacity {load} of {mentor.maxActiveMatches} active</div>

        {formOpen && (
          <div className={cx(styles.confirm, styles.shareOn)} style={{ display: 'block' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Request {mentor.name}</div>
            {fixedTaskN ? (
              <div className={styles.note}>For #{fixedTaskN} {fixedTaskTitle}</div>
            ) : (
              <label className={styles.note} style={{ display: 'block', marginTop: 6 }}>
                For which task
                <select className={styles.select} value={selectedTask} onChange={e => { setSelectedTask(e.target.value); setError(false); }}>
                  <option value="">Choose a task</option>
                  {orderedOptions.map(t => <option key={t.n} value={t.n}>#{t.n} {t.title}</option>)}
                </select>
              </label>
            )}
            <textarea rows={2} placeholder="What should the mentor help with?" value={note} onChange={e => setNote(e.target.value)} />
            {error && <div className={styles.err} style={{ display: 'block' }}>Choose a task first.</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className={styles.btn} onClick={() => setFormOpen(false)}>Cancel</button>
              <button className={cx(styles.btn, styles.btnPrimary)} onClick={handleSend}>Send request</button>
            </div>
          </div>
        )}
      </div>
      <div>
        {!formOpen && (
          alreadyRequested ? <span className={cx(styles.tchip, styles.tchipOk)}>Requested</span>
            : full ? <span className={styles.tchip}>At capacity</span>
              : <button className={cx(styles.btn, best && styles.btnPrimary)} onClick={() => setFormOpen(true)}>Connect</button>
        )}
      </div>
    </div>
  );
}
