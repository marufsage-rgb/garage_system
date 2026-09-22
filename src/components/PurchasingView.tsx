import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  Mail,
  Phone,
  FileCheck,
  Star,
  DollarSign
} from 'lucide-react';
import { PurchaseOrder, Vendor, Product, PurchaseStatus, PaymentStatus } from '../types';
import { formatCurrency } from '../utils/formatters';

interface PurchasingViewProps {
  purchaseOrders: PurchaseOrder[];
  vendors: Vendor[];
  products: Product[];
  currency: string;
  onOpenNewPoModal: () => void;
  onOpenNewVendorModal: () => void;
  onUpdatePoStatus: (poId: string, status: PurchaseStatus) => void;
  onReceiveGoods: (po: PurchaseOrder) => void;
}

export const PurchasingView: React.FC<PurchasingViewProps> = ({
  purchaseOrders,
  vendors,
  currency,
  onOpenNewPoModal,
  onOpenNewVendorModal,
  onUpdatePoStatus,
  onReceiveGoods,
}) => {
  const [activeTab, setActiveTab] = useState<'pos' | 'vendors'>('pos');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredPOs = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredVendors = vendors.filter((v) => {
    return (
      v.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalPoSpend = purchaseOrders.reduce((acc, po) => acc + po.total, 0);
  const totalBalanceOwed = vendors.reduce((acc, v) => acc + v.balanceOwed, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Purchasing & Vendor Procurement</h1>
          <p className="text-xs text-slate-500 mt-1">
            Supplier management, procurement orders, goods receiving, and accounts payable control.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('pos')}
              className={`px-3.5 py-1.5 rounded-md transition-all ${
                activeTab === 'pos' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600'
              }`}
            >
              Purchase Orders ({purchaseOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('vendors')}
              className={`px-3.5 py-1.5 rounded-md transition-all ${
                activeTab === 'vendors' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600'
              }`}
            >
              Vendors ({vendors.length})
            </button>
          </div>

          {activeTab === 'pos' ? (
            <button
              onClick={onOpenNewPoModal}
              id="btn-create-po"
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Purchase Order</span>
            </button>
          ) : (
            <button
              onClick={onOpenNewVendorModal}
              id="btn-create-vendor"
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Vendor</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Procurement Volume</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {formatCurrency(totalPoSpend, currency)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Accounts Payable (AP Owed)</span>
          <div className="text-xl font-bold text-rose-600 mt-1">
            {formatCurrency(totalBalanceOwed, currency)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Active Suppliers</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {vendors.length} Verified Partners
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={activeTab === 'pos' ? 'Filter by PO # or vendor...' : 'Search suppliers...'}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-indigo-500"
          />
        </div>

        {activeTab === 'pos' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-700 py-1.5 px-2.5 rounded-lg focus:outline-none"
            >
              <option value="all">All Orders</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}
      </div>

      {/* PO Table or Vendor Cards */}
      {activeTab === 'pos' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">PO Number</th>
                  <th className="px-4 py-3">Vendor / Supplier</th>
                  <th className="px-4 py-3">Ordered Date</th>
                  <th className="px-4 py-3">Expected Delivery</th>
                  <th className="px-4 py-3">Ordered Items</th>
                  <th className="px-4 py-3">Total Cost</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Fulfillment Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPOs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      No purchase orders match your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPOs.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3 font-semibold text-slate-900">
                        {po.poNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {po.vendorName}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{po.date}</td>
                      <td className="px-4 py-3 text-slate-500">{po.expectedDate}</td>
                      <td className="px-4 py-3">
                        <div className="text-slate-800 font-medium">
                          {po.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {formatCurrency(po.total, currency)}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={po.status}
                          onChange={(e) => onUpdatePoStatus(po.id, e.target.value as PurchaseStatus)}
                          className={`text-[11px] font-semibold rounded-md px-2 py-1 border focus:outline-none cursor-pointer ${
                            po.status === 'received'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : po.status === 'approved'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : po.status === 'submitted'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <option value="draft">Draft</option>
                          <option value="submitted">Submitted</option>
                          <option value="approved">Approved</option>
                          <option value="received">Received</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {po.status !== 'received' ? (
                          <button
                            onClick={() => onReceiveGoods(po)}
                            title="Accept shipment and increment warehouse inventory levels"
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded font-medium transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Receive Goods</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-medium inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Stocked
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Vendors Directory */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVendors.map((v) => (
            <div key={v.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm">
                    {v.company.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded text-amber-700 text-xs font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{v.rating}</span>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mt-3">{v.company}</h3>
                <div className="text-xs text-slate-500 font-medium">Rep: {v.name}</div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{v.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{v.phone}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Terms: <strong className="text-slate-700">{v.paymentTerms}</strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Payable Balance:</span>
                <span className={`font-bold ${v.balanceOwed > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                  {formatCurrency(v.balanceOwed, currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
