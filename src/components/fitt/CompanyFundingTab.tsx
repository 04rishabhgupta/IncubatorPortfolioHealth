import React, { useState } from 'react';
import { FittTracker } from '@/types';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Send, Presentation } from 'lucide-react';
import { ConnectStartupModal } from '@/components/demoday/ConnectStartupModal';
import styles from './fitt.module.css';
import { cx, fmtCr } from './helpers';

import { DonutChartComponent, HorizontalBarChartComponent } from './charts';

export function CompanyFundingTab({
  tracker,
  startupId,
  startupName,
}: {
  tracker: FittTracker;
  startupId?: string;
  startupName?: string;
}) {
  const { pitchConnections, investors } = useStore();
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const b = tracker.baseline;

  const startupPitches = startupId
    ? pitchConnections.filter((p) => p.startupId === startupId)
    : [];

  return (
    <section className={styles.panel}>
      <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
        {b.founders.map(f => (
          <div className={cx(styles.card, styles.founder)} key={f.name}>
            <b>{f.name}</b><br />
            {f.role} &middot;{' '}
            {f.commitment === 'PART_TIME'
              ? <span style={{ color: 'var(--weak)' }}>part-time</span>
              : 'full-time'}
            <br />
            <span className={styles.note}>{f.note}{f.flag ? ` · ${f.flag}` : ''}</span>
          </div>
        ))}
      </div>

      <div className={styles.card}>
        <p className={styles.lbl}>Cap table (fully diluted, as-converted)</p>
        <DonutChartComponent
          data={b.capTable.map(c => ({
            name: c.holder,
            value: c.pct,
            color: c.color,
          }))}
          centerLabel="Equity"
          centerValue="100%"
          height={240}
        />
        {b.capTableNote && <p className={styles.note} style={{ marginTop: 8 }}>{b.capTableNote}</p>}
      </div>

      <div className={cx(styles.grid, styles.g2)}>
        <div className={styles.card}>
          <p className={styles.lbl}>Funding ledger (₹ Cr)</p>
          <HorizontalBarChartComponent
            data={b.funding.map(f => ({
              label: f.label,
              value: f.amountCr,
              max: b.fundingWidthDenominatorCr,
              color: f.kind === 'GRANT' ? '#16A34A' : f.kind === 'SIGNING' ? '#A1A1AA' : '#2563EB',
              unit: ' Cr',
              badge: f.kind === 'GRANT' ? 'Grant' : f.kind === 'SIGNING' ? 'Signing' : 'Equity',
            }))}
            valuePrefix="₹"
            valueSuffix=" Cr"
            height={200}
          />
        </div>
        <div className={styles.card}>
          <p className={styles.lbl}>Valuation</p>
          <div style={{ fontSize: 14 }}>
            Round 1 post-money <b>{fmtCr(b.roundPostMoneyCr)}</b> &rarr; current pre-money <b>{fmtCr(b.currentPreMoneyCr)}</b>{' '}
            <span className={cx(styles.pill, styles.pDanger)}>Down round</span>
          </div>
          <p className={styles.lbl} style={{ marginTop: 18 }}>Use of funds (current round)</p>
          <DonutChartComponent
            data={b.useOfFunds.map(u => ({
              name: u.label,
              value: u.pct,
              color: u.color,
            }))}
            centerLabel="Funds"
            centerValue="100%"
            height={180}
            innerRadius={45}
            outerRadius={68}
          />
        </div>
      </div>

      <div className={styles.card}>
        <p className={styles.lbl}>Identity and IP facts</p>
        <table className={styles.table}>
          <tbody>
            <tr><td style={{ width: 220 }} className={styles.note}>CIN</td><td>{b.cin} &middot; {b.roc} &middot; incorporated {b.incorporatedOn}</td></tr>
            <tr><td className={styles.note}>Locations</td><td>{b.locations}</td></tr>
            <tr><td className={styles.note}>IP status</td><td>{b.ipStatusNote}</td></tr>
            <tr><td className={styles.note}>Tech transfer</td><td>{b.techTransferNote}</td></tr>
            <tr><td className={styles.note}>Total raised</td><td>{b.totalRaisedNote}</td></tr>
          </tbody>
        </table>
      </div>

      {/* Demo Day & Investor Introductions Section */}
      <div className={styles.card} style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <p className={styles.lbl} style={{ margin: 0 }}>Investor & VC Pitches (Demo Day)</p>
            <span className={styles.note}>Active venture capital connections, pitch tracks, and syndicate introductions</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Link href="/demo-day" style={{ textDecoration: 'none' }}>
              <Button size="sm" variant="outline" className="text-xs">
                <Presentation className="h-3 w-3 mr-1" />
                Demo Day Platform
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => setConnectModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
            >
              <Send className="h-3 w-3 mr-1" />
              Pitch to Investor
            </Button>
          </div>
        </div>

        {startupPitches.length === 0 ? (
          <div style={{ padding: '20px', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 8px 0' }}>
              No pitch connections recorded for {startupName || 'this startup'} yet.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConnectModalOpen(true)}
              className="text-xs text-blue-600 border-blue-200"
            >
              <Send className="h-3 w-3 mr-1.5" />
              Introduce to an Investor or VC
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {startupPitches.map((p) => {
              const inv = investors.find((i) => i.id === p.investorId);
              return (
                <div
                  key={p.id}
                  style={{
                    padding: '12px 16px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <b style={{ fontSize: '13px', color: '#0F172A' }}>{inv?.firm || 'Investor Firm'}</b>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>
                        ({inv?.name || 'Partner'} &middot; {p.round})
                      </span>
                      <Badge className="text-[10px] bg-blue-100 text-blue-800 border-blue-200 font-semibold">
                        {p.status}
                      </Badge>
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', marginTop: 4 }}>
                      Ask: <b style={{ color: '#059669' }}>{p.askAmount}</b>
                      {p.nextAction && <span> &middot; Next: {p.nextAction}</span>}
                    </div>
                    {p.notes && (
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: 2 }}>
                        {p.notes}
                      </div>
                    )}
                  </div>
                  <Link href="/demo-day">
                    <Button size="sm" variant="ghost" className="text-xs text-blue-600">
                      Manage Track &rarr;
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConnectStartupModal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        preselectedStartupId={startupId}
      />
    </section>
  );
}
