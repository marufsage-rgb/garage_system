import React, { useState } from 'react';
import { ERPState, JobCard, Estimate, NotificationLog } from '../types';
import { initialJobCards, initialEstimates, initialNotificationLogs } from '../mockData';
import {
  Terminal,
  Play,
  Database,
  Table,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Image as ImageIcon,
  Calculator,
  Sparkles,
  Layers,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react';

interface SqlConsoleViewProps {
  state: ERPState;
  onRunMigration?: (migrationName: string, details: string) => void;
  onUpdateState?: React.Dispatch<React.SetStateAction<ERPState>>;
}

const PACKAGE_1_MIGRATION_SQL = `-- ═══════════════════════════════════════════════════════════
-- PACKAGE 1 MIGRATION — Safe to run even if columns already exist
-- ═══════════════════════════════════════════════════════════

-- 1. Job cards — before/after photo paths (quick access)
ALTER TABLE job_cards 
ADD COLUMN IF NOT EXISTS before_photo VARCHAR(255) NULL AFTER notes,
ADD COLUMN IF NOT EXISTS after_photo  VARCHAR(255) NULL AFTER before_photo;

-- 2. Estimates — 5% Oman VAT breakdown
ALTER TABLE estimates 
ADD COLUMN IF NOT EXISTS subtotal    DECIMAL(10,3) DEFAULT 0.000 AFTER total_amount,
ADD COLUMN IF NOT EXISTS vat_amount  DECIMAL(10,3) DEFAULT 0.000 AFTER subtotal,
ADD COLUMN IF NOT EXISTS grand_total DECIMAL(10,3) DEFAULT 0.000 AFTER vat_amount;

-- 3. Backfill existing estimates (subtotal=total, VAT on top)
UPDATE estimates 
SET subtotal    = total_amount,
    vat_amount  = ROUND(total_amount * 0.05, 3),
    grand_total = ROUND(total_amount * 1.05, 3)
WHERE subtotal = 0 AND total_amount > 0;

-- 4. Notification log for WhatsApp audit trail
CREATE TABLE IF NOT EXISTS notification_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_card_id INT NULL,
  channel ENUM('WHATSAPP','EMAIL','SMS') NOT NULL,
  recipient VARCHAR(150) NOT NULL,
  message TEXT,
  status ENUM('SENT','FAILED','PENDING') DEFAULT 'SENT',
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_jc (job_card_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

export const SqlConsoleView: React.FC<SqlConsoleViewProps> = ({
  state,
  onRunMigration,
  onUpdateState,
}) => {
  const [query, setQuery] = useState(PACKAGE_1_MIGRATION_SQL);
  const [activeTab, setActiveTab] = useState<'results' | 'package1' | 'schema'>('results');
  const [execResult, setExecResult] = useState<{
    columns: string[];
    rows: any[];
    executionTimeMs: number;
    error?: string;
    isMigration?: boolean;
    migrationSteps?: { title: string; status: 'ok' | 'info'; message: string }[];
  } | null>(null);

  const jobCards = state.jobCards || initialJobCards;
  const estimates = state.estimates || initialEstimates;
  const notificationLogs = state.notificationLogs || initialNotificationLogs;

  // Robust client-side SQL parser & executor on ERP dataset + Migration Engine
  const executeQuery = () => {
    const start = performance.now();
    const cleanQ = query.trim();

    try {
      const lower = cleanQ.toLowerCase();

      // Check if this is the Package 1 migration or contains DDL / UPDATE
      const isMigrationScript =
        lower.includes('package 1 migration') ||
        (lower.includes('alter table') && (lower.includes('job_cards') || lower.includes('estimates'))) ||
        (lower.includes('update estimates') && lower.includes('vat_amount')) ||
        lower.includes('create table if not exists notification_log');

      if (isMigrationScript) {
        // Run migration logic and apply updates to ERPState
        const steps: { title: string; status: 'ok' | 'info'; message: string }[] = [];

        if (lower.includes('job_cards') && lower.includes('before_photo')) {
          steps.push({
            title: 'ALTER TABLE job_cards',
            status: 'ok',
            message: 'Added columns `before_photo` (VARCHAR 255) and `after_photo` (VARCHAR 255) for vehicle inspection records.',
          });
        }

        if (lower.includes('estimates') && lower.includes('vat_amount')) {
          steps.push({
            title: 'ALTER TABLE estimates',
            status: 'ok',
            message: 'Added Oman 5% VAT columns: `subtotal` DECIMAL(10,3), `vat_amount` DECIMAL(10,3), and `grand_total` DECIMAL(10,3).',
          });
        }

        if (lower.includes('update estimates')) {
          steps.push({
            title: 'UPDATE estimates (Backfill)',
            status: 'ok',
            message: `Backfilled ${estimates.length} estimates with subtotal = total_amount, 5.0% Oman VAT, and grand_total.`,
          });
        }

        if (lower.includes('notification_log')) {
          steps.push({
            title: 'CREATE TABLE notification_log',
            status: 'ok',
            message: 'Table initialized with InnoDB engine, utf8mb4 charset, and index on idx_jc (job_card_id) for WhatsApp audit tracking.',
          });
        }

        // Apply state updates if updater is provided
        if (onUpdateState) {
          onUpdateState((prev) => {
            const updatedEstimates = (prev.estimates || initialEstimates).map((est) => {
              const subtotal = est.totalAmount;
              const vatAmount = Math.round(subtotal * 0.05 * 1000) / 1000;
              const grandTotal = Math.round(subtotal * 1.05 * 1000) / 1000;
              return {
                ...est,
                subtotal,
                vatAmount,
                grandTotal,
              };
            });

            return {
              ...prev,
              estimates: updatedEstimates,
              jobCards: prev.jobCards || initialJobCards,
              notificationLogs: prev.notificationLogs || initialNotificationLogs,
            };
          });
        }

        if (onRunMigration) {
          onRunMigration(
            'PACKAGE 1 MIGRATION',
            'Job cards before/after photos, 5% Oman VAT estimates breakdown, and notification_log WhatsApp audit trail.'
          );
        }

        const end = performance.now();
        setExecResult({
          columns: ['estimate_number', 'customer_name', 'total_amount', 'subtotal', 'vat_amount (5%)', 'grand_total', 'status'],
          rows: estimates.map((e) => ({
            estimate_number: e.estimateNumber,
            customer_name: e.customerName,
            total_amount: Number(e.totalAmount).toFixed(3) + ' OMR',
            subtotal: Number(e.subtotal || e.totalAmount).toFixed(3) + ' OMR',
            'vat_amount (5%)': Number(e.vatAmount || e.totalAmount * 0.05).toFixed(3) + ' OMR',
            grand_total: Number(e.grandTotal || e.totalAmount * 1.05).toFixed(3) + ' OMR',
            status: e.status.toUpperCase(),
          })),
          executionTimeMs: Math.round((end - start) * 10) / 10,
          isMigration: true,
          migrationSteps: steps,
        });
        setActiveTab('results');
        return;
      }

      if (!lower.startsWith('select')) {
        throw new Error(
          'Command not recognized. To execute the Package 1 Migration, paste the ALTER TABLE / UPDATE / CREATE TABLE script or click "Package 1 Migration" in the presets bar.'
        );
      }

      // Determine table
      let tableData: any[] = [];
      let tableName = '';

      if (lower.includes('from products')) {
        tableName = 'products';
        tableData = state.products.map((p) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          category: p.category,
          unit: p.unit,
          cost_price: p.costPrice,
          unit_price: p.unitPrice,
          stock_quantity: p.stockQuantity,
          reorder_level: p.reorderLevel,
          warehouse_location: p.warehouseLocation,
          status: p.status,
        }));
      } else if (lower.includes('from sales_orders')) {
        tableName = 'sales_orders';
        tableData = state.salesOrders.map((o) => ({
          id: o.id,
          order_number: o.orderNumber,
          customer_company: o.customerCompany,
          customer_name: o.customerName,
          order_date: o.date,
          due_date: o.dueDate,
          subtotal: o.subtotal,
          tax: o.tax,
          total: o.total,
          status: o.status,
          payment_status: o.paymentStatus,
        }));
      } else if (lower.includes('from customers')) {
        tableName = 'customers';
        tableData = state.customers.map((c) => ({
          id: c.id,
          company: c.company,
          name: c.name,
          email: c.email,
          phone: c.phone,
          outstanding_balance: c.outstandingBalance,
          status: c.status,
        }));
      } else if (lower.includes('from vendors')) {
        tableName = 'vendors';
        tableData = state.vendors.map((v) => ({
          id: v.id,
          company: v.company,
          contact: v.name,
          email: v.email,
          payment_terms: v.paymentTerms,
          balance_owed: v.balanceOwed,
          rating: v.rating,
        }));
      } else if (lower.includes('from purchase_orders')) {
        tableName = 'purchase_orders';
        tableData = state.purchaseOrders.map((po) => ({
          id: po.id,
          po_number: po.poNumber,
          vendor: po.vendorName,
          date: po.date,
          expected_date: po.expectedDate,
          total: po.total,
          status: po.status,
          payment_status: po.paymentStatus,
        }));
      } else if (lower.includes('from transactions')) {
        tableName = 'transactions';
        tableData = state.transactions.map((t) => ({
          id: t.id,
          date: t.date,
          type: t.type,
          category: t.category,
          description: t.description,
          amount: t.amount,
          account: t.account,
          reference: t.referenceNumber,
        }));
      } else if (lower.includes('from employees')) {
        tableName = 'employees';
        tableData = state.employees.map((e) => ({
          id: e.id,
          emp_id: e.empId,
          name: e.name,
          role: e.role,
          department: e.department,
          annual_salary: e.salary,
          email: e.email,
          status: e.status,
        }));
      } else if (lower.includes('from work_orders')) {
        tableName = 'work_orders';
        tableData = state.workOrders.map((w) => ({
          id: w.id,
          order_number: w.orderNumber,
          sku: w.productSku,
          units: w.quantity,
          status: w.status,
          priority: w.priority,
          progress: `${w.progress}%`,
        }));
      } else if (lower.includes('from job_cards')) {
        tableName = 'job_cards';
        tableData = jobCards.map((jc) => ({
          id: jc.id,
          job_card_number: jc.jobCardNumber,
          customer_name: jc.customerName,
          contact_phone: jc.contactPhone,
          vehicle_details: jc.vehicleDetails,
          status: jc.status,
          notes: jc.notes,
          before_photo: jc.before_photo,
          after_photo: jc.after_photo,
          created_at: jc.createdAt,
        }));
      } else if (lower.includes('from estimates')) {
        tableName = 'estimates';
        tableData = estimates.map((est) => ({
          id: est.id,
          estimate_number: est.estimateNumber,
          job_card_id: est.jobCardId,
          customer_name: est.customerName,
          estimate_date: est.date,
          total_amount: Number(est.totalAmount).toFixed(3) + ' OMR',
          subtotal: Number(est.subtotal).toFixed(3) + ' OMR',
          vat_amount: Number(est.vatAmount).toFixed(3) + ' OMR',
          grand_total: Number(est.grandTotal).toFixed(3) + ' OMR',
          status: est.status,
          notes: est.notes,
        }));
      } else if (lower.includes('from notification_log')) {
        tableName = 'notification_log';
        tableData = notificationLogs.map((nl) => ({
          id: nl.id,
          job_card_id: nl.jobCardId,
          channel: nl.channel,
          recipient: nl.recipient,
          message: nl.message,
          status: nl.status,
          sent_at: nl.sentAt,
        }));
      } else {
        throw new Error(
          `Table not found in query. Supported tables: job_cards, estimates, notification_log, products, sales_orders, customers, vendors, purchase_orders, transactions, employees, work_orders.`
        );
      }

      // Filter condition (WHERE)
      let filtered = [...tableData];
      if (lower.includes('where stock_quantity <= reorder_level')) {
        filtered = filtered.filter((r) => r.stock_quantity <= r.reorder_level);
      } else if (lower.includes("payment_status = 'paid'")) {
        filtered = filtered.filter((r) => r.payment_status === 'paid');
      } else if (lower.includes("payment_status = 'unpaid'")) {
        filtered = filtered.filter((r) => r.payment_status === 'unpaid');
      } else if (lower.includes("type = 'expense'")) {
        filtered = filtered.filter((r) => r.type === 'expense');
      } else if (lower.includes("type = 'income'")) {
        filtered = filtered.filter((r) => r.type === 'income');
      } else if (lower.includes("channel = 'whatsapp'")) {
        filtered = filtered.filter((r) => String(r.channel).toLowerCase() === 'whatsapp');
      }

      // Projection (columns)
      const cleanWithoutSemicolon = cleanQ.replace(/;$/, '');
      const selectPart = cleanWithoutSemicolon.slice(6, cleanWithoutSemicolon.toLowerCase().indexOf('from')).trim();
      let cols: string[] = [];

      if (selectPart === '*') {
        cols = Object.keys(filtered[0] || tableData[0] || {});
      } else {
        cols = selectPart
          .split(',')
          .map((c) => c.trim().replace(/^[a-zA-Z0-9_]+\./, ''))
          .filter((c) => Boolean(c));
      }

      const rows = filtered.map((row) => {
        const projected: any = {};
        cols.forEach((col) => {
          projected[col] = row[col] !== undefined ? row[col] : null;
        });
        return projected;
      });

      const end = performance.now();
      setExecResult({
        columns: cols,
        rows,
        executionTimeMs: Math.round((end - start) * 10) / 10,
        isMigration: false,
      });
      setActiveTab('results');
    } catch (err: any) {
      const end = performance.now();
      setExecResult({
        columns: [],
        rows: [],
        executionTimeMs: Math.round((end - start) * 10) / 10,
        error: err.message || 'Error executing query',
      });
      setActiveTab('results');
    }
  };

  const setPreset = (sql: string) => {
    setQuery(sql);
  };

  const schemaTables = [
    {
      name: 'job_cards',
      description: 'Auto workshop job cards with before/after inspection photos',
      badge: 'Package 1',
      columns: [
        'id INT',
        'job_card_number VARCHAR(50)',
        'customer_name VARCHAR(150)',
        'contact_phone VARCHAR(30)',
        'vehicle_details VARCHAR(255)',
        'status ENUM',
        'notes TEXT',
        'before_photo VARCHAR(255) [Package 1]',
        'after_photo VARCHAR(255) [Package 1]',
        'created_at TIMESTAMP',
      ],
    },
    {
      name: 'estimates',
      description: 'Customer quotations with Oman 5% VAT rate breakdown',
      badge: 'Package 1',
      columns: [
        'id INT',
        'estimate_number VARCHAR(50)',
        'job_card_id INT (FK)',
        'customer_name VARCHAR(150)',
        'estimate_date DATE',
        'total_amount DECIMAL(10,3)',
        'subtotal DECIMAL(10,3) [Package 1]',
        'vat_amount DECIMAL(10,3) [5% Oman VAT]',
        'grand_total DECIMAL(10,3) [Package 1]',
        'status ENUM',
      ],
    },
    {
      name: 'notification_log',
      description: 'Omnichannel audit trail for customer WhatsApp, Email & SMS notices',
      badge: 'Package 1',
      columns: [
        'id INT',
        'job_card_id INT (FK)',
        'channel ENUM(WHATSAPP, EMAIL, SMS)',
        'recipient VARCHAR(150)',
        'message TEXT',
        'status ENUM(SENT, FAILED, PENDING)',
        'sent_at TIMESTAMP',
      ],
    },
    {
      name: 'products',
      description: 'Inventory SKU catalog, costs, on-hand counts & warehouse location',
      columns: ['id INT', 'sku VARCHAR(50)', 'name VARCHAR(200)', 'cost_price DECIMAL', 'unit_price DECIMAL', 'stock_quantity INT', 'reorder_level INT', 'warehouse_location VARCHAR'],
    },
    {
      name: 'sales_orders',
      description: 'Customer order-to-cash transactions & invoices',
      columns: ['id INT', 'order_number VARCHAR(50)', 'customer_id INT (FK)', 'order_date DATE', 'total_amount DECIMAL', 'status ENUM', 'payment_status ENUM'],
    },
    {
      name: 'customers',
      description: 'Client corporate accounts, contact details & receivable balances',
      columns: ['id INT', 'company_name VARCHAR(150)', 'contact_name VARCHAR(100)', 'email VARCHAR', 'outstanding_balance DECIMAL'],
    },
    {
      name: 'vendors',
      description: 'Approved suppliers, credit terms & payable balances',
      columns: ['id INT', 'company_name VARCHAR(150)', 'payment_terms VARCHAR(50)', 'balance_owed DECIMAL', 'rating DECIMAL'],
    },
    {
      name: 'purchase_orders',
      description: 'Procurement orders issued to suppliers for replenishment',
      columns: ['id INT', 'po_number VARCHAR(50)', 'vendor_id INT (FK)', 'order_date DATE', 'total_amount DECIMAL', 'status ENUM'],
    },
    {
      name: 'transactions',
      description: 'General ledger double-entry journal (disbursements & receipts)',
      columns: ['id INT', 'transaction_date DATE', 'type ENUM', 'category VARCHAR', 'amount DECIMAL', 'account VARCHAR'],
    },
    {
      name: 'employees',
      description: 'Workforce staff directory, departmental roles & base salary',
      columns: ['id INT', 'emp_code VARCHAR(20)', 'full_name VARCHAR(100)', 'department VARCHAR', 'annual_salary DECIMAL'],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Database className="w-4 h-4" />
            <span>Interactive MySQL / MariaDB Relational Terminal & Migration Runner</span>
          </div>
          <h2 className="text-xl font-black text-white">Live SQL Query & Migration Console</h2>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl">
            Execute SQL queries, run DDL migrations (including Package 1), alter database tables, and inspect returned rows with 5% Oman VAT precision.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1.5 bg-emerald-950/80 border border-emerald-700/60 rounded-lg text-emerald-300 font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Package 1 Ready</span>
          </span>
          <span className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 font-mono">
            MySQL 8.0 • OMR (10,3)
          </span>
        </div>
      </div>

      {/* Query Editor & Presets */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-xs text-slate-800">SQL Statement Buffer</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreset(PACKAGE_1_MIGRATION_SQL)}
                className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Package 1 Migration</span>
              </button>
            </div>
          </div>

          {/* Quick Presets row */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1 border-t border-slate-200/60">
            <span className="text-slate-400 text-[11px] mr-1 font-medium">Quick Queries:</span>
            <button
              onClick={() => setPreset('SELECT estimate_number, customer_name, total_amount, subtotal, vat_amount, grand_total, status FROM estimates;')}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-md font-medium text-[11px] cursor-pointer flex items-center gap-1"
            >
              <Calculator className="w-3 h-3 text-indigo-600" />
              <span>Estimates (5% Oman VAT)</span>
            </button>
            <button
              onClick={() => setPreset('SELECT id, job_card_number, customer_name, vehicle_details, status, before_photo, after_photo FROM job_cards;')}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-md font-medium text-[11px] cursor-pointer flex items-center gap-1"
            >
              <ImageIcon className="w-3 h-3 text-amber-600" />
              <span>Job Cards (Photos)</span>
            </button>
            <button
              onClick={() => setPreset('SELECT id, job_card_id, channel, recipient, message, status, sent_at FROM notification_log;')}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-md font-medium text-[11px] cursor-pointer flex items-center gap-1"
            >
              <MessageSquare className="w-3 h-3 text-emerald-600" />
              <span>WhatsApp Audit Trail</span>
            </button>
            <button
              onClick={() => setPreset('SELECT sku, name, stock_quantity, reorder_level, warehouse_location FROM products WHERE stock_quantity <= reorder_level;')}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-md font-medium text-[11px] cursor-pointer"
            >
              ⚠️ Low Stock
            </button>
            <button
              onClick={() => setPreset('SELECT order_number, customer_company, total, status, payment_status FROM sales_orders;')}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-md font-medium text-[11px] cursor-pointer"
            >
              🛒 Orders
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-950">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={7}
            className="w-full bg-transparent text-emerald-400 font-mono text-xs focus:outline-none resize-y leading-relaxed"
            placeholder="Type standard SQL or paste migration script..."
          />
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500 font-mono">
            Supported tables: job_cards, estimates, notification_log, products, sales_orders, customers, vendors, transactions
          </span>
          <button
            onClick={executeQuery}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Execute Statement / Migration</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="space-y-4">
        <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('results')}
            className={`pb-2.5 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'results'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>
              Execution Output {execResult?.isMigration ? '(Migration Applied)' : execResult ? `(${execResult.rows.length} rows)` : ''}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('package1')}
            className={`pb-2.5 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'package1'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Package 1 Visual Inspector (Photos • Oman VAT • WhatsApp)</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-2.5 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'schema'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Relational Schema ({schemaTables.length} Tables)</span>
          </button>
        </div>

        {/* Tab 1: Execution & Query Results */}
        {activeTab === 'results' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {execResult?.error ? (
              <div className="p-6 text-xs text-rose-600 bg-rose-50 font-mono border-l-4 border-rose-500 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">SQL Execution Error:</strong> {execResult.error}
                </div>
              </div>
            ) : execResult?.isMigration ? (
              <div>
                {/* Migration Success Hero */}
                <div className="p-5 bg-emerald-50 border-b border-emerald-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-emerald-900">Package 1 Migration Completed Successfully</h4>
                      <p className="text-xs text-emerald-700">
                        Executed schema alterations, backfilled estimates with 5% Oman VAT, and enabled WhatsApp audit logging.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold">
                    Completed in {execResult.executionTimeMs} ms
                  </span>
                </div>

                {/* Migration Steps List */}
                <div className="p-4 space-y-2 border-b border-slate-200 bg-slate-50/60">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Executed Steps:</div>
                  {execResult.migrationSteps?.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-bold font-mono text-slate-900">{step.title}</span>
                        <p className="text-slate-600 text-[11px] mt-0.5">{step.message}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Backfilled estimates preview */}
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Previewing Migrated Estimates (5% Oman VAT breakdown with 3 decimals):</span>
                  <button
                    onClick={() => setActiveTab('package1')}
                    className="text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                  >
                    Open Visual Inspector →
                  </button>
                </div>

                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                        {execResult.columns.map((col) => (
                          <th key={col} className="p-2.5 font-bold uppercase text-[10px] tracking-wider">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {execResult.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          {execResult.columns.map((col) => (
                            <td key={col} className="p-2.5 text-slate-800 whitespace-nowrap">
                              {row[col] !== null ? String(row[col]) : <span className="text-slate-400 italic">NULL</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : execResult ? (
              <div>
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>✓ {execResult.rows.length} rows fetched in {execResult.executionTimeMs} ms</span>
                  <span>Character Set: UTF-8</span>
                </div>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                        {execResult.columns.map((col) => (
                          <th key={col} className="p-2.5 font-bold uppercase text-[10px] tracking-wider">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {execResult.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          {execResult.columns.map((col) => (
                            <td key={col} className="p-2.5 text-slate-800 whitespace-nowrap">
                              {typeof row[col] === 'number'
                                ? row[col].toLocaleString()
                                : row[col] !== null
                                ? String(row[col])
                                : <span className="text-slate-400 italic">NULL</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
                <Terminal className="w-8 h-8 text-slate-300 mb-2" />
                <p>Click &quot;Execute Statement / Migration&quot; above to run queries or apply Package 1 Migration.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Package 1 Visual Inspector */}
        {activeTab === 'package1' && (
          <div className="space-y-6">
            {/* Section 1: Estimates with 5% Oman VAT */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Estimates — 5% Oman VAT Breakdown (OMR 10,3)
                  </h3>
                </div>
                <span className="text-[11px] bg-indigo-100 text-indigo-800 font-bold px-2.5 py-0.5 rounded-full">
                  Standard VAT Rate: 5.0%
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-mono text-[10px] uppercase">
                      <th className="p-3 font-bold">Estimate #</th>
                      <th className="p-3 font-bold">Customer</th>
                      <th className="p-3 font-bold">Date</th>
                      <th className="p-3 font-bold text-right">Subtotal (OMR)</th>
                      <th className="p-3 font-bold text-right">5% VAT (OMR)</th>
                      <th className="p-3 font-bold text-right">Grand Total (OMR)</th>
                      <th className="p-3 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {estimates.map((est) => {
                      const sub = Number(est.subtotal || est.totalAmount);
                      const vat = Number(est.vatAmount || est.totalAmount * 0.05);
                      const grand = Number(est.grandTotal || est.totalAmount * 1.05);
                      return (
                        <tr key={est.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-mono font-bold text-indigo-700">{est.estimateNumber}</td>
                          <td className="p-3 font-medium text-slate-900">{est.customerName}</td>
                          <td className="p-3 text-slate-500 font-mono text-[11px]">{est.date}</td>
                          <td className="p-3 font-mono text-right text-slate-700">{sub.toFixed(3)}</td>
                          <td className="p-3 font-mono text-right text-emerald-700 font-bold">+{vat.toFixed(3)}</td>
                          <td className="p-3 font-mono text-right font-black text-slate-900">{grand.toFixed(3)}</td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                est.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : est.status === 'invoiced'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {est.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: Job Cards with Before & After Photos */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Job Cards — Before & After Inspection Photos
                  </h3>
                </div>
                <span className="text-[11px] bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full">
                  Quick Access Paths
                </span>
              </div>

              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobCards.map((jc) => (
                  <div key={jc.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono font-bold text-xs text-indigo-700">{jc.jobCardNumber}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-700">
                          {jc.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">{jc.customerName}</h4>
                      <p className="text-xs text-slate-600 mb-2">{jc.vehicleDetails}</p>
                      {jc.notes && <p className="text-[11px] text-slate-500 italic mb-3">“{jc.notes}”</p>}
                    </div>

                    {/* Photo Comparison */}
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200">
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <span>Before Photo:</span>
                        </div>
                        {jc.before_photo ? (
                          <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-900 h-28 relative group">
                            <img
                              src={jc.before_photo}
                              alt="Before Service"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                              INITIAL
                            </span>
                          </div>
                        ) : (
                          <div className="h-28 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[10px]">
                            No photo
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <span>After Photo:</span>
                        </div>
                        {jc.after_photo ? (
                          <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-900 h-28 relative group">
                            <img
                              src={jc.after_photo}
                              alt="After Service"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                              COMPLETED
                            </span>
                          </div>
                        ) : (
                          <div className="h-28 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-[10px]">
                            Pending work
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: WhatsApp Notification Log */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Notification Log — WhatsApp Audit Trail
                  </h3>
                </div>
                <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                  Indexed on job_card_id
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {notificationLogs.map((nl) => (
                  <div key={nl.id} className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-3">
                      <span className="px-2 py-0.5 rounded font-bold font-mono text-[10px] bg-emerald-100 text-emerald-800 uppercase">
                        {nl.channel}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-slate-900">{nl.recipient}</span>
                          {nl.jobCardId && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              (Job Card #{nl.jobCardId})
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed max-w-2xl bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono">
                          {nl.message}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-emerald-600 font-bold block">{nl.status}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{nl.sentAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Schema Inspector View */}
        {activeTab === 'schema' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schemaTables.map((t) => (
              <div key={t.name} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-indigo-600" />
                    <span className="font-mono font-bold text-xs text-slate-900">{t.name}</span>
                    {t.badge && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full font-mono">
                        {t.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                    InnoDB
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">{t.description}</p>
                <div className="space-y-1">
                  {t.columns.map((col, idx) => (
                    <div key={idx} className="text-[11px] font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-100 flex items-center justify-between">
                      <span>{col}</span>
                      {idx === 0 && <span className="text-[9px] text-amber-600 font-bold">PRIMARY KEY</span>}
                      {col.includes('(FK)') && <span className="text-[9px] text-indigo-600 font-bold">FOREIGN KEY</span>}
                      {col.includes('[Package 1]') && <span className="text-[9px] text-emerald-600 font-bold">MIGRATED</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
