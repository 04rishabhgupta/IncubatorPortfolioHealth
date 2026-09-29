'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { DEMO_TODAY } from '@/lib/clock';
import { FittTracker, Mentor, MentorMatch, MentorRequest } from '@/types';
import styles from './fitt.module.css';
import { initials } from './helpers';
import { DialogChrome } from './DialogChrome';
import { MentorCard } from './MentorCard';
import { mentorLoad, requestsForStartup } from './mentorData';

const generateId = () => Math.random().toString(36).substr(2, 9);

type HubTab = 'suggested' | 'pool' | 'connected';

export function MentorHub({
  startupId,
  startupName,
  tracker,
  mentors,
  mentorMatches,
  mentorRequests,
  onClose,
}: {
  startupId: string;
  startupName: string;
  tracker: FittTracker;
  mentors: Mentor[];
  mentorMatches: MentorMatch[];
  mentorRequests: MentorRequest[];
  onClose: () => void;
}) {
  const addMentorRequest = useStore(s => s.addMentorRequest);
  const [tab, setTab] = useState<HubTab>('suggested');
  const openTasks = tracker.supportLog.filter(t => t.status !== 'Done');
  const conns = requestsForStartup(startupId, mentorRequests);

  const agg = new Map<string, { score: number; tasks: number[] }>();
  Object.entries(tracker.mentorSuggestions).forEach(([n, arr]) => {
    arr.forEach(s => {
      const cur = agg.get(s.mentorId) || { score: 0, tasks: [] };
      cur.score += s.fit === 'h' ? 3 : s.fit === 'm' ? 2 : 1;
      cur.tasks.push(Number(n));
      agg.set(s.mentorId, cur);
    });
  });
  const ranked = [...agg.entries()].sort((a, b) => b[1].score - a[1].score);

  const handleConnect = (mentorId: string) => (taskN: number, note: string) => {
    const task = tracker.supportLog.find(t => t.n === taskN);
    addMentorRequest({
      id: generateId(),
      startupId,
      challenge: task ? `#${taskN} ${task.title}` : `#${taskN}`,
      expertiseNeeded: [],
      raisedBy: 'STAFF',
      createdOn: DEMO_TODAY,
      status: 'PENDING',
      mentorId,
      note,
      fittTaskN: taskN,
    });
  };

  return (
    <DialogChrome
      kicker={`Mentor connect · ${startupName}`}
      title="Mentors for open support tasks"
      meta={<span className={styles.note}>Ranked by expertise fit to each task, then availability and capacity.</span>}
      tabs={<>
        <button role="tab" className={tab === 'suggested' ? styles.dtabOn : undefined} aria-selected={tab === 'suggested'} onClick={() => setTab('suggested')}>Suggested</button>
        <button role="tab" className={tab === 'pool' ? styles.dtabOn : undefined} aria-selected={tab === 'pool'} onClick={() => setTab('pool')}>Full pool ({mentors.length})</button>
        <button role="tab" className={tab === 'connected' ? styles.dtabOn : undefined} aria-selected={tab === 'connected'} onClick={() => setTab('connected')}>Connected ({conns.length})</button>
      </>}
      onClose={onClose}
    >
      {tab === 'suggested' && ranked.map(([mentorId, a]) => {
        const mentor = mentors.find(m => m.id === mentorId);
        if (!mentor) return null;
        return (
          <MentorCard
            key={mentorId}
            mentor={mentor}
            tasksLabel={a.tasks.map(n => `#${n} ${tracker.supportLog.find(t => t.n === n)?.title}`).join(', ')}
            load={mentorLoad(mentor.id, startupId, mentorMatches, mentorRequests)}
            openTasks={openTasks}
            rankedTaskNs={a.tasks}
            onConnect={handleConnect(mentor.id)}
          />
        );
      })}

      {tab === 'pool' && mentors.map(mentor => (
        <MentorCard
          key={mentor.id}
          mentor={mentor}
          load={mentorLoad(mentor.id, startupId, mentorMatches, mentorRequests)}
          openTasks={openTasks}
          onConnect={handleConnect(mentor.id)}
        />
      ))}

      {tab === 'connected' && (
        conns.length === 0 ? <p className={styles.note}>No mentors connected yet.</p> : conns.map(c => {
          const mentor = mentors.find(m => m.id === c.mentorId);
          const t = tracker.supportLog.find(tt => tt.n === c.fittTaskN);
          if (!mentor || !t) return null;
          return (
            <div className={styles.mc} key={c.id}>
              <span className={styles.av}>{initials(mentor.name)}</span>
              <div className={styles.mi}>
                <b>{mentor.name}</b>
                <div className={styles.note}>#{t.n} {t.title} &middot; requested {c.createdOn}</div>
                {c.note && <div className={styles.why}>&ldquo;{c.note}&rdquo;</div>}
              </div>
            </div>
          );
        })
      )}
    </DialogChrome>
  );
}
