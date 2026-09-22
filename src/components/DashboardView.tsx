import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Package,
  ShoppingCart,
  AlertTriangle,
  ArrowUpRight,
  Truck,
  Layers,
  Clock,
  ArrowRight,
  ShieldCheck,
  Car,
  UserCheck,
  History,
  Wrench,
  CheckCircle2,
  Tag,
  BellRing,
  Calendar,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { ERPState, ModuleType, SalesOrder, Product, JobCard } from '../types';
import { formatCurrency } from '../utils/formatters';

interface DashboardViewProps {
  state: ERPState;
  onNavigate: (module: ModuleType) => void;
  onViewOrder: (order: SalesOrder) => void;
  onQuickReorder: (product: Product) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  onNavigate,
  onViewOrder,
  onQuickReorder,
}) => {
  const currency = state.settings.currency;
  const [chartRange, setChartRange] = useState<'6M' | 'YTD'>('6M');
  const [vinTabFilter, setVinTabFilter] = useState<'all' | 'active' | 'qc'>('all');
  const [isRepeatAlertCollapsed, setIsRepeatAlertCollapsed] = useState<boolean>(false);

  // Compute live metrics
  const totalSalesRevenue = state.salesOrders.reduce((acc, order) => {
    return order.status !== 'cancelled' ? acc + order.total : acc;
  }, 0);

  const totalExpenses = state.transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalInventoryValuation = state.products.reduce((acc, p) => {
    return acc + p.stockQuantity * p.costPrice;
  }, 0);

  const pendingReceivables = state.salesOrders
    .filter((o) => o.paymentStatus !== 'paid' && o.status !== 'cancelled')
    .reduce((acc, o) => acc + o.total, 0);

  const lowStockItems = state.products.filter(
    (p) => p.stockQuantity <= p.reorderLevel
  );

  const pendingOrders = state.salesOrders.filter(
    (o) => o.status === 'confirmed' || o.status === 'processing'
  );

  // Helper to check if a job card was created today or on the active system demo date (2026-09-19)
  const isCreatedToday = (dateStr?: string) => {
    if (!dateStr) return false;
    const realToday = new Date().toISOString().substring(0, 10);
    const systemSampleDate = '2026-09-19';
    const cardDate = dateStr.substring(0, 10);
    return cardDate === realToday || cardDate === systemSampleDate;
  };

  // Recent Repeat Jobs Arriving Today: Specifically alerts the manager to repeat vehicle entries arriving at the workshop today
  const todayRepeatJobs = useMemo(() => {
    const list: {
      jobCard: JobCard;
      vin: string;
      priorVisitsCount: number;
      priorCards: JobCard[];
      latestPriorCard?: JobCard;
      isQcWarrantyRework: boolean;
      daysSinceLastVisit?: number;
      arrivalTime: string;
    }[] = [];

    (state.jobCards || []).forEach((jc) => {
      // Must be created today
      if (!isCreatedToday(jc.createdAt)) return;

      const vin = (jc.vinNumber || '').trim().toUpperCase();
      // Find prior job cards matching this vehicle's VIN or customer
      const matchingPriorByVin =
        vin && vin !== 'N/A' && vin !== 'UNKNOWN'
          ? (state.jobCards || []).filter((other) => {
              if (other.id === jc.id) return false;
              const otherVin = (other.vinNumber || '').trim().toUpperCase();
              return otherVin === vin;
            })
          : [];

      const matchingPriorByName = (state.jobCards || []).filter((other) => {
        if (other.id === jc.id) return false;
        return other.customerName.trim().toLowerCase() === jc.customerName.trim().toLowerCase();
      });

      const hasPrior =
        matchingPriorByVin.length > 0 ||
        jc.isRepeatJob ||
        (jc.repeatVisitCount && jc.repeatVisitCount > 1) ||
        matchingPriorByName.length > 0;

      if (hasPrior) {
        const priorCards = matchingPriorByVin.length > 0 ? matchingPriorByVin : matchingPriorByName;
        const sortedPrior = [...priorCards].sort((a, b) =>
          (b.createdAt || '').localeCompare(a.createdAt || '')
        );
        const latestPrior = sortedPrior[0];

        // Calculate days between visits if possible
        let daysSince: number | undefined;
        if (latestPrior?.createdAt && jc.createdAt) {
          try {
            const d1 = new Date(jc.createdAt.replace(' ', 'T')).getTime();
            const d2 = new Date(latestPrior.createdAt.replace(' ', 'T')).getTime();
            const diffDays = Math.round(Math.abs(d1 - d2) / (1000 * 60 * 60 * 24));
            if (!isNaN(diffDays)) daysSince = diffDays;
          } catch {
            // ignore
          }
        }

        // Format arrival time
        let arrivalTime = 'Today';
        if (jc.createdAt && jc.createdAt.length >= 16) {
          arrivalTime = jc.createdAt.substring(11, 16);
        }

        list.push({
          jobCard: jc,
          vin: vin || 'VIN-UNRECORDED',
          priorVisitsCount: priorCards.length,
          priorCards: sortedPrior,
          latestPriorCard: latestPrior,
          isQcWarrantyRework: Boolean(jc.isRepeatJob),
          daysSinceLastVisit: daysSince,
          arrivalTime,
        });
      }
    });

    return list.sort((a, b) => {
      // Prioritize QC rework callbacks first, then most recent arrival
      if (a.isQcWarrantyRework && !b.isQcWarrantyRework) return -1;
      if (!a.isQcWarrantyRework && b.isQcWarrantyRework) return 1;
      return (b.jobCard.createdAt || '').localeCompare(a.jobCard.createdAt || '');
    });
  }, [state.jobCards]);

  // Repeat Vehicle VIN Analytics & Visit Grouping
  const repeatVinGroups = useMemo(() => {
    const map = new Map<string, JobCard[]>();
    (state.jobCards || []).forEach((jc) => {
      const vin = (jc.vinNumber || '').trim().toUpperCase();
      if (vin && vin !== 'N/A' && vin !== 'UNKNOWN') {
        const list = map.get(vin) || [];
        list.push(jc);
        map.set(vin, list);
      }
    });

    const groups: {
      vin: string;
      visitCount: number;
      cards: JobCard[];
      customerName: string;
      vehicleDetails: string;
      plateNumber?: string;
      latestCard: JobCard;
      hasActiveCard: boolean;
      hasQcReworkAlert: boolean;
    }[] = [];

    map.forEach((cards, vin) => {
      if (cards.length > 1) {
        const sorted = [...cards].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        const latest = sorted[0];
        const hasActive = sorted.some((c) => c.status !== 'delivered' && c.status !== 'completed');
        const hasQc = sorted.some((c) => c.isRepeatJob);
        groups.push({
          vin,
          visitCount: cards.length,
          cards: sorted,
          customerName: latest.customerName,
          vehicleDetails: latest.vehicleDetails || 'Vehicle',
          plateNumber: latest.plateNumber,
          latestCard: latest,
          hasActiveCard: hasActive,
          hasQcReworkAlert: hasQc,
        });
      }
    });

    return groups.sort((a, b) => {
      // Prioritize active cards, then visit count
      if (a.hasActiveCard && !b.hasActiveCard) return -1;
      if (!a.hasActiveCard && b.hasActiveCard) return 1;
      return b.visitCount - a.visitCount;
    });
  }, [state.jobCards]);

  const totalRepeatVinVehicles = repeatVinGroups.length;
  const activeRepeatVinJobs = repeatVinGroups.filter((g) => g.hasActiveCard).length;
  const qcReworkJobsCount = (state.jobCards || []).filter((jc) => jc.isRepeatJob).length;

  const totalRepeatCustomers = useMemo(() => {
    const counts: Record<string, number> = {};
    (state.jobCards || []).forEach((j) => {
      const key = j.customerName.trim().toLowerCase();
      if (key) counts[key] = (counts[key] || 0) + 1;
    });
    return Object.values(counts).filter((c) => c > 1).length;
  }, [state.jobCards]);

  // Filtered Repeat VIN groups based on user tab
  const filteredRepeatVinGroups = useMemo(() => {
    if (vinTabFilter === 'active') return repeatVinGroups.filter((g) => g.hasActiveCard);
    if (vinTabFilter === 'qc') return repeatVinGroups.filter((g) => g.hasQcReworkAlert);
    return repeatVinGroups;
  }, [repeatVinGroups, vinTabFilter]);

  // Cashflow points for pure SVG chart
  const cashflowData = [
    { month: 'Apr', revenue: 42000, expense: 28000 },
    { month: 'May', revenue: 51000, expense: 32000 },
    { month: 'Jun', revenue: 48500, expense: 30000 },
    { month: 'Jul', revenue: 64000, expense: 36000 },
    { month: 'Aug', revenue: 59000, expense: 34500 },
    { month: 'Sep', revenue: 68500, expense: 38200 },
  ];

  const maxVal = 75000;
  const chartHeight = 160;
  const chartWidth = 560;

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome & Global status banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-orange-100 text-orange-800 tracking-wider uppercase">
              CEO & OWNER DESK
            </span>
            <span className="text-xs font-bold text-orange-600">Hi ANSHAD</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
            Zukait Executive ERP Cockpit
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Welcome back, Anshad. Enterprise resource telemetry, 8-bay shop floor status, and consolidated Oman VAT financials.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {todayRepeatJobs.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
              <BellRing className="w-3.5 h-3.5 text-amber-700" />
              {todayRepeatJobs.length} Repeat Entries Arrived Today
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Core Ledgers Synchronized
          </span>
          <button
            onClick={() => onNavigate('sales')}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 ml-2"
          >
            Review Orders <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recent Repeat Jobs Summary Section: Alerts Manager to Repeat Vehicle Entries Arrived Today */}
      <div className="rounded-xl border border-amber-300 bg-linear-to-r from-amber-50/90 via-orange-50/30 to-amber-50/70 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-200/80">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs relative">
              <BellRing className="w-5 h-5" />
              {todayRepeatJobs.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-600 text-white shadow-2xs">
                  Manager Alert
                </span>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Recent Repeat Jobs (Today's Workshop Arrivals)</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-200/80 text-amber-900 border border-amber-300">
                  {todayRepeatJobs.length} {todayRepeatJobs.length === 1 ? 'Vehicle' : 'Vehicles'}
                </span>
                {todayRepeatJobs.some((r) => r.isQcWarrantyRework) && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    QC Warranty Callback Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Critical workshop telemetry: Recurring vehicles and repeat customer chassis checked into the facility today. Inspect prior repair histories to avoid warranty rework or redundant teardowns.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            <button
              type="button"
              onClick={() => onNavigate('job_cards')}
              className="text-xs font-semibold px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <span>Manage Job Cards</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsRepeatAlertCollapsed(!isRepeatAlertCollapsed)}
              className="text-xs font-medium px-2.5 py-1.5 bg-white hover:bg-amber-100/80 text-slate-700 rounded-lg border border-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
              title={isRepeatAlertCollapsed ? 'Expand Details' : 'Collapse Details'}
            >
              {isRepeatAlertCollapsed ? (
                <>
                  <span>Show</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Hide</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {!isRepeatAlertCollapsed && (
          <div className="p-4 sm:p-5 bg-white/70">
            {todayRepeatJobs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-1.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <span className="font-semibold text-slate-700">No repeat vehicle arrivals logged today.</span>
                <span>All workshop check-ins today are first-time registrations or new client intakes.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {todayRepeatJobs.map((item) => {
                  const jc = item.jobCard;
                  const prior = item.latestPriorCard;
                  return (
                    <div
                      key={jc.id}
                      className={`p-4 rounded-xl border transition-all ${
                        item.isQcWarrantyRework
                          ? 'bg-red-50/80 border-red-200 hover:border-red-300'
                          : 'bg-white border-amber-200/90 hover:border-amber-300 shadow-xs'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        {/* Vehicle & Identifiers */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                              {jc.jobCardNumber}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                              {jc.jobType}
                            </span>
                            <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              VIN: {item.vin}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <RotateCcw className="w-3 h-3 text-amber-700" />
                              Repeat Visit #{item.priorVisitsCount + 1}
                            </span>

                            {item.isQcWarrantyRework ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-red-600" />
                                QC REWORK / WARRANTY CALLBACK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                                <UserCheck className="w-3 h-3 text-sky-600" />
                                Repeat Customer
                              </span>
                            )}
                          </div>

                          <div className="flex items-baseline gap-2 flex-wrap pt-0.5">
                            <span className="text-sm font-bold text-slate-900">
                              {jc.vehicleDetails}
                            </span>
                            {jc.plateNumber && (
                              <span className="text-xs font-mono font-medium text-slate-500">
                                ({jc.plateNumber})
                              </span>
                            )}
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-medium text-slate-700">
                              Customer: <strong>{jc.customerName}</strong>
                            </span>
                            {jc.contactPhone && (
                              <span className="text-xs text-slate-500">
                                ({jc.contactPhone})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status & Arrival Info */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-[11px] text-slate-500 flex items-center justify-end gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>Arrived Today: <strong>{item.arrivalTime}</strong></span>
                            </div>
                            <div className="text-xs font-semibold capitalize text-slate-800 mt-0.5">
                              Status: <span className="text-indigo-600">{jc.status.replace(/_/g, ' ')}</span>
                            </div>
                            {jc.assignedTechnicianName && (
                              <div className="text-[11px] text-slate-500">
                                Assigned: {jc.assignedTechnicianName} ({jc.bayNumber || 'Shop Floor'})
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => onNavigate('job_cards')}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shrink-0 cursor-pointer"
                          >
                            Inspect Job Card
                          </button>
                        </div>
                      </div>

                      {/* Prior Service History vs Today's Issue */}
                      <div className="mt-3 pt-2.5 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                        {/* Prior Service Details */}
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between text-slate-600 font-medium">
                            <span className="flex items-center gap-1 font-semibold text-slate-700">
                              <History className="w-3.5 h-3.5 text-slate-500" />
                              Last Known Visit:
                            </span>
                            {prior ? (
                              <span className="font-mono text-[11px] font-bold text-slate-800">
                                {prior.jobCardNumber} ({prior.createdAt.substring(0, 10)})
                              </span>
                            ) : (
                              <span className="text-slate-400">Historical archive</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-600 mt-1">
                            {prior?.notes || 'Previous service completed and delivered.'}
                          </div>
                          {item.daysSinceLastVisit !== undefined && (
                            <div className="text-[10px] text-slate-500 mt-1 font-medium">
                              Interval: {item.daysSinceLastVisit} days since previous visit
                            </div>
                          )}
                        </div>

                        {/* Today's Scope or QC Rework Reason */}
                        <div
                          className={`p-2.5 rounded-lg border ${
                            item.isQcWarrantyRework
                              ? 'bg-red-100/70 border-red-200 text-red-950'
                              : 'bg-indigo-50/50 border-indigo-100 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span className="flex items-center gap-1">
                              <Wrench className="w-3.5 h-3.5" />
                              {item.isQcWarrantyRework ? 'QC Rework Diagnosis:' : "Today's Work Scope:"}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                              Bay: {jc.bayNumber || 'TBD'}
                            </span>
                          </div>
                          <div className="text-[11px] mt-1 leading-snug">
                            {jc.repeatReason || jc.notes || 'Routine check-in and scheduled service inspection.'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Gross Sales */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gross Sales</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalSalesRevenue, state.settings.currency)}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-emerald-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+14.2% vs prior cycle</span>
            </div>
          </div>
        </div>

        {/* Card 2: Inventory Valuation */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Inventory Valuation</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalInventoryValuation, state.settings.currency)}
            </div>
            <div className="flex items-center justify-between mt-1.5 text-xs text-slate-500">
              <span>{state.products.length} SKUs across 3 WH</span>
              <span
                onClick={() => onNavigate('inventory')}
                className="text-indigo-600 cursor-pointer font-medium hover:underline"
              >
                Inspect
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Pending Receivables */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Open Receivables (AR)</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(pendingReceivables, state.settings.currency)}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
              <span>{pendingOrders.length} active orders pending payment</span>
            </div>
          </div>
        </div>

        {/* Card 4: Low Stock Critical Alerts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Critical Stock Alerts</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${lowStockItems.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {lowStockItems.length} <span className="text-sm font-normal text-slate-500">items</span>
            </div>
            <div className="flex items-center justify-between mt-1.5 text-xs">
              <span className={lowStockItems.length > 0 ? 'text-rose-600 font-medium' : 'text-slate-500'}>
                {lowStockItems.length > 0 ? 'Replenishment Required' : 'All stocks optimal'}
              </span>
              <button
                onClick={() => onNavigate('inventory')}
                className="text-indigo-600 font-medium hover:underline"
              >
                View
              </button>
            </div>
          </div>
        </div>

        {/* Card 5: Workshop Repeat VINs & QC Rework */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Repeat VIN Visits</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeRepeatVinJobs > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {totalRepeatVinVehicles} <span className="text-sm font-normal text-slate-500">units</span>
            </div>
            <div className="flex items-center justify-between mt-1.5 text-xs">
              <span className={activeRepeatVinJobs > 0 ? 'text-amber-700 font-semibold' : 'text-slate-500'}>
                {activeRepeatVinJobs > 0 ? `${activeRepeatVinJobs} active in bays` : 'None in bay'}
              </span>
              <button
                type="button"
                onClick={() => onNavigate('job_cards')}
                className="text-indigo-600 font-medium hover:underline cursor-pointer"
              >
                Inspect
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Workshop Repeat Vehicle VIN & Quality Control Intelligence (Module C.3) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                Module C.3
              </span>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Car className="w-5 h-5 text-indigo-600" />
                <span>Repeat Vehicle VIN Tracking & Quality Control</span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Automated VIN telemetry detecting returning vehicles, recurring chassis repairs, warranty claims, and repeat customer loyalty.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs font-semibold text-slate-700">
              <button
                type="button"
                onClick={() => setVinTabFilter('all')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  vinTabFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Repeat VINs ({totalRepeatVinVehicles})
              </button>
              <button
                type="button"
                onClick={() => setVinTabFilter('active')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  vinTabFilter === 'active'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active in Shop ({activeRepeatVinJobs})
              </button>
              <button
                type="button"
                onClick={() => setVinTabFilter('qc')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  vinTabFilter === 'qc'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                QC Rework ({qcReworkJobsCount})
              </button>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('job_cards')}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <span>View Job Pipeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Repeat VIN Items */}
        <div className="p-5">
          {filteredRepeatVinGroups.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No vehicle VIN matches found for the selected filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRepeatVinGroups.map((group) => {
                const latest = group.latestCard;
                const isQcAlert = group.hasQcReworkAlert || latest.isRepeatJob;
                return (
                  <div
                    key={group.vin}
                    className={`p-4 rounded-xl border transition-all ${
                      isQcAlert
                        ? 'bg-red-50/40 border-red-200 hover:border-red-300'
                        : group.hasActiveCard
                        ? 'bg-amber-50/30 border-amber-200 hover:border-amber-300'
                        : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded tracking-wide">
                            {group.vin}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <Car className="w-3 h-3 text-amber-700" />
                            {group.visitCount} Visits
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-800 mt-1.5">
                          {group.vehicleDetails}
                        </div>
                        {group.plateNumber && (
                          <div className="text-[11px] font-mono text-slate-500">
                            Plate: {group.plateNumber}
                          </div>
                        )}
                      </div>

                      {/* QC Alert or Active Tag */}
                      {isQcAlert ? (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          QC REWORK
                        </span>
                      ) : group.hasActiveCard ? (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          IN BAY
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                          Delivered
                        </span>
                      )}
                    </div>

                    {/* Customer & Repeat Customer Status */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs text-slate-500">Customer</div>
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {group.customerName}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300 shrink-0">
                        <UserCheck className="w-3 h-3 text-sky-600" />
                        Repeat Customer
                      </span>
                    </div>

                    {/* Active / Latest Job Card Details */}
                    <div className="mt-2.5 bg-white p-2.5 rounded-lg border border-slate-200/80 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Latest Card:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {latest.jobCardNumber}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Current Stage:</span>
                        <span className="font-semibold text-slate-700 capitalize">
                          {latest.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {latest.assignedTechnicianName && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Assigned Tech:</span>
                          <span className="text-slate-700 font-medium truncate max-w-[140px]">
                            {latest.assignedTechnicianName}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Historical Trail */}
                    <div className="mt-2.5 text-[11px] text-slate-600 space-y-1">
                      <div className="flex items-center gap-1 font-semibold text-slate-500">
                        <History className="w-3 h-3" />
                        <span>Visit History Trail ({group.cards.length} cards):</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        {group.cards.map((c, idx) => (
                          <span
                            key={c.id}
                            title={`${c.jobCardNumber} - ${c.status} (${c.createdAt})`}
                            className={`px-1.5 py-0.5 rounded font-mono text-[10px] border ${
                              c.id === latest.id
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {idx === 0 ? 'Latest: ' : `Visit #${group.cards.length - idx}: `}
                            {c.jobCardNumber}
                          </span>
                        ))}
                      </div>

                      {latest.isRepeatJob && latest.repeatReason && (
                        <div className="mt-1.5 p-2 bg-red-100/60 rounded border border-red-200 text-[10px] text-red-800 leading-tight">
                          <strong>QC Issue:</strong> {latest.repeatReason}
                        </div>
                      )}
                    </div>

                    {/* Card Footer Action */}
                    <div className="mt-3 pt-2 border-t border-slate-200/70 flex justify-end">
                      <button
                        type="button"
                        onClick={() => onNavigate('job_cards')}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Inspect in Workshop</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Analytics & Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Revenue vs Expenses Cash Flow Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Cash Flow & Operating Margins</h2>
              <p className="text-xs text-slate-500 mt-0.5">Consolidated Revenue vs Operational Expenditures</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                  Revenue
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  Operating Cost
                </span>
              </div>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium text-slate-600">
                <button
                  onClick={() => setChartRange('6M')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    chartRange === '6M' ? 'bg-white shadow-xs text-slate-900 font-semibold' : ''
                  }`}
                >
                  Past 6M
                </button>
                <button
                  onClick={() => setChartRange('YTD')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    chartRange === 'YTD' ? 'bg-white shadow-xs text-slate-900 font-semibold' : ''
                  }`}
                >
                  YTD
                </button>
              </div>
            </div>
          </div>

          {/* SVG Vector Chart */}
          <div className="pt-6">
            <div className="h-52 w-full flex items-end justify-between gap-4 px-2">
              {cashflowData.map((d, i) => {
                const revHeight = (d.revenue / maxVal) * 100;
                const expHeight = (d.expense / maxVal) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full flex items-end justify-center gap-1.5 h-40">
                      {/* Revenue Bar */}
                      <div
                        style={{ height: `${revHeight}%` }}
                        className="w-5 bg-indigo-600 rounded-t-sm transition-all duration-300 group-hover:bg-indigo-700 relative"
                        title={`${d.month} Revenue: ${formatCurrency(d.revenue, currency)}`}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10 pointer-events-none">
                          {formatCurrency(d.revenue, currency).replace('.00', '')}
                        </div>
                      </div>

                      {/* Expense Bar */}
                      <div
                        style={{ height: `${expHeight}%` }}
                        className="w-5 bg-rose-400 rounded-t-sm transition-all duration-300 group-hover:bg-rose-500 relative"
                        title={`${d.month} Expense: ${formatCurrency(d.expense, currency)}`}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10 pointer-events-none">
                          {formatCurrency(d.expense, currency).replace('.00', '')}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-slate-500">{d.month}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Average Monthly Net Margin: <strong className="text-slate-800">41.6%</strong></span>
              <span>Total Q3 Disbursed: <strong className="text-slate-800">{formatCurrency(totalExpenses, currency)}</strong></span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Urgent Low Stock Restock Panel */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Reorder Thresholds</span>
              </h2>
              <span className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                {lowStockItems.length} Urgent
              </span>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {lowStockItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  All inventory buffers within safe levels.
                </div>
              ) : (
                lowStockItems.slice(0, 4).map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-800 truncate">{item.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        SKU: {item.sku} • Stock:{' '}
                        <span className="font-semibold text-rose-600">{item.stockQuantity}</span> / Min: {item.reorderLevel}
                      </div>
                    </div>
                    <button
                      onClick={() => onQuickReorder(item)}
                      className="shrink-0 text-xs px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-medium rounded border border-slate-200 transition-colors"
                    >
                      Restock PO
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate('inventory')}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg transition-colors text-center block"
            >
              Open Inventory Master Directory →
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Sales Pipeline & Work Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales Orders (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Customer Sales Orders</h2>
              <p className="text-xs text-slate-500 mt-0.5">Order-to-Cash live transaction tracking</p>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1"
            >
              All Sales Orders <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Fulfillment</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.salesOrders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      {order.orderNumber}
                      <div className="text-[10px] text-slate-400 font-normal">{order.date}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{order.customerCompany}</div>
                      <div className="text-[11px] text-slate-400">{order.customerName}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatCurrency(order.total, state.settings.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          order.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'shipped'
                            ? 'bg-sky-100 text-sky-800'
                            : order.status === 'processing'
                            ? 'bg-indigo-100 text-indigo-800'
                            : order.status === 'confirmed'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          order.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : order.paymentStatus === 'partial'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onViewOrder(order)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manufacturing Operations Summary (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Manufacturing Work Orders</h2>
              <span
                onClick={() => onNavigate('manufacturing')}
                className="text-xs text-indigo-600 cursor-pointer font-medium hover:underline"
              >
                View all
              </span>
            </div>

            <div className="space-y-3.5 mt-3">
              {state.workOrders.map((wo) => (
                <div key={wo.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{wo.orderNumber}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        wo.priority === 'high'
                          ? 'bg-rose-100 text-rose-700'
                          : wo.priority === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {wo.priority}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1 truncate">{wo.productName}</div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{wo.assignedTo}</span>
                    <span className="font-medium text-slate-700">{wo.progress}% completed</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${wo.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                      style={{ width: `${wo.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Plant Capacity: <strong className="text-slate-800">84% Utilized</strong></span>
            <button
              onClick={() => onNavigate('manufacturing')}
              className="text-indigo-600 font-medium hover:underline"
            >
              Shop Floor Map →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
