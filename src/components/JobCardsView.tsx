import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Plus,
  Car,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  User,
  UserCheck,
  History,
  Image as ImageIcon,
  ChevronRight,
  TrendingUp,
  Boxes,
  ShieldCheck,
  RefreshCw,
  Eye,
  Camera,
  Play,
  Pause,
  Square
} from 'lucide-react';
import {
  JobCard,
  JobCardStage,
  JobCardType,
  ERPState,
  AuditLog,
  Technician
} from '../types';
import { formatCurrency } from '../utils/formatters';

interface JobCardsViewProps {
  state: ERPState;
  onUpdateState: React.Dispatch<React.SetStateAction<ERPState>>;
  onNavigateToSupervisorLive?: (jobCardId: string | number) => void;
  onNavigateToPnl?: (jobCardId: string | number) => void;
  onNavigateToPartsTransfer?: (jobCardId: string | number) => void;
}

export const JobCardsView: React.FC<JobCardsViewProps> = ({
  state,
  onUpdateState,
  onNavigateToSupervisorLive,
  onNavigateToPnl,
  onNavigateToPartsTransfer,
}) => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'open_new'>('pipeline');
  const [stageFilter, setStageFilter] = useState<'all' | JobCardStage>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | JobCardType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [repeatOnlyFilter, setRepeatOnlyFilter] = useState(false);
  const [repeatCustomerFilter, setRepeatCustomerFilter] = useState(false);
  const [repeatVinFilter, setRepeatVinFilter] = useState(false);

  // Selected Photo Modal for Before/After inspection
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<JobCard | null>(null);

  // Selected Detail Modal
  const [selectedJobCardDetail, setSelectedJobCardDetail] = useState<JobCard | null>(null);

  // Form State for Opening New Job Card
  const [newJobType, setNewJobType] = useState<JobCardType>('lube');
  const [customerName, setCustomerName] = useState('');
  const [contactPhone, setContactPhone] = useState('+968 ');
  const [vehicleMakeModel, setVehicleMakeModel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [vinNumber, setVinNumber] = useState('');
  const [initialStage, setInitialStage] = useState<JobCardStage>('in_progress');
  const [assignedTechId, setAssignedTechId] = useState('tech-01');
  const [bayNumber, setBayNumber] = useState('Bay 1 (Lube Pit)');
  const [notes, setNotes] = useState('');
  const [beforePhotoUrl, setBeforePhotoUrl] = useState('');
  const [isRepeatJob, setIsRepeatJob] = useState(false);
  const [repeatReason, setRepeatReason] = useState('');
  const [previousJobNumber, setPreviousJobNumber] = useState('');

  // Auto-detect repeat vehicle when plate number changes
  const handlePlateChange = (plate: string) => {
    setPlateNumber(plate);
    if (plate.trim().length >= 4) {
      const existing = (state.jobCards || []).find(
        (jc) => jc.plateNumber?.toLowerCase().includes(plate.toLowerCase().trim()) ||
               jc.vehicleDetails?.toLowerCase().includes(plate.toLowerCase().trim())
      );
      if (existing) {
        setIsRepeatJob(true);
        setPreviousJobNumber(existing.jobCardNumber);
        setRepeatReason(`Vehicle plate matched prior visit on ${existing.createdAt.substring(0, 10)} (${existing.jobCardNumber}). Quality verification active.`);
        if (!customerName) setCustomerName(existing.customerName);
        if (!contactPhone || contactPhone === '+968 ') setContactPhone(existing.contactPhone || '+968 ');
        if (!vinNumber && existing.vinNumber) setVinNumber(existing.vinNumber);
      }
    }
  };

  // Auto-detect repeat vehicle when chassis / VIN number is entered
  const handleVinChange = (vin: string) => {
    setVinNumber(vin);
    const cleanVin = vin.trim().toUpperCase();
    if (cleanVin.length >= 6) {
      const existing = (state.jobCards || []).find(
        (jc) => jc.vinNumber && jc.vinNumber.trim().toUpperCase() === cleanVin
      );
      if (existing) {
        setIsRepeatJob(true);
        setPreviousJobNumber(existing.jobCardNumber);
        setRepeatReason(`Identical VIN matched prior visit on ${existing.createdAt.substring(0, 10)} (${existing.jobCardNumber} - ${existing.vehicleDetails || 'Unit'}).`);
        if (!customerName) setCustomerName(existing.customerName);
        if (!contactPhone || contactPhone === '+968 ') setContactPhone(existing.contactPhone || '+968 ');
        if (!vehicleMakeModel && existing.vehicleDetails) setVehicleMakeModel(existing.vehicleDetails);
        if (!plateNumber && existing.plateNumber) setPlateNumber(existing.plateNumber);
      }
    }
  };

  // Memoized Visit Counts across all Job Cards
  const customerVisitCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (state.jobCards || []).forEach((j) => {
      const key = j.customerName.trim().toLowerCase();
      if (key) {
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }, [state.jobCards]);

  const vinVisitCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (state.jobCards || []).forEach((j) => {
      const vin = (j.vinNumber || '').trim().toUpperCase();
      if (vin && vin !== 'N/A' && vin !== 'UNKNOWN') {
        counts[vin] = (counts[vin] || 0) + 1;
      }
    });
    return counts;
  }, [state.jobCards]);

  const isRepeatCustomer = (jc: JobCard): boolean => {
    if (jc.isRepeatCustomer) return true;
    const nameCount = customerVisitCounts[jc.customerName.trim().toLowerCase()] || 0;
    return nameCount > 1;
  };

  const getCustomerVisitCount = (jc: JobCard): number => {
    if (jc.repeatVisitCount && jc.repeatVisitCount > 1) return jc.repeatVisitCount;
    return customerVisitCounts[jc.customerName.trim().toLowerCase()] || 1;
  };

  const isRepeatVin = (jc: JobCard): boolean => {
    const vin = (jc.vinNumber || '').trim().toUpperCase();
    return Boolean(vin && vin !== 'N/A' && (vinVisitCounts[vin] || 0) > 1);
  };

  const getVinVisitCount = (jc: JobCard): number => {
    const vin = (jc.vinNumber || '').trim().toUpperCase();
    return vin ? vinVisitCounts[vin] || 1 : 1;
  };

  // Generate Serial Number: Lube vs Bodyshop
  const getNextSerialNumber = (type: JobCardType): string => {
    const existingCount = (state.jobCards || []).filter((j) => j.jobType === type).length;
    const prefix = type === 'lube' ? 'LB' : 'BS';
    const num = (type === 'lube' ? 101 : 201) + existingCount;
    return `${prefix}-2026-${num}`;
  };

  // Handle Form Submit
  const handleOpenJobCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Please enter a customer name.');
      return;
    }

    const serial = getNextSerialNumber(newJobType);
    const tech = (state.technicians || []).find((t) => t.id === assignedTechId);

    const customerKey = customerName.trim().toLowerCase();
    const existingCustomerVisits = (state.jobCards || []).filter(
      (j) => j.customerName.trim().toLowerCase() === customerKey
    ).length;
    const isCustomerRepeat = existingCustomerVisits > 0 || isRepeatJob;

    const newJobCard: JobCard = {
      id: `jc-${Date.now()}`,
      jobCardNumber: serial,
      jobType: newJobType,
      customerName,
      contactPhone,
      vehicleDetails: vehicleMakeModel ? `${vehicleMakeModel} (${plateNumber || 'N/A'})` : plateNumber,
      plateNumber,
      vinNumber,
      status: initialStage,
      assignedTechnicianId: assignedTechId,
      assignedTechnicianName: tech?.name || 'Assigned Technician',
      bayNumber,
      workTimerStatus: 'running',
      timerStartedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      elapsedMinutes: 0,
      notes,
      before_photo: beforePhotoUrl || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80',
      after_photo: null,
      isRepeatJob,
      repeatReason: isRepeatJob ? repeatReason : undefined,
      previousJobCardNumber: isRepeatJob ? previousJobNumber : undefined,
      isRepeatCustomer: isCustomerRepeat,
      repeatVisitCount: existingCustomerVisits + 1,
      partsRequired: [],
      consumablesUsed: [],
      laborEntries: tech ? [{
        id: `jcl-${Date.now()}`,
        technicianId: tech.id,
        technicianName: tech.name,
        operation: newJobType === 'lube' ? 'Periodic Lube & Diagnostic Inspection' : 'Bodyshop Structural Assessment',
        hourlyWageCost: tech.hourlyWage,
        hourlyChargeRate: 15.000,
        hours: 1.0,
        status: 'active',
      }] : [],
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      action: 'Job Card Opened',
      category: 'workshop',
      details: `Opened ${newJobType.toUpperCase()} Job Card ${serial} for ${customerName} (Vehicle: ${plateNumber || 'N/A'}, VIN: ${vinNumber || 'N/A'}). Assigned to ${tech?.name || 'Tech'} in ${bayNumber}`,
      performedBy: 'Workshop Supervisor',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      severity: isRepeatJob ? 'warning' : 'info',
    };

    onUpdateState((prev) => ({
      ...prev,
      jobCards: [newJobCard, ...(prev.jobCards || [])],
      auditLogs: [audit, ...(prev.auditLogs || [])],
    }));

    // Reset Form
    setCustomerName('');
    setContactPhone('+968 ');
    setVehicleMakeModel('');
    setPlateNumber('');
    setVinNumber('');
    setNotes('');
    setBeforePhotoUrl('');
    setIsRepeatJob(false);
    setRepeatReason('');
    setPreviousJobNumber('');
    setActiveTab('pipeline');
    alert(`Job Card ${serial} created and dispatched to ${tech?.name || 'Technician'}!`);
  };

  // Stage change handler
  const handleUpdateStage = (jobCardId: string | number, newStage: JobCardStage) => {
    const jc = (state.jobCards || []).find((j) => j.id === jobCardId);
    if (!jc) return;

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      action: 'Job Card Stage Advanced',
      category: 'workshop',
      details: `Advanced ${jc.jobCardNumber} from ${jc.status.toUpperCase()} to ${newStage.toUpperCase()}`,
      performedBy: 'Floor Supervisor',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      severity: 'info',
    };

    onUpdateState((prev) => ({
      ...prev,
      jobCards: (prev.jobCards || []).map((j) =>
        j.id === jobCardId ? { ...j, status: newStage } : j
      ),
      auditLogs: [audit, ...(prev.auditLogs || [])],
    }));
  };

  // Filtered Job Cards
  const filteredJobCards = (state.jobCards || []).filter((jc) => {
    if (stageFilter !== 'all' && jc.status !== stageFilter) return false;
    if (typeFilter !== 'all' && jc.jobType !== typeFilter) return false;
    if (repeatOnlyFilter && !jc.isRepeatJob) return false;
    if (repeatCustomerFilter && !isRepeatCustomer(jc)) return false;
    if (repeatVinFilter && !isRepeatVin(jc)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        jc.jobCardNumber.toLowerCase().includes(q) ||
        jc.customerName.toLowerCase().includes(q) ||
        (jc.vehicleDetails && jc.vehicleDetails.toLowerCase().includes(q)) ||
        (jc.plateNumber && jc.plateNumber.toLowerCase().includes(q)) ||
        (jc.vinNumber && jc.vinNumber.toLowerCase().includes(q)) ||
        (jc.assignedTechnicianName && jc.assignedTechnicianName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Stage count pills helper
  const getStageCount = (stage: JobCardStage | 'all'): number => {
    if (stage === 'all') return state.jobCards?.length || 0;
    return (state.jobCards || []).filter((j) => j.status === stage).length;
  };

  const repeatJobsCount = (state.jobCards || []).filter((j) => j.isRepeatJob).length;
  const repeatCustomersCount = (state.jobCards || []).filter((j) => isRepeatCustomer(j)).length;
  const repeatVinJobsCount = (state.jobCards || []).filter((j) => isRepeatVin(j)).length;

  return (
    <div className="space-y-6">
      {/* Header and Stage Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Module C
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Open Job Card & Workflow Monitoring
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Dual serial numbering for Lube (LB) & Bodyshop (BS), 5-stage workshop monitoring, repeat job tracking, and photo inspection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'pipeline'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Live Pipeline ({state.jobCards?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('open_new')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'open_new'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Open New Job Card</span>
          </button>
        </div>
      </div>

      {/* Stage Monitoring Status Bar (c.2) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <span>Job Status Monitoring Stages (c.2)</span>
          <div className="flex flex-wrap items-center gap-2">
            {repeatCustomersCount > 0 && (
              <button
                type="button"
                onClick={() => setRepeatCustomerFilter(!repeatCustomerFilter)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  repeatCustomerFilter
                    ? 'bg-sky-700 text-white shadow-sm'
                    : 'bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>{repeatCustomersCount} Repeat Customers</span>
              </button>
            )}

            {repeatVinJobsCount > 0 && (
              <button
                type="button"
                onClick={() => setRepeatVinFilter(!repeatVinFilter)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  repeatVinFilter
                    ? 'bg-amber-700 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Car className="w-3.5 h-3.5 text-amber-700" />
                <span>{repeatVinJobsCount} Repeat VIN Visits</span>
              </button>
            )}

            {repeatJobsCount > 0 && (
              <button
                type="button"
                onClick={() => setRepeatOnlyFilter(!repeatOnlyFilter)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  repeatOnlyFilter
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span>{repeatJobsCount} Repeat / QC Rework</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          <button
            onClick={() => setStageFilter('all')}
            className={`p-2.5 rounded-lg text-left border transition-all cursor-pointer ${
              stageFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="text-[11px] uppercase font-semibold">All Jobs</div>
            <div className="text-xl font-bold font-mono mt-0.5">{getStageCount('all')}</div>
          </button>

          <button
            onClick={() => setStageFilter('parts_waiting')}
            className={`p-2.5 rounded-lg text-left border transition-all cursor-pointer ${
              stageFilter === 'parts_waiting'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <div className="text-[11px] uppercase font-semibold flex items-center gap-1">
              <span>Parts Waiting</span>
            </div>
            <div className="text-xl font-bold font-mono mt-0.5">{getStageCount('parts_waiting')}</div>
          </button>

          <button
            onClick={() => setStageFilter('denting')}
            className={`p-2.5 rounded-lg text-left border transition-all cursor-pointer ${
              stageFilter === 'denting'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            <div className="text-[11px] uppercase font-semibold">Denting</div>
            <div className="text-xl font-bold font-mono mt-0.5">{getStageCount('denting')}</div>
          </button>

          <button
            onClick={() => setStageFilter('painting')}
            className={`p-2.5 rounded-lg text-left border transition-all cursor-pointer ${
              stageFilter === 'painting'
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
            }`}
          >
            <div className="text-[11px] uppercase font-semibold">Painting</div>
            <div className="text-xl font-bold font-mono mt-0.5">{getStageCount('painting')}</div>
          </button>

          <button
            onClick={() => setStageFilter('ready_to_deliver')}
            className={`p-2.5 rounded-lg text-left border transition-all cursor-pointer ${
              stageFilter === 'ready_to_deliver'
                ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                : 'bg-cyan-50 text-cyan-900 border-cyan-200 hover:bg-cyan-100'
            }`}
          >
            <div className="text-[11px] uppercase font-semibold">Ready to Deliver</div>
            <div className="text-xl font-bold font-mono mt-0.5">{getStageCount('ready_to_deliver')}</div>
          </button>

          <button
            onClick={() => setStageFilter('delivered')}
            className={`p-2.5 rounded-lg text-left border transition-all cursor-pointer ${
              stageFilter === 'delivered'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <div className="text-[11px] uppercase font-semibold">Delivered</div>
            <div className="text-xl font-bold font-mono mt-0.5">{getStageCount('delivered')}</div>
          </button>
        </div>
      </div>

      {/* CREATE NEW JOB CARD (c.1) */}
      {activeTab === 'open_new' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Module C.1: Open Vehicle Job Card</h2>
            <p className="text-xs text-slate-500">
              Generate distinct serial numbers for Lube (`LB-...`) and Bodyshop (`BS-...`) with automatic repeat customer checking.
            </p>
          </div>

          <form onSubmit={handleOpenJobCard} className="space-y-6">
            {/* c.1: Two Types Serial Numbers */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Select Job Card Serial Type (c.1)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  onClick={() => setNewJobType('lube')}
                  className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                    newJobType === 'lube'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono">
                      LUBE SERVICE (LB)
                    </span>
                    <div className="text-sm font-semibold text-slate-900">Periodic Oil, Fluids & Fast Lube</div>
                    <div className="text-xs text-slate-500">Auto-assigned next serial: <strong className="font-mono text-indigo-700">{getNextSerialNumber('lube')}</strong></div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    newJobType === 'lube' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                  }`}>
                    {newJobType === 'lube' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </label>

                <label
                  onClick={() => setNewJobType('bodyshop')}
                  className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                    newJobType === 'bodyshop'
                      ? 'border-purple-600 bg-purple-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-mono">
                      BODYSHOP & COLLISION (BS)
                    </span>
                    <div className="text-sm font-semibold text-slate-900">Denting, Chassis Jig & Paint Refinish</div>
                    <div className="text-xs text-slate-500">Auto-assigned next serial: <strong className="font-mono text-purple-700">{getNextSerialNumber('bodyshop')}</strong></div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    newJobType === 'bodyshop' ? 'border-purple-600 bg-purple-600' : 'border-slate-300'
                  }`}>
                    {newJobType === 'bodyshop' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </label>
              </div>
            </div>

            {/* Customer & Vehicle Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sultan Al-Harthy"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Customer WhatsApp / Phone *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+968 9123 4567"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Vehicle Plate # (Repeat Detector) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muscat 48291-A"
                  value={plateNumber}
                  onChange={(e) => handlePlateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Vehicle Make, Model & Year
                </label>
                <input
                  type="text"
                  placeholder="e.g. Toyota Land Cruiser V8 5.7L / 2023"
                  value={vehicleMakeModel}
                  onChange={(e) => setVehicleMakeModel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Chassis / VIN Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. JTMHT05J58402914"
                  value={vinNumber}
                  onChange={(e) => handleVinChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase"
                />
              </div>
            </div>

            {/* Manual Toggle / Indication for Repeat Job */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={isRepeatJob}
                  onChange={(e) => setIsRepeatJob(e.target.checked)}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                />
                <span>Flag as Repeat Job / Warranty Re-check (QC Alert)</span>
              </label>
              {isRepeatJob && (
                <span className="text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                  QC Flagged
                </span>
              )}
            </div>

            {/* Repeat Job Alert Banner if detected */}
            {isRepeatJob && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                  <span>REPEAT JOB DETECTED — Warranty / Quality Check Flagged</span>
                </div>
                <p className="text-xs text-red-700">
                  This vehicle was recently serviced under previous Job Card <strong>{previousJobNumber || 'Prior JC'}</strong>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-red-900 mb-0.5">Repeat Rework Reason</label>
                    <input
                      type="text"
                      value={repeatReason}
                      onChange={(e) => setRepeatReason(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-red-300 rounded text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-red-900 mb-0.5">Previous Reference Card #</label>
                    <input
                      type="text"
                      value={previousJobNumber}
                      onChange={(e) => setPreviousJobNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-red-300 rounded text-xs bg-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Initial Stage, Technician and Bay Assignment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Initial Workflow Stage (c.2)
                </label>
                <select
                  value={initialStage}
                  onChange={(e: any) => setInitialStage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="in_progress">In Progress (Active Work)</option>
                  <option value="parts_waiting">Parts Waiting (Pending Stock)</option>
                  <option value="denting">Denting (Bodyshop Stage)</option>
                  <option value="painting">Painting (Spray Booth Stage)</option>
                  <option value="ready_to_deliver">Ready to Deliver</option>
                  <option value="draft">Draft Intake</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Assign Lead Technician
                </label>
                <select
                  value={assignedTechId}
                  onChange={(e) => {
                    setAssignedTechId(e.target.value);
                    const t = (state.technicians || []).find((tech) => tech.id === e.target.value);
                    if (t) setBayNumber(t.bay);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  {(state.technicians || []).map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name} — {tech.specialization} ({tech.bay})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Assigned Bay / Lift / Booth
                </label>
                <input
                  type="text"
                  value={bayNumber}
                  onChange={(e) => setBayNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Before Photo URL (Intake Damage / Inspection Photo)
              </label>
              <input
                type="text"
                placeholder="https://... (or leave default workshop image)"
                value={beforePhotoUrl}
                onChange={(e) => setBeforePhotoUrl(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Intake Notes & Customer Complaints
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Engine oil leakage complaint, front bumper crack repair, check brake pads thickness."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('pipeline')}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Open & Dispatch Job Card</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PIPELINE & CARDS LIST VIEW */}
      {activeTab === 'pipeline' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-4 space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search Job Card #, Plate, Tech..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e: any) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white"
              >
                <option value="all">All Types (LB & BS)</option>
                <option value="lube">Lube Service (LB)</option>
                <option value="bodyshop">Bodyshop & Collision (BS)</option>
              </select>

              {/* Stage Filter */}
              <select
                value={stageFilter}
                onChange={(e: any) => setStageFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white"
              >
                <option value="all">All Stages</option>
                <option value="parts_waiting">Parts Waiting</option>
                <option value="denting">Denting</option>
                <option value="painting">Painting</option>
                <option value="ready_to_deliver">Ready to Deliver</option>
                <option value="delivered">Delivered</option>
                <option value="in_progress">In Progress</option>
              </select>
            </div>
          </div>

          {/* Table of Job Cards */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3">Job Card # (c.1)</th>
                  <th className="px-4 py-3">Vehicle & Customer</th>
                  <th className="px-4 py-3">Stage Monitor (c.2)</th>
                  <th className="px-4 py-3">Assigned Tech & Bay</th>
                  <th className="px-4 py-3 text-center">Parts / Consumables</th>
                  <th className="px-4 py-3 text-center">Inspection Photos</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredJobCards.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No job cards found for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredJobCards.map((jc) => {
                    const pendingPartsCount = (jc.partsRequired || []).filter(
                      (p) => p.status === 'pending' || p.status === 'ordered'
                    ).length;
                    const allocatedPartsCount = (jc.partsRequired || []).filter(
                      (p) => p.status === 'allocated' || p.status === 'arrived'
                    ).length;
                    const consumablesCount = jc.consumablesUsed?.length || 0;

                    return (
                      <tr key={jc.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 text-base">
                              {jc.jobCardNumber}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              jc.jobType === 'lube'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {jc.jobType}
                            </span>
                          </div>

                          {jc.isRepeatJob && (
                            <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                              <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                              <span>REPEAT JOB (QC)</span>
                            </div>
                          )}
                          {jc.previousJobCardNumber && (
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              Prev Ref: <span className="font-semibold text-slate-700">{jc.previousJobCardNumber}</span>
                            </div>
                          )}
                          <div className="text-[11px] text-slate-400 mt-0.5">{jc.createdAt}</div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-900">{jc.customerName}</span>
                            {isRepeatCustomer(jc) && (
                              <span
                                title={`Repeat Customer — ${getCustomerVisitCount(jc)} recorded visits in workshop`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300 shadow-2xs"
                              >
                                <UserCheck className="w-3 h-3 text-sky-600 shrink-0" />
                                <span>Repeat Customer ({getCustomerVisitCount(jc)})</span>
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-700 font-medium mt-0.5">{jc.vehicleDetails}</div>

                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            {jc.plateNumber && (
                              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                                {jc.plateNumber}
                              </span>
                            )}
                            {jc.vinNumber && (
                              <span className="text-[10px] font-mono text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                VIN: {jc.vinNumber}
                              </span>
                            )}
                            {isRepeatVin(jc) && (
                              <span
                                title={`Identical VIN matched across ${getVinVisitCount(jc)} workshop service cards`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs"
                              >
                                <Car className="w-3 h-3 text-amber-700 shrink-0" />
                                <span>Repeat VIN ({getVinVisitCount(jc)} visits)</span>
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] font-mono text-slate-400 mt-1">{jc.contactPhone}</div>
                        </td>

                        <td className="px-4 py-3">
                          <select
                            value={jc.status}
                            onChange={(e: any) => handleUpdateStage(jc.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase cursor-pointer border ${
                              jc.status === 'parts_waiting'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : jc.status === 'denting'
                                ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                                : jc.status === 'painting'
                                ? 'bg-purple-100 text-purple-800 border-purple-300'
                                : jc.status === 'ready_to_deliver'
                                ? 'bg-cyan-100 text-cyan-800 border-cyan-300'
                                : jc.status === 'delivered'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-slate-100 text-slate-800 border-slate-300'
                            }`}
                          >
                            <option value="parts_waiting">⚠️ Parts Waiting</option>
                            <option value="denting">🔨 Denting</option>
                            <option value="painting">🎨 Painting</option>
                            <option value="in_progress">⚙️ In Progress</option>
                            <option value="ready_to_deliver">🚗 Ready to Deliver</option>
                            <option value="delivered">✅ Delivered</option>
                            <option value="completed">Completed</option>
                          </select>
                        </td>

                        <td className="px-4 py-3">
                          <div className="text-xs font-semibold text-slate-900">
                            {jc.assignedTechnicianName || 'Unassigned'}
                          </div>
                          <div className="text-xs text-slate-500">{jc.bayNumber || 'General Bay'}</div>
                          {jc.workTimerStatus === 'running' && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                              Timer Running
                            </span>
                          )}
                          {jc.workTimerStatus === 'paused' && (
                            <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                              ⏸️ Paused: {jc.pauseReason?.substring(0, 20)}...
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex flex-col items-center gap-0.5">
                            <span className="text-xs font-semibold text-slate-800">
                              {allocatedPartsCount} allocated / {pendingPartsCount} pending
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {consumablesCount} consumables used
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setSelectedPhotoModal(jc)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Before / After</span>
                          </button>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* P&L button */}
                            <button
                              onClick={() => onNavigateToPnl && onNavigateToPnl(jc.id)}
                              title="View Job Card P&L"
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                            >
                              <TrendingUp className="w-3.5 h-3.5" />
                            </button>

                            {/* Parts Requisition button */}
                            <button
                              onClick={() => onNavigateToPartsTransfer && onNavigateToPartsTransfer(jc.id)}
                              title="Transfer Parts & Consumables"
                              className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                            >
                              <Boxes className="w-3.5 h-3.5" />
                            </button>

                            {/* Supervisor Live Desk button */}
                            <button
                              onClick={() => onNavigateToSupervisorLive && onNavigateToSupervisorLive(jc.id)}
                              title="Live Supervisor Timer & Technician Desk"
                              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium flex items-center gap-1 cursor-pointer"
                            >
                              <span>Desk</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BEFORE & AFTER PHOTO MODAL */}
      {selectedPhotoModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  Inspection Photos — {selectedPhotoModal.jobCardNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedPhotoModal.customerName} • {selectedPhotoModal.vehicleDetails}
                </p>
              </div>
              <button
                onClick={() => setSelectedPhotoModal(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                  <span>1. Before Service / Damage Intake</span>
                  <label className="cursor-pointer text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Upload / Snap</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && selectedPhotoModal) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const dataUrl = ev.target?.result as string;
                            onUpdateState((prev) => ({
                              ...prev,
                              jobCards: prev.jobCards.map((c) =>
                                c.id === selectedPhotoModal.id ? { ...c, before_photo: dataUrl } : c
                              ),
                            }));
                            setSelectedPhotoModal((prev) => prev ? { ...prev, before_photo: dataUrl } : null);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                {selectedPhotoModal.before_photo ? (
                  <div className="relative h-60 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center group">
                    <img
                      src={selectedPhotoModal.before_photo}
                      alt="Before"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded bg-slate-900/80 text-white text-[10px] font-mono">
                      INTAKE INSPECTION
                    </div>
                  </div>
                ) : (
                  <label className="h-60 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20 transition-all flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 text-xs cursor-pointer p-4 text-center">
                    <Camera className="w-8 h-8 mb-2" />
                    <span className="font-semibold">Click to upload or capture before photo</span>
                    <span className="text-[10px] text-slate-400 mt-1">Supports camera & image gallery</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && selectedPhotoModal) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const dataUrl = ev.target?.result as string;
                            onUpdateState((prev) => ({
                              ...prev,
                              jobCards: prev.jobCards.map((c) =>
                                c.id === selectedPhotoModal.id ? { ...c, before_photo: dataUrl } : c
                              ),
                            }));
                            setSelectedPhotoModal((prev) => prev ? { ...prev, before_photo: dataUrl } : null);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center justify-between">
                  <span>2. After Service / Completed Refinish</span>
                  <label className="cursor-pointer text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Upload / Snap</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && selectedPhotoModal) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const dataUrl = ev.target?.result as string;
                            onUpdateState((prev) => ({
                              ...prev,
                              jobCards: prev.jobCards.map((c) =>
                                c.id === selectedPhotoModal.id ? { ...c, after_photo: dataUrl } : c
                              ),
                            }));
                            setSelectedPhotoModal((prev) => prev ? { ...prev, after_photo: dataUrl } : null);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                {selectedPhotoModal.after_photo ? (
                  <div className="relative h-60 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center group">
                    <img
                      src={selectedPhotoModal.after_photo}
                      alt="After"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded bg-emerald-900/90 text-white text-[10px] font-mono">
                      COMPLETED QC REPAIR
                    </div>
                  </div>
                ) : (
                  <label className="h-60 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/20 transition-all flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 text-xs cursor-pointer p-4 text-center">
                    <Camera className="w-8 h-8 mb-2" />
                    <span className="font-semibold">Click to upload or capture after photo</span>
                    <span className="text-[10px] text-slate-400 mt-1">Vehicle delivery & warranty documentation</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && selectedPhotoModal) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const dataUrl = ev.target?.result as string;
                            onUpdateState((prev) => ({
                              ...prev,
                              jobCards: prev.jobCards.map((c) =>
                                c.id === selectedPhotoModal.id ? { ...c, after_photo: dataUrl } : c
                              ),
                            }));
                            setSelectedPhotoModal((prev) => prev ? { ...prev, after_photo: dataUrl } : null);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
              <strong>Technician Notes:</strong> {selectedPhotoModal.notes || 'No extra intake notes recorded.'}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedPhotoModal(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
