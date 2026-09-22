import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Pause,
  Square,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  User,
  Activity,
  Award,
  BarChart3,
  Wrench,
  Car,
  ChevronRight,
  RotateCcw,
  Zap
} from 'lucide-react';
import {
  ERPState,
  Technician,
  JobCard,
  AuditLog,
  LaborEntry
} from '../types';
import { formatCurrency } from '../utils/formatters';

interface SupervisorLiveViewProps {
  state: ERPState;
  onUpdateState: React.Dispatch<React.SetStateAction<ERPState>>;
  selectedJobCardId?: string | number;
}

export const SupervisorLiveView: React.FC<SupervisorLiveViewProps> = ({
  state,
  onUpdateState,
  selectedJobCardId,
}) => {
  const [activeTab, setActiveTab] = useState<'live_bays' | 'mobile_app' | 'repeat_tracking' | 'performance_report'>('live_bays');

  // Pause Reason Modal
  const [pauseModalJc, setPauseModalJc] = useState<JobCard | null>(null);
  const [pauseReasonInput, setPauseReasonInput] = useState('Waiting for spare parts from warehouse');

  // Mobile App Simulator State
  const [activeMobileTechId, setActiveMobileTechId] = useState<string>('tech-01');
  const [mobileStopwatchSeconds, setMobileStopwatchSeconds] = useState<number>(2718); // 45m 18s initial

  // Tick active stopwatch for mobile simulator if running
  useEffect(() => {
    const activeTech = (state.technicians || []).find((t) => t.id === activeMobileTechId);
    const activeJc = (state.jobCards || []).find(
      (j) => j.assignedTechnicianId === activeMobileTechId && j.workTimerStatus === 'running'
    );

    let interval: any = null;
    if (activeJc) {
      interval = setInterval(() => {
        setMobileStopwatchSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeMobileTechId, state.jobCards, state.technicians]);

  // Handle Timer Actions: Start, Pause, Stop
  const handleStartTimer = (jobCardId: string | number) => {
    const jc = (state.jobCards || []).find((j) => j.id === jobCardId);
    if (!jc) return;

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      action: 'Work Timer Started',
      category: 'workshop',
      details: `Technician ${jc.assignedTechnicianName} started work on Job Card ${jc.jobCardNumber}`,
      performedBy: 'Supervisor / Mobile Tech',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      severity: 'info',
    };

    onUpdateState((prev) => ({
      ...prev,
      jobCards: (prev.jobCards || []).map((j) =>
        j.id === jobCardId
          ? {
              ...j,
              workTimerStatus: 'running',
              timerStartedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
              pauseReason: undefined,
            }
          : j
      ),
      auditLogs: [audit, ...(prev.auditLogs || [])],
    }));
  };

  const handleOpenPauseModal = (jc: JobCard) => {
    setPauseModalJc(jc);
  };

  const handleConfirmPauseTimer = () => {
    if (!pauseModalJc) return;

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      action: 'Work Timer Paused',
      category: 'workshop',
      details: `Job Card ${pauseModalJc.jobCardNumber} paused by ${pauseModalJc.assignedTechnicianName}. Reason: ${pauseReasonInput}`,
      performedBy: 'Supervisor / Mobile Tech',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      severity: 'warning',
    };

    onUpdateState((prev) => ({
      ...prev,
      jobCards: (prev.jobCards || []).map((j) =>
        j.id === pauseModalJc.id
          ? {
              ...j,
              workTimerStatus: 'paused',
              pauseReason: pauseReasonInput,
            }
          : j
      ),
      auditLogs: [audit, ...(prev.auditLogs || [])],
    }));

    setPauseModalJc(null);
  };

  const handleStopTimer = (jobCardId: string | number) => {
    const jc = (state.jobCards || []).find((j) => j.id === jobCardId);
    if (!jc) return;

    const audit: AuditLog = {
      id: `aud-${Date.now()}`,
      action: 'Work Timer Stopped',
      category: 'workshop',
      details: `Technician ${jc.assignedTechnicianName} stopped/completed clocked labor on Job Card ${jc.jobCardNumber}`,
      performedBy: 'Supervisor / Mobile Tech',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      severity: 'info',
    };

    onUpdateState((prev) => ({
      ...prev,
      jobCards: (prev.jobCards || []).map((j) =>
        j.id === jobCardId
          ? {
              ...j,
              workTimerStatus: 'stopped',
              status: 'ready_to_deliver',
              elapsedMinutes: (j.elapsedMinutes || 0) + 45,
            }
          : j
      ),
      auditLogs: [audit, ...(prev.auditLogs || [])],
    }));

    alert(`Work stopped on ${jc.jobCardNumber}. Labor hours saved and job moved to Ready to Deliver!`);
  };

  // Format seconds to HH:MM:SS
  const formatSeconds = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Selected Mobile Tech
  const activeTech = (state.technicians || []).find((t) => t.id === activeMobileTechId) || (state.technicians || [])[0];
  const activeTechJob = (state.jobCards || []).find(
    (j) => j.assignedTechnicianId === activeMobileTechId && j.status !== 'delivered'
  );

  return (
    <div className="space-y-6">
      {/* Header and Module Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Module D
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Supervisor Work Assignment & Technician Live Desk
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time Start/Pause/Stop timers, smartphone mobile app view for technicians, repeat job quality tracking, and technician performance KPIs.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('live_bays')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'live_bays'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            <span>Live Bay Monitoring (d.4)</span>
          </button>

          <button
            onClick={() => setActiveTab('mobile_app')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'mobile_app'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tech Mobile App (d.2)</span>
          </button>

          <button
            onClick={() => setActiveTab('repeat_tracking')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'repeat_tracking'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-600" />
            <span>Repeat Job Tracking (d.3)</span>
          </button>

          <button
            onClick={() => setActiveTab('performance_report')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'performance_report'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>Performance Report (d.5)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: LIVE JOB MONITORING (d.4) & WORK TIMERS (d.1) */}
      {activeTab === 'live_bays' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Workshop Bays & Active Job Cards (d.4: Live Monitoring)</span>
            </h2>
            <div className="text-xs text-slate-500 font-mono">
              Live updates: 5 Active Bays • 4 Technicians Clocked In
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(state.technicians || []).map((tech) => {
              const activeJc = (state.jobCards || []).find(
                (jc) => jc.assignedTechnicianId === tech.id && jc.status !== 'delivered'
              );

              return (
                <div
                  key={tech.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between"
                >
                  {/* Card Header: Bay & Tech */}
                  <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                        {tech.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{tech.name}</div>
                        <div className="text-xs text-slate-500">{tech.specialization}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {tech.bay}
                    </span>
                  </div>

                  {/* Card Body: Active Job */}
                  <div className="p-4 space-y-3 flex-1">
                    {activeJc ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              {activeJc.jobCardNumber}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              activeJc.jobType === 'lube' ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {activeJc.jobType}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            activeJc.status === 'parts_waiting'
                              ? 'bg-amber-100 text-amber-800'
                              : activeJc.status === 'denting'
                              ? 'bg-indigo-100 text-indigo-800'
                              : activeJc.status === 'painting'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {activeJc.status}
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-slate-800">
                          {activeJc.vehicleDetails}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Client: {activeJc.customerName} ({activeJc.contactPhone})
                        </div>

                        {activeJc.isRepeatJob && (
                          <div className="text-[10px] font-bold text-red-600 bg-red-50 p-1.5 rounded border border-red-200 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Repeat Job: {activeJc.repeatReason?.substring(0, 45)}...</span>
                          </div>
                        )}

                        {/* Live Timer Status & Display (d.1) */}
                        <div className="bg-slate-900 text-slate-100 p-3 rounded-xl flex items-center justify-between font-mono">
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Clocked Timer (d.1)</div>
                            <div className="text-lg font-bold text-emerald-400 flex items-center gap-1.5">
                              {activeJc.workTimerStatus === 'running' && (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                              )}
                              <span>
                                {activeJc.workTimerStatus === 'running'
                                  ? '01:14:32'
                                  : activeJc.workTimerStatus === 'paused'
                                  ? 'PAUSED'
                                  : 'STOPPED'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400">Total Hours</div>
                            <div className="text-xs font-semibold text-white">
                              {((activeJc.elapsedMinutes || 0) / 60 + 1.25).toFixed(1)} hrs
                            </div>
                          </div>
                        </div>

                        {activeJc.workTimerStatus === 'paused' && activeJc.pauseReason && (
                          <div className="text-xs text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                            <strong>Pause Reason:</strong> {activeJc.pauseReason}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
                        <Wrench className="w-6 h-6 mb-1 text-slate-300" />
                        <span>Bay is currently idle. No active job assigned.</span>
                      </div>
                    )}
                  </div>

                  {/* Card Actions: Work Start / Pause / Stop (d.1) */}
                  {activeJc && (
                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleStartTimer(activeJc.id)}
                        disabled={activeJc.workTimerStatus === 'running'}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                          activeJc.workTimerStatus === 'running'
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        }`}
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Start</span>
                      </button>

                      <button
                        onClick={() => handleOpenPauseModal(activeJc)}
                        disabled={activeJc.workTimerStatus === 'paused' || activeJc.workTimerStatus === 'stopped'}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                          activeJc.workTimerStatus === 'paused' || activeJc.workTimerStatus === 'stopped'
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                        }`}
                      >
                        <Pause className="w-3 h-3 fill-current" />
                        <span>Pause</span>
                      </button>

                      <button
                        onClick={() => handleStopTimer(activeJc.id)}
                        disabled={activeJc.workTimerStatus === 'stopped'}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                          activeJc.workTimerStatus === 'stopped'
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                        }`}
                      >
                        <Square className="w-3 h-3 fill-current" />
                        <span>Stop</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: TECHNICIAN MOBILE APP SIMULATOR (d.2) */}
      {activeTab === 'mobile_app' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Controls & Tech selector on the left */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Module D.2: Technician Mobile Simulator</h2>
              <p className="text-xs text-slate-500 mt-1">
                Technicians use their smartphones or workshop tablet stations to clock in, start/pause/stop job timers, and verify required spare parts.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Select Technician Device
              </label>
              <select
                value={activeMobileTechId}
                onChange={(e) => setActiveMobileTechId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                {(state.technicians || []).map((t) => (
                  <option key={t.id} value={t.id}>
                    📱 {t.name} ({t.specialization} - {t.bay})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-2 text-slate-700">
              <div className="font-semibold text-slate-900">Mobile Device Capabilities:</div>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                <li>Instant 1-tap labor timer start / pause / resume</li>
                <li>Live stopwatch with vibration feedback</li>
                <li>Parts arrival notification alerts</li>
                <li>Auto-save offline time entries if network drops</li>
              </ul>
            </div>
          </div>

          {/* Interactive Mobile Device Frame */}
          <div className="lg:col-span-2 flex justify-center">
            <div className="w-full max-w-sm rounded-[36px] bg-slate-950 p-3 shadow-2xl border-4 border-slate-800 relative">
              {/* Smartphone Notch / Speaker */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full flex items-center justify-center">
                <div className="w-10 h-1 bg-slate-700 rounded-full" />
              </div>

              {/* Mobile Screen Surface */}
              <div className="bg-slate-900 rounded-[28px] overflow-hidden text-slate-100 pt-7 pb-4 px-4 space-y-4">
                {/* Mobile App Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                      {activeTech.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{activeTech.name}</div>
                      <div className="text-[10px] text-emerald-400 font-mono">ONLINE • {activeTech.bay}</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    APEX TECH APP
                  </span>
                </div>

                {/* Active Job Card Card */}
                {activeTechJob ? (
                  <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-white">
                        {activeTechJob.jobCardNumber}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold uppercase">
                        {activeTechJob.status}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        {activeTechJob.vehicleDetails}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Owner: {activeTechJob.customerName}
                      </div>
                    </div>

                    {/* Big Digital Stopwatch Display */}
                    <div className="bg-slate-950 p-4 rounded-xl text-center border border-slate-800">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                        Active Time Entry (d.2)
                      </div>
                      <div className="text-3xl font-extrabold font-mono text-emerald-400 tracking-wider my-1">
                        {formatSeconds(mobileStopwatchSeconds)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Standard Billable Rate: 15.000 OMR/hr
                      </div>
                    </div>

                    {/* Touch-Friendly Buttons */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        onClick={() => handleStartTimer(activeTechJob.id)}
                        className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-md cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>START</span>
                      </button>

                      <button
                        onClick={() => handleOpenPauseModal(activeTechJob)}
                        className="py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-md cursor-pointer"
                      >
                        <Pause className="w-4 h-4 fill-current" />
                        <span>PAUSE</span>
                      </button>

                      <button
                        onClick={() => handleStopTimer(activeTechJob.id)}
                        className="py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-md cursor-pointer"
                      >
                        <Square className="w-4 h-4 fill-current" />
                        <span>STOP</span>
                      </button>
                    </div>

                    {/* Required Parts Checklist for Technician */}
                    <div className="border-t border-slate-700/80 pt-2 space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                        Required Spare Parts ({activeTechJob.partsRequired?.length || 0})
                      </div>
                      {(activeTechJob.partsRequired || []).map((part, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-1.5 rounded bg-slate-900/60 border border-slate-800"
                        >
                          <span className="text-slate-300 truncate max-w-[170px]">{part.partName}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            part.status === 'allocated' || part.status === 'arrived'
                              ? 'bg-emerald-900/60 text-emerald-400'
                              : 'bg-amber-900/60 text-amber-400'
                          }`}>
                            {part.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-800/80 p-6 rounded-2xl text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <div className="text-sm font-bold text-white">All Clear!</div>
                    <div className="text-xs text-slate-400">
                      You do not have any pending job cards assigned to your bay right now.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REPEAT JOB TRACKING (d.3) */}
      {activeTab === 'repeat_tracking' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-red-600" />
                <span>Module D.3: Repeat Job & Warranty Rework Tracking</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Vehicles returning within 90 days for identical or related faults require supervisor investigation and root cause classification.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3">Repeat Job #</th>
                  <th className="px-4 py-3">Customer & Vehicle</th>
                  <th className="px-4 py-3">Previous Job Ref</th>
                  <th className="px-4 py-3">Rework Reason & Root Cause</th>
                  <th className="px-4 py-3">Responsible Tech</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(state.jobCards || []).filter((j) => j.isRepeatJob).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No repeat/rework jobs currently flagged in the system.
                    </td>
                  </tr>
                ) : (
                  (state.jobCards || [])
                    .filter((j) => j.isRepeatJob)
                    .map((jc) => (
                      <tr key={jc.id} className="hover:bg-red-50/30">
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-red-700">{jc.jobCardNumber}</span>
                          <div className="text-[10px] text-slate-400">{jc.createdAt}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{jc.customerName}</div>
                          <div className="text-xs text-slate-600">{jc.vehicleDetails}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-xs font-semibold text-slate-800">
                            {jc.previousJobCardNumber || 'LB-2025-089'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-red-900 font-medium">
                            {jc.repeatReason || 'Oil seepage recurring around sump plug after recent periodic service'}
                          </div>
                          <span className="text-[10px] text-slate-500">Root Cause: Sealant / Torque deficiency</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-semibold text-slate-800">{jc.assignedTechnicianName}</div>
                          <div className="text-[11px] text-slate-400">{jc.bayNumber}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-800">
                            Under Warranty Investigation
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: TECHNICIANS PERFORMANCE REPORT (d.5) */}
      {activeTab === 'performance_report' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                <span>Module D.5: Technicians Performance & Productivity Report</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly analytics on completed jobs, billable efficiency ratio, rework rates, and labor wage costs.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3">Technician</th>
                  <th className="px-4 py-3">Specialization</th>
                  <th className="px-4 py-3 text-center">Jobs Completed</th>
                  <th className="px-4 py-3 text-center">Rework Jobs</th>
                  <th className="px-4 py-3 text-center">Rework %</th>
                  <th className="px-4 py-3 text-center">Efficiency %</th>
                  <th className="px-4 py-3 text-right">Clocked Hours</th>
                  <th className="px-4 py-3 text-right">Wage Cost (OMR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(state.technicians || []).map((t) => {
                  const completed = t.jobsCompleted ?? t.completedJobsCount ?? 0;
                  const rework = t.reworkCount ?? t.reworkJobsCount ?? 0;
                  const eff = t.efficiency ?? t.efficiencyRating ?? 95;
                  const reworkPercent = completed > 0 ? ((rework / completed) * 100).toFixed(1) : '0.0';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{t.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{t.bay}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700 font-medium">
                        {t.specialization}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                        {completed}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-red-600 font-bold">
                        {rework}
                      </td>
                      <td className="px-4 py-3 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          Number(reworkPercent) > 3.0 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {reworkPercent}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-indigo-700">
                        {eff}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-800">
                        168.5 hrs
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(t.hourlyWage * 168.5, state.settings.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PAUSE REASON MODAL */}
      {pauseModalJc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  ⏸️
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Pause Work Timer (d.1)</h3>
                  <p className="text-xs text-slate-500">{pauseModalJc.jobCardNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setPauseModalJc(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Select or Enter Pause Reason
              </label>
              <select
                value={pauseReasonInput}
                onChange={(e) => setPauseReasonInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-2"
              >
                <option value="Waiting for spare parts from warehouse">⚠️ Waiting for spare parts from warehouse</option>
                <option value="Waiting for paint to cure / bake in booth">🎨 Waiting for paint to cure / bake</option>
                <option value="Lunch / Shift Break">🥪 Lunch / Shift Break</option>
                <option value="Customer clarification on estimate">📞 Customer clarification on estimate</option>
                <option value="Sublet machining / lathe work outside">🔧 Sublet machining / lathe work</option>
              </select>

              <input
                type="text"
                value={pauseReasonInput}
                onChange={(e) => setPauseReasonInput(e.target.value)}
                placeholder="Or custom explanation..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPauseModalJc(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPauseTimer}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Confirm Pause
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
