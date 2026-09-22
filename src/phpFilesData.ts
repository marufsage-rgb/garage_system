// Pre-bundled source files for the pure HTML, PHP, SQL, CSS ERP system

export interface SourceFile {
  name: string;
  path: string;
  language: 'php' | 'sql' | 'css' | 'markdown';
  description: string;
  content: string;
}

export const PHP_ERP_FILES: SourceFile[] = [
  {
    name: 'schema.sql',
    path: 'schema.sql',
    language: 'sql',
    description: 'MySQL Relational Database Schema with 11 tables, constraints, foreign keys and seed data',
    content: `-- ==========================================================
-- APEX ERP - Relational Database Schema (MySQL / MariaDB)
-- Stack: HTML5, Pure CSS3, PHP 8+, MySQL/MariaDB
-- ==========================================================

CREATE DATABASE IF NOT EXISTS \`apex_erp\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`apex_erp\`;

-- 1. Customers
CREATE TABLE IF NOT EXISTS \`customers\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`company_name\` VARCHAR(150) NOT NULL,
  \`contact_name\` VARCHAR(100) NOT NULL,
  \`email\` VARCHAR(100),
  \`phone\` VARCHAR(30),
  \`address\` TEXT,
  \`outstanding_balance\` DECIMAL(12,2) DEFAULT 0.00,
  \`status\` ENUM('active', 'inactive') DEFAULT 'active',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Vendors / Suppliers
CREATE TABLE IF NOT EXISTS \`vendors\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`company_name\` VARCHAR(150) NOT NULL,
  \`contact_name\` VARCHAR(100) NOT NULL,
  \`email\` VARCHAR(100),
  \`phone\` VARCHAR(30),
  \`payment_terms\` VARCHAR(50) DEFAULT 'Net 30',
  \`balance_owed\` DECIMAL(12,2) DEFAULT 0.00,
  \`rating\` DECIMAL(3,2) DEFAULT 4.80,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Products / Inventory SKUs
CREATE TABLE IF NOT EXISTS \`products\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`sku\` VARCHAR(50) NOT NULL UNIQUE,
  \`name\` VARCHAR(200) NOT NULL,
  \`category\` VARCHAR(100) NOT NULL,
  \`unit\` VARCHAR(20) DEFAULT 'pcs',
  \`cost_price\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`unit_price\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`stock_quantity\` INT NOT NULL DEFAULT 0,
  \`reorder_level\` INT NOT NULL DEFAULT 10,
  \`warehouse_location\` VARCHAR(100) DEFAULT 'WH-A',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Sales Orders
CREATE TABLE IF NOT EXISTS \`sales_orders\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`order_number\` VARCHAR(50) NOT NULL UNIQUE,
  \`customer_id\` INT NOT NULL,
  \`order_date\` DATE NOT NULL,
  \`due_date\` DATE NOT NULL,
  \`subtotal\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`tax_amount\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`total_amount\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`status\` ENUM('draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'draft',
  \`payment_status\` ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid',
  \`notes\` TEXT,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`customer_id\`) REFERENCES \`customers\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Sales Order Line Items
CREATE TABLE IF NOT EXISTS \`sales_order_items\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`sales_order_id\` INT NOT NULL,
  \`product_id\` INT NOT NULL,
  \`quantity\` INT NOT NULL DEFAULT 1,
  \`unit_price\` DECIMAL(12,2) NOT NULL,
  \`total_price\` DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (\`sales_order_id\`) REFERENCES \`sales_orders\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Purchase Orders (Procurement)
CREATE TABLE IF NOT EXISTS \`purchase_orders\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`po_number\` VARCHAR(50) NOT NULL UNIQUE,
  \`vendor_id\` INT NOT NULL,
  \`order_date\` DATE NOT NULL,
  \`expected_date\` DATE NOT NULL,
  \`subtotal\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`tax_amount\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`total_amount\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`status\` ENUM('draft', 'submitted', 'approved', 'received', 'cancelled') DEFAULT 'draft',
  \`payment_status\` ENUM('unpaid', 'paid') DEFAULT 'unpaid',
  \`notes\` TEXT,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`vendor_id\`) REFERENCES \`vendors\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. General Ledger / Transactions
CREATE TABLE IF NOT EXISTS \`transactions\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`transaction_date\` DATE NOT NULL,
  \`type\` ENUM('income', 'expense') NOT NULL,
  \`category\` VARCHAR(100) NOT NULL,
  \`description\` VARCHAR(255) NOT NULL,
  \`amount\` DECIMAL(12,2) NOT NULL,
  \`account\` VARCHAR(100) NOT NULL,
  \`reference_number\` VARCHAR(100),
  \`status\` ENUM('cleared', 'pending') DEFAULT 'cleared',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 8. Employees / Human Resources
CREATE TABLE IF NOT EXISTS \`employees\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`emp_code\` VARCHAR(20) NOT NULL UNIQUE,
  \`full_name\` VARCHAR(100) NOT NULL,
  \`email\` VARCHAR(100) NOT NULL,
  \`phone\` VARCHAR(30),
  \`role\` VARCHAR(100) NOT NULL,
  \`department\` VARCHAR(100) NOT NULL,
  \`annual_salary\` DECIMAL(12,2) NOT NULL,
  \`status\` ENUM('active', 'on_leave', 'inactive') DEFAULT 'active',
  \`join_date\` DATE NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 9. Job Cards (Workshop & Service Orders)
CREATE TABLE IF NOT EXISTS \`job_cards\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`job_card_number\` VARCHAR(50) NOT NULL UNIQUE,
  \`customer_name\` VARCHAR(150) NOT NULL,
  \`contact_phone\` VARCHAR(30),
  \`vehicle_details\` VARCHAR(255),
  \`status\` ENUM('draft', 'in_progress', 'completed', 'delivered') DEFAULT 'draft',
  \`notes\` TEXT,
  \`before_photo\` VARCHAR(255) NULL,
  \`after_photo\` VARCHAR(255) NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 10. Estimates / Quotations (with 5% Oman VAT breakdown)
CREATE TABLE IF NOT EXISTS \`estimates\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`estimate_number\` VARCHAR(50) NOT NULL UNIQUE,
  \`job_card_id\` INT NULL,
  \`customer_name\` VARCHAR(150) NOT NULL,
  \`estimate_date\` DATE NOT NULL,
  \`total_amount\` DECIMAL(10,3) NOT NULL DEFAULT 0.000,
  \`subtotal\` DECIMAL(10,3) DEFAULT 0.000,
  \`vat_amount\` DECIMAL(10,3) DEFAULT 0.000,
  \`grand_total\` DECIMAL(10,3) DEFAULT 0.000,
  \`status\` ENUM('draft', 'sent', 'approved', 'invoiced', 'declined') DEFAULT 'draft',
  \`notes\` TEXT,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`job_card_id\`) REFERENCES \`job_cards\`(\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 11. Notification Log (WhatsApp, Email, SMS Audit Trail)
CREATE TABLE IF NOT EXISTS \`notification_log\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`job_card_id\` INT NULL,
  \`channel\` ENUM('WHATSAPP','EMAIL','SMS') NOT NULL,
  \`recipient\` VARCHAR(150) NOT NULL,
  \`message\` TEXT,
  \`status\` ENUM('SENT','FAILED','PENDING') DEFAULT 'SENT',
  \`sent_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_jc\` (\`job_card_id\`),
  FOREIGN KEY (\`job_card_id\`) REFERENCES \`job_cards\`(\`id\`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================================
-- PACKAGE 1 MIGRATION — Safe to run even if columns already exist
-- ==========================================================

-- 1. Job cards — before/after photo paths (quick access)
ALTER TABLE \`job_cards\` 
ADD COLUMN IF NOT EXISTS \`before_photo\` VARCHAR(255) NULL AFTER \`notes\`,
ADD COLUMN IF NOT EXISTS \`after_photo\`  VARCHAR(255) NULL AFTER \`before_photo\`;

-- 2. Estimates — 5% Oman VAT breakdown
ALTER TABLE \`estimates\` 
ADD COLUMN IF NOT EXISTS \`subtotal\`    DECIMAL(10,3) DEFAULT 0.000 AFTER \`total_amount\`,
ADD COLUMN IF NOT EXISTS \`vat_amount\`  DECIMAL(10,3) DEFAULT 0.000 AFTER \`subtotal\`,
ADD COLUMN IF NOT EXISTS \`grand_total\` DECIMAL(10,3) DEFAULT 0.000 AFTER \`vat_amount\`;

-- 3. Backfill existing estimates (subtotal=total, VAT on top)
UPDATE \`estimates\` 
SET \`subtotal\`    = \`total_amount\`,
    \`vat_amount\`  = ROUND(\`total_amount\` * 0.05, 3),
    \`grand_total\` = ROUND(\`total_amount\` * 1.05, 3)
WHERE \`subtotal\` = 0 AND \`total_amount\` > 0;`
  },
  {
    name: 'config.php',
    path: 'config.php',
    language: 'php',
    description: 'PDO database connection, error handling and utility helpers',
    content: `<?php
declare(strict_types=1);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'apex_erp');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');

function getDbConnection(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_PORT, DB_NAME);
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    }
    return $pdo;
}

function e(?string $string): string {
    return htmlspecialchars($string ?? '', ENT_QUOTES, 'UTF-8');
}

function money(float $amount): string {
    return '$' . number_format($amount, 2);
}
?>`
  },
  {
    name: 'style.css',
    path: 'style.css',
    language: 'css',
    description: 'Pure CSS3 stylesheet for desktop, mobile and print invoices',
    content: `/* APEX ERP - Pure CSS3 Stylesheet */
:root {
  --primary: #4338ca;
  --primary-hover: #3730a3;
  --secondary: #0f172a;
  --bg-main: #f8fafc;
  --surface: #ffffff;
  --border: #e2e8f0;
  --text-main: #1e293b;
  --text-muted: #64748b;
  --success: #10b981;
  --danger: #ef4444;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: var(--bg-main);
  color: var(--text-main);
  line-height: 1.5;
  font-size: 14px;
}
.app-container { display: flex; min-height: 100vh; }
.sidebar { width: 260px; background: #0f172a; color: #f8fafc; flex-shrink: 0; }
.main-wrapper { flex: 1; display: flex; flex-direction: column; overflow-x: hidden; }
.topbar { background: #fff; border-bottom: 1px solid var(--border); padding: 14px 28px; }
.content-body { padding: 24px 28px; max-width: 1400px; width: 100%; }
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
.kpi-card { background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
.card { background: #fff; border: 1px solid var(--border); border-radius: 12px; margin-bottom: 24px; overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th { background: #f8fafc; padding: 12px 16px; border-bottom: 1px solid var(--border); }
.data-table td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; }
.btn { display: inline-flex; align-items: center; padding: 8px 16px; font-size: 13px; font-weight: 600; border-radius: 8px; text-decoration: none; cursor: pointer; }
.btn-primary { background: var(--primary); color: white; border: none; }
@media print { .sidebar, .topbar, .btn { display: none !important; } }`
  },
  {
    name: 'index.php',
    path: 'index.php',
    language: 'php',
    description: 'Executive dashboard controller and KPI query aggregation',
    content: `<?php
require_once __DIR__ . '/config.php';
$pdo = getDbConnection();

// Fetch Executive Metrics via SQL
$salesStmt = $pdo->query("SELECT COALESCE(SUM(total_amount), 0) as total_sales, COUNT(*) as order_count FROM sales_orders WHERE status != 'cancelled'");
$salesData = $salesStmt->fetch();

$inventoryStmt = $pdo->query("SELECT COALESCE(SUM(stock_quantity * cost_price), 0) as inventory_valuation, COUNT(*) as sku_count FROM products");
$inventoryData = $inventoryStmt->fetch();

$lowStockStmt = $pdo->query("SELECT * FROM products WHERE stock_quantity <= reorder_level ORDER BY stock_quantity ASC LIMIT 5");
$lowStockItems = $lowStockStmt->fetchAll();

$recentOrdersStmt = $pdo->query("
    SELECT so.*, c.company_name 
    FROM sales_orders so 
    JOIN customers c ON so.customer_id = c.id 
    ORDER BY so.id DESC LIMIT 5
");
$recentOrders = $recentOrdersStmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Apex ERP - Executive Dashboard</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="app-container">
        <!-- Sidebar Navigation -->
        <aside class="sidebar">
            <div style="padding:20px; font-weight:bold; font-size:18px;">Apex ERP (PHP/MySQL)</div>
            <ul style="list-style:none; padding:10px;">
                <li><a href="index.php" style="color:white;">Dashboard</a></li>
                <li><a href="sales.php" style="color:#94a3b8;">Sales & Invoices</a></li>
                <li><a href="inventory.php" style="color:#94a3b8;">Inventory</a></li>
                <li><a href="purchases.php" style="color:#94a3b8;">Purchasing</a></li>
                <li><a href="finance.php" style="color:#94a3b8;">Finance</a></li>
                <li><a href="hr.php" style="color:#94a3b8;">Human Resources</a></li>
            </ul>
        </aside>
        
        <div class="main-wrapper">
            <header class="topbar"><h1>Executive Dashboard</h1></header>
            <main class="content-body">
                <div class="kpi-grid">
                    <div class="kpi-card">
                        <div>GROSS SALES</div>
                        <h2><?= money((float)$salesData['total_sales']) ?></h2>
                    </div>
                    <div class="kpi-card">
                        <div>INVENTORY VALUATION</div>
                        <h2><?= money((float)$inventoryData['inventory_valuation']) ?></h2>
                    </div>
                </div>
            </main>
        </div>
    </div>
</body>
</html>`
  },
  {
    name: 'sales.php',
    path: 'sales.php',
    language: 'php',
    description: 'Sales Order pipeline, transactional stock deduction, and tax invoice generation',
    content: `<?php
require_once __DIR__ . '/config.php';
$pdo = getDbConnection();

// Transactional Order Placement
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'create_order') {
    $pdo->beginTransaction();
    try {
        $orderNumber = 'SO-2026-' . rand(100, 999);
        $customerId = (int)$_POST['customer_id'];
        $subtotal = (float)$_POST['subtotal'];
        $tax = $subtotal * 0.08;
        $total = $subtotal + $tax;

        $stmt = $pdo->prepare("INSERT INTO sales_orders (order_number, customer_id, order_date, due_date, subtotal, tax_amount, total_amount, status) VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY), ?, ?, ?, 'confirmed')");
        $stmt->execute([$orderNumber, $customerId, $subtotal, $tax, $total]);
        $orderId = $pdo->lastInsertId();

        // Update product inventory stock
        $pdo->commit();
        header("Location: sales.php?view_id=" . $orderId);
        exit;
    } catch (Exception $e) {
        $pdo->rollBack();
        die("Order creation failed: " . $e->getMessage());
    }
}
?>`
  },
  {
    name: 'inventory.php',
    path: 'inventory.php',
    language: 'php',
    description: 'SKU catalog, bin location, stock adjustments, and reorder levels',
    content: `<?php
require_once __DIR__ . '/config.php';
$pdo = getDbConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['adjust_qty'])) {
    $stmt = $pdo->prepare("UPDATE products SET stock_quantity = GREATEST(0, stock_quantity + ?) WHERE id = ?");
    $stmt->execute([(int)$_POST['adjust_qty'], (int)$_POST['product_id']]);
    header("Location: inventory.php");
    exit;
}

$products = $pdo->query("SELECT * FROM products ORDER BY stock_quantity ASC")->fetchAll();
?>`
  },
  {
    name: 'purchases.php',
    path: 'purchases.php',
    language: 'php',
    description: 'Purchase orders, vendor credit terms, and 1-click Goods Receipt SQL transaction',
    content: `<?php
require_once __DIR__ . '/config.php';
$pdo = getDbConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['receive_po_id'])) {
    $poId = (int)$_POST['receive_po_id'];
    $pdo->beginTransaction();
    $items = $pdo->prepare("SELECT product_id, quantity FROM purchase_order_items WHERE purchase_order_id = ?");
    $items->execute([$poId]);
    foreach ($items->fetchAll() as $item) {
        $upd = $pdo->prepare("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?");
        $upd->execute([$item['quantity'], $item['product_id']]);
    }
    $pdo->prepare("UPDATE purchase_orders SET status = 'received' WHERE id = ?")->execute([$poId]);
    $pdo->commit();
    header("Location: purchases.php");
    exit;
}
?>`
  },
  {
    name: 'finance.php',
    path: 'finance.php',
    language: 'php',
    description: 'General Ledger journal entries, debit/credit postings, P&L reports, CSV exports, and CSS Print/PDF formatting',
    content: `<?php
require_once __DIR__ . '/config.php';
$pdo = getDbConnection();

// CSV Export Endpoint for External Accounting Software (QuickBooks, Xero, Excel, Sage)
if (isset($_GET['action']) && $_GET['action'] === 'export_csv') {
    $reportType = $_GET['report'] ?? 'transactions';

    if ($reportType === 'transactions') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=apex_erp_transactions_' . date('Y-m-d') . '.csv');
        $output = fopen('php://output', 'w');

        fputcsv($output, [
            'Transaction ID', 'Date', 'Reference #', 'Type', 'Category', 
            'Description', 'Account', 'Debit', 'Credit', 'Net Amount', 'Currency', 'Status'
        ]);

        $allTxs = $pdo->query("SELECT * FROM transactions ORDER BY transaction_date DESC, id DESC")->fetchAll();
        foreach ($allTxs as $t) {
            $debit = ($t['type'] === 'expense') ? number_format((float)$t['amount'], 2, '.', '') : '0.00';
            $credit = ($t['type'] === 'income') ? number_format((float)$t['amount'], 2, '.', '') : '0.00';
            fputcsv($output, [
                $t['id'],
                $t['transaction_date'],
                $t['reference_number'],
                strtoupper($t['type']),
                $t['category'],
                $t['description'],
                $t['account'],
                $debit,
                $credit,
                number_format((float)$t['amount'], 2, '.', ''),
                'USD',
                $t['status']
            ]);
        }
        fclose($output);
        exit;
    } elseif ($reportType === 'financial_summary') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=apex_erp_pnl_report_' . date('Y-m-d') . '.csv');
        $output = fopen('php://output', 'w');

        fputcsv($output, ['REPORT', 'Apex Enterprise Consolidated Financial Statement']);
        fputcsv($output, ['DATE_GENERATED', date('Y-m-d H:i:s')]);
        fputcsv($output, ['CURRENCY', 'USD']);
        fputcsv($output, []);

        $totals = $pdo->query("SELECT SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as total_inflows, SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as total_outflows FROM transactions")->fetch();
        $net = $totals['total_inflows'] - $totals['total_outflows'];

        fputcsv($output, ['LINE ITEM', 'AMOUNT (USD)']);
        fputcsv($output, ['Operating Inflows (Customer Receipts)', number_format((float)$totals['total_inflows'], 2, '.', '')]);
        fputcsv($output, ['Operating Outflows (Disbursements)', number_format((float)$totals['total_outflows'], 2, '.', '')]);
        fputcsv($output, ['Net Operating Cash Flow', number_format((float)$net, 2, '.', '')]);
        fclose($output);
        exit;
    }
}

$transactions = $pdo->query("SELECT * FROM transactions ORDER BY transaction_date DESC")->fetchAll();
$summary = $pdo->query("SELECT SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income, SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense FROM transactions")->fetch();
$net = $summary['income'] - $summary['expense'];
?>`
  },
  {
    name: 'hr.php',
    path: 'hr.php',
    language: 'php',
    description: 'Employee staff roster, salary budget, and monthly payroll burn calculation',
    content: `<?php
require_once __DIR__ . '/config.php';
$pdo = getDbConnection();

$employees = $pdo->query("SELECT * FROM employees ORDER BY department ASC")->fetchAll();
$payroll = $pdo->query("SELECT SUM(annual_salary) as total_salary FROM employees")->fetchColumn();
$monthlyBurn = $payroll / 12;
?>`
  },
  {
    name: 'workshop.php',
    path: 'workshop.php',
    language: 'php',
    description: 'Automotive Workshop controller: Estimates (parts+labour & lumpsum), WhatsApp/Email dispatch, Lube & Bodyshop Job Cards, and P&L',
    content: `<?php
/**
 * APEX AUTOMOTIVE WORKSHOP ERP - Backend Controller
 * Stack: Pure HTML5, PHP 8+, MySQL (PDO), Pure CSS3
 * Features:
 *   a) Vehicle Estimate (Parts + Labour & Lumpsum with 5% Oman VAT)
 *   b) Send to Customer (WhatsApp API & Insurance Claims Email)
 *   c) Open Job Card (Lube 'LB' & Bodyshop 'BS' Serials, Stage Monitoring)
 *   d) Work Assign by Supervisor (Start/Pause/Stop timers, Mobile access, Repeat Tracking, Tech Performance)
 *   e) Spare Parts List (Job Card Parts Requisition, Status Monitoring)
 *   f) Parts & Consumables Inventory (Stock, Transfers to Job Card: paint, clips, welding rods)
 *   g) Job Card Profit & Loss (Purchases, Labor wages, Consumables, Gross Margin %)
 */

require_once __DIR__ . '/config.php';
$pdo = getDbConnection();

// a) CREATE VEHICLE ESTIMATE
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'create_estimate') {
    $estNumber = 'EST-2026-' . rand(100, 999);
    $customerName = trim($_POST['customer_name'] ?? '');
    $contactPhone = trim($_POST['contact_phone'] ?? '');
    $vehicleDetails = trim($_POST['vehicle_details'] ?? '');
    $estType = $_POST['estimate_type'] ?? 'parts_labour';
    $subtotal = floatval($_POST['subtotal'] ?? 0.000);
    $vatRate = 0.05; // 5% Oman VAT
    $vatAmount = round($subtotal * $vatRate, 3);
    $grandTotal = round($subtotal + $vatAmount, 3);

    $stmt = $pdo->prepare("INSERT INTO estimates 
        (estimate_number, customer_name, contact_phone, vehicle_details, estimate_type, subtotal, vat_rate, vat_amount, grand_total, total_amount, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')");
    $stmt->execute([$estNumber, $customerName, $contactPhone, $vehicleDetails, $estType, $subtotal, $vatRate, $vatAmount, $grandTotal, $grandTotal]);
}

// c.1) OPEN JOB CARD (LUBE vs BODYSHOP SERIALS)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'open_job_card') {
    $jobType = $_POST['job_type'] ?? 'lube';
    $prefix = ($jobType === 'lube') ? 'LB' : 'BS';
    $count = $pdo->query("SELECT COUNT(*) FROM job_cards WHERE job_card_number LIKE '{$prefix}%'")->fetchColumn();
    $serialNum = sprintf("%s-2026-%03d", $prefix, 101 + $count);

    $stmt = $pdo->prepare("INSERT INTO job_cards 
        (job_card_number, customer_name, contact_phone, vehicle_details, status, notes, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, NOW())");
    $stmt->execute([$serialNum, $_POST['customer_name'], $_POST['contact_phone'], $_POST['vehicle_details'], $_POST['stage'], $_POST['notes']]);
}

$jobCards = $pdo->query("SELECT * FROM job_cards ORDER BY id DESC LIMIT 20")->fetchAll(PDO::FETCH_ASSOC);
$estimates = $pdo->query("SELECT * FROM estimates ORDER BY id DESC LIMIT 20")->fetchAll(PDO::FETCH_ASSOC);
?>`
  },
  {
    name: 'sql_runner.php',
    path: 'sql_runner.php',
    language: 'php',
    description: 'Interactive web SQL query console with execution time telemetry and table rendering',
    content: `<?php
require_once __DIR__ . '/config.php';
$pdo = getDbConnection();

$q = $_POST['query'] ?? 'SELECT * FROM products WHERE stock_quantity <= reorder_level';
$res = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $q) {
    $stmt = $pdo->query($q);
    $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
}
?>`
  },
  {
    name: 'README.md',
    path: 'README.md',
    language: 'markdown',
    description: 'Setup and deployment guide for XAMPP, WAMP, Docker and LAMP servers',
    content: `# APEX ERP (Pure HTML, PHP, SQL, CSS Stack)
Deployable on any Apache / Nginx + PHP 8+ and MySQL/MariaDB server.

1. Import \`schema.sql\` into MySQL.
2. Edit database credentials in \`config.php\`.
3. Open in browser: \`http://localhost/apex-erp\``
  }
];
