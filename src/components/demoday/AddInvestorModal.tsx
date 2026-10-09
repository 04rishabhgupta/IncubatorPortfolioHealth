'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Investor, InvestorType } from '@/types';
import { X, Briefcase, Plus, Globe, Mail, Phone, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface AddInvestorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (investor: Investor) => void;
}

const INVESTOR_TYPES: { value: InvestorType; label: string }[] = [
  { value: 'VC_FUND', label: 'Venture Capital Fund (VC)' },
  { value: 'ANGEL_NETWORK', label: 'Angel Network / Syndicate' },
  { value: 'FAMILY_OFFICE', label: 'Family Office' },
  { value: 'CORPORATE_VC', label: 'Corporate VC (CVC)' },
  { value: 'MICRO_VC', label: 'Micro VC' },
];

const AVAILABLE_SECTORS = [
  'DeepTech',
  'AI/ML',
  'Healthcare & MedTech',
  'CleanTech & Energy',
  'AgriTech',
  'SaaS & Enterprise',
  'Defense & Aerospace',
  'FinTech',
  'Semiconductors & Hardware',
  'Advanced Materials',
];

const AVAILABLE_STAGES = ['Pre-Seed', 'Seed', 'Pre-Series A', 'Series A', 'Series B+'];

export function AddInvestorModal({ isOpen, onClose, onSuccess }: AddInvestorModalProps) {
  const { addInvestor } = useStore();

  const [firm, setFirm] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('Partner');
  const [type, setType] = useState<InvestorType>('VC_FUND');
  const [ticketSize, setTicketSize] = useState('₹1 Cr - ₹5 Cr');
  const [geography, setGeography] = useState('Pan-India');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [thesis, setThesis] = useState('');
  const [selectedSectors, setSelectedSectors] = useState<string[]>(['DeepTech', 'AI/ML']);
  const [selectedStages, setSelectedStages] = useState<string[]>(['Seed', 'Pre-Series A']);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleSector = (sector: string) => {
    setSelectedSectors((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
    );
  };

  const toggleStage = (stage: string) => {
    setSelectedStages((prev) =>
      prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firm.trim()) {
      toast.error('Firm or fund name is required');
      return;
    }
    if (!name.trim()) {
      toast.error('Partner / contact name is required');
      return;
    }

    setSubmitting(true);
    try {
      const newInvestor: Investor = {
        id: crypto.randomUUID(),
        name: name.trim(),
        firm: firm.trim(),
        title: title.trim() || 'Partner',
        type,
        ticketSize: ticketSize.trim(),
        geography: geography.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
        sectors: selectedSectors,
        stages: selectedStages,
        thesis: thesis.trim(),
        active: true,
        createdAt: new Date().toISOString().split('T')[0],
      };

      const res = await addInvestor(newInvestor);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Registered "${newInvestor.firm}" into Investor Directory!`);
        if (onSuccess && res.data) onSuccess(res.data);
        onClose();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message || 'Failed to add investor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E4E4E7] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Add Investor / VC Fund</h2>
              <p className="text-xs text-white/80">
                Register venture capital funds, angel networks, and family offices for portfolio demo days
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Firm / Fund Name *</Label>
              <Input
                value={firm}
                onChange={(e) => setFirm(e.target.value)}
                placeholder="e.g. Blume Ventures, Kalaari Capital"
                className="text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Partner / Contact Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vikram Sharma"
                className="text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Designation / Role</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Managing Partner"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Investor Entity Type</Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as InvestorType)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                {INVESTOR_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Typical Check Size</Label>
              <Input
                value={ticketSize}
                onChange={(e) => setTicketSize(e.target.value)}
                placeholder="₹1 Cr - ₹5 Cr"
                className="text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Geography Focus</Label>
            <Input
              value={geography}
              onChange={(e) => setGeography(e.target.value)}
              placeholder="e.g. Pan-India, Delhi NCR, South Asia"
              className="text-sm"
            />
          </div>

          {/* Sector Tags */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Sector Interests (Click to toggle)
            </Label>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {AVAILABLE_SECTORS.map((sec) => {
                const isSelected = selectedSectors.includes(sec);
                return (
                  <button
                    type="button"
                    key={sec}
                    onClick={() => toggleSector(sec)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {isSelected ? `✓ ${sec}` : `+ ${sec}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stages Tags */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Target Investment Stages
            </Label>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {AVAILABLE_STAGES.map((stg) => {
                const isSelected = selectedStages.includes(stg);
                return (
                  <button
                    type="button"
                    key={stg}
                    onClick={() => toggleStage(stg)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {isSelected ? `✓ ${stg}` : `+ ${stg}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                <Mail className="h-3 w-3 text-gray-400" /> Email
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@fund.vc"
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                <Phone className="h-3 w-3 text-gray-400" /> Phone
              </Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                <Globe className="h-3 w-3 text-gray-400" /> Website
              </Label>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://fund.vc"
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                <ExternalLink className="h-3 w-3 text-gray-400" /> LinkedIn Profile
              </Label>
              <Input
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="text-xs"
              />
            </div>
          </div>

          {/* Thesis */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Investment Thesis / Mandate</Label>
            <textarea
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
              rows={2}
              placeholder="e.g. Looking for IP-heavy hardware, AI infrastructure, and climate tech with proven lab validation."
              className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 resize-none text-gray-900"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !firm.trim() || !name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              {submitting ? 'Adding...' : 'Add to Investor Directory'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
