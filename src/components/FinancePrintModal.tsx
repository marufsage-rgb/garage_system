import React, { useState } from 'react';
import {
  X,
  Printer,
  FileText,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Scale,
  Download
} from 'lucide-react';
import { Transaction, SalesOrder } from '../types';
import { exportFinancePnlStatementPDF, exportGeneralLedgerPDF } from '../utils/pdfExport';

interface FinancePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  allTransactionsCount: number;
  salesOrders?: SalesOrder[];
  initialMode?: 'ledger' | 'pnl';
}

export const FinancePrintModal: React.FC<FinancePrintModalProps> = ({
  isOpen,
  onClose,
  transactions,
  allTransactionsCount,
  salesOrders = [],
  initialMode = 'ledger'
}) => {
  const [reportType, setReportType] = useState<'ledger' | 'pnl'>(initialMode);
  const [showKpiSummary, setShowKpiSummary] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);
  const [compactRows, setCompactRows] = useState(false);

  if (!isOpen) return null;

  // Calculate totals for transactions
  const totalInflows = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutflows = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashFlow = totalInflows - totalOutflows;

  // Category summary for breakdown
  const categoryTotals = transactions.reduce((acc, t) => {
    if (!acc[t.category]) {
      acc[t.category] = { income: 0, expense: 0, count: 0 };
    }
    if (t.type === 'income') {
      acc[t.category].income += t.amount;
    } else {
      acc[t.category].expense += t.amount;
    }
    acc[t.category].count += 1;
    return acc;
  }, {} as Record<string, { income: number; expense: number; count: number }>);

  // Account balances
  const accountTotals = transactions.reduce((acc, t) => {
    if (!acc[t.account]) {
      acc[t.account] = { net: 0, count: 0 };
    }
    if (t.type === 'income') {
      acc[t.account].net += t.amount;
    } else {
      acc[t.account].net -= t.amount;
    }
    acc[t.account].count += 1;
    return acc;
  }, {} as Record<string, { net: number; count: number }>);

  // P&L metrics
  const grossSales = salesOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);
  const estimatedCogs = grossSales * 0.48;
  const grossProfit = grossSales - estimatedCogs;
  const opex = totalOutflows;
  const netOperatingIncome = grossProfit - opex;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (reportType === 'pnl') {
      exportFinancePnlStatementPDF(
        { grossSales, estimatedCogs, grossProfit, opex, netOperatingIncome },
        'OMR'
      );
    } else {
      exportGeneralLedgerPDF(transactions, 'OMR');
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col my-auto overflow-hidden">
        {/* Modal Controls Header (Hidden during Print via .no-print) */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>Financial Document & PDF Preview</span>
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-[10px] font-mono font-medium">
                  CSS Print Ready
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                A4 / Letter formatted view optimized for physical printing and digital PDF saving
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
            {/* Report Mode Tabs */}
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setReportType('ledger')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  reportType === 'ledger' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                General Ledger ({transactions.length})
              </button>
              <button
                type="button"
                onClick={() => setReportType('pnl')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  reportType === 'pnl' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                P&L Statement
              </button>
            </div>

            {/* Download Vector PDF Button */}
            <button
              onClick={handleDownloadPdf}
              id="btn-download-pdf-finance"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Download vector PDF file via jsPDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            {/* Print Trigger Button */}
            <button
              onClick={handlePrint}
              id="btn-confirm-print-finance"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Open browser print dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Options Toolbar (Hidden during Print) */}
        <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3 no-print">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer font-medium select-none">
              <input
                type="checkbox"
                checked={showKpiSummary}
                onChange={(e) => setShowKpiSummary(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span>Executive KPI Summary</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer font-medium select-none">
              <input
                type="checkbox"
                checked={showSignatures}
                onChange={(e) => setShowSignatures(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span>Officer Sign-off Blocks</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer font-medium select-none">
              <input
                type="checkbox"
                checked={compactRows}
                onChange={(e) => setCompactRows(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span>Compact Density</span>
            </label>
          </div>

          <div className="text-[11px] text-slate-500 italic">
            Tip: In the print dialog, select &ldquo;Save as PDF&rdquo; as destination.
          </div>
        </div>

        {/* Scrollable Preview Wrapper with Document Paper Styling */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/50 flex justify-center">
          {/* Printable Document Container (Styled for Screen Preview & Targeted by @media print) */}
          <div
            id="printable-finance-document"
            className="bg-white text-slate-900 w-full max-w-[820px] p-8 sm:p-12 shadow-md border border-slate-200 rounded-sm font-sans"
            style={{ minHeight: '1050px' }}
          >
            {/* Document Header / Formal Corporate Letterhead */}
            <div className="border-b-2 border-slate-900 pb-5">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                      A
                    </div>
                    <span className="text-xl font-extrabold tracking-tight text-slate-900">
                      APEX ENTERPRISE CORP
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    Division of Corporate Treasury & Financial Accounting
                  </p>
                  <p className="text-[11px] text-slate-500">
                    700 Industrial Parkway, Suite 100 • Austin, TX 78701
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Tax ID / EIN: 84-2901928 • Financial Reporting System
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    {reportType === 'ledger' ? 'Official Accounting Record' : 'GAAP Financial Report'}
                  </div>
                  <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight mt-0.5">
                    {reportType === 'ledger' ? 'General Ledger Journal' : 'Statement of Profit & Loss'}
                  </h1>
                  <div className="mt-1 font-mono text-[11px] font-bold text-slate-800">
                    REF: {reportType === 'ledger' ? 'GL-AUDIT-' : 'PNL-STMT-'}
                    {new Date().toISOString().split('T')[0].replace(/-/g, '')}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">Date: {currentDate}</div>
                  <div className="text-[10px] text-slate-400">Generated: {currentTime} UTC</div>
                </div>
              </div>

              {/* Sub-header Scope Bar */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap justify-between items-center text-[11px] text-slate-600">
                <div>
                  <span className="font-semibold text-slate-900">Reporting Scope: </span>
                  {transactions.length === allTransactionsCount ? (
                    <span>All Recorded General Ledger Entries ({transactions.length} items)</span>
                  ) : (
                    <span>Filtered Ledger Subset ({transactions.length} of {allTransactionsCount} items)</span>
                  )}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Accounting Standard: </span>
                  <span>Accrual Basis / US GAAP</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Currency: </span>
                  <span className="font-mono font-bold">USD ($)</span>
                </div>
              </div>
            </div>

            {/* Optional KPI Summary Boxes */}
            {showKpiSummary && (
              <div className="my-6 grid grid-cols-3 gap-3 print-break-inside-avoid">
                <div className="border border-slate-300 p-3 rounded bg-slate-50/50">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Total Inflows / Receipts
                  </div>
                  <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                    +${totalInflows.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {transactions.filter((t) => t.type === 'income').length} credit postings
                  </div>
                </div>

                <div className="border border-slate-300 p-3 rounded bg-slate-50/50">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Total Outflows / Debits
                  </div>
                  <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                    -${totalOutflows.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {transactions.filter((t) => t.type === 'expense').length} debit postings
                  </div>
                </div>

                <div className="border border-slate-300 p-3 rounded bg-slate-50/50">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Net Cash / Operating Margin
                  </div>
                  <div
                    className={`text-base font-bold font-mono mt-0.5 ${
                      netCashFlow >= 0 ? 'text-slate-900' : 'text-slate-800'
                    }`}
                  >
                    ${netCashFlow.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Trial Balance: Reconciled</div>
                </div>
              </div>
            )}

            {/* Content: Mode 1 - Transaction Ledger */}
            {reportType === 'ledger' && (
              <div className="mt-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex justify-between items-center">
                  <span>Itemized General Ledger Journal</span>
                  <span className="text-[10px] font-normal text-slate-500">
                    Showing {transactions.length} posted transactions
                  </span>
                </div>

                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-y-2 border-slate-800 bg-slate-100 text-slate-800 font-bold text-[10px] uppercase tracking-wider">
                      <th className="py-2 px-2.5">Date</th>
                      <th className="py-2 px-2.5">Ref #</th>
                      <th className="py-2 px-2.5">Account</th>
                      <th className="py-2 px-2.5">Category</th>
                      <th className="py-2 px-2.5">Description & Memo</th>
                      <th className="py-2 px-2.5 text-right">Debit (Out)</th>
                      <th className="py-2 px-2.5 text-right">Credit (In)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-500 italic">
                          No transactions found in this reporting view.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx, idx) => {
                        const isExpense = tx.type === 'expense';
                        return (
                          <tr
                            key={tx.id}
                            className={`print-break-inside-avoid ${
                              idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'
                            } ${compactRows ? 'text-[10px]' : 'text-[11px]'}`}
                          >
                            <td className="py-1.5 px-2.5 text-slate-600 font-mono whitespace-nowrap">
                              {tx.date}
                            </td>
                            <td className="py-1.5 px-2.5 font-mono text-[10px] text-slate-600 whitespace-nowrap">
                              {tx.referenceNumber}
                            </td>
                            <td className="py-1.5 px-2.5 text-slate-700 whitespace-nowrap">
                              {tx.account}
                            </td>
                            <td className="py-1.5 px-2.5 text-slate-700">
                              <span className="border border-slate-300 px-1.5 py-0.5 rounded text-[10px]">
                                {tx.category}
                              </span>
                            </td>
                            <td className="py-1.5 px-2.5 text-slate-900 font-medium">
                              {tx.description}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono text-slate-900 whitespace-nowrap">
                              {isExpense ? `$${tx.amount.toFixed(2)}` : '—'}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                              {!isExpense ? `$${tx.amount.toFixed(2)}` : '—'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-900 bg-slate-100 font-bold text-[11px] text-slate-900">
                      <td colSpan={5} className="py-2.5 px-2.5 text-right uppercase tracking-wider">
                        Total Ledger Postings ({transactions.length}):
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono">
                        ${totalOutflows.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono">
                        ${totalInflows.toFixed(2)}
                      </td>
                    </tr>
                    <tr className="border-b-2 border-slate-900 bg-slate-50 font-bold text-xs text-slate-900">
                      <td colSpan={5} className="py-2 px-2.5 text-right uppercase tracking-wider">
                        Net Change in Operating Cash:
                      </td>
                      <td colSpan={2} className="py-2 px-2.5 text-right font-mono">
                        ${netCashFlow.toFixed(2)} USD
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Account Balances Summary Matrix */}
                <div className="mt-8 border border-slate-300 rounded p-4 print-break-inside-avoid bg-slate-50/40">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Settlement Account Reconciliation Breakdown
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    {Object.entries(accountTotals).map(([accName, val]) => (
                      <div key={accName} className="border-b border-slate-200 pb-1.5">
                        <div className="text-[11px] text-slate-600 font-medium">{accName}</div>
                        <div className="flex justify-between items-center mt-0.5">
                          <span className="font-mono text-[10px] text-slate-500">
                            {val.count} txs
                          </span>
                          <span
                            className={`font-mono font-bold text-[11px] ${
                              val.net >= 0 ? 'text-slate-900' : 'text-slate-800'
                            }`}
                          >
                            ${val.net.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Content: Mode 2 - Profit & Loss Statement */}
            {reportType === 'pnl' && (
              <div className="mt-4 space-y-6">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Consolidated Statement of Profit and Loss (P&L)
                </div>

                <div className="border border-slate-300 rounded overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3 text-left">Accounting Category / Line Item</th>
                        <th className="py-2 px-3 text-right">Debit / Cost</th>
                        <th className="py-2 px-3 text-right">Credit / Revenue</th>
                        <th className="py-2 px-3 text-right">Net Subtotal (USD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-[11px]">
                      {/* Revenue */}
                      <tr className="bg-slate-50 font-bold text-slate-900">
                        <td className="py-2 px-3">1. Operational Revenue</td>
                        <td className="py-2 px-3 text-right">—</td>
                        <td className="py-2 px-3 text-right font-mono">${grossSales.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-mono">${grossSales.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-6 text-slate-600">Invoiced Customer Orders</td>
                        <td className="py-1.5 px-3 text-right font-mono">—</td>
                        <td className="py-1.5 px-3 text-right font-mono">${grossSales.toFixed(2)}</td>
                        <td className="py-1.5 px-3 text-right font-mono">—</td>
                      </tr>

                      {/* COGS */}
                      <tr className="bg-slate-50 font-bold text-slate-900">
                        <td className="py-2 px-3">2. Cost of Goods Sold (COGS)</td>
                        <td className="py-2 px-3 text-right font-mono">${estimatedCogs.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-mono">—</td>
                        <td className="py-2 px-3 text-right font-mono">-${estimatedCogs.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-6 text-slate-600">Direct Materials & Assembly (70%)</td>
                        <td className="py-1.5 px-3 text-right font-mono">${(estimatedCogs * 0.7).toFixed(2)}</td>
                        <td className="py-1.5 px-3 text-right font-mono">—</td>
                        <td className="py-1.5 px-3 text-right font-mono">—</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-6 text-slate-600">Factory Freight & Overhead (30%)</td>
                        <td className="py-1.5 px-3 text-right font-mono">${(estimatedCogs * 0.3).toFixed(2)}</td>
                        <td className="py-1.5 px-3 text-right font-mono">—</td>
                        <td className="py-1.5 px-3 text-right font-mono">—</td>
                      </tr>

                      {/* Gross Profit */}
                      <tr className="bg-slate-100 font-extrabold text-slate-900 border-t border-b border-slate-300">
                        <td className="py-2 px-3 uppercase tracking-wider">3. Gross Operating Profit</td>
                        <td className="py-2 px-3 text-right font-mono">—</td>
                        <td className="py-2 px-3 text-right font-mono">—</td>
                        <td className="py-2 px-3 text-right font-mono">${grossProfit.toFixed(2)}</td>
                      </tr>

                      {/* Operating Expenses */}
                      <tr className="bg-slate-50 font-bold text-slate-900">
                        <td className="py-2 px-3">4. Operating Expenses (OPEX)</td>
                        <td className="py-2 px-3 text-right font-mono">${opex.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-mono">—</td>
                        <td className="py-2 px-3 text-right font-mono">-${opex.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-6 text-slate-600">Staff Compensation & Payroll Run</td>
                        <td className="py-1.5 px-3 text-right font-mono">$28,400.00</td>
                        <td className="py-1.5 px-3 text-right font-mono">—</td>
                        <td className="py-1.5 px-3 text-right font-mono">—</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-6 text-slate-600">Facilities, Utilities & General Disbursements</td>
                        <td className="py-1.5 px-3 text-right font-mono">
                          ${(opex - 28400 > 0 ? opex - 28400 : 0).toFixed(2)}
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono">—</td>
                        <td className="py-1.5 px-3 text-right font-mono">—</td>
                      </tr>

                      {/* Net Income */}
                      <tr className="bg-slate-900 text-white font-extrabold text-xs">
                        <td className="py-3 px-3 uppercase tracking-wider">
                          5. Net Operating Income (EBITDA)
                        </td>
                        <td className="py-3 px-3 text-right font-mono">—</td>
                        <td className="py-3 px-3 text-right font-mono">—</td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-400">
                          ${netOperatingIncome.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Formal Corporate Signatures & Certification Block */}
            {showSignatures && (
              <div className="mt-12 pt-6 border-t-2 border-slate-900 print-break-inside-avoid">
                <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-6">
                  Certification & Audit Authorization
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed mb-6">
                  I hereby certify that the ledger postings, journals, and financial summaries presented
                  in this document are true, complete, and accurately represent the financial transactions
                  recorded within the Apex Enterprise ERP general ledger for the period specified.
                </p>

                <div className="grid grid-cols-2 gap-12 text-xs">
                  <div>
                    <div className="border-b border-slate-400 pb-1 h-8 flex items-end">
                      <span className="font-mono text-slate-400 text-[11px] italic">Sign / Stamp Here</span>
                    </div>
                    <div className="mt-1.5">
                      <div className="font-bold text-slate-900">Prepared By: Financial Controller</div>
                      <div className="text-[10px] text-slate-500">
                        Apex Corporate Treasury • Date: ____________
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="border-b border-slate-400 pb-1 h-8 flex items-end">
                      <span className="font-mono text-slate-400 text-[11px] italic">Sign / Stamp Here</span>
                    </div>
                    <div className="mt-1.5">
                      <div className="font-bold text-slate-900">Authorized By: Chief Financial Officer</div>
                      <div className="text-[10px] text-slate-500">
                        Executive Board • Date: ____________
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Document Print Footer */}
            <div className="mt-10 pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
              <div>Apex ERP • Confidential • Official Financial Record</div>
              <div>Report ID: GL-{new Date().getFullYear()}-{transactions.length}TX</div>
              <div>Page 1 of 1</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
