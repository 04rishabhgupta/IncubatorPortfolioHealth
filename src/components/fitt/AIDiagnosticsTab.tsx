'use client';

import React, { useRef, useState } from 'react';
import { Startup, MonthlyMetrics } from '@/types';
import { useStore } from '@/store';
import { parseStartupExcel, generateStartupExcel } from '@/lib/excelService';
import styles from './fitt.module.css';
import { cx } from './helpers';
import { computeInvestibilityScore, generateAIAnalysis, detectRedFlags } from '@/lib/aiAnalysis';
import { uploadAuditExcelAction } from '@/app/actions/storage';
import { recomputeStartupAiAnalysisAction } from '@/app/actions/aiAnalysis';
import { Sparkles, ShieldAlert, AlertTriangle, CheckCircle, Award, FileSpreadsheet, Upload, Download, RefreshCw, Cpu } from 'lucide-react';
import { toast } from 'sonner';

export function AIDiagnosticsTab({ startup, metrics }: { startup: Startup; metrics?: MonthlyMetrics[] }) {
  const { updateStartup } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [syncing, setSyncing] = useState(false);
  const [recomputingAi, setRecomputingAi] = useState(false);

  const investibility = startup.investibility || computeInvestibilityScore(startup, metrics);
  const redFlags = startup.aiAnalysis?.redFlags || detectRedFlags(startup, metrics);
  const aiAnalysis = startup.aiAnalysis || generateAIAnalysis(startup, metrics);

  const b = investibility.breakdown;

  const handleRecomputeAi = async () => {
    setRecomputingAi(true);
    try {
      const res = await recomputeStartupAiAnalysisAction(startup.id);
      if (res.error) {
        toast.error(`AI recomputation failed: ${res.error}`);
      } else {
        toast.success('Deep AI diagnostics and investibility recomputed and saved!');
      }
    } catch {
      toast.error('Failed to run AI diagnostics');
    } finally {
      setRecomputingAi(false);
    }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSyncing(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const parsed = parseStartupExcel(buffer, startup);
        const updatedStartup: Startup = {
          ...startup,
          ...parsed,
          fittTracker: parsed.fittTracker || startup.fittTracker,
        };
        // Automatically re-calculate AI investibility & red flags from new Excel data
        updatedStartup.investibility = computeInvestibilityScore(updatedStartup, metrics);
        updatedStartup.aiAnalysis = generateAIAnalysis(updatedStartup, metrics);

        // Archive to private storage for auditing
        try {
          const formData = new FormData();
          formData.append('startupId', startup.id);
          formData.append('file', file);
          await uploadAuditExcelAction(formData);
        } catch (uploadErr) {
          console.warn('Storage audit upload failed:', uploadErr);
        }

        const res = await updateStartup(updatedStartup);
        if (res?.error) {
          toast.error(`Failed to update startup: ${res.error}`);
          return;
        }
        toast.success(`Excel data updated and archived! AI Diagnostics recalculated.`);
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
      a.download = `${startup.name.replace(/\s+/g, '_')}_AI_Report.xlsx`;
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
    <section className={styles.panel}>
      {/* Live Excel Sync & Recalculation Bar */}
      <div
        className={styles.card}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '14px 20px',
          marginBottom: '16px',
          borderLeft: '4px solid var(--brand)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet style={{ width: '18px', height: '18px', color: 'var(--brand)' }} />
            <b style={{ fontSize: '13px', color: 'var(--brand)' }}>Live Excel Sync & AI Diagnostic Recalculation</b>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '2px', marginBottom: 0 }}>
            Upload or update any parameter sheet (.xlsx) to automatically refresh investibility scores, red flags, and metrics in real-time.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleExcelUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={syncing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--brand)',
              color: '#fff',
              border: 'none',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {syncing ? <RefreshCw style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Upload style={{ width: 14, height: 14 }} />}
            {syncing ? 'Re-analyzing Excel...' : 'Upload Updated Excel (.xlsx)'}
          </button>
          <button
            onClick={handleExportExcel}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#fff',
              color: 'var(--brand)',
              border: '1px solid var(--border)',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Download style={{ width: 14, height: 14 }} />
            Export Current Sheet
          </button>
          <button
            onClick={handleRecomputeAi}
            disabled={recomputingAi}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#F1F5F9',
              color: '#334155',
              border: '1px solid #CBD5E1',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {recomputingAi ? (
              <RefreshCw style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
            ) : (
              <Cpu style={{ width: 14, height: 14, color: '#4F46E5' }} />
            )}
            {recomputingAi ? 'Recomputing AI...' : 'Re-run Deep AI Diagnostics'}
          </button>
        </div>
      </div>

      {/* Top Investibility Hero */}
      <div className={styles.card} style={{ background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)', color: '#fff', border: 'none', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles style={{ width: '20px', height: '20px', color: '#93C5FD' }} />
              <span style={{ textTransform: 'uppercase', letterSpacing: '.06em', fontSize: '11px', fontWeight: 700, color: '#BFDBFE' }}>
                AI Investibility Evaluation
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '6px' }}>
              <span style={{ fontSize: '42px', fontWeight: 900, lineHeight: 1 }}>{investibility.total}/100</span>
              <span
                style={{
                  background: 'var(--strong)',
                  color: '#fff',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 800,
                }}
              >
                Grade {investibility.grade}
              </span>
            </div>
            <p style={{ marginTop: '10px', fontSize: '13px', color: 'rgba(255, 255, 255, .85)', maxWidth: '640px', lineHeight: 1.5 }}>
              {investibility.recommendation}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', minWidth: '240px' }}>
            <div style={{ background: 'rgba(255, 255, 255, .1)', padding: '8px 12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, .7)', display: 'block' }}>Team</span>
              <b style={{ fontSize: '16px' }}>{b.teamScore}/20</b>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, .1)', padding: '8px 12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, .7)', display: 'block' }}>Market</span>
              <b style={{ fontSize: '16px' }}>{b.marketScore}/25</b>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, .1)', padding: '8px 12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, .7)', display: 'block' }}>Technology & IP</span>
              <b style={{ fontSize: '16px' }}>{b.technologyScore}/20</b>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, .1)', padding: '8px 12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, .7)', display: 'block' }}>Traction</span>
              <b style={{ fontSize: '16px' }}>{b.tractionScore}/15</b>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Red Flags vs Strengths */}
      <div className={cx(styles.grid, styles.g2)}>
        {/* Red flags */}
        <div className={styles.card} style={{ borderLeft: '4px solid var(--weak)' }}>
          <p className={styles.lbl} style={{ color: 'var(--weak)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert style={{ width: '16px', height: '16px' }} />
            Active AI Red Flags ({redFlags.length})
          </p>
          {redFlags.length === 0 ? (
            <div style={{ padding: '12px', background: 'var(--ok-bg)', borderRadius: '8px', color: 'var(--strong)', fontSize: '13px' }}>
              No critical red flags currently flagged by the diagnostic system.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              {redFlags.map((flag, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--danger-bg)',
                    border: '1px solid #F5C2C7',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '12px',
                    color: 'var(--weak)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    lineHeight: 1.4,
                  }}
                >
                  <AlertTriangle style={{ width: '14px', height: '14px', flexShrink: 0, marginTop: '2px' }} />
                  <span>{flag}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Strengths & Competitive Moats */}
        <div className={styles.card} style={{ borderLeft: '4px solid var(--strong)' }}>
          <p className={styles.lbl} style={{ color: 'var(--strong)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award style={{ width: '16px', height: '16px' }} />
            Core Strengths & Competitive Moats
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
            {investibility.strengths.map((str, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--ok-bg)',
                  border: '1px solid #C3E6CB',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '12px',
                  color: 'var(--strong)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  lineHeight: 1.4,
                }}
              >
                <CheckCircle style={{ width: '14px', height: '14px', flexShrink: 0, marginTop: '2px' }} />
                <span>{str}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Automated Thesis & Recommended Actions */}
      <div className={cx(styles.grid, styles.g2e)}>
        <div className={styles.card}>
          <p className={styles.lbl}>Automated Investment Thesis</p>
          <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text)', marginTop: '8px' }}>
            {aiAnalysis.thesis}
          </p>
          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--line)', fontSize: '12px', color: 'var(--text-2)' }}>
            Last evaluated on: <b>{aiAnalysis.lastAnalyzed}</b> by Folio OS Deeptech Diagnostic Engine
          </div>
        </div>

        <div className={styles.card}>
          <p className={styles.lbl}>Recommended PM / Associate Action Plan</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {aiAnalysis.actionItems.map((item, idx) => (
              <li
                key={idx}
                style={{
                  fontSize: '12px',
                  color: 'var(--text)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  lineHeight: 1.4,
                }}
              >
                <span style={{ color: 'var(--strong)', fontWeight: 800 }}>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
