'use client';

import { PointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, FileCheck2, IndianRupee, Sparkles, TrendingUp, UsersRound } from 'lucide-react';
import { useStore } from '@/store';
import { Startup } from '@/types';

// Deterministic 0..1 value from a string, so each startup keeps a stable position.
function seeded(str: string, salt: number) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

type Band = 'healthy' | 'watch' | 'risk';

function bandOf(score: number): Band {
  if (score >= 70) return 'healthy';
  if (score >= 50) return 'watch';
  return 'risk';
}

const BAND = {
  healthy: { dot: 'bg-emerald-400', glow: 'shadow-[0_0_14px_rgba(52,211,153,0.8)]', bar: 'bg-emerald-400', label: 'Healthy ≥70' },
  watch: { dot: 'bg-amber-400', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.6)]', bar: 'bg-amber-400', label: 'Watch 50–69' },
  risk: { dot: 'bg-red-500', glow: 'shadow-[0_0_16px_rgba(239,68,68,0.9)]', bar: 'bg-red-500', label: 'At risk <50' },
} as const;

// Healthier startups orbit closer to the core.
const RINGS: Record<Band, { radius: number; duration: number; reverse?: boolean }> = {
  healthy: { radius: 21, duration: 48 },
  watch: { radius: 33, duration: 80, reverse: true },
  risk: { radius: 45, duration: 110 },
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

function useCountUp(target: number, delay = 0, duration = 1400) {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (reduced) return setValue(target);
    let raf = 0;
    const start = performance.now() + delay;
    const step = (now: number) => {
      const t = Math.min(Math.max((now - start) / duration, 0), 1);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, delay, duration, reduced]);
  return value;
}

type Scored = Startup & { score: number; band: Band };

function Orbit({ startups }: { startups: Scored[] }) {
  const byBand = useMemo(() => {
    const groups: Record<Band, Scored[]> = { healthy: [], watch: [], risk: [] };
    startups.forEach(s => groups[s.band].push(s));
    return groups;
  }, [startups]);

  return (
    <div className="relative aspect-square h-full max-h-full">
      {/* Radar sweep */}
      <div
        aria-hidden
        className="absolute inset-[5%] rounded-full"
        style={{
          background: 'conic-gradient(from 0deg, transparent 0deg 290deg, rgba(59,130,246,0.28) 360deg)',
          animation: 'ls-spin 7s linear infinite',
          maskImage: 'radial-gradient(circle, black 30%, transparent 72%)',
        }}
      />

      {(Object.keys(RINGS) as Band[]).map(band => {
        const ring = RINGS[band];
        const members = byBand[band];
        const spin = `ls-spin ${ring.duration}s linear infinite${ring.reverse ? ' reverse' : ''}`;
        const counterSpin = `ls-spin ${ring.duration}s linear infinite${ring.reverse ? '' : ' reverse'}`;
        return (
          <div key={band} className="absolute inset-0">
            <div
              aria-hidden
              className="absolute rounded-full border border-dashed border-white/[0.09]"
              style={{ inset: `${50 - ring.radius}%` }}
            />
            <div className="absolute inset-0" style={{ animation: spin }}>
              {members.map((s, i) => {
                const angle = ((i + seeded(s.id, 3) * 0.6) / Math.max(members.length, 1)) * Math.PI * 2;
                const x = 50 + ring.radius * Math.cos(angle);
                const y = 50 + ring.radius * Math.sin(angle);
                const tone = BAND[band];
                return (
                  <div
                    key={s.id}
                    className="group absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    {/* Counter-rotate so labels stay upright while the ring turns */}
                    <div className="relative flex flex-col items-center" style={{ animation: counterSpin }}>
                      {band === 'risk' && (
                        <span
                          aria-hidden
                          className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-red-500"
                          style={{ animation: 'ls-ping 2.2s cubic-bezier(0,0,0.2,1) infinite' }}
                        />
                      )}
                      <span className={`relative h-3 w-3 rounded-full ring-2 ring-zinc-950 ${tone.dot} ${tone.glow}`} />
                      <span
                        className={`mt-1 whitespace-nowrap rounded-md border border-white/10 bg-zinc-900/90 px-1.5 py-px font-mono text-[10px] backdrop-blur transition-opacity ${
                          band === 'risk' ? 'text-red-300 opacity-100' : 'text-zinc-300 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {s.name} · {s.score}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Core */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {[0, 1.2].map(delay => (
          <span
            key={delay}
            aria-hidden
            className="absolute inset-0 rounded-2xl border border-blue-400/50"
            style={{ animation: `ls-pulse-ring 2.4s ease-out ${delay}s infinite` }}
          />
        ))}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_60px_rgba(59,130,246,0.55)]">
          <TrendingUp className="h-7 w-7 text-white" aria-hidden />
        </div>
      </div>
    </div>
  );
}

function HealthCard({ startups, avg }: { startups: Scored[]; avg: number }) {
  const shown = useCountUp(avg, 300);
  const bars = useMemo(() => [...startups].sort((a, b) => a.score - b.score), [startups]);

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-zinc-900/70 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Avg. health score</p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className="text-3xl font-bold tabular-nums text-white">{shown}</span>
        <span className="text-sm text-zinc-500">/100</span>
      </p>
      <div className="mt-2 flex h-10 items-end gap-[3px]" aria-label="Investibility score per startup, lowest to highest">
        {bars.map((s, i) => (
          <span
            key={s.id}
            className={`flex-1 origin-bottom rounded-t-sm ${BAND[s.band].bar} opacity-90`}
            style={{
              height: `${Math.max(s.score, 6)}%`,
              animation: `ls-grow 0.7s cubic-bezier(0.22,1,0.36,1) ${0.4 + i * 0.04}s both`,
            }}
          />
        ))}
      </div>
      <p className="mt-2 text-[11px] text-zinc-500">{startups.length} startups · lowest to highest</p>
    </div>
  );
}

type FeedEvent = { id: string; title: string; subject: string; icon: typeof Sparkles; tone: string };

function buildEvents(startups: Scored[]): FeedEvent[] {
  const neutral = [
    { title: 'Monthly check-in submitted', icon: FileCheck2, tone: 'bg-blue-500/15 text-blue-300' },
    { title: 'Mentor matched', icon: UsersRound, tone: 'bg-violet-500/15 text-violet-300' },
    { title: 'Grant tranche disbursed', icon: IndianRupee, tone: 'bg-amber-500/15 text-amber-300' },
  ];
  return [...startups]
    .sort((a, b) => seeded(a.id, 9) - seeded(b.id, 9))
    .map((s, i) => {
      if (s.band === 'risk')
        return { id: s.id, title: 'AI flagged a red flag', subject: s.name, icon: AlertTriangle, tone: 'bg-red-500/15 text-red-300' };
      if (s.band === 'healthy')
        return {
          id: s.id,
          title: `Investibility rated ${s.investibility?.grade ?? 'A'}`,
          subject: s.name,
          icon: Sparkles,
          tone: 'bg-emerald-500/15 text-emerald-300',
        };
      return { id: s.id, subject: s.name, ...neutral[i % neutral.length] };
    });
}

const AGO = ['just now', '2m ago', '6m ago'];

function ActivityFeed({ startups }: { startups: Scored[] }) {
  const events = useMemo(() => buildEvents(startups), [startups]);
  const reduced = usePrefersReducedMotion();
  const [tick, setTick] = useState(2);

  useEffect(() => {
    if (reduced || events.length < 2) return;
    const t = setInterval(() => setTick(n => n + 1), 3200);
    return () => clearInterval(t);
  }, [reduced, events.length]);

  if (!events.length) return null;

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-zinc-900/70 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Live activity</p>
        <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ animation: 'ls-blink 1.6s ease-in-out infinite' }} />
          Live
        </span>
      </div>
      <ul className="space-y-1.5" aria-live="off">
        {[0, 1, 2].map(i => {
          const key = tick - i;
          const e = events[((key % events.length) + events.length) % events.length];
          const Icon = e.icon;
          return (
            <li
              key={key}
              className={`flex items-center gap-2.5 rounded-xl bg-white/[0.03] px-2.5 py-2 ${i === 2 ? '[@media(max-height:880px)]:hidden' : ''}`}
              style={{ opacity: 1 - i * 0.28, animation: i === 0 ? 'ls-feed-in 0.5s cubic-bezier(0.22,1,0.36,1)' : undefined }}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${e.tone}`}>
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium leading-tight text-zinc-100">{e.title}</span>
                <span className="block truncate text-[11px] leading-tight text-zinc-500">{e.subject}</span>
              </span>
              <span className="shrink-0 text-[10px] text-zinc-500">{AGO[i]}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Stat({ label, value, delay }: { label: string; value: number; delay: number }) {
  const shown = useCountUp(value, delay);
  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-center backdrop-blur">
      <dt className="order-2 text-xs text-zinc-400">{label}</dt>
      <dd className="text-2xl font-bold tabular-nums text-blue-300">{shown}</dd>
    </div>
  );
}

export function LoginShowcase() {
  const startups = useStore(s => s.startups);
  const panelRef = useRef<HTMLElement>(null);

  const scored = useMemo<Scored[]>(
    () =>
      startups
        .filter(s => !s.archived && s.investibility)
        .map(s => {
          const score = Math.round(s.investibility!.total);
          return { ...s, score, band: bandOf(score) };
        }),
    [startups],
  );

  const stats = useMemo(() => {
    const avg = scored.length ? Math.round(scored.reduce((sum, s) => sum + s.score, 0) / scored.length) : 0;
    return {
      avg,
      active: startups.filter(s => !s.archived).length,
      cohorts: new Set(startups.filter(s => !s.archived).map(s => s.cohort)).size,
      healthy: scored.filter(s => s.band === 'healthy').length,
      risk: scored.filter(s => s.band === 'risk').length,
    };
  }, [scored, startups]);

  // Subtle parallax: write pointer position to CSS variables, no re-render.
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const el = panelRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--px', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    el.style.setProperty('--py', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  };
  const onPointerLeave = () => {
    panelRef.current?.style.setProperty('--px', '0');
    panelRef.current?.style.setProperty('--py', '0');
  };
  const parallax = (depth: number) => ({
    transform: `translate3d(calc(var(--px, 0) * ${depth}px), calc(var(--py, 0) * ${depth}px), 0)`,
    transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1)',
  });

  return (
    <aside
      ref={panelRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="login-showcase relative hidden overflow-hidden bg-zinc-950 text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-[52%] lg:flex-col lg:gap-6 lg:px-12 lg:py-10 xl:px-14"
    >
      {/* Drifting aurora + masked grid */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-blue-600/25 blur-[130px]" style={{ animation: 'ls-drift 18s ease-in-out infinite' }} />
        <div className="absolute -bottom-48 right-[-10%] h-[30rem] w-[30rem] rounded-full bg-indigo-600/20 blur-[130px]" style={{ animation: 'ls-drift 22s ease-in-out -6s infinite reverse' }} />
        <div className="absolute right-1/3 top-1/3 h-72 w-72 rounded-full bg-cyan-500/10 blur-[110px]" style={{ animation: 'ls-drift 26s ease-in-out -12s infinite' }} />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 55%, black, transparent)',
            animation: 'ls-grid-pan 30s linear infinite',
          }}
        />
      </div>

      <div className="relative flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-900/40">
          <TrendingUp className="h-5 w-5 text-white" aria-hidden />
        </div>
        <div className="leading-tight">
          <p className="text-base font-semibold text-white">Folio OS</p>
          <p className="text-sm text-zinc-400">Portfolio Health &amp; Governance</p>
        </div>
      </div>

      <div className="relative max-w-2xl space-y-3" style={{ animation: 'ls-feed-in 0.8s cubic-bezier(0.22,1,0.36,1) both' }}>
        <p className="text-[2.25rem] font-extrabold leading-[1.08] tracking-[-0.04em] xl:text-[2.75rem]">
          Portfolio Health &amp;
          <span className="block bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-[length:200%_auto] bg-clip-text text-transparent" style={{ animation: 'ls-shimmer 6s linear infinite' }}>
            Investment Intelligence
          </span>
        </p>
        <p className="max-w-lg text-[15px] text-zinc-400">
          Every startup in your incubator, scored, monitored and flagged in real time.
        </p>
      </div>

      {/* Visual stage */}
      <div className="relative flex min-h-[300px] flex-1 gap-4">
        <div className="relative min-w-0 flex-1">
          <div className="absolute inset-0 flex items-center justify-center" style={parallax(-10)}>
            <Orbit startups={scored} />
          </div>

          {stats.risk > 0 && (
            <div className="absolute left-0 top-0" style={parallax(12)}>
              <div
                className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 backdrop-blur"
                style={{ animation: 'ls-float 6s ease-in-out -1.5s infinite' }}
              >
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                {stats.risk} need attention
              </div>
            </div>
          )}

          <ul className="absolute bottom-0 left-0 flex flex-col gap-1 text-[11px] text-zinc-400" aria-label="Orbit legend">
            {(Object.keys(BAND) as Band[]).map(b => (
              <li key={b} className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${BAND[b].dot}`} aria-hidden />
                {BAND[b].label}
              </li>
            ))}
            <li className="text-zinc-600">Closer to core = healthier</li>
          </ul>
        </div>

        <div className="relative flex w-64 shrink-0 flex-col justify-center gap-3 xl:w-72">
          <div style={parallax(16)}>
            <div style={{ animation: 'ls-float 7s ease-in-out infinite' }}>
              <HealthCard startups={scored} avg={stats.avg} />
            </div>
          </div>
          <div style={parallax(22)}>
            <div style={{ animation: 'ls-float 8s ease-in-out -3s infinite' }}>
              <ActivityFeed startups={scored} />
            </div>
          </div>
        </div>
      </div>

      <dl className="relative grid grid-cols-3 gap-3">
        <Stat label="Active startups" value={stats.active} delay={200} />
        <Stat label="Cohorts" value={stats.cohorts} delay={350} />
        <Stat label="Healthy (≥70)" value={stats.healthy} delay={500} />
      </dl>

      <p className="relative text-xs text-zinc-600">© {new Date().getFullYear()} Folio OS · FITT, IIT Delhi</p>
    </aside>
  );
}
