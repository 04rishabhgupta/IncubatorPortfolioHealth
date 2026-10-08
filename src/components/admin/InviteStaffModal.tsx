'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Role } from '@/types';
import { UserPlus, Loader2, Shield, Briefcase, UserCheck, AlertCircle } from 'lucide-react';

interface InviteStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteStaffModal({ open, onOpenChange }: InviteStaffModalProps) {
  const { users, inviteStaffUser } = useStore();
  const [email, setEmail] = useState('');
  const [label, setLabel] = useState('');
  const [role, setRole] = useState<Role>('INVESTMENT_ASSOCIATE');
  const [managerId, setManagerId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Portfolio Heads available to supervise Portfolio Managers
  const portfolioHeads = users.filter((u) => u.role === 'INVESTMENT_MANAGER');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid official email address.');
      return;
    }
    if (!label.trim()) {
      setErrorMsg('Please enter the full name of the staff member.');
      return;
    }
    if (role === 'INVESTMENT_ASSOCIATE' && !managerId) {
      setErrorMsg('Portfolio Managers must report to a supervising Portfolio Head.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await inviteStaffUser({
        email: email.trim().toLowerCase(),
        label: label.trim(),
        role,
        managerId: role === 'INVESTMENT_ASSOCIATE' ? managerId : null,
      });

      if (res.error) {
        setErrorMsg(res.error);
        setSubmitting(false);
        return;
      }

      toast.success(`Invitation sent to ${label} (${email})`, {
        description: 'An official Supabase Auth invitation link has been dispatched.',
      });
      onOpenChange(false);
      setEmail('');
      setLabel('');
      setRole('INVESTMENT_ASSOCIATE');
      setManagerId('');
    } catch {
      setErrorMsg('Failed to invite staff member. Please check server logs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-border shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-primary mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-primary" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Invite Incubator Staff Member
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Invite a new team member to IIT Delhi FITT Folio OS. They will receive an email invitation to set up their account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="staff-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Official Email
            </Label>
            <Input
              id="staff-email"
              type="email"
              placeholder="e.g. r.sharma@fitt-iitd.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              className="text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="staff-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Full Name &amp; Title
            </Label>
            <Input
              id="staff-name"
              type="text"
              placeholder="e.g. Dr. Rajesh Sharma"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={submitting}
              className="text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Governance Role
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('INVESTMENT_ASSOCIATE')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs transition-all ${
                  role === 'INVESTMENT_ASSOCIATE'
                    ? 'border-primary bg-primary/5 text-primary font-semibold ring-1 ring-primary'
                    : 'border-border text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <UserCheck className="w-4 h-4 mb-1" />
                <span className="text-[11px] leading-tight text-center">Portfolio Manager</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole('INVESTMENT_MANAGER');
                  setManagerId('');
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs transition-all ${
                  role === 'INVESTMENT_MANAGER'
                    ? 'border-purple-600 bg-purple-50 text-purple-700 font-semibold ring-1 ring-purple-600'
                    : 'border-border text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <Briefcase className="w-4 h-4 mb-1" />
                <span className="text-[11px] leading-tight text-center">Portfolio Head</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole('ADMIN');
                  setManagerId('');
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs transition-all ${
                  role === 'ADMIN'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold ring-1 ring-blue-600'
                    : 'border-border text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <Shield className="w-4 h-4 mb-1" />
                <span className="text-[11px] leading-tight text-center">Administrator</span>
              </button>
            </div>
          </div>

          {role === 'INVESTMENT_ASSOCIATE' && (
            <div className="space-y-1.5 animate-in fade-in-50 duration-150">
              <Label htmlFor="staff-manager" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Supervising Portfolio Head <span className="text-red-500">*</span>
              </Label>
              <select
                id="staff-manager"
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                disabled={submitting}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="">Select a supervising Portfolio Head...</option>
                {portfolioHeads.map((ph) => (
                  <option key={ph.id} value={ph.id}>
                    {ph.label} ({ph.email})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                Required by FITT governance: Every venture manager must report to a designated Portfolio Head.
              </p>
            </div>
          )}

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Sending Invite…
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
