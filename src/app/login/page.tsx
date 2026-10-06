'use client';

import { FormEvent, KeyboardEvent, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, TrendingUp, Zap, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store';
import { authenticate } from '@/data/seed/users';
import { DemoCredentialsDialog } from '@/components/auth/DemoCredentialsDialog';
import { User } from '@/types';

// Deterministic 0..1 value from a string, so each startup keeps a stable spot on the map.
function seeded(str: string, salt: number) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

function healthTone(score: number | undefined) {
  if (score === undefined) return 'bg-zinc-600';
  if (score >= 70) return 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]';
  if (score >= 50) return 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]';
  return 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.7)]';
}

function ShowcasePanel() {
  const startups = useStore(s => s.startups);
  const active = useMemo(() => startups.filter(s => !s.archived), [startups]);

  const stats = useMemo(() => {
    const scored = active.filter(s => s.investibility);
    const avg = scored.length
      ? Math.round(scored.reduce((sum, s) => sum + (s.investibility?.total ?? 0), 0) / scored.length)
      : 0;
    const atRisk = scored.filter(s => (s.investibility?.total ?? 100) < 50);
    return { avg, atRisk, cohorts: new Set(active.map(s => s.cohort)).size };
  }, [active]);

  const dots = active.slice(0, 14);

  return (
    <aside className="relative hidden overflow-hidden bg-zinc-950 text-white lg:flex lg:sticky lg:top-0 lg:h-dvh lg:w-[52%] lg:flex-col lg:justify-between lg:gap-10 lg:overflow-y-auto lg:px-12 lg:py-10 xl:px-14">
      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-blue-600/25 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 right-0 h-[24rem] w-[24rem] rounded-full bg-indigo-600/15 blur-[120px]" />

      <div className="relative flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-900/40">
          <TrendingUp className="h-5 w-5 text-white" aria-hidden />
        </div>
        <div className="leading-tight">
          <p className="text-base font-semibold text-white">Folio OS</p>
          <p className="text-sm text-zinc-400">Portfolio Health &amp; Governance</p>
        </div>
      </div>

      <div className="relative max-w-2xl space-y-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" aria-hidden />
            Live Portfolio
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300">
            <span className="text-white">{active.length}</span> startups tracked
          </span>
        </div>

        <div className="space-y-4">
          <p className="text-[2.5rem] font-extrabold leading-[1.08] tracking-[-0.04em] xl:text-[3rem]">
            Portfolio Health &amp;
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              Investment Intelligence
            </span>
          </p>
          <p className="max-w-lg text-base text-zinc-400">
            AI-powered investibility scoring, red-flag detection and mentor matching for every startup in your incubator.
          </p>
        </div>

        {/* Health map */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
              backgroundSize: '44px 44px',
            }}
          />
          <div className="relative h-48">
            <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" aria-hidden /> Health map
            </span>
            {dots.map(s => (
              <div
                key={s.id}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
                style={{ left: `${8 + seeded(s.id, 1) * 80}%`, top: `${22 + seeded(s.id, 2) * 62}%` }}
              >
                <span className={`h-3 w-3 rounded-full ${healthTone(s.investibility?.total)}`} />
                <span className="max-w-24 truncate rounded bg-zinc-950/70 px-1 font-mono text-[10px] text-zinc-400">
                  {s.name}
                </span>
              </div>
            ))}
          </div>
          {stats.atRisk.length > 0 && (
            <div className="relative mx-3 mb-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">
                {stats.atRisk.length} {stats.atRisk.length === 1 ? 'startup needs' : 'startups need'} attention
                {stats.atRisk[0] && <span className="text-red-400/70"> · {stats.atRisk[0].name}</span>}
              </span>
            </div>
          )}
        </div>

        <dl className="grid grid-cols-3 gap-3">
          {[
            { label: 'Active startups', value: active.length },
            { label: 'Cohorts', value: stats.cohorts },
            { label: 'Avg. health score', value: stats.avg },
          ].map(item => (
            <div key={item.label} className="flex flex-col rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-center">
              <dt className="order-2 text-xs text-zinc-400">{item.label}</dt>
              <dd className="text-2xl font-bold tabular-nums text-blue-300">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="relative text-xs text-zinc-600">© {new Date().getFullYear()} Folio OS · FITT, IIT Delhi</p>
    </aside>
  );
}

type FieldErrors = { identifier?: string; password?: string };

export default function LoginPage() {
  const login = useStore(s => s.login);
  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const completeLogin = (user: User) => {
    login(user);
    toast.success(`Signed in as ${user.label}`);
    router.push(user.role === 'ADMIN' ? '/admin' : '/portfolio');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setFormError('');

    const errors: FieldErrors = {};
    if (!identifier.trim()) errors.identifier = 'Enter your email or user ID';
    if (!password) errors.password = 'Enter your password';
    setFieldErrors(errors);
    if (errors.identifier) return identifierRef.current?.focus();
    if (errors.password) return passwordRef.current?.focus();

    setSubmitting(true);
    // Simulated network latency so the loading state is perceptible.
    await new Promise(r => setTimeout(r, 450));
    const user = authenticate(identifier, password);

    if (!user) {
      setSubmitting(false);
      // Don't reveal which field was wrong.
      setFormError('Incorrect email/user ID or password. Please try again.');
      passwordRef.current?.select();
      return;
    }
    completeLogin(user);
  };

  const detectCapsLock = (e: KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(e.getModifierState?.('CapsLock') ?? false);
  };

  const handleDemoUse = (user: User) => {
    setDemoOpen(false);
    completeLogin(user);
  };

  const inputBase =
    'h-12 w-full rounded-xl border bg-zinc-50 px-4 text-[15px] text-zinc-900 placeholder:text-zinc-400 transition-colors outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15 disabled:opacity-60';
  const inputState = (hasError: boolean) =>
    hasError ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15' : 'border-zinc-200 hover:border-zinc-300';

  return (
    <div className="flex min-h-dvh bg-white">
      <ShowcasePanel />

      <main className="flex flex-1 flex-col bg-zinc-50">
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-md">
            {/* Compact brand for small screens, where the showcase panel is hidden */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600">
                <TrendingUp className="h-5 w-5 text-white" aria-hidden />
              </div>
              <div className="leading-tight">
                <p className="text-base font-semibold text-zinc-900">Folio OS</p>
                <p className="text-sm text-zinc-500">Portfolio Health &amp; Governance</p>
              </div>
            </div>

            <h1 className="!text-[2rem] !font-bold !tracking-[-0.03em] text-zinc-900">Welcome back</h1>
            <p className="mt-2 text-[15px] text-zinc-500">Sign in to access your portfolio dashboard</p>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7"
            >
              <div aria-live="assertive">
                {formError && (
                  <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>{formError}</span>
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div>
                  <label htmlFor="identifier" className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-zinc-700">
                    Email or User ID
                  </label>
                  <input
                    ref={identifierRef}
                    id="identifier"
                    name="username"
                    type="text"
                    inputMode="email"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoFocus
                    placeholder="you@fitt.demo"
                    value={identifier}
                    onChange={e => {
                      setIdentifier(e.target.value);
                      if (fieldErrors.identifier) setFieldErrors(f => ({ ...f, identifier: undefined }));
                      if (formError) setFormError('');
                    }}
                    disabled={submitting}
                    aria-invalid={!!fieldErrors.identifier || !!formError}
                    aria-describedby={fieldErrors.identifier ? 'identifier-error' : undefined}
                    className={`${inputBase} ${inputState(!!fieldErrors.identifier)}`}
                  />
                  {fieldErrors.identifier && (
                    <p id="identifier-error" className="mt-1.5 text-sm text-red-600">{fieldErrors.identifier}</p>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-[0.08em] text-zinc-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => toast.info('Contact your Folio OS administrator to reset your password.')}
                      className="rounded text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      ref={passwordRef}
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) setFieldErrors(f => ({ ...f, password: undefined }));
                        if (formError) setFormError('');
                      }}
                      onKeyDown={detectCapsLock}
                      onKeyUp={detectCapsLock}
                      onBlur={() => setCapsLock(false)}
                      disabled={submitting}
                      aria-invalid={!!fieldErrors.password || !!formError}
                      aria-describedby={
                        [fieldErrors.password && 'password-error', capsLock && 'capslock-hint'].filter(Boolean).join(' ') || undefined
                      }
                      className={`${inputBase} pr-12 ${inputState(!!fieldErrors.password)}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
                    >
                      {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p id="password-error" className="mt-1.5 text-sm text-red-600">{fieldErrors.password}</p>
                  )}
                  {capsLock && (
                    <p id="capslock-hint" className="mt-1.5 flex items-center gap-1.5 text-sm text-amber-600">
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Caps Lock is on
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-[15px] font-semibold text-white shadow-sm shadow-blue-600/30 transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/30 disabled:cursor-not-allowed disabled:opacity-80"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Signing in…
                    </>
                  ) : (
                    <>
                      Sign in <ArrowRight className="h-4 w-4" aria-hidden />
                    </>
                  )}
                </button>
              </div>
            </form>

            <button
              type="button"
              onClick={() => setDemoOpen(true)}
              aria-haspopup="dialog"
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 text-[15px] font-medium text-zinc-700 transition-colors hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20"
            >
              <Zap className="h-4 w-4" aria-hidden /> Demo Credentials
            </button>

            <p className="mt-6 text-center text-xs text-zinc-500">
              Secure access · Role-based permissions · FITT, IIT Delhi
            </p>
          </div>
        </div>
      </main>

      <DemoCredentialsDialog open={demoOpen} onOpenChange={setDemoOpen} onUse={handleDemoUse} />
    </div>
  );
}
