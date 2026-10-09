'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { TODAY } from '@/lib/clock';
import { FittSupportTask, FittTracker, Mentor, MentorMatch, MentorRequest } from '@/types';
import styles from './fitt.module.css';
import { cx, statusDotClass } from './helpers';
import { DialogChrome } from './DialogChrome';
import { MentorCard } from './MentorCard';
import { mentorLoad, requestedForTask, requestsForStartup } from './mentorData';

const generateId = () => Math.random().toString(36).substr(2, 9);

export function TaskDialog({
  startupId,
  tracker,
  task,
  initialTab,
  mentors,
  mentorMatches,
  mentorRequests,
  onClose,
}: {
  startupId: string;
  tracker: FittTracker;
  task: FittSupportTask;
  initialTab: 'details' | 'mentors';
  mentors: Mentor[];
  mentorMatches: MentorMatch[];
  mentorRequests: MentorRequest[];
  onClose: () => void;
}) {
  const addMentorRequest = useStore(s => s.addMentorRequest);
  const [tab, setTab] = useState<'details' | 'mentors'>(initialTab);

  const suggestions = tracker.mentorSuggestions[task.n] || [];
  const gap = tracker.mentorGaps[task.n];
  const openTasks = tracker.supportLog.filter(t => t.status !== 'Done');
  const taskConns = requestsForStartup(startupId, mentorRequests).filter(c => c.fittTaskN === task.n);

  const handleConnect = (mentorId: string) => (taskN: number, note: string) => {
    addMentorRequest({
      id: generateId(),
      startupId,
      challenge: `#${taskN} ${task.title}`,
      expertiseNeeded: [],
      raisedBy: 'STAFF',
      createdOn: TODAY,
      status: 'PENDING',
      mentorId,
      note,
      fittTaskN: taskN,
    });
  };

  return (
    <DialogChrome
      kicker={`Support log #${task.n} · ${task.type}`}
      title={task.title}
      meta={<span className={styles.pill} style={{ background: 'var(--muted)' }}><span className={cx(styles.dot, statusDotClass(task.status))} style={{ display: 'inline-block', marginRight: 6 }} />{task.status}</span>}
      tabs={<>
        <button role="tab" className={tab === 'details' ? styles.dtabOn : undefined} aria-selected={tab === 'details'} onClick={() => setTab('details')}>Details</button>
        <button role="tab" className={tab === 'mentors' ? styles.dtabOn : undefined} aria-selected={tab === 'mentors'} onClick={() => setTab('mentors')}>Connect mentor ({suggestions.length})</button>
      </>}
      onClose={onClose}
    >
      {tab === 'details' ? (
        <>
          <div className={styles.kv}>
            <div><span>Opened</span>{task.date}</div>
            <div><span>Status</span>{task.status}</div>
            <div><span>Owner</span>{task.owner}</div>
            <div><span>Support type</span>{task.type}</div>
          </div>
          <div className={styles.sec}><h3>Action / intervention</h3><p>{task.action}</p></div>
          <div className={styles.sec}><h3>Outcome observed</h3><p>{task.outcome}</p></div>
          <div className={styles.sec}><h3>Why this action exists (SWOT source)</h3><div className={styles.src}>{task.source}</div></div>
          <div className={styles.sec}>
            <h3>Mentor</h3>
            <p>
              {taskConns.length > 0
                ? taskConns.map(c => `${mentors.find(m => m.id === c.mentorId)?.name} · requested ${c.createdOn}`).join(', ')
                : 'No mentor connected.'}
            </p>
            <button className={cx(styles.btn, styles.btnPrimary)} style={{ marginTop: 10 }} onClick={() => setTab('mentors')}>Connect mentor</button>
          </div>
        </>
      ) : (
        <>
          {task.heldReason && <div className={styles.warnbox}>{task.heldReason}</div>}
          {gap && <div className={cx(styles.warnbox, styles.warnboxAmber)}>{gap}</div>}
          {suggestions.filter(s => mentors.some(m => m.id === s.mentorId)).length === 0
            ? <p className={styles.note}>No mentor in the pool fits this task.</p>
            : suggestions.map((s, i) => {
              const mentor = mentors.find(m => m.id === s.mentorId);
              if (!mentor) return null;
              return (
                <MentorCard
                  key={s.mentorId}
                  mentor={mentor}
                  fit={s.fit}
                  why={s.why}
                  best={i === 0}
                  load={mentorLoad(mentor.id, startupId, mentorMatches, mentorRequests)}
                  fixedTaskN={task.n}
                  fixedTaskTitle={task.title}
                  alreadyRequested={requestedForTask(task.n, mentor.id, startupId, mentorRequests)}
                  openTasks={openTasks}
                  onConnect={handleConnect(mentor.id)}
                />
              );
            })}
        </>
      )}
    </DialogChrome>
  );
}
