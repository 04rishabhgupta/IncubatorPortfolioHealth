'use client';

import { useState } from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { ArrowRight, Check, Copy, Zap, X, ShieldCheck, Briefcase, UserRound } from 'lucide-react';
import { users, demoPasswords } from '@/data/seed/users';
import { Role, User } from '@/types';

type RoleConfig = {
  role: Role;
  title: string;
  description: string;
  icon: typeof ShieldCheck;
  // Tailwind classes per role, kept literal so they survive purging
  card: string;
  badge: string;
  field: string;
  label: string;
  value: string;
  chipActive: string;
  button: string;
};

const ROLES: RoleConfig[] = [
  {
    role: 'ADMIN',
    title: 'Admin',
    description: 'Full access — manage users, managers, the entire portfolio and system settings.',
    icon: ShieldCheck,
    card: 'border-violet-200 bg-violet-50/60',
    badge: 'border-violet-200 bg-white text-violet-800',
    field: 'border-violet-200 bg-white',
    label: 'text-violet-400',
    value: 'text-violet-900',
    chipActive: 'border-violet-600 bg-violet-600 text-white',
    button: 'bg-violet-600 hover:bg-violet-700 focus-visible:ring-violet-600/40',
  },
  {
    role: 'INVESTMENT_MANAGER',
    title: 'Investment Manager',
    description: 'Own a portfolio, assign associates, review assessments and approve submissions.',
    icon: Briefcase,
    card: 'border-blue-200 bg-blue-50/60',
    badge: 'border-blue-200 bg-white text-blue-800',
    field: 'border-blue-200 bg-white',
    label: 'text-blue-400',
    value: 'text-blue-900',
    chipActive: 'border-blue-600 bg-blue-600 text-white',
    button: 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-600/40',
  },
  {
    role: 'INVESTMENT_ASSOCIATE',
    title: 'Investment Associate',
    description: 'Track assigned startups, log check-ins and support. Cannot manage users.',
    icon: UserRound,
    card: 'border-emerald-200 bg-emerald-50/60',
    badge: 'border-emerald-200 bg-white text-emerald-800',
    field: 'border-emerald-200 bg-white',
    label: 'text-emerald-500',
    value: 'text-emerald-900',
    chipActive: 'border-emerald-600 bg-emerald-600 text-white',
    button: 'bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-600/40',
  },
];

function CopyField({ label, value, cfg }: { label: string; value: string; cfg: RoleConfig }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked (insecure context / permissions); the value stays selectable.
    }
  };

  return (
    <div className={`flex h-10 items-center gap-3 rounded-lg border pl-3 pr-1 ${cfg.field}`}>
      <span className={`w-12 shrink-0 font-mono text-[11px] font-medium uppercase tracking-wider ${cfg.label}`}>
        {label}
      </span>
      <span className={`flex-1 truncate font-mono text-sm select-all ${cfg.value}`}>{value}</span>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? `${label} copied` : `Copy ${label.toLowerCase()}`}
        className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

function RoleCard({ cfg, onUse }: { cfg: RoleConfig; onUse: (user: User) => void }) {
  const accounts = users.filter(u => u.role === cfg.role);
  const [selectedId, setSelectedId] = useState(accounts[0]?.id);
  const selected = accounts.find(u => u.id === selectedId) ?? accounts[0];
  const Icon = cfg.icon;

  if (!selected) return null;

  return (
    <section className={`rounded-xl border p-4 sm:p-5 ${cfg.card}`} aria-label={`${cfg.title} demo account`}>
      <div className="flex items-center justify-between gap-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${cfg.badge}`}>
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {cfg.title}
        </span>
        <button
          type="button"
          onClick={() => onUse(selected)}
          className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold text-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-4 ${cfg.button}`}
        >
          Use this <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <p className="mt-3 text-sm text-zinc-600">{cfg.description}</p>

      {accounts.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Choose ${cfg.title} account`}>
          {accounts.map((u, i) => {
            const active = u.id === selected.id;
            return (
              <button
                key={u.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelectedId(u.id)}
                className={`h-7 rounded-md border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
                  active ? cfg.chipActive : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900'
                }`}
              >
                #{i + 1}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-3 space-y-2">
        <CopyField label="Email" value={selected.email} cfg={cfg} />
        <CopyField label="Pass" value={demoPasswords[cfg.role]} cfg={cfg} />
      </div>
    </section>
  );
}

export function DemoCredentialsDialog({
  open,
  onOpenChange,
  onUse,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUse: (user: User) => void;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-sm duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-zinc-950/10 outline-none duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
          <header className="flex items-start gap-3 border-b border-zinc-200 bg-gradient-to-b from-blue-50/60 to-white px-5 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Zap className="h-4 w-4" aria-hidden />
            </div>
            <div className="flex-1">
              <DialogPrimitive.Title className="text-base font-semibold tracking-tight text-zinc-900">
                Demo Credentials
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm text-zinc-500">
                Pick a role to sign in instantly, or copy the details into the form.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
            {ROLES.map(cfg => (
              <RoleCard key={cfg.role} cfg={cfg} onUse={onUse} />
            ))}
          </div>

          <footer className="border-t border-zinc-200 px-5 py-3 text-center text-xs text-zinc-500">
            Press <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd>, click outside, or{' '}
            <DialogPrimitive.Close className="font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900">
              dismiss
            </DialogPrimitive.Close>{' '}
            to close
          </footer>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
