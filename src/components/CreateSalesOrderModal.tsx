import React, { useState } from 'react';
import { X, Plus, Trash2, ShoppingCart, Banknote, CreditCard } from 'lucide-react';
import { Customer, Product, SalesOrder, OrderItem } from '../types';
import { formatCurrency } from '../utils/formatters';

interface CreateSalesOrderModalProps {
  customers: Customer[];
  products: Product[];
  currency: string;
  onClose: () => void;
  onSubmit: (newOrder: SalesOrder) => void;
}

export const CreateSalesOrderModal: React.FC<CreateSalesOrderModalProps> = ({
  customers,
  products,
  currency,
  onClose,
  onSubmit,
}) => {
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Initial line items
  const [items, setItems] = useState<OrderItem[]>([
    {
      id: 'li-1',
      productId: products[0]?.id || '',
      sku: products[0]?.sku || '',
      productName: products[0]?.name || '',
      quantity: 1,
      unitPrice: products[0]?.unitPrice || 0,
      total: products[0]?.unitPrice || 0,
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
      unitPrice: selected.unitPrice,
      total: selected.unitPrice * newItems[index].quantity,
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
    const firstProd = products[0];
    if (!firstProd) return;
    setItems([
      ...items,
      {
        id: `li-${Date.now()}`,
        productId: firstProd.id,
        sku: firstProd.sku,
        productName: firstProd.name,
        quantity: 1,
        unitPrice: firstProd.unitPrice,
        total: firstProd.unitPrice,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  const tax = subtotal * 0.08;
  const total = Math.max(0, subtotal + tax - discount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;

    const randomNum = Math.floor(100 + Math.random() * 900);
    const newOrder: SalesOrder = {
      id: `so-${Date.now()}`,
      orderNumber: `SO-2026-${randomNum}`,
      customerId: cust.id,
      customerName: cust.name,
      customerCompany: cust.company,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0], // Same day
      items,
      subtotal,
      tax,
      discount,
      total,
      status: 'confirmed',
      paymentStatus: paymentMethod === 'cash' ? 'paid' : 'unpaid',
      notes: notes || `Payment: ${paymentMethod.toUpperCase()}`,
    };

    onSubmit(newOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-800 text-sm">Create POS Invoice / Sales Order</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs text-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Customer *</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:outline-indigo-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company} ({c.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method *</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold border transition-colors ${
                    paymentMethod === 'cash' 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                      : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-4 h-4" /> Cash / Paid
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold border transition-colors ${
                    paymentMethod === 'credit' 
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                      : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4" /> Credit (Unpaid)
                </button>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-700">Parts / Products</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 px-2 py-1 rounded-md"
              >
                <Plus className="w-3.5 h-3.5" /> Add Part
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="w-20 sm:w-24 shrink-0">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleQtyChange(idx, parseInt(e.target.value) || 1)}
                      placeholder="Qty"
                      className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-center font-bold"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs truncate font-medium text-slate-800"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku} - {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24 text-right shrink-0">
                    <div className="text-[10px] text-slate-400">Unit Price</div>
                    <div className="font-semibold text-slate-700">{formatCurrency(item.unitPrice, currency)}</div>
                  </div>

                  <div className="w-24 text-right shrink-0">
                    <div className="text-[10px] text-slate-400">Total</div>
                    <div className="font-bold text-indigo-700">{formatCurrency(item.total, currency)}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length <= 1}
                    className="text-slate-400 hover:text-rose-600 disabled:opacity-30 p-1 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Discount & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Discount Amount</label>
              <input
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:outline-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Additional Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes for this invoice"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:outline-indigo-500"
              />
            </div>
          </div>

          {/* Total Bar */}
          <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <div>Subtotal: <strong>{formatCurrency(subtotal, currency)}</strong></div>
              <div>Sales Tax (8%): <strong>{formatCurrency(tax, currency)}</strong></div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Net Invoiced Total</div>
              <div className="text-lg font-black text-indigo-700">{formatCurrency(total, currency)}</div>
            </div>
          </div>

          {/* Actions */}
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
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" /> Confirm & Issue Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
