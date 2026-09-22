import React, { useState } from 'react';
import {
  Factory,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  RotateCcw,
  Users
} from 'lucide-react';
import { WorkOrder, WorkOrderStatus } from '../types';

interface ManufacturingViewProps {
  workOrders: WorkOrder[];
  onOpenNewWoModal: () => void;
  onUpdateWoProgress: (id: string, progress: number) => void;
  onUpdateWoStatus: (id: string, status: WorkOrderStatus) => void;
}

export const ManufacturingView: React.FC<ManufacturingViewProps> = ({
  workOrders,
  onOpenNewWoModal,
  onUpdateWoProgress,
  onUpdateWoStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredWOs = workOrders.filter((wo) => {
    const matchesSearch =
      wo.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || wo.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = workOrders.filter((w) => w.status === 'in_progress').length;
  const completedCount = workOrders.filter((w) => w.status === 'completed').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Operations & Manufacturing Floor</h1>
          <p className="text-xs text-slate-500 mt-1">
            Shop floor work orders, Bill of Materials (BOM) execution, assembly pipelines, and quality control.
          </p>
        </div>

        <button
          onClick={onOpenNewWoModal}
          id="btn-create-work-order"
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Work Order</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">In-Progress Production</span>
          <div className="text-xl font-bold text-indigo-600 mt-1">{activeCount} Lines Active</div>
          <div className="text-[11px] text-slate-400 mt-1">Cells currently running shifts</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Completed Orders (Month)</span>
          <div className="text-xl font-bold text-emerald-600 mt-1">{completedCount} Units Finished</div>
          <div className="text-[11px] text-slate-400 mt-1">Passed QA inspection</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Floor Efficiency</span>
          <div className="text-xl font-bold text-slate-900 mt-1">94.8% OEE</div>
          <div className="text-[11px] text-slate-400 mt-1">Overall Equipment Effectiveness</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search work order #, assembly, line..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 py-1.5 px-2.5 rounded-lg focus:outline-none"
          >
            <option value="all">All Work Orders</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>
      </div>

      {/* Work Orders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredWOs.map((wo) => (
          <div key={wo.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm font-mono">{wo.orderNumber}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    wo.priority === 'high'
                      ? 'bg-rose-100 text-rose-700'
                      : wo.priority === 'medium'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {wo.priority} Priority
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-800 mt-2">{wo.productName}</h3>
              <div className="text-xs text-slate-500 mt-0.5">
                Target Batch: <strong>{wo.quantity} units</strong> • SKU: <span className="font-mono text-indigo-600">{wo.productSku}</span>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Assigned Unit: <strong className="text-slate-700">{wo.assignedTo}</strong></span>
                <span>Due: {wo.targetDate}</span>
              </div>

              {/* Progress Section */}
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-600">Production Progress</span>
                  <span className="font-bold text-slate-800">{wo.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      wo.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${wo.progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onUpdateWoProgress(wo.id, Math.min(100, wo.progress + 15))}
                  className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded transition-colors"
                >
                  +15% Progress
                </button>
                {wo.progress < 100 && (
                  <button
                    onClick={() => onUpdateWoProgress(wo.id, 100)}
                    className="px-2.5 py-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium rounded transition-colors"
                  >
                    Complete Job
                  </button>
                )}
              </div>

              <select
                value={wo.status}
                onChange={(e) => onUpdateWoStatus(wo.id, e.target.value as WorkOrderStatus)}
                className="text-[11px] font-semibold rounded px-2 py-1 bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none"
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
