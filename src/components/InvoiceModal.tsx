import React from 'react';
import { X, Printer, CheckCircle2, Download, Building2, Calendar, FileText } from 'lucide-react';
import { SalesOrder } from '../types';
import { formatCurrency } from '../utils/formatters';
import { exportSalesInvoicePDF } from '../utils/pdfExport';

interface InvoiceModalProps {
  order: SalesOrder | null;
  currency: string;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, currency, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    exportSalesInvoicePDF(order, { currency: currency as any });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-slate-800 text-sm">Commercial Tax Invoice / Bill of Sale</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              id="btn-download-invoice-pdf"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Download official Tax Invoice as vector PDF file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              id="btn-print-invoice"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div id="printable-invoice" className="p-8 bg-white text-slate-800 text-xs">
          {/* Header */}
          <div className="flex justify-between items-start pb-6 border-b border-slate-200">
            <div>
              <div className="text-xl font-black text-slate-900 tracking-tight">APEX ENTERPRISE CORP</div>
              <div className="text-slate-500 text-xs mt-1">Industrial Systems & Resource Logistics</div>
              <div className="text-slate-500 text-[11px] mt-0.5">700 Industrial Parkway, Suite 100 • Austin, TX 78701</div>
              <div className="text-slate-500 text-[11px]">EIN: 84-2901928 • Contact: billing@apexenterprise.io</div>
            </div>

            <div className="text-right">
              <div className="text-xl font-bold text-indigo-700 uppercase tracking-wide">INVOICE</div>
              <div className="font-mono text-sm font-bold text-slate-900 mt-1">{order.orderNumber}</div>
              <div className="text-slate-500 text-[11px] mt-1">Date: {order.date}</div>
              <div className="text-slate-500 text-[11px]">Due Date: {order.dueDate}</div>
              <div className="mt-2">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    order.paymentStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : order.paymentStatus === 'partial'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  Payment Status: {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Bill To & Ship To */}
          <div className="grid grid-cols-2 gap-8 py-6 border-b border-slate-200 text-xs">
            <div>
              <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Bill To:</div>
              <div className="text-sm font-bold text-slate-900 mt-1">{order.customerCompany}</div>
              <div className="text-slate-600 mt-0.5">Attn: {order.customerName}</div>
              <div className="text-slate-500 text-[11px] mt-0.5">Verified Corporate Customer Account</div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Order Meta:</div>
              <div className="text-slate-600 mt-1">Fulfillment: <strong className="text-slate-800 uppercase">{order.status}</strong></div>
              <div className="text-slate-600 mt-0.5">Currency: <strong className="text-slate-800">{currency}</strong></div>
              {order.notes && (
                <div className="text-slate-500 text-[11px] mt-1 bg-slate-50 p-2 rounded border border-slate-100">
                  Notes: {order.notes}
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-6">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Item / SKU</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-3 font-mono text-indigo-600 text-[11px]">{item.sku}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">{item.productName}</td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-900">{item.quantity}</td>
                    <td className="py-3 px-3 text-right">{formatCurrency(item.unitPrice, currency)}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">{formatCurrency(item.total, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculation Summary */}
          <div className="flex justify-end pt-2 pb-6 border-b border-slate-200">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800">{formatCurrency(order.subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax (Standard 8.0%):</span>
                <span>{formatCurrency(order.tax, currency)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Contract Discount:</span>
                  <span>-{formatCurrency(order.discount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Due:</span>
                <span className="text-indigo-700">{formatCurrency(order.total, currency)}</span>
              </div>
            </div>
          </div>

          {/* Payment Terms & Footer */}
          <div className="pt-6 text-[11px] text-slate-500 space-y-1">
            <div className="font-bold text-slate-700">Payment Instructions:</div>
            <div>Please wire transfer funds referencing order #{order.orderNumber} to:</div>
            <div>JPMorgan Chase Bank, N.A. • Routing: 021000021 • Account: 9812-4410-092</div>
            <div className="text-[10px] text-slate-400 mt-4 text-center">
              Thank you for partnering with Apex Enterprise Corp. Official computer-generated commercial document.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
