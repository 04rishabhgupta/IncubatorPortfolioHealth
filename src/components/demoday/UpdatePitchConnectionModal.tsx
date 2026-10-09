'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PitchConnection, PitchConnectionStatus } from '@/types';
import { X, CheckCircle, Star } from 'lucide-react';
import { toast } from 'sonner';

interface UpdatePitchConnectionModalProps {
  connection: PitchConnection | null;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: PitchConnectionStatus; label: string; desc: string }[] = [
  { value: 'INTRODUCED', label: '1. Introduced', desc: 'Deck / teaser sent to partner' },
  { value: 'PITCH_SCHEDULED', label: '2. Pitch Scheduled', desc: 'Call / meeting confirmed' },
  { value: 'PITCHED', label: '3. Pitched', desc: 'Pitch completed, awaiting initial feedback' },
  { value: 'DUE_DILIGENCE', label: '4. Due Diligence', desc: 'Financial, tech & IP DD underway' },
  { value: 'TERM_SHEET', label: '5. Term Sheet Offered', desc: 'Valuation & terms negotiated' },
  { value: 'COMMITTED', label: '6. Committed & Closed', desc: 'Funding agreement executed' },
  { value: 'PASSED', label: 'Passed / Not Interested', desc: 'Fund passed for this stage/thesis' },
];

export function UpdatePitchConnectionModal({
  connection,
  isOpen,
  onClose,
}: UpdatePitchConnectionModalProps) {
  const { updatePitchConnection, startups, investors } = useStore();

  const [status, setStatus] = useState<PitchConnectionStatus>('INTRODUCED');
  const [rating, setRating] = useState<number>(0);
  const [nextAction, setNextAction] = useState('');
  const [notes, setNotes] = useState('');
  const [askAmount, setAskAmount] = useState('');
  const [round, setRound] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (connection) {
      setStatus(connection.status);
      setRating(connection.rating || 0);
      setNextAction(connection.nextAction || '');
      setNotes(connection.notes || '');
      setAskAmount(connection.askAmount || '');
      setRound(connection.round || '');
    }
  }, [connection]);

  if (!isOpen || !connection) return null;

  const startup = startups.find((s) => s.id === connection.startupId);
  const investor = investors.find((i) => i.id === connection.investorId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updated: PitchConnection = {
        ...connection,
        status,
        rating: rating > 0 ? rating : undefined,
        nextAction: nextAction.trim() || undefined,
        notes: notes.trim(),
        askAmount: askAmount.trim() || connection.askAmount,
        round: round.trim() || connection.round,
        updatedAt: new Date().toISOString().split('T')[0],
      };

      const res = await updatePitchConnection(updated);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Updated pitch connection for ${startup?.name || 'startup'}!`);
        onClose();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message || 'Failed to update connection');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E4E4E7] w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold">Update Pitch Progress</h2>
            <p className="text-xs text-white/80">
              {startup?.name || 'Startup'} ↔ {investor?.firm || 'Investor'} ({round})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Status Select */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Pipeline Stage *</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PitchConnectionStatus)}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} — {opt.desc}
                </option>
              ))}
            </select>
          </div>

          {/* Investor Interest Rating */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Investor Interest Rating</Label>
            <div className="flex items-center gap-1.5 pt-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star === rating ? 0 : star)}
                  className="p-1 text-amber-400 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-5 w-5 ${
                      star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs text-gray-500 ml-2">
                {rating === 0
                  ? 'Unrated'
                  : rating === 5
                  ? 'Very High Interest'
                  : rating === 4
                  ? 'High Interest'
                  : rating === 3
                  ? 'Moderate Interest'
                  : 'Low Interest'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Target Round</Label>
              <Input
                value={round}
                onChange={(e) => setRound(e.target.value)}
                placeholder="Seed"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Ask Amount</Label>
              <Input
                value={askAmount}
                onChange={(e) => setAskAmount(e.target.value)}
                placeholder="₹2.5 Cr"
                className="text-sm"
              />
            </div>
          </div>

          {/* Next Action */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Next Action Item</Label>
            <Input
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder="e.g. Schedule tech deep-dive call with CTO next Tuesday"
              className="text-sm"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Feedback & Meeting Notes</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Partner comments, valuation expectations, due diligence questions..."
              className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-gray-900"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5"
            >
              <CheckCircle className="h-4 w-4" />
              {submitting ? 'Updating...' : 'Save Updates'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
