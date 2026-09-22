import React from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Phone,
  FileCheck,
  Car,
  Package,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Users,
  ArrowRight,
  ExternalLink,
  Info
} from 'lucide-react';
import { ERPState, ManagerPermissions, DEFAULT_MANAGER_PERMISSIONS } from '../types';

interface ManagerPortalViewProps {
  state: ERPState;
  onNavigate: (module: any) => void;
  onApproveEstimate?: (id: string | number) => void;
}

export const ManagerPortalView: React.FC<ManagerPortalViewProps> = ({
  state,
  onNavigate,
  onApproveEstimate,
}) => {
  const perms: ManagerPermissions = state.settings.managerPermissions || DEFAULT_MANAGER_PERMISSIONS;
  const ownerName = state.settings.ownerName || 'ANSHAD';
  const ownerPhone = state.settings.ownerPhone || '+968 94616364';

  const pendingEstimates = (state.estimates || []).filter((e) => e.status === 'draft' || e.status === 'sent');
  const activeJobCards = (state.jobCards || []).filter((j) => j.status !== 'delivered' && j.status !== 'completed');

  const permissionList = [
    {
      key: 'canApproveEstimates',
      label: 'Estimate Approval & Pricing Discounts',
      desc: 'Authorize customer quotations, claim estimates, and discount markups.',
      granted: perms.canApproveEstimates,
      targetModule: 'estimates',
      icon: FileCheck,
    },
    {
      key: 'canManageJobCards',
      label: 'Workshop Job Card Stage Dispatch',
      desc: 'Reassign technician bays, transition repair milestones, update repair notes.',
      granted: perms.canManageJobCards,
      targetModule: 'job_cards',
      icon: Car,
    },
    {
      key: 'canManageInventory',
      label: 'Spare Parts & Consumables Ordering',
      desc: 'Transfer paints and filters to job cards, register stock arrivals.',
      granted: perms.canManageInventory,
      targetModule: 'workshop_inventory',
      icon: Package,
    },
    {
      key: 'canViewFinances',
      label: 'Financial Ledger & Cashflow Books',
      desc: 'Inspect workshop income, direct overhead expenses, and general ledger.',
      granted: perms.canViewFinances,
      targetModule: 'finance',
      icon: DollarSign,
    },
    {
      key: 'canViewJobCardPnl',
      label: 'Job Card Profit & Loss Margins',
      desc: 'Audit real-time parts margin, technician labor costs, and job profitability.',
      granted: perms.canViewJobCardPnl,
      targetModule: 'job_card_pnl',
      icon: TrendingUp,
    },
    {
      key: 'canApprovePurchaseOrders',
      label: 'Vendor PO Procurement Sign-off',
      desc: 'Approve vendor purchase orders above threshold limit.',
      granted: perms.canApprovePurchaseOrders,
      targetModule: 'purchasing',
      icon: ShoppingCart,
    },
    {
      key: 'canManageStaff',
      label: 'Technician Schedules & Hourly Wages',
      desc: 'Modify technician wage multipliers, overtime rates, and shift rosters.',
      granted: perms.canManageStaff,
      targetModule: 'hr',
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Manager Master Banner with Anshad Authorization Badge */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>DELEGATED EXECUTIVE MANAGEMENT PANEL</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white">
              Manager Control Center
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Operational supervision governed strictly by authorizations granted by Owner & CEO <strong className="text-white">{ownerName}</strong> ({ownerPhone}).
            </p>
          </div>

          {/* Direct WhatsApp Anshad for Permissions Button */}
          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2.5">
            <a
              href={`https://wa.me/${ownerPhone.replace(/[^0-9]/g, '')}?text=Hello%20Owner%20Anshad,%20I%20am%20the%20Workshop%20Manager%20requesting%20permission%20authorization%20for%20a%20module.`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-3 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>Request Permission from Anshad</span>
              </div>
              <span className="text-[11px] font-mono bg-emerald-700/60 px-2 py-0.5 rounded">
                WhatsApp
              </span>
            </a>

            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/80 text-[11px] text-slate-300 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Only Owner Anshad can grant or revoke manager capabilities</span>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions Matrix Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Operational Capabilities Authorized by Owner Anshad
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            {permissionList.filter((p) => p.granted).length} of {permissionList.length} Authorized
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {permissionList.map((perm) => {
            const Icon = perm.icon;
            return (
              <div
                key={perm.key}
                className={`p-5 rounded-2xl border transition-all ${
                  perm.granted
                    ? 'bg-white border-slate-200 shadow-xs hover:border-indigo-300'
                    : 'bg-slate-50/70 border-slate-200 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      perm.granted ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {perm.granted ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wide">
                      <Unlock className="w-3 h-3" />
                      <span>Authorized</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase tracking-wide">
                      <Lock className="w-3 h-3" />
                      <span>Locked by Anshad</span>
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-800 mb-1">{perm.label}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">{perm.desc}</p>

                {perm.granted ? (
                  <button
                    onClick={() => onNavigate(perm.targetModule)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span>Open Module</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <a
                    href={`https://wa.me/${ownerPhone.replace(/[^0-9]/g, '')}?text=Hello%20Anshad,%20as%20the%20Manager%20I%20need%20permission%20to%20access%20${encodeURIComponent(perm.label)}.`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Request from Anshad</span>
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Manager Actions: Pending Approvals & Live Supervision */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Estimates Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Pending Estimates for Sign-off ({pendingEstimates.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('estimates')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              All Estimates →
            </button>
          </div>

          <div className="space-y-3">
            {pendingEstimates.slice(0, 4).map((est) => (
              <div
                key={est.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-800">{est.estimateNumber} • {est.vehicleDetails || 'Vehicle'}</div>
                  <div className="text-slate-500 text-[11px]">{est.customerName} • {(est.grandTotal || 0).toFixed(3)} OMR</div>
                </div>
                {perms.canApproveEstimates ? (
                  <button
                    onClick={() => {
                      if (onApproveEstimate) onApproveEstimate(est.id);
                      alert(`Estimate ${est.estimateNumber} approved by Manager under Anshad's delegation.`);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow-2xs transition-colors cursor-pointer"
                  >
                    Approve
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Needs Anshad Approval
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Live Active Job Cards Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Active Job Cards Under Repair ({activeJobCards.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('job_cards')}
              className="text-xs font-bold text-purple-600 hover:text-purple-800"
            >
              All Job Cards →
            </button>
          </div>

          <div className="space-y-3">
            {activeJobCards.slice(0, 4).map((jc) => (
              <div
                key={jc.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-800">{jc.jobCardNumber} • {jc.vehicleDetails || 'Vehicle'}</div>
                  <div className="text-slate-500 text-[11px] capitalize">
                    Stage: {jc.status.replace(/_/g, ' ')} • Bay #{jc.bayNumber || 1}
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('job_cards')}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                >
                  Manage
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
