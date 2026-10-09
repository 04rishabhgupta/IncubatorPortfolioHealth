'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { scopeStartups } from '@/lib/rbac';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DemoDayEvent } from '@/types';
import { X, Calendar, Presentation, MapPin, Clock, Building2, Users } from 'lucide-react';
import { toast } from 'sonner';

interface ScheduleDemoDayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScheduleDemoDayModal({ isOpen, onClose }: ScheduleDemoDayModalProps) {
  const { currentUser, startups: allStartups, investors, createDemoDay } = useStore();

  const accessibleStartups = currentUser ? scopeStartups(currentUser, allStartups) : allStartups;

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return d.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('10:00 AM - 1:30 PM IST');
  const [location, setLocation] = useState('Hybrid / IIT Delhi & Zoom');
  const [cohort, setCohort] = useState('Current Incubation Cohort');
  const [description, setDescription] = useState(
    'Showcasing top cohort ventures to institutional venture funds, angel networks, and strategic partners.'
  );
  const [selectedStartupIds, setSelectedStartupIds] = useState<string[]>(() =>
    accessibleStartups.slice(0, 5).map((s) => s.id)
  );
  const [selectedInvestorIds, setSelectedInvestorIds] = useState<string[]>(() =>
    investors.slice(0, 5).map((i) => i.id)
  );
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleStartup = (id: string) => {
    setSelectedStartupIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const toggleInvestor = (id: string) => {
    setSelectedInvestorIds((prev) =>
      prev.includes(id) ? prev.filter((iId) => iId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Event title is required');
      return;
    }
    if (!date) {
      toast.error('Date is required');
      return;
    }

    setSubmitting(true);
    try {
      const newEvent: DemoDayEvent = {
        id: crypto.randomUUID(),
        title: title.trim(),
        date,
        time: time.trim() || undefined,
        location: location.trim(),
        cohort: cohort.trim(),
        description: description.trim(),
        status: 'UPCOMING',
        startupIds: selectedStartupIds,
        investorIds: selectedInvestorIds,
        createdAt: new Date().toISOString().split('T')[0],
      };

      const res = await createDemoDay(newEvent);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Demo Day "${newEvent.title}" scheduled successfully!`);
        onClose();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message || 'Failed to schedule Demo Day');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E4E4E7] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              <Presentation className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Schedule Demo Day & Pitch Event</h2>
              <p className="text-xs text-white/80">
                Organize an investor showcase event with startup pitches and VC speed-networking
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Demo Day Event Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. FITT DeepTech & AI Demo Day 2026"
              className="text-sm font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-violet-600" />
                Event Date *
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-violet-600" />
                Event Time
              </Label>
              <Input
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="10:00 AM - 1:00 PM IST"
                className="text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-violet-600" />
                Venue / Platform
              </Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="IIT Delhi / Virtual Broadcast"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Cohort / Batch</Label>
              <Input
                value={cohort}
                onChange={(e) => setCohort(e.target.value)}
                placeholder="Cohort 8 - Autumn 2026"
                className="text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Agenda & Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 resize-none text-gray-900"
            />
          </div>

          {/* Startups selection */}
          <div className="space-y-2 pt-1">
            <Label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-blue-600" />
                Pitching Startups ({selectedStartupIds.length} selected)
              </span>
              <span className="text-[11px] text-gray-500 font-normal">
                Click to include in lineup
              </span>
            </Label>
            {accessibleStartups.length === 0 ? (
              <p className="text-xs text-gray-500">No startups in scope.</p>
            ) : (
              <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1 bg-gray-50/50">
                {accessibleStartups.map((s) => {
                  const checked = selectedStartupIds.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white text-xs cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStartup(s.id)}
                        className="rounded-xs text-violet-600 focus:ring-violet-500"
                      />
                      <span className="font-medium text-gray-800">{s.name}</span>
                      <span className="text-[10px] text-gray-500">
                        • {s.sector.replace('_', ' ')} • {s.stage.replace('_', ' ')}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Investors selection */}
          <div className="space-y-2 pt-1">
            <Label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-indigo-600" />
                Invited Investors / VCs ({selectedInvestorIds.length} selected)
              </span>
              <span className="text-[11px] text-gray-500 font-normal">
                Click to invite
              </span>
            </Label>
            {investors.length === 0 ? (
              <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                No investors in directory yet. You can invite investors later after scheduling.
              </p>
            ) : (
              <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1 bg-gray-50/50">
                {investors.map((inv) => {
                  const checked = selectedInvestorIds.includes(inv.id);
                  return (
                    <label
                      key={inv.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white text-xs cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleInvestor(inv.id)}
                        className="rounded-xs text-violet-600 focus:ring-violet-500"
                      />
                      <span className="font-medium text-gray-800">{inv.firm}</span>
                      <span className="text-[10px] text-gray-500">
                        ({inv.name} • {inv.ticketSize})
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !title.trim()}
              className="bg-violet-600 hover:bg-violet-700 text-white font-semibold flex items-center gap-1.5"
            >
              <Presentation className="h-4 w-4" />
              {submitting ? 'Scheduling...' : 'Schedule Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
