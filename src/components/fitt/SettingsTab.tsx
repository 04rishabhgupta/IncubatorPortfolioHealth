'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { Sector, Stage, Startup, User } from '@/types';
import { getAssignableAssociates, getAssignableManagers } from '@/lib/rbac';
import styles from './fitt.module.css';
import { cx, SECTOR_LABELS, STAGE_LABELS } from './helpers';

const SECTORS = Object.keys(SECTOR_LABELS) as Sector[];
const STAGES = Object.keys(STAGE_LABELS) as Stage[];
const TRLS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

interface FormState {
  name: string;
  website: string;
  oneLiner: string;
  sector: Sector;
  stage: Stage;
  trl: string;
  city: string;
  email: string;
  cohort: string;
}

function toForm(startup: Startup, founderEmail: string): FormState {
  return {
    name: startup.name,
    website: startup.website || '',
    oneLiner: startup.oneLiner,
    sector: startup.sector,
    stage: startup.stage,
    trl: String(startup.trl),
    city: startup.city,
    email: founderEmail,
    cohort: startup.cohort,
  };
}

export function SettingsTab({
  startup,
  currentUser,
  allUsers,
  founderEmail,
  canAssignManager,
  canAssignAssociate,
  canArchive,
  canModify,
}: {
  startup: Startup;
  currentUser: User;
  allUsers: User[];
  founderEmail: string;
  canAssignManager: boolean;
  canAssignAssociate: boolean;
  canArchive: boolean;
  canModify: boolean;
}) {
  const updateStartup = useStore(s => s.updateStartup);
  const updateAssignment = useStore(s => s.updateAssignment);

  const canOpenModify = canModify || canAssignManager || canAssignAssociate;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(() => toForm(startup, founderEmail));
  const [managerId, setManagerId] = useState(startup.managerId);
  const [associateId, setAssociateId] = useState(startup.associateId || '');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleteError, setDeleteError] = useState(false);

  const managers = getAssignableManagers(allUsers);
  const associates = getAssignableAssociates(managerId, allUsers);

  const resetForm = () => {
    setForm(toForm(startup, founderEmail));
    setManagerId(startup.managerId);
    setAssociateId(startup.associateId || '');
  };

  const handleModify = () => {
    resetForm();
    setEditing(true);
    setSaved(false);
    setError('');
  };

  const handleCancel = () => {
    resetForm();
    setEditing(false);
    setError('');
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(f => ({ ...f, [key]: value }));
    setError('');
  };

  const handleManagerChange = (newManagerId: string) => {
    setManagerId(newManagerId);
    const stillValid = getAssignableAssociates(newManagerId, allUsers).some(a => a.id === associateId);
    if (!stillValid) setAssociateId('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const oneLiner = form.oneLiner.trim();
    const email = form.email.trim();
    if (!name) { setError('Enter a startup name.'); return; }
    if (!oneLiner) { setError('Enter a one-liner.'); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError(`Enter a valid email, like founder@${(startup.website || 'company.com').replace(/^https?:\/\//, '')}.`); return; }

    if (canModify) {
      const res = await updateStartup({
        ...startup,
        name,
        oneLiner,
        website: form.website.trim() || undefined,
        sector: form.sector,
        stage: form.stage,
        trl: Number(form.trl),
        city: form.city.trim(),
        cohort: form.cohort.trim(),
      });
      if (res?.error) {
        setError(res.error);
        return;
      }
    }
    if (canAssignManager || canAssignAssociate) {
      const nextManagerId = canAssignManager ? managerId : startup.managerId;
      const nextAssociateId = canAssignAssociate ? (associateId || null) : startup.associateId;
      const res = await updateAssignment(startup.id, nextManagerId, nextAssociateId, currentUser.label);
      if (res?.error) {
        setError(res.error);
        return;
      }
    }
    setEditing(false);
    setSaved(true);
  };

  const handleDeleteOpen = () => { setDeleteOpen(true); setDeleteText(''); setDeleteError(false); };
  const handleDeleteCancel = () => { setDeleteOpen(false); setDeleteError(false); };
  const handleDeleteGo = async () => {
    if (deleteText.trim() !== startup.name) { setDeleteError(true); return; }
    await updateStartup({ ...startup, archived: true });
  };

  if (startup.archived) {
    return (
      <section className={styles.panel}>
        <div className={cx(styles.card, styles.deletedPanel)}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{startup.name} was deleted</div>
          <p className={styles.note} style={{ fontSize: 14 }}>This startup is archived. It no longer appears in active portfolio views.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Startup details</div>
            <div className={styles.note}>Shown in the header, portfolio table and founder portal.</div>
          </div>
          {canOpenModify && !editing && (
            <button className={cx(styles.btn, styles.btnPrimary)} onClick={handleModify}>Modify</button>
          )}
        </div>

        <form className={cx(styles.setgrid, editing && styles.editing)} onSubmit={handleSubmit} noValidate>
          <label>Startup name
            <input name="name" required value={form.name} disabled={!editing || !canModify} onChange={e => setField('name', e.target.value)} />
          </label>
          <label>Website
            <input name="web" value={form.website} disabled={!editing || !canModify} onChange={e => setField('website', e.target.value)} />
          </label>
          <label className={styles.span2}>One-liner
            <input name="line" required value={form.oneLiner} disabled={!editing || !canModify} onChange={e => setField('oneLiner', e.target.value)} />
          </label>
          <label>Sector
            <select name="sector" value={form.sector} disabled={!editing || !canModify} onChange={e => setField('sector', e.target.value as Sector)}>
              {SECTORS.map(s => <option key={s} value={s}>{SECTOR_LABELS[s]}</option>)}
            </select>
          </label>
          <label>Stage
            <select name="stage" value={form.stage} disabled={!editing || !canModify} onChange={e => setField('stage', e.target.value as Stage)}>
              {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
            </select>
          </label>
          <label>TRL
            <select name="trl" value={form.trl} disabled={!editing || !canModify} onChange={e => setField('trl', e.target.value)}>
              {TRLS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label>City / HQ
            <input name="city" value={form.city} disabled={!editing || !canModify} onChange={e => setField('city', e.target.value)} />
          </label>
          <label>Portfolio Head
            <select name="mgr" value={managerId} disabled={!editing || !canAssignManager} onChange={e => handleManagerChange(e.target.value)}>
              {managers.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </label>
          <label>Portfolio Manager
            <select name="assoc" value={associateId} disabled={!editing || !canAssignAssociate} onChange={e => { setAssociateId(e.target.value); setError(''); }}>
              <option value="">To be assigned</option>
              {associates.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
          </label>
          <label>Founder contact email
            <input name="email" type="email" value={form.email} disabled={!editing || !canModify} onChange={e => setField('email', e.target.value)} />
          </label>
          <label>Cohort
            <input name="cohort" value={form.cohort} disabled={!editing || !canModify} onChange={e => setField('cohort', e.target.value)} />
          </label>

          {error && <div className={cx(styles.span2, styles.err)} style={{ display: 'block' }}>{error}</div>}

          {editing && (
            <div className={cx(styles.span2, styles.setact)}>
              <button type="button" className={styles.btn} onClick={handleCancel}>Cancel</button>
              <button type="submit" className={cx(styles.btn, styles.btnPrimary)}>Save changes</button>
            </div>
          )}
        </form>
        {saved && !editing && <div className={styles.ok} style={{ display: 'block' }}>Changes saved.</div>}
      </div>

      {canArchive && (
        <div className={cx(styles.card, styles.danger)}>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--weak)' }}>Delete startup</div>
          <p style={{ margin: '6px 0 12px', fontSize: 14 }}>Removes {startup.name} and all its check-ins, reviews, support log, mentor connections and founder portal access. This can&rsquo;t be undone.</p>
          {!deleteOpen && (
            <button className={cx(styles.btn, styles.dangerbtn)} onClick={handleDeleteOpen}>Delete startup</button>
          )}
          {deleteOpen && (
            <div className={styles.delbox}>
              <label style={{ fontSize: 13 }}>
                <span>Type <b>{startup.name}</b> to confirm</span>
                <input autoComplete="off" value={deleteText} onChange={e => { setDeleteText(e.target.value); setDeleteError(false); }} />
              </label>
              {deleteError && <div className={styles.err} style={{ display: 'block' }}>The name doesn&rsquo;t match.</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
                <button className={styles.btn} onClick={handleDeleteCancel}>Cancel</button>
                <button className={cx(styles.btn, styles.dangerfill)} onClick={handleDeleteGo}>Delete permanently</button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
