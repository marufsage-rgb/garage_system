import React, { useState, useEffect } from 'react';
import { Search, X, ShoppingCart, Package, Users, Truck, ArrowRight } from 'lucide-react';
import { ERPState, ModuleType, SalesOrder } from '../types';

interface GlobalSearchModalProps {
  state: ERPState;
  onClose: () => void;
  onNavigate: (module: ModuleType) => void;
  onViewOrder: (order: SalesOrder) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  state,
  onClose,
  onNavigate,
  onViewOrder,
}) => {
  const [query, setQuery] = useState('');

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const q = query.trim().toLowerCase();

  const matchingOrders = q
    ? state.salesOrders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerCompany.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q)
      )
    : [];

  const matchingProducts = q
    ? state.products.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      )
    : [];

  const matchingCustomers = q
    ? state.customers.filter(
        (c) => c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q)
      )
    : [];

  const matchingPOs = q
    ? state.purchaseOrders.filter(
        (po) => po.poNumber.toLowerCase().includes(q) || po.vendorName.toLowerCase().includes(q)
      )
    : [];

  const totalResults =
    matchingOrders.length + matchingProducts.length + matchingCustomers.length + matchingPOs.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col animate-in fade-in-0 duration-200">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <Search className="w-5 h-5 text-indigo-600 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across orders, SKUs, customers, suppliers..."
            className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4 text-xs">
          {!q && (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <p>Type to query the enterprise database.</p>
              <div className="flex justify-center gap-2 text-[11px] text-slate-500">
                <span className="px-2 py-0.5 bg-slate-100 rounded">SO-2026</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded">Motor</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded">Apex</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded">PO-</span>
              </div>
            </div>
          )}

          {q && totalResults === 0 && (
            <div className="py-8 text-center text-slate-400">
              No ERP records matching &quot;{query}&quot;
            </div>
          )}

          {/* Sales Orders Matches */}
          {matchingOrders.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5 text-indigo-500" />
                <span>Sales Orders ({matchingOrders.length})</span>
              </div>
              <div className="space-y-1">
                {matchingOrders.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => {
                      onViewOrder(o);
                      onClose();
                    }}
                    className="p-2.5 rounded-lg hover:bg-indigo-50/60 cursor-pointer flex items-center justify-between border border-transparent hover:border-indigo-100 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{o.orderNumber} - {o.customerCompany}</div>
                      <div className="text-[11px] text-slate-500">
                        ${o.total.toFixed(2)} • Status: {o.status} ({o.paymentStatus})
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-indigo-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product SKUs Matches */}
          {matchingProducts.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-500" />
                <span>Inventory SKUs ({matchingProducts.length})</span>
              </div>
              <div className="space-y-1">
                {matchingProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onNavigate('inventory');
                      onClose();
                    }}
                    className="p-2.5 rounded-lg hover:bg-slate-100 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {p.sku} • In-Stock: {p.stockQuantity} {p.unit} (${p.unitPrice.toFixed(2)})
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-200 rounded font-medium text-slate-700">
                      {p.warehouseLocation}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers Matches */}
          {matchingCustomers.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-500" />
                <span>Customers ({matchingCustomers.length})</span>
              </div>
              <div className="space-y-1">
                {matchingCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onNavigate('sales');
                      onClose();
                    }}
                    className="p-2.5 rounded-lg hover:bg-slate-100 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{c.company}</div>
                      <div className="text-[11px] text-slate-500">{c.name} • {c.email}</div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-700">
                      ${c.outstandingBalance.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Purchase Orders Matches */}
          {matchingPOs.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Purchase Orders ({matchingPOs.length})</span>
              </div>
              <div className="space-y-1">
                {matchingPOs.map((po) => (
                  <div
                    key={po.id}
                    onClick={() => {
                      onNavigate('purchasing');
                      onClose();
                    }}
                    className="p-2.5 rounded-lg hover:bg-slate-100 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{po.poNumber} - {po.vendorName}</div>
                      <div className="text-[11px] text-slate-500">
                        ${po.total.toFixed(2)} • Status: {po.status}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Navigate with mouse or keyboard</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
