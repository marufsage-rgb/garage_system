import React, { useState } from 'react';
import { X, Landmark } from 'lucide-react';
import { Transaction } from '../types';

interface RecordExpenseModalProps {
  currency: string;
  onClose: () => void;
  onSubmit: (tx: Transaction) => void;
}

export const RecordExpenseModal: React.FC<RecordExpenseModalProps> = ({ currency, onClose, onSubmit }) => {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState('Operating Overhead');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(450);
  const [account, setAccount] = useState('Operating Account (JPMorgan Chase)');
  const [referenceNumber, setReferenceNumber] = useState(`REF-${Math.floor(10000 + Math.random() * 90000)}`);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type,
      category,
      description,
      amount,
      account,
      referenceNumber,
      status: 'cleared',
    };

    onSubmit(newTx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-800 text-sm">Record General Ledger Entry</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Entry Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:outline-indigo-500"
              >
                <option value="expense">Disbursement / Expense</option>
                <option value="income">Receipt / Income</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Account Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:outline-indigo-500"
              >
                <option value="Operating Overhead">Operating Overhead</option>
                <option value="Vendor Settlement">Vendor Settlement</option>
                <option value="Facility & Utilities">Facility & Utilities</option>
                <option value="Freight & Logistics">Freight & Logistics</option>
                <option value="Payroll & Benefits">Payroll & Benefits</option>
                <option value="Customer Receipts">Customer Receipts</option>
                <option value="Consulting & Audit">Consulting & Audit</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Transaction Description *</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Monthly maintenance contract for CNC mill"
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:outline-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Amount ({currency}) *</label>
              <input
                type="number"
                step="0.01"
                min={0.01}
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:outline-indigo-500 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Voucher / Reference #</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-mono focus:bg-white focus:outline-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Settlement Account</label>
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:bg-white focus:outline-indigo-500"
            >
              <option value="Operating Account (JPMorgan Chase)">Operating Account (JPMorgan Chase)</option>
              <option value="Payroll Reserve (Silicon Valley Bank)">Payroll Reserve (Silicon Valley Bank)</option>
              <option value="Commercial Card">Commercial Corporate Card</option>
            </select>
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
              Post to Ledger
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
