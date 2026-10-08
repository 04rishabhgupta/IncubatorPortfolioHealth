'use client';

import { useState } from 'react';
import { FittTracker } from '@/types';
import { useStore } from '@/store';
import { TODAY } from '@/lib/clock';
import styles from './fitt.module.css';
import { cx } from './helpers';

export function NeedsAttention({ startupId, tracker, founderName, actor }: { startupId: string; tracker: FittTracker; founderName: string; actor: string }) {
  const addFounderActionItems = useStore(s => s.addFounderActionItems);
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(tracker.needsAttention.map(i => [i.key, true]))
  );
  const [note, setNote] = useState('');
  const [error, setError] = useState(false);
  const [sent, setSent] = useState(false);

  const items = tracker.needsAttention;

  const handleShareClick = () => {
    setOpen(true);
    setSent(false);
  };

  const toggle = (key: string) => {
    setChecked(prev => ({ ...prev, [key]: !prev[key] }));
    setError(false);
  };

  const handleSend = () => {
    const selected = items.filter(i => checked[i.key]);
    if (selected.length === 0) {
      setError(true);
      return;
    }
    addFounderActionItems(selected.map(i => ({
      startupId,
      title: i.issue,
      cause: i.cause,
      effect: i.effect,
      fix: i.fix,
      note: note.trim() || undefined,
      sharedBy: actor,
      sharedOn: TODAY,
    })));
    setSent(true);
  };

  return (
    <div className={styles.na}>
      <div className={styles.naH}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
        Needs attention · {items.length}
      </div>
      <div className={cx(styles.naGrid, styles.naGridHead)}>
        <span>Issue</span><span>Cause</span><span>Effect</span><span>Fix</span>
      </div>
      {items.map(item => (
        <div className={styles.naGrid} key={item.key}>
          <div>
            <div className={cx(styles.naIssue, item.critical && styles.naIssueCrit)}>{item.issue}</div>
            <span className={styles.naTag}>{item.tag}</span>
          </div>
          <div>{item.cause}</div>
          <div>{item.effect}</div>
          <div>{item.fix}</div>
        </div>
      ))}
      <div className={styles.naFoot}>
        <span style={{ fontSize: 12, color: 'var(--warn-text)' }}>Checked on {tracker.checkedOn}</span>
        <button className={cx(styles.btn, styles.btnPrimary)} onClick={handleShareClick}>Share with founder</button>
      </div>

      {open && (
        <div className={cx(styles.share, styles.shareOn, styles.card)}>
          <div style={{ fontWeight: 600 }}>Share with {founderName}</div>
          <div className={styles.note} style={{ marginBottom: 6 }}>Pick what the founder sees. Cause, effect and fix go with each item.</div>
          {items.map(item => (
            <label key={item.key}>
              <input type="checkbox" checked={!!checked[item.key]} onChange={() => toggle(item.key)} />
              {item.issue}
            </label>
          ))}
          <textarea rows={3} placeholder="Add a note for the founder" value={note} onChange={e => setNote(e.target.value)} />
          {error && <div className={styles.err} style={{ display: 'block' }}>Select at least one item.</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
            <button className={styles.btn} onClick={() => setOpen(false)}>Cancel</button>
            <button className={cx(styles.btn, styles.btnPrimary)} onClick={handleSend}>Send to founder portal</button>
          </div>
          {sent && <div className={styles.ok} style={{ display: 'block' }}>Sent. It appears on the founder portal under Action items.</div>}
        </div>
      )}
    </div>
  );
}
