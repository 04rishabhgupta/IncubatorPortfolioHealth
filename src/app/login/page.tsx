'use client';

import { FormEvent, KeyboardEvent, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, TrendingUp, Zap, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store';
import { demoPasswords } from '@/data/seed/users';
import { createClient } from '@/lib/supabase/client';
import { userFromProfile } from '@/lib/supabase/mappers';
import { DemoCredentialsDialog } from '@/components/auth/DemoCredentialsDialog';
import { LoginShowcase } from '@/components/auth/LoginShowcase';
import { User } from '@/types';

type FieldErrors = { identifier?: string; password?: string };

export default function LoginPage() {
  const login = useStore(s => s.login);
  const hydrate = useStore(s => s.hydrate);
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

  const completeLogin = async (user: User) => {
    login(user);
    try {
      await hydrate();
    } catch (e) {
      console.error('Hydration error:', e);
    }
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
    try {
      const supabase = createClient();
      const raw = identifier.trim().toLowerCase();
      const email = raw.includes('@') ? raw : `${raw}@fitt.demo`;

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        setSubmitting(false);
        setFormError('Incorrect email/user ID or password. Please try again.');
        passwordRef.current?.select();
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profile) {
        await completeLogin(userFromProfile(profile));
      } else {
        await completeLogin({
          id: authData.user.id,
          email: authData.user.email || email,
          role: 'ADMIN',
          label: 'Admin',
        });
      }
    } catch {
      setSubmitting(false);
      setFormError('Connection failed. Please check your credentials and try again.');
    }
  };

  const detectCapsLock = (e: KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(e.getModifierState?.('CapsLock') ?? false);
  };

  const handleDemoUse = async (user: User) => {
    setDemoOpen(false);
    setSubmitting(true);
    setFormError('');
    try {
      const supabase = createClient();
      const pwd = demoPasswords[user.role];
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: pwd,
      });

      if (authError || !authData.user) {
        setSubmitting(false);
        setFormError('Failed to sign in with demo credentials.');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profile) {
        await completeLogin(userFromProfile(profile));
      } else {
        await completeLogin(user);
      }
    } catch {
      setSubmitting(false);
      setFormError('Authentication failed. Please try again.');
    }
  };

  const inputBase =
    'h-12 w-full rounded-xl border bg-zinc-50 px-4 text-[15px] text-zinc-900 placeholder:text-zinc-400 transition-colors outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15 disabled:opacity-60';
  const inputState = (hasError: boolean) =>
    hasError ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15' : 'border-zinc-200 hover:border-zinc-300';

  return (
    <div className="flex min-h-dvh bg-white">
      <LoginShowcase />

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

            {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
              <button
                type="button"
                onClick={() => setDemoOpen(true)}
                aria-haspopup="dialog"
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 text-[15px] font-medium text-zinc-700 transition-colors hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20"
              >
                <Zap className="h-4 w-4" aria-hidden /> Demo Credentials
              </button>
            )}

            <p className="mt-6 text-center text-xs text-zinc-500">
              Secure access · Role-based permissions · FITT, IIT Delhi
            </p>
          </div>
        </div>
      </main>

      {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
        <DemoCredentialsDialog open={demoOpen} onOpenChange={setDemoOpen} onUse={handleDemoUse} />
      )}
    </div>
  );
}
