import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Search,
  Printer,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Wrench,
  Boxes,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  FileText
} from 'lucide-react';
import { ERPState, JobCard } from '../types';
import { formatCurrency } from '../utils/formatters';
import { exportJobCardPnlReportPDF, exportSingleJobCardPnlPDF } from '../utils/pdfExport';

interface JobCardPnlViewProps {
  state: ERPState;
  selectedJobCardId?: string | number;
}

export const JobCardPnlView: React.FC<JobCardPnlViewProps> = ({
  state,
  selectedJobCardId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'lube' | 'bodyshop'>('all');
  const [drilldownJc, setDrilldownJc] = useState<JobCard | null>(null);

  // Auto-open selected job card drilldown if passed as prop
  React.useEffect(() => {
    if (selectedJobCardId) {
      const target = (state.jobCards || []).find((j) => j.id === selectedJobCardId);
      if (target) setDrilldownJc(target);
    }
  }, [selectedJobCardId, state.jobCards]);

  // Compute P&L for a specific Job Card
  const calculateJobCardPnl = (jc: JobCard) => {
    // 1. Purchases / Spare Parts Cost & Billable Price (g.1)
    const partsCost = (jc.partsRequired || []).reduce(
      (acc, curr) => acc + curr.quantity * curr.unitCost,
      0
    );
    const partsRevenue = (jc.partsRequired || []).reduce(
      (acc, curr) => acc + curr.quantity * curr.unitPrice,
      0
    );

    // 2. Labor Details (g.2)
    const laborCost = (jc.laborEntries || []).reduce(
      (acc, curr) => acc + curr.hours * curr.hourlyWageCost,
      0
    );
    const laborRevenue = (jc.laborEntries || []).reduce(
      (acc, curr) => acc + curr.hours * curr.hourlyChargeRate,
      0
    );

    // 3. Consumables Used Cost (paint, clips, welding rods)
    const consumablesCost = (jc.consumablesUsed || []).reduce(
      (acc, curr) => acc + (curr.totalCost || curr.quantity * curr.unitCost),
      0
    );

    // Total Direct Job Cost
    const totalJobCost = +(partsCost + laborCost + consumablesCost).toFixed(3);

    // Billed / Quoted Revenue (from linked estimate or sum of parts & labor billable)
    let totalRevenue = +(partsRevenue + laborRevenue).toFixed(3);
    if (totalRevenue === 0) {
      // Fallback: If estimate linked
      const linkedEst = (state.estimates || []).find(
        (e) => e.jobCardId === jc.id || e.jobCardNumber === jc.jobCardNumber
      );
      if (linkedEst) {
        totalRevenue = linkedEst.subtotal || linkedEst.totalAmount;
      } else {
        totalRevenue = +(totalJobCost * 1.5).toFixed(3); // Standard 33% gross margin fallback
      }
    }

    // 3. Profit / Loss each job card (g.3)
    const netProfit = +(totalRevenue - totalJobCost).toFixed(3);
    const profitMargin = totalRevenue > 0 ? +((netProfit / totalRevenue) * 100).toFixed(1) : 0;

    return {
      partsCost,
      partsRevenue,
      laborCost,
      laborRevenue,
      consumablesCost,
      totalJobCost,
      totalRevenue,
      netProfit,
      profitMargin,
    };
  };

  // Workshop-wide Aggregated Totals
  const pnlSummary = (state.jobCards || []).reduce(
    (acc, jc) => {
      const pnl = calculateJobCardPnl(jc);
      acc.totalRevenue += pnl.totalRevenue;
      acc.totalCost += pnl.totalJobCost;
      acc.totalPartsCost += pnl.partsCost;
      acc.totalLaborCost += pnl.laborCost;
      acc.totalConsumablesCost += pnl.consumablesCost;
      acc.totalProfit += pnl.netProfit;
      return acc;
    },
    {
      totalRevenue: 0,
      totalCost: 0,
      totalPartsCost: 0,
      totalLaborCost: 0,
      totalConsumablesCost: 0,
      totalProfit: 0,
    }
  );

  const overallMargin = pnlSummary.totalRevenue > 0
    ? +((pnlSummary.totalProfit / pnlSummary.totalRevenue) * 100).toFixed(1)
    : 0;

  // Filtered Cards
  const filteredJobCards = (state.jobCards || []).filter((jc) => {
    if (typeFilter !== 'all' && jc.jobType !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        jc.jobCardNumber.toLowerCase().includes(q) ||
        jc.customerName.toLowerCase().includes(q) ||
        (jc.vehicleDetails && jc.vehicleDetails.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Module G
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Job Card Profit & Loss Analytics
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time financial performance per job card: itemized purchase parts, technician labor costs, consumables allocation, and gross profit margins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e: any) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="all">All Serial Types (LB & BS)</option>
            <option value="lube">Lube Service (LB)</option>
            <option value="bodyshop">Bodyshop & Collision (BS)</option>
          </select>
          <button
            onClick={() => exportJobCardPnlReportPDF(filteredJobCards, calculateJobCardPnl, state.settings)}
            id="btn-export-workshop-pnl-pdf"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Export complete workshop Profit & Loss report as PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export P&L Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* High-Level P&L KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Total Workshop Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {formatCurrency(pnlSummary.totalRevenue, state.settings.currency)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Billed & Quoted Value</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Parts & Consumables Cost</span>
            <Boxes className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-700 mt-1 font-mono">
            {formatCurrency(pnlSummary.totalPartsCost + pnlSummary.totalConsumablesCost, state.settings.currency)}
          </div>
          <div className="text-xs text-indigo-600 mt-1">
            Parts: {formatCurrency(pnlSummary.totalPartsCost, state.settings.currency)} • Mat: {formatCurrency(pnlSummary.totalConsumablesCost, state.settings.currency)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Direct Labor Wage Cost</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1 font-mono">
            {formatCurrency(pnlSummary.totalLaborCost, state.settings.currency)}
          </div>
          <div className="text-xs text-amber-600 mt-1">Clocked Technician Wages</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Net Gross Profit (Margin)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
            {formatCurrency(pnlSummary.totalProfit, state.settings.currency)}
          </div>
          <div className="text-xs text-emerald-700 font-semibold mt-1">
            Overall Margin: {overallMargin}%
          </div>
        </div>
      </div>

      {/* Main Table: Job Card P&L Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-4 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search Job Card #, Customer, Plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="text-xs text-slate-500">
            Showing financial margins for {filteredJobCards.length} Job Cards
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-y border-slate-200">
              <tr>
                <th className="px-4 py-3">Job Card #</th>
                <th className="px-4 py-3">Customer & Vehicle</th>
                <th className="px-4 py-3 text-right">Revenue (OMR)</th>
                <th className="px-4 py-3 text-right">Purchases / Parts (g.1)</th>
                <th className="px-4 py-3 text-right">Labor Wages (g.2)</th>
                <th className="px-4 py-3 text-right">Consumables</th>
                <th className="px-4 py-3 text-right font-bold text-slate-900">Total Direct Cost</th>
                <th className="px-4 py-3 text-right font-bold text-emerald-700">Net Profit (g.3)</th>
                <th className="px-4 py-3 text-center">Margin %</th>
                <th className="px-4 py-3 text-center">Drilldown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredJobCards.map((jc) => {
                const pnl = calculateJobCardPnl(jc);

                return (
                  <tr key={jc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-slate-900">{jc.jobCardNumber}</div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        jc.jobType === 'lube' ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {jc.jobType}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{jc.customerName}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[170px]">{jc.vehicleDetails}</div>
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(pnl.totalRevenue, state.settings.currency)}
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-indigo-700">
                      {formatCurrency(pnl.partsCost, state.settings.currency)}
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-amber-700">
                      {formatCurrency(pnl.laborCost, state.settings.currency)}
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-purple-700">
                      {formatCurrency(pnl.consumablesCost, state.settings.currency)}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                      {formatCurrency(pnl.totalJobCost, state.settings.currency)}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-extrabold text-emerald-600">
                      {formatCurrency(pnl.netProfit, state.settings.currency)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                        pnl.profitMargin >= 35
                          ? 'bg-emerald-100 text-emerald-800'
                          : pnl.profitMargin >= 15
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {pnl.profitMargin}%
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setDrilldownJc(jc)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-medium cursor-pointer flex items-center gap-1 mx-auto"
                      >
                        <span>P&L Sheet</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRILLDOWN P&L STATEMENT MODAL */}
      {drilldownJc && (() => {
        const pnl = calculateJobCardPnl(drilldownJc);

        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-indigo-100 text-indigo-800">
                      {drilldownJc.jobType}
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 font-mono">
                      {drilldownJc.jobCardNumber} — Profit & Loss Statement
                    </h3>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Customer: {drilldownJc.customerName} • Vehicle: {drilldownJc.vehicleDetails}
                  </div>
                </div>
                <button
                  onClick={() => setDrilldownJc(null)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Top Highlights Banner */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl text-center">
                <div>
                  <div className="text-xs uppercase text-slate-500 font-semibold">Total Revenue</div>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                    {formatCurrency(pnl.totalRevenue, state.settings.currency)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500 font-semibold">Total Direct Costs</div>
                  <div className="text-lg font-bold font-mono text-red-600 mt-0.5">
                    {formatCurrency(pnl.totalJobCost, state.settings.currency)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500 font-semibold">Net Gross Margin</div>
                  <div className="text-lg font-bold font-mono text-emerald-600 mt-0.5">
                    {formatCurrency(pnl.netProfit, state.settings.currency)} ({pnl.profitMargin}%)
                  </div>
                </div>
              </div>

              {/* 1. Itemized Purchase Details (g.1) */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>1. Spare Parts Purchases & Margin Breakdown (g.1)</span>
                  <span className="text-indigo-700 font-mono">Parts Cost: {formatCurrency(pnl.partsCost, state.settings.currency)}</span>
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Part Description</th>
                        <th className="p-2">OEM / SKU</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-right">Cost Price</th>
                        <th className="p-2 text-right">Selling Price</th>
                        <th className="p-2 text-right">Part Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(drilldownJc.partsRequired || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-3 text-center text-slate-400">
                            No spare parts billed to this job card yet.
                          </td>
                        </tr>
                      ) : (
                        (drilldownJc.partsRequired || []).map((part, idx) => {
                          const itemCost = part.quantity * part.unitCost;
                          const itemRev = part.quantity * part.unitPrice;
                          const itemProfit = itemRev - itemCost;
                          return (
                            <tr key={idx}>
                              <td className="p-2 font-medium">{part.partName}</td>
                              <td className="p-2 font-mono text-slate-500">{part.partNumber}</td>
                              <td className="p-2 text-center font-mono">{part.quantity}</td>
                              <td className="p-2 text-right font-mono text-red-600">{formatCurrency(itemCost, state.settings.currency)}</td>
                              <td className="p-2 text-right font-mono text-slate-900">{formatCurrency(itemRev, state.settings.currency)}</td>
                              <td className="p-2 text-right font-mono font-bold text-emerald-600">+{formatCurrency(itemProfit, state.settings.currency)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Labor Details (g.2) */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>2. Labor Operations & Technician Clocking Details (g.2)</span>
                  <span className="text-amber-700 font-mono">Labor Cost: {formatCurrency(pnl.laborCost, state.settings.currency)}</span>
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Technician</th>
                        <th className="p-2">Operation Scope</th>
                        <th className="p-2 text-center">Clocked Hours</th>
                        <th className="p-2 text-right">Wage Cost Rate</th>
                        <th className="p-2 text-right">Customer Rate</th>
                        <th className="p-2 text-right">Labor Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(drilldownJc.laborEntries || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-3 text-center text-slate-400">
                            No technician labor lines recorded yet.
                          </td>
                        </tr>
                      ) : (
                        (drilldownJc.laborEntries || []).map((labor, idx) => {
                          const wageTotal = labor.hours * labor.hourlyWageCost;
                          const revTotal = labor.hours * labor.hourlyChargeRate;
                          const profit = revTotal - wageTotal;
                          return (
                            <tr key={idx}>
                              <td className="p-2 font-bold">{labor.technicianName}</td>
                              <td className="p-2">{labor.operation}</td>
                              <td className="p-2 text-center font-mono">{labor.hours} hrs</td>
                              <td className="p-2 text-right font-mono text-amber-700">{formatCurrency(wageTotal, state.settings.currency)}</td>
                              <td className="p-2 text-right font-mono text-slate-900">{formatCurrency(revTotal, state.settings.currency)}</td>
                              <td className="p-2 text-right font-mono font-bold text-emerald-600">+{formatCurrency(profit, state.settings.currency)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Consumables Used */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>3. Paint, Clips & Workshop Consumables Allocated</span>
                  <span className="text-purple-700 font-mono">Consumables Cost: {formatCurrency(pnl.consumablesCost, state.settings.currency)}</span>
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Consumable Material</th>
                        <th className="p-2">Category</th>
                        <th className="p-2 text-center">Allocated Qty</th>
                        <th className="p-2 text-right">Unit Cost</th>
                        <th className="p-2 text-right">Total Expense</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(drilldownJc.consumablesUsed || []).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-3 text-center text-slate-400">
                            No shop consumables allocated to this job card.
                          </td>
                        </tr>
                      ) : (
                        (drilldownJc.consumablesUsed || []).map((cons, idx) => (
                          <tr key={idx}>
                            <td className="p-2 font-semibold">{cons.name}</td>
                            <td className="p-2 uppercase text-slate-500">{cons.category}</td>
                            <td className="p-2 text-center font-mono">{cons.quantity} {cons.unit}</td>
                            <td className="p-2 text-right font-mono">{formatCurrency(cons.unitCost, state.settings.currency)}</td>
                            <td className="p-2 text-right font-mono font-bold text-purple-700">{formatCurrency(cons.totalCost || cons.quantity * cons.unitCost, state.settings.currency)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                <div className="text-[10px] text-slate-400">
                  Apex Auto ERP P&L Engine • Computed in Omani Rial (OMR)
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDrilldownJc(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium cursor-pointer hover:bg-slate-50"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => exportSingleJobCardPnlPDF(drilldownJc, pnl, state.settings)}
                    id="btn-download-jc-pnl-pdf"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF Statement</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
