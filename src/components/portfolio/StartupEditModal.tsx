'use client';

import { useState, useRef } from 'react';
import { useStore } from '@/store';
import { Startup, Sector, Stage, IPStatus, CommercialSignal } from '@/types';
import { parseStartupExcel } from '@/lib/excelService';
import { computeInvestibilityScore, generateAIAnalysis, detectRedFlags } from '@/lib/aiAnalysis';
import {
  Upload,
  X,
  Trash2,
  Save,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface StartupEditModalProps {
  startup: Startup;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

const SECTORS: Sector[] = [
  'AI_ML',
  'MEDTECH',
  'AGRITECH',
  'CYBERSECURITY',
  'UAV',
  'SEMICONDUCTOR',
  'ADVANCED_MATERIALS',
];

const STAGES: Stage[] = [
  'PRE_INCUBATION',
  'EARLY_INCUBATION',
  'MID_INCUBATION',
  'LATE_INCUBATION',
  'ACCELERATION',
  'GRADUATED',
];

export function StartupEditModal({ startup, isOpen, onClose, onDeleted }: StartupEditModalProps) {
  const { updateStartup, deleteStartup, currentUser, users } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(startup.name);
  const [oneLiner, setOneLiner] = useState(startup.oneLiner);
  const [sector, setSector] = useState<Sector>(startup.sector);
  const [stage, setStage] = useState<Stage>(startup.stage);
  const [cohort, setCohort] = useState(startup.cohort);
  const [city, setCity] = useState(startup.city);
  const [website, setWebsite] = useState(startup.website || '');
  const [trl, setTrl] = useState(startup.trl);
  const [ipStatus, setIpStatus] = useState<IPStatus>(startup.ipStatus);
  const [ipOwnershipClear, setIpOwnershipClear] = useState(startup.ipOwnershipClear);
  const [commercialSignal, setCommercialSignal] = useState<CommercialSignal>(startup.commercialSignal);
  const [grantSanctioned, setGrantSanctioned] = useState(startup.grantSanctioned);
  const [grantDisbursed, setGrantDisbursed] = useState(startup.grantDisbursed);
  const [managerId, setManagerId] = useState(startup.managerId);
  const [associateId, setAssociateId] = useState<string | null>(startup.associateId);
  const [tracker, setTracker] = useState(startup.fittTracker);

  const [parsing, setParsing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen) return null;

  const canDelete =
    currentUser?.role === 'ADMIN' ||
    (currentUser?.role === 'INVESTMENT_MANAGER' && startup.managerId === currentUser.id);

  // Live updated startup draft
  const draftStartup: Startup = {
    ...startup,
    name: name.trim(),
    oneLiner: oneLiner.trim(),
    sector,
    stage,
    cohort,
    city,
    website,
    trl,
    ipStatus,
    ipOwnershipClear,
    commercialSignal,
    grantSanctioned: Number(grantSanctioned),
    grantDisbursed: Number(grantDisbursed),
    managerId,
    associateId,
    fittTracker: tracker,
  };

  const investibility = computeInvestibilityScore(draftStartup);
  const redFlags = detectRedFlags(draftStartup);

  // Handle Excel re-upload
  const handleExcelUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const parsed = parseStartupExcel(buffer, startup);

        if (parsed.name) setName(parsed.name);
        if (parsed.oneLiner) setOneLiner(parsed.oneLiner);
        if (parsed.sector) setSector(parsed.sector);
        if (parsed.stage) setStage(parsed.stage);
        if (parsed.cohort) setCohort(parsed.cohort);
        if (parsed.city) setCity(parsed.city);
        if (parsed.website) setWebsite(parsed.website);
        if (parsed.trl !== undefined) setTrl(parsed.trl);
        if (parsed.ipStatus) setIpStatus(parsed.ipStatus);
        if (parsed.ipOwnershipClear !== undefined) setIpOwnershipClear(parsed.ipOwnershipClear);
        if (parsed.commercialSignal) setCommercialSignal(parsed.commercialSignal);
        if (parsed.grantSanctioned !== undefined) setGrantSanctioned(parsed.grantSanctioned);
        if (parsed.grantDisbursed !== undefined) setGrantDisbursed(parsed.grantDisbursed);
        if (parsed.fittTracker) setTracker(parsed.fittTracker);

        toast.success('Excel updated parameters and sheets parsed!');
      } catch (err) {
        console.error(err);
        toast.error('Failed to parse Excel update');
      } finally {
        setParsing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedAI = generateAIAnalysis(draftStartup);
    const finalStartup: Startup = {
      ...draftStartup,
      investibility,
      aiAnalysis: updatedAI,
    };
    const res = await updateStartup(finalStartup);
    if (res?.error) {
      toast.error(`Failed to update startup: ${res.error}`);
      return;
    }
    toast.success(`Updated ${finalStartup.name} profile and recomputed AI diagnostics`);
    onClose();
  };

  const handleDelete = async () => {
    const res = await deleteStartup(startup.id);
    if (res?.error) {
      toast.error(`Failed to remove startup: ${res.error}`);
      return;
    }
    toast.success(`Startup ${startup.name} removed from portfolio`);
    onClose();
    if (onDeleted) onDeleted();
  };

  const managers = users.filter((u) => u.role === 'INVESTMENT_MANAGER');
  const associates = users.filter((u) => u.role === 'INVESTMENT_ASSOCIATE' && u.managerId === managerId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E4E4E7] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold">Edit Startup: {startup.name}</h2>
            <p className="text-xs text-white/80">
              Update startup parameters, re-upload Excel metrics, or manage assignments.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Excel Re-upload banner */}
        <div className="bg-[#FAFAFA] px-6 py-3 border-b border-[#E4E4E7] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-600 font-medium">Re-sync from Excel:</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleExcelUpdate}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={parsing}
              className="h-8 text-xs bg-white border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              {parsing ? 'Parsing...' : 'Upload Updated Excel'}
            </Button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500 font-medium">Current Investibility:</span>
            <Badge className="bg-blue-600 text-white font-mono">
              {investibility.total}/100 (Grade {investibility.grade})
            </Badge>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">Startup Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">One-Liner</Label>
              <Input value={oneLiner} onChange={(e) => setOneLiner(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">Sector</Label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value as Sector)}
                className="w-full text-sm border border-zinc-200 rounded-lg p-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700">Stage</Label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as Stage)}
                className="w-full text-sm border border-zinc-200 rounded-lg p-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Cohort</Label>
              <Input value={cohort} onChange={(e) => setCohort(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">TRL Level</Label>
              <Input
                type="number"
                min={1}
                max={9}
                value={trl}
                onChange={(e) => setTrl(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">IP Status</Label>
              <select
                value={ipStatus}
                onChange={(e) => setIpStatus(e.target.value as IPStatus)}
                className="w-full text-sm border border-gray-300 rounded-lg p-2 bg-white"
              >
                <option value="NONE">None</option>
                <option value="TRADE_SECRET">Trade Secret</option>
                <option value="FILED">Filed</option>
                <option value="GRANTED">Granted</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">IP Title Clear?</Label>
              <select
                value={ipOwnershipClear ? 'YES' : 'NO'}
                onChange={(e) => setIpOwnershipClear(e.target.value === 'YES')}
                className="w-full text-sm border border-gray-300 rounded-lg p-2 bg-white"
              >
                <option value="YES">Yes</option>
                <option value="NO">No</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Commercial Signal</Label>
              <select
                value={commercialSignal}
                onChange={(e) => setCommercialSignal(e.target.value as CommercialSignal)}
                className="w-full text-sm border border-gray-300 rounded-lg p-2 bg-white"
              >
                <option value="NONE">None</option>
                <option value="INTEREST">Interest</option>
                <option value="PILOT_LOI">Pilot / LOI</option>
                <option value="PAYING">Paying Customers</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Grant Sanctioned (INR)</Label>
              <Input
                type="number"
                value={grantSanctioned}
                onChange={(e) => setGrantSanctioned(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Grant Disbursed (INR)</Label>
              <Input
                type="number"
                value={grantDisbursed}
                onChange={(e) => setGrantDisbursed(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Assignments */}
          <div className="bg-[#FAFAFA] p-4 rounded-xl border border-[#E4E4E7] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Managing Portfolio Head</Label>
              <select
                value={managerId}
                onChange={(e) => {
                  setManagerId(e.target.value);
                  setAssociateId(null);
                }}
                className="w-full text-sm border border-gray-300 rounded-lg p-2 bg-white"
              >
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Assigned Portfolio Manager</Label>
              <select
                value={associateId || ''}
                onChange={(e) => setAssociateId(e.target.value || null)}
                className="w-full text-sm border border-gray-300 rounded-lg p-2 bg-white"
              >
                <option value="">Unassigned</option>
                {associates.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Red Flags Preview */}
          {redFlags.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1.5">
              <div className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" />
                Active AI Red Flags ({redFlags.length})
              </div>
              <ul className="text-xs text-red-900 space-y-1">
                {redFlags.map((flag, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span>•</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Delete Section */}
          {canDelete && (
            <div className="pt-3 border-t border-red-100">
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove this startup from incubator portfolio...
                </button>
              ) : (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                  <span className="text-xs text-red-800 font-medium">
                    Are you sure? This will remove <b>{startup.name}</b> and its records.
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDelete(false)}
                      className="h-7 text-xs text-zinc-600"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
                    >
                      Confirm Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E4E4E7] shrink-0">
            <Button type="button" variant="ghost" onClick={onClose} className="text-zinc-600">
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 shadow-sm gap-1.5"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
