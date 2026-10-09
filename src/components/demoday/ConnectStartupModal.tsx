'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { scopeStartups } from '@/lib/rbac';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PitchConnectionStatus } from '@/types';
import { X, Send, Presentation, Building2, User, Link as LinkIcon, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface ConnectStartupModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedStartupId?: string;
  preselectedInvestorId?: string;
  preselectedDemoDayId?: string;
}

const ROUNDS = ['Pre-Seed', 'Seed', 'Pre-Series A', 'Series A', 'Series B+', 'Bridge Round'];

export function ConnectStartupModal({
  isOpen,
  onClose,
  preselectedStartupId,
  preselectedInvestorId,
  preselectedDemoDayId,
}: ConnectStartupModalProps) {
  const {
    currentUser,
    startups: allStartups,
    investors,
    demoDays,
    createPitchConnection,
  } = useStore();

  const accessibleStartups = currentUser ? scopeStartups(currentUser, allStartups) : allStartups;

  const [startupId, setStartupId] = useState(preselectedStartupId || (accessibleStartups[0]?.id ?? ''));
  const [investorId, setInvestorId] = useState(preselectedInvestorId || (investors[0]?.id ?? ''));
  const [demoDayId, setDemoDayId] = useState(preselectedDemoDayId || '');
  const [round, setRound] = useState('Seed');
  const [askAmount, setAskAmount] = useState('₹2.5 Cr');
  const [pitchDeckUrl, setPitchDeckUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('You must be logged in to create a pitch introduction');
      return;
    }
    if (!startupId) {
      toast.error('Please select a startup to connect');
      return;
    }
    if (!investorId) {
      toast.error('Please select an investor or VC firm');
      return;
    }

    setSubmitting(true);
    try {
      const selectedStartup = accessibleStartups.find((s) => s.id === startupId);
      const selectedInvestor = investors.find((i) => i.id === investorId);

      const res = await createPitchConnection({
        id: crypto.randomUUID(),
        startupId,
        investorId,
        demoDayId: demoDayId || null,
        connectedBy: currentUser.id,
        status: 'INTRODUCED' as PitchConnectionStatus,
        round,
        askAmount,
        pitchDeckUrl: pitchDeckUrl.trim() || undefined,
        notes: notes.trim(),
        connectedOn: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(
          `Introduced ${selectedStartup?.name || 'Startup'} to ${selectedInvestor?.firm || 'Investor'}!`
        );
        onClose();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message || 'Failed to create pitch connection');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E4E4E7] w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              <Presentation className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Connect Startup to Investor / VC</h2>
              <p className="text-xs text-white/80">
                Facilitate demo day pitch introduction or direct syndicate connection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5 overflow-y-auto flex-1">
          {/* Startup Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-blue-600" />
              Startup to Pitch
            </Label>
            {accessibleStartups.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                No active startups available in your scope.
              </p>
            ) : (
              <select
                value={startupId}
                onChange={(e) => setStartupId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                required
              >
                <option value="">Select a Startup...</option>
                {accessibleStartups.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.sector.replace('_', ' ')}) - {s.stage.replace('_', ' ')}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Investor Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-indigo-600" />
              Target Investor / VC Firm
            </Label>
            {investors.length === 0 ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
                <p className="font-semibold">No Investors in Directory yet</p>
                <p className="text-blue-700">
                  You can register investors in the Investor Directory tab or add one now.
                </p>
              </div>
            ) : (
              <select
                value={investorId}
                onChange={(e) => setInvestorId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                required
              >
                <option value="">Select an Investor / Fund...</option>
                {investors.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.firm} - {inv.name} ({inv.type.replace('_', ' ')}) • {inv.ticketSize}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Optional Demo Day Event */}
          {demoDays.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Presentation className="h-3.5 w-3.5 text-violet-600" />
                Associate with Demo Day (Optional)
              </Label>
              <select
                value={demoDayId}
                onChange={(e) => setDemoDayId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Direct Introduction (Not linked to event)</option>
                {demoDays.map((dd) => (
                  <option key={dd.id} value={dd.id}>
                    {dd.title} ({dd.date} - {dd.cohort})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Round & Ask Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Target Round</Label>
              <select
                value={round}
                onChange={(e) => setRound(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {ROUNDS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                Ask Amount
              </Label>
              <Input
                value={askAmount}
                onChange={(e) => setAskAmount(e.target.value)}
                placeholder="e.g. ₹2.5 Cr"
                className="text-sm font-medium"
                required
              />
            </div>
          </div>

          {/* Pitch Deck URL */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5 text-gray-500" />
              Pitch Deck or Data Room Link (Optional)
            </Label>
            <Input
              value={pitchDeckUrl}
              onChange={(e) => setPitchDeckUrl(e.target.value)}
              placeholder="https://docsend.com/... or Google Drive URL"
              className="text-sm"
            />
          </div>

          {/* Notes / Context */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Introduction Context & Highlights
            </Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Thesis alignment, key metrics, IP highlights, or reasons why this startup is a strong fit for this VC..."
              className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none text-gray-900"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || accessibleStartups.length === 0 || investors.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Connecting...' : 'Create Pitch Connection'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
