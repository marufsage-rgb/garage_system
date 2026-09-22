import React, { useState } from 'react';
import { X, Truck, Plus, Trash2 } from 'lucide-react';
import { Vendor, Product, PurchaseOrder, OrderItem } from '../types';
import { formatCurrency } from '../utils/formatters';

interface CreatePoModalProps {
  vendors: Vendor[];
  products: Product[];
  initialProduct?: Product | null;
  currency: string;
  onClose: () => void;
  onSubmit: (po: PurchaseOrder) => void;
}

export const CreatePoModal: React.FC<CreatePoModalProps> = ({
  vendors,
  products,
  initialProduct,
  currency,
  onClose,
  onSubmit,
}) => {
  const [vendorId, setVendorId] = useState(vendors[0]?.id || '');
  const [expectedDate, setExpectedDate] = useState('2026-10-01');
  const [notes, setNotes] = useState('');

  const targetProd = initialProduct || products[0];

  const [items, setItems] = useState<OrderItem[]>([
    {
      id: 'poi-1',
      productId: targetProd?.id || '',
      sku: targetProd?.sku || '',
      productName: targetProd?.name || '',
      quantity: 20,
      unitPrice: targetProd?.costPrice || 0,
      total: (targetProd?.costPrice || 0) * 20,
    },
  ]);

  const handleProductChange = (index: number, prodId: string) => {
    const selected = products.find((p) => p.id === prodId);
    if (!selected) return;
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: selected.id,
      sku: selected.sku,
      productName: selected.name,
      unitPrice: selected.costPrice,
      total: selected.costPrice * newItems[index].quantity,
    };
    setItems(newItems);
  };

  const handleQtyChange = (index: number, qty: number) => {
    const validQty = Math.max(1, qty);
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      quantity: validQty,
      total: newItems[index].unitPrice * validQty,
    };
    setItems(newItems);
  };

  const handleAddItem = () => {
    const p = products[0];
    if (!p) return;
    setItems([
      ...items,
      {
        id: `poi-${Date.now()}`,
        productId: p.id,
        sku: p.sku,
        productName: p.name,
        quantity: 10,
        unitPrice: p.costPrice,
        total: p.costPrice * 10,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((acc, i) => acc + i.total, 0);
  const tax = subtotal * 0.05; // 5% standard procurement surcharge / freight tax
  const total = subtotal + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vendor = vendors.find((v) => v.id === vendorId);
    if (!vendor) return;

    const randomNum = Math.floor(100 + Math.random() * 900);
    const newPo: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-2026-${randomNum}`,
      vendorId: vendor.id,
      vendorName: vendor.company,
      date: new Date().toISOString().split('T')[0],
      expectedDate,
      items,
      subtotal,
      tax,
      total,
      status: 'submitted',
      paymentStatus: 'unpaid',
      notes,
    };

    onSubmit(newPo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-800 text-sm">Create Procurement Purchase Order (PO)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs text-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Supplier / Vendor *</label>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:outline-indigo-500"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.company} ({v.paymentTerms})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Expected Delivery Date *</label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:outline-indigo-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-700">Items to Replenish / Order</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Add SKU
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex-1 min-w-0">
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs truncate"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) - Cost: {formatCurrency(p.costPrice, currency)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleQtyChange(idx, parseInt(e.target.value) || 1)}
                      placeholder="Qty"
                      className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-center"
                    />
                  </div>

                  <div className="w-24 text-right font-bold text-slate-900 text-xs">
                    {formatCurrency(item.total, currency)}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length <= 1}
                    className="text-slate-400 hover:text-rose-600 disabled:opacity-30 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Procurement Instructions</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Include Certificate of Conformance upon delivery"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:outline-indigo-500"
            />
          </div>

          <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <div>Subtotal Goods: <strong>{formatCurrency(subtotal, currency)}</strong></div>
              <div>Estimated Freight & Surcharge: <strong>{formatCurrency(tax, currency)}</strong></div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Total PO Commitment</div>
              <div className="text-lg font-black text-indigo-700">{formatCurrency(total, currency)}</div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
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
              Issue Purchase Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
