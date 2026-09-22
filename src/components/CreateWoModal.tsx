import React, { useState } from 'react';
import { X, Factory } from 'lucide-react';
import { Product, WorkOrder } from '../types';

interface CreateWoModalProps {
  products: Product[];
  onClose: () => void;
  onSubmit: (wo: WorkOrder) => void;
}

export const CreateWoModal: React.FC<CreateWoModalProps> = ({ products, onClose, onSubmit }) => {
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(40);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [assignedTo, setAssignedTo] = useState('Assembly Line 2');
  const [targetDate, setTargetDate] = useState('2026-10-05');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const randomNum = Math.floor(100 + Math.random() * 900);
    const newWo: WorkOrder = {
      id: `wo-${Date.now()}`,
      orderNumber: `WO-2026-${randomNum}`,
      productSku: prod.sku,
      productName: `${prod.name} (Production Run)`,
      quantity,
      status: 'planned',
      startDate: new Date().toISOString().split('T')[0],
      targetDate,
      priority,
      assignedTo,
      progress: 0,
    };

    onSubmit(newWo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Factory className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-800 text-sm">Issue Manufacturing Work Order</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Product Assembly *</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:outline-indigo-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Batch Production Units *</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:outline-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Run Priority *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:outline-indigo-500 font-semibold"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High / Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Station / Cell</label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="e.g. SMT Line 2"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:outline-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Completion Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:outline-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
            >
              Dispatch to Shop Floor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
