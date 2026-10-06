import { useRef, useState } from 'react';
import { Startup, User } from '@/types';
import { useStore } from '@/store';
import { parseStartupExcel, generateStartupExcel } from '@/lib/excelService';
import { computeInvestibilityScore, generateAIAnalysis } from '@/lib/aiAnalysis';
import { toast } from 'sonner';
import { Upload, Download, RefreshCw } from 'lucide-react';
import styles from './fitt.module.css';
import { monthLabel, SECTOR_LABELS, STAGE_LABELS } from './helpers';

function displayDomain(url?: string) {
  if (!url) return null;
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export function Header({ startup, manager, associate }: { startup: Startup; manager?: User; associate?: User }) {
  const { updateStartup } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [syncing, setSyncing] = useState(false);

  const tracker = startup.fittTracker;
  if (!tracker) return null;
  const redFlagCount = tracker.redFlags.filter(f => f.value).length;
  const lastCheckin = tracker.monthlyCheckins[tracker.monthlyCheckins.length - 1];
  const lastReview = tracker.sixMonthReviews[tracker.sixMonthReviews.length - 1];
  const domain = displayDomain(startup.website);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSyncing(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const parsed = parseStartupExcel(buffer, startup);
        const updated: Startup = {
          ...startup,
          ...parsed,
          fittTracker: parsed.fittTracker || startup.fittTracker,
        };
        updated.investibility = computeInvestibilityScore(updated);
        updated.aiAnalysis = generateAIAnalysis(updated);
        updateStartup(updated);
        toast.success(`Excel synced for ${startup.name}! Data and AI Diagnostics updated.`);
      } catch (err) {
        console.error('Failed to parse Excel:', err);
        toast.error('Failed to parse Excel file');
      } finally {
        setSyncing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExportExcel = () => {
    try {
      const buffer = generateStartupExcel(startup);
      const blob = new Blob([buffer as Uint8Array<ArrayBuffer>], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${startup.name.replace(/\s+/g, '_')}_FITT_Tracker.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Downloaded latest Excel data sheet');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export Excel');
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.headerCard}>
        <div>
          <div className="heading-display">{startup.name}</div>
          <div style={{ color: 'var(--text-2)', marginTop: 2 }}>{startup.oneLiner}</div>
          <div style={{ marginTop: 8 }}>
            <span className={styles.chip}>{SECTOR_LABELS[startup.sector] || startup.sector}</span>
            {tracker.baseline.tags.map(t => <span className={styles.chip} key={t}>{t}</span>)}
            <span className={styles.chip}>TRL {startup.trl}</span>
            <span className={styles.chip}>{STAGE_LABELS[startup.stage] || startup.stage}</span>
            {tracker.baseline.dpiitRecognised && <span className={styles.chip}>DPIIT recognised</span>}
            {domain && <span className={styles.chip}>{domain}</span>}
          </div>
        </div>
        <div className={styles.textRight}>
          <div>
            Portfolio Head: <b style={{ color: 'var(--text)' }}>{manager?.label || 'Unassigned'}</b>
          </div>
          <div>
            Portfolio Manager: <b style={{ color: 'var(--text)' }}>{associate?.label || 'To be assigned'}</b>
          </div>
          {lastCheckin && <div style={{ fontSize: 12 }}>Last check-in: {monthLabel(lastCheckin.month)}</div>}
          {lastReview && <div style={{ fontSize: 12 }}>Review cycle: {lastReview.cycle}</div>}
          <div style={{ marginTop: 6 }}>
            <span className={`${styles.pill} ${styles.pDanger}`}>{redFlagCount} of {tracker.redFlags.length} red flags</span>
          </div>

          {/* Action buttons for live Excel update and export */}
          <div style={{ marginTop: 10, display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={syncing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'var(--brand)',
                color: '#fff',
                border: 'none',
                padding: '5px 11px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {syncing ? <RefreshCw style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} /> : <Upload style={{ width: 12, height: 12 }} />}
              {syncing ? 'Syncing...' : 'Update via Excel (.xlsx)'}
            </button>
            <button
              onClick={handleExportExcel}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'transparent',
                color: 'var(--brand)',
                border: '1px solid var(--border)',
                padding: '5px 11px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Download style={{ width: 12, height: 12 }} />
              Export Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
