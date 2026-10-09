'use client';

import { useState } from 'react';
import { Startup, User } from '@/types';
import { useStore } from '@/store';
import { can } from '@/lib/rbac';
import { getRunwayMonths } from '@/lib/derived';
import styles from './fitt.module.css';
import { cx } from './helpers';
import { Header } from './Header';
import { OverviewTab } from './OverviewTab';
import { MonthlyCheckinTab } from './MonthlyCheckinTab';
import { SixMonthReviewTab } from './SixMonthReviewTab';
import { CompanyFundingTab } from './CompanyFundingTab';
import { StrategyTab } from './StrategyTab';
import { DueDiligenceTab } from './DueDiligenceTab';
import { SupportLogTab } from './SupportLogTab';
import { SettingsTab } from './SettingsTab';
import { TaskDialog } from './TaskDialog';
import { MentorHub } from './MentorHub';
import { AIDiagnosticsTab } from './AIDiagnosticsTab';

type TabKey = 'overview' | 'ai' | 'monthly' | 'review' | 'company' | 'strategy' | 'dd' | 'support' | 'settings';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'ai', label: 'AI Diagnostics & Investibility' },
  { key: 'monthly', label: 'Monthly check-in' },
  { key: 'review', label: '6-month review' },
  { key: 'company', label: 'Company and funding' },
  { key: 'strategy', label: 'Strategy' },
  { key: 'dd', label: 'Due diligence' },
  { key: 'support', label: 'Support log' },
  { key: 'settings', label: 'Settings' },
];

type DialogCtx = { kind: 'task'; n: number; tab: 'details' | 'mentors' } | { kind: 'hub' } | null;

export function FittStartupPage({ startup, currentUser }: { startup: Startup; currentUser: User }) {
  const { metrics, teams, mentors, mentorMatches, mentorRequests, users } = useStore();
  const [tab, setTab] = useState<TabKey>('overview');
  const [dialogCtx, setDialogCtx] = useState<DialogCtx>(null);

  const tracker = startup.fittTracker;
  if (!tracker) return null;

  const manager = users.find(u => u.id === startup.managerId);
  const associate = users.find(u => u.id === startup.associateId);
  const founder = teams.find(t => t.startupId === startup.id && t.isFounder && /CEO/i.test(t.role))
    || teams.find(t => t.startupId === startup.id && t.isFounder);

  const sMetrics = metrics.filter(m => m.startupId === startup.id).sort((a, b) => b.month.localeCompare(a.month));
  const latestMetrics = sMetrics[0];
  const runway = getRunwayMonths(startup.id, metrics);

  const canModify = can(currentUser, 'edit_startup', startup);
  const canAssignManager = can(currentUser, 'reassign_manager', startup);
  const canAssignAssociate = can(currentUser, 'assign_associate', startup);
  const canArchive = currentUser.role === 'ADMIN' || (currentUser.role === 'INVESTMENT_MANAGER' && startup.managerId === currentUser.id);

  const activeTask = dialogCtx?.kind === 'task' ? tracker.supportLog.find(t => t.n === dialogCtx.n) : undefined;

  return (
    <div className={styles.root}>
      <Header startup={startup} manager={manager} associate={associate} />

      <div className={styles.tabs}>
        {TABS.map(t => (
          <button key={t.key} className={cx(styles.tab, tab === t.key && styles.tabOn)} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <OverviewTab
          startupId={startup.id}
          tracker={tracker}
          latestMetrics={latestMetrics}
          runway={runway}
          founderName={founder?.name || 'the founder'}
          actor={currentUser.label}
          investibility={startup.investibility}
        />
      )}
      {tab === 'ai' && <AIDiagnosticsTab startup={startup} metrics={sMetrics} />}
      {tab === 'monthly' && <MonthlyCheckinTab tracker={tracker} />}
      {tab === 'review' && <SixMonthReviewTab tracker={tracker} />}
      {tab === 'company' && <CompanyFundingTab tracker={tracker} startupId={startup.id} startupName={startup.name} />}
      {tab === 'strategy' && <StrategyTab tracker={tracker} />}
      {tab === 'dd' && <DueDiligenceTab tracker={tracker} />}
      {tab === 'support' && (
        <SupportLogTab
          startupId={startup.id}
          tracker={tracker}
          mentors={mentors}
          mentorMatches={mentorMatches}
          mentorRequests={mentorRequests}
          onOpenTask={(n) => setDialogCtx({ kind: 'task', n, tab: 'details' })}
          onOpenHub={() => setDialogCtx({ kind: 'hub' })}
        />
      )}
      {tab === 'settings' && (
        <SettingsTab
          startup={startup}
          currentUser={currentUser}
          allUsers={users}
          founderEmail={founder?.email || ''}
          canAssignManager={canAssignManager}
          canAssignAssociate={canAssignAssociate}
          canArchive={canArchive}
          canModify={canModify}
        />
      )}

      {dialogCtx?.kind === 'task' && activeTask && (
        <TaskDialog
          startupId={startup.id}
          tracker={tracker}
          task={activeTask}
          initialTab={dialogCtx.tab}
          mentors={mentors}
          mentorMatches={mentorMatches}
          mentorRequests={mentorRequests}
          onClose={() => setDialogCtx(null)}
        />
      )}
      {dialogCtx?.kind === 'hub' && (
        <MentorHub
          startupId={startup.id}
          startupName={startup.name}
          tracker={tracker}
          mentors={mentors}
          mentorMatches={mentorMatches}
          mentorRequests={mentorRequests}
          onClose={() => setDialogCtx(null)}
        />
      )}
    </div>
  );
}
