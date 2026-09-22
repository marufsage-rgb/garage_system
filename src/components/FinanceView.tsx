import React, { useState } from 'react';
import {
  Landmark,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  PieChart,
  CheckCircle2,
  Download,
  FileText,
  ChevronDown,
  Printer
} from 'lucide-react';
import { Transaction, SalesOrder } from '../types';
import { FinancePrintModal } from './FinancePrintModal';
import { formatCurrency } from '../utils/formatters';
import { exportFinancePnlStatementPDF, exportGeneralLedgerPDF } from '../utils/pdfExport';

interface FinanceViewProps {
  transactions: Transaction[];
  salesOrders: SalesOrder[];
  currency: string;
  onOpenRecordExpenseModal: () => void;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  transactions,
  salesOrders,
  currency,
  onOpenRecordExpenseModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [activeTab, setActiveTab] = useState<'ledger' | 'pnl'>('ledger');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printMode, setPrintMode] = useState<'ledger' | 'pnl'>('ledger');

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const netCashflow = totalIncome - totalExpense;

  // Filtered transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.account.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Simple P&L calculations
  const grossSales = salesOrders.reduce((acc, o) => (o.status !== 'cancelled' ? acc + o.total : acc), 0);
  const estimatedCogs = grossSales * 0.48; // Standard 48% blended industrial COGS
  const grossProfit = grossSales - estimatedCogs;
  const opex = totalExpense;
  const netOperatingIncome = grossProfit - opex;

  // CSV Escaping helper complying with RFC 4180
  const escapeCsv = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '""';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  // Helper to trigger browser download
  const triggerDownload = (csvString: string, filename: string) => {
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export 1: Full Transaction History CSV for External Accounting (QuickBooks, Xero, Excel, Sage)
  const handleExportTransactionsCsv = (txList: Transaction[] = transactions, label = 'All Transactions') => {
    const headers = [
      'Transaction ID',
      'Date',
      'Reference Number',
      'Type',
      'Category',
      'Description',
      'Settlement Account',
      `Debit (${currency})`,
      `Credit (${currency})`,
      `Net Amount (${currency})`,
      'Currency',
      'Reconciliation Status'
    ];

    const rows = txList.map((t) => {
      const isExpense = t.type === 'expense';
      const debit = isExpense ? t.amount.toFixed(2) : '0.00';
      const credit = !isExpense ? t.amount.toFixed(2) : '0.00';
      const netSigned = isExpense ? (-t.amount).toFixed(2) : t.amount.toFixed(2);

      return [
        escapeCsv(t.id),
        escapeCsv(t.date),
        escapeCsv(t.referenceNumber),
        escapeCsv(t.type.toUpperCase()),
        escapeCsv(t.category),
        escapeCsv(t.description),
        escapeCsv(t.account),
        escapeCsv(debit),
        escapeCsv(credit),
        escapeCsv(netSigned),
        escapeCsv(currency),
        escapeCsv('Cleared')
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const today = new Date().toISOString().split('T')[0];
    const filename = `apex_erp_transactions_${today}.csv`;
    triggerDownload(csvContent, filename);

    setShowExportMenu(false);
    setExportSuccessMessage(`Exported ${txList.length} transactions to ${filename}`);
    setTimeout(() => setExportSuccessMessage(null), 4000);
  };

  // Export 2: Consolidated Profit & Loss Financial Report CSV
  const handleExportPnlCsv = () => {
    const today = new Date().toISOString().split('T')[0];
    const lines = [
      ['REPORT', 'Apex Enterprise Consolidated Profit & Loss Statement'].map(escapeCsv).join(','),
      ['ORGANIZATION', 'Apex Enterprise Global ERP'].map(escapeCsv).join(','),
      ['FISCAL_PERIOD', 'FY 2026 (Annualized)'].map(escapeCsv).join(','),
      ['DATE_GENERATED', new Date().toLocaleString()].map(escapeCsv).join(','),
      ['CURRENCY', currency].map(escapeCsv).join(','),
      '',
      ['Section', 'Line Item Description', 'Details / Note', `Debit / Cost (${currency})`, `Credit / Revenue (${currency})`, `Net Subtotal (${currency})`].map(escapeCsv).join(','),
      // Revenue
      ['1. REVENUE', 'Gross Operational Revenue', 'Invoiced customer orders', '0.00', grossSales.toFixed(2), grossSales.toFixed(2)].map(escapeCsv).join(','),
      ['1. REVENUE', 'Direct Invoiced Sales', 'Confirmed non-cancelled sales', '0.00', grossSales.toFixed(2), grossSales.toFixed(2)].map(escapeCsv).join(','),
      // COGS
      ['2. COGS', 'Cost of Goods Sold (Total)', 'Blended industrial inventory ratio (48%)', estimatedCogs.toFixed(2), '0.00', (-estimatedCogs).toFixed(2)].map(escapeCsv).join(','),
      ['2. COGS', 'Direct Raw Materials & Assembly', 'Estimated 70% of production run', (estimatedCogs * 0.7).toFixed(2), '0.00', (-(estimatedCogs * 0.7)).toFixed(2)].map(escapeCsv).join(','),
      ['2. COGS', 'Factory Overhead & Freight Inward', 'Estimated 30% of logistics run', (estimatedCogs * 0.3).toFixed(2), '0.00', (-(estimatedCogs * 0.3)).toFixed(2)].map(escapeCsv).join(','),
      // Gross Profit
      ['3. GROSS PROFIT', 'Gross Operating Margin', 'Revenue minus Cost of Goods Sold', '0.00', '0.00', grossProfit.toFixed(2)].map(escapeCsv).join(','),
      // OPEX
      ['4. OPEX', 'Operating Expenses (Total)', 'Disbursements & General Ledger outflows', opex.toFixed(2), '0.00', (-opex).toFixed(2)].map(escapeCsv).join(','),
      ['4. OPEX', 'Staff Compensation & Payroll Run', 'Estimated baseline monthly payroll', '28400.00', '0.00', '-28400.00'].map(escapeCsv).join(','),
      ['4. OPEX', 'Facility, Logistics & Utilities', 'Operating disbursements', (opex - 28400 > 0 ? opex - 28400 : 0).toFixed(2), '0.00', (-(opex - 28400 > 0 ? opex - 28400 : 0)).toFixed(2)].map(escapeCsv).join(','),
      // Net Income
      ['5. NET INCOME', 'Net Operating Income (EBITDA)', 'Operating profit after all operational deductions', '0.00', '0.00', netOperatingIncome.toFixed(2)].map(escapeCsv).join(',')
    ];

    const csvContent = lines.join('\r\n');
    const filename = `apex_erp_pnl_report_${today}.csv`;
    triggerDownload(csvContent, filename);

    setShowExportMenu(false);
    setExportSuccessMessage(`Exported financial P&L report to ${filename}`);
    setTimeout(() => setExportSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Confirmation */}
      {exportSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{exportSuccessMessage}</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-mono">Compatible with QuickBooks, Xero & Excel</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Finance, General Ledger & P&L</h1>
          <p className="text-xs text-slate-500 mt-1">
            Double-entry ledger journal, operating expenses, financial statements, and accounts reconciliation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'ledger' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600'
              }`}
            >
              General Ledger
            </button>
            <button
              onClick={() => setActiveTab('pnl')}
              className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === 'pnl' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600'
              }`}
            >
              Profit & Loss Statement
            </button>
          </div>

            {/* Download / Export Menu */}
            <div className="relative">
              <button
                id="btn-download-csv-menu"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
                title="Export transaction history or financial reports in PDF or CSV format"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Export Reports</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {showExportMenu && (
                <div
                  className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-40 text-xs"
                  onMouseLeave={() => setShowExportMenu(false)}
                >
                  <div className="px-3.5 py-1.5 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-100 tracking-wider">
                    PDF Document Reports (jsPDF)
                  </div>

                  <button
                    onClick={() => {
                      exportFinancePnlStatementPDF(
                        { grossSales, estimatedCogs, grossProfit, opex, netOperatingIncome },
                        currency
                      );
                      setShowExportMenu(false);
                      setExportSuccessMessage('Exported Profit & Loss Statement (PDF)');
                      setTimeout(() => setExportSuccessMessage(null), 4000);
                    }}
                    id="btn-export-pnl-pdf"
                    className="w-full text-left px-3.5 py-2.5 hover:bg-indigo-50/70 flex items-start gap-2.5 text-slate-700 hover:text-indigo-900 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-900">Download P&L Statement (PDF)</div>
                      <div className="text-[11px] text-slate-500">
                        Formal income statement with Revenue, COGS, OPEX & EBITDA
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      exportGeneralLedgerPDF(filteredTransactions, currency);
                      setShowExportMenu(false);
                      setExportSuccessMessage(`Exported General Ledger (${filteredTransactions.length} entries) as PDF`);
                      setTimeout(() => setExportSuccessMessage(null), 4000);
                    }}
                    id="btn-export-ledger-pdf"
                    className="w-full text-left px-3.5 py-2.5 hover:bg-indigo-50/70 flex items-start gap-2.5 text-slate-700 hover:text-indigo-900 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-900">Download General Ledger (PDF)</div>
                      <div className="text-[11px] text-slate-500">
                        Full double-entry audit trail report with debits and credits
                      </div>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <div className="px-3.5 py-1.5 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-100 tracking-wider">
                    CSV Raw Data Exports
                  </div>

                  <button
                    onClick={() => handleExportTransactionsCsv(transactions, 'All Transactions')}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-indigo-50/70 flex items-start gap-2.5 text-slate-700 hover:text-indigo-900 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-900">Transaction History CSV</div>
                      <div className="text-[11px] text-slate-500">
                        All {transactions.length} entries (QuickBooks / Xero import)
                      </div>
                    </div>
                  </button>

                  {filteredTransactions.length !== transactions.length && (
                    <button
                      onClick={() => handleExportTransactionsCsv(filteredTransactions, 'Filtered Transactions')}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-indigo-50/70 flex items-start gap-2.5 text-slate-700 hover:text-indigo-900 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-slate-900">Filtered Transactions CSV</div>
                        <div className="text-[11px] text-slate-500">
                          Export active filtered view ({filteredTransactions.length} rows)
                        </div>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={handleExportPnlCsv}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-indigo-50/70 flex items-start gap-2.5 text-slate-700 hover:text-indigo-900 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-900">Financial Statement (P&L) CSV</div>
                      <div className="text-[11px] text-slate-500">
                        Consolidated Revenue, COGS, OPEX & EBITDA table
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

          {/* Print Document Preview Button */}
          <button
            onClick={() => {
              setPrintMode(activeTab);
              setIsPrintModalOpen(true);
            }}
            id="btn-print-preview-header"
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
            title="Open clean, document-formatted view for printing or saving as PDF"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={onOpenRecordExpenseModal}
            id="btn-record-expense"
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Entry</span>
          </button>
        </div>
      </div>

      {/* Top Financial Health Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Recorded Inflows</span>
            <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-2">
            +{formatCurrency(totalIncome, currency)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Recorded Outflows</span>
            <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-rose-600 mt-2">
            -{formatCurrency(totalExpense, currency)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Net Cash Position</span>
            <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl font-bold mt-2 ${netCashflow >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            {formatCurrency(netCashflow, currency)}
          </div>
        </div>
      </div>

      {activeTab === 'ledger' ? (
        <div className="space-y-4">
          {/* Search & Filter Bar with Direct CSV Trigger */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search transactions, accounts, categories..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 text-xs text-slate-700 py-1.5 px-2.5 rounded-lg focus:outline-none"
              >
                <option value="all">All Transactions</option>
                <option value="income">Income / Receipts</option>
                <option value="expense">Expenses / Disbursements</option>
              </select>

              <button
                onClick={() => handleExportTransactionsCsv(filteredTransactions)}
                id="btn-export-ledger-csv"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                title="Export this transaction list directly to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV ({filteredTransactions.length})</span>
              </button>

              <button
                onClick={() => {
                  setPrintMode('ledger');
                  setIsPrintModalOpen(true);
                }}
                id="btn-print-preview-ledger"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                title="Open clean, document-formatted view for printing or saving as PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / PDF Preview</span>
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-[10px] tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-4 py-3">Description & Memo</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Settlement Account</th>
                    <th className="px-4 py-3">Reference #</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Reconciliation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3 text-slate-500 font-medium">{tx.date}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{tx.description}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                            {tx.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{tx.account}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{tx.referenceNumber}</td>
                        <td
                          className={`px-4 py-3 font-bold text-right ${
                            tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Cleared
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* P&L Statement Snapshot */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-3xl mx-auto">
          <div className="border-b border-slate-200 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Consolidated Statement of Profit and Loss</h2>
              <p className="text-xs text-slate-500 mt-0.5">For Fiscal Year 2026 (Currency: USD)</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPnlCsv}
                id="btn-export-pnl-csv"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
                title="Export P&L statement to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download P&L CSV</span>
              </button>
              <button
                onClick={() => {
                  setPrintMode('pnl');
                  setIsPrintModalOpen(true);
                }}
                id="btn-print-pnl"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
                title="Print or save P&L statement as PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / PDF Statement</span>
              </button>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-700">
            {/* Revenue */}
            <div className="pb-3 border-b border-slate-100">
              <div className="flex justify-between font-bold text-slate-900 py-1">
                <span>Gross Operational Revenue</span>
                <span>${grossSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 pl-4 py-0.5">
                <span>Direct Invoiced Sales</span>
                <span>${grossSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* COGS */}
            <div className="pb-3 border-b border-slate-100">
              <div className="flex justify-between font-bold text-slate-900 py-1">
                <span>Cost of Goods Sold (COGS)</span>
                <span className="text-rose-600">-${estimatedCogs.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 pl-4 py-0.5">
                <span>Direct Raw Materials & Component Assembly</span>
                <span>${(estimatedCogs * 0.7).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 pl-4 py-0.5">
                <span>Factory Overhead & Freight Inward</span>
                <span>${(estimatedCogs * 0.3).toFixed(2)}</span>
              </div>
            </div>

            {/* Gross Profit */}
            <div className="py-2 px-3 bg-slate-50 rounded-lg flex justify-between font-bold text-slate-900">
              <span>Gross Profit</span>
              <span className="text-indigo-600">${grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>

            {/* OPEX */}
            <div className="pb-3 border-b border-slate-100 pt-2">
              <div className="flex justify-between font-bold text-slate-900 py-1">
                <span>Operating Expenses (OPEX)</span>
                <span className="text-rose-600">-${opex.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 pl-4 py-0.5">
                <span>Staff Compensation & Payroll Run</span>
                <span>$28,400.00</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 pl-4 py-0.5">
                <span>Facility, Logistics & Utilities</span>
                <span>${(opex - 28400 > 0 ? opex - 28400 : 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Net Income */}
            <div className="py-3 px-4 bg-indigo-50 border border-indigo-100 rounded-lg flex justify-between font-bold text-base text-slate-900 mt-4">
              <span>Net Operating Income (EBITDA)</span>
              <span className={netOperatingIncome >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                ${netOperatingIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Print / PDF Document Preview Modal */}
      <FinancePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        transactions={filteredTransactions}
        allTransactionsCount={transactions.length}
        salesOrders={salesOrders}
        initialMode={printMode}
      />
    </div>
  );
};
