<?php
require_once __DIR__ . '/config.php';
$pdo = getDbConnection();

// Handle Expense / Income Entry POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'record_tx') {
    $date = $_POST['date'] ?: date('Y-m-d');
    $type = $_POST['type'];
    $category = trim($_POST['category']);
    $desc = trim($_POST['description']);
    $amount = (float)$_POST['amount'];
    $account = trim($_POST['account']);
    $ref = 'TX-' . rand(10000, 99999);

    if ($amount > 0 && $desc) {
        $stmt = $pdo->prepare("INSERT INTO transactions (transaction_date, type, category, description, amount, account, reference_number) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$date, $type, $category, $desc, $amount, $account, $ref]);
        setFlash('success', "Posted {$type} entry of " . money($amount) . " to General Ledger.");
    }
    header("Location: finance.php");
    exit;
}

// Handle CSV Export for External Accounting Software (QuickBooks, Xero, Excel, Sage)
if (isset($_GET['action']) && $_GET['action'] === 'export_csv') {
    $reportType = $_GET['report'] ?? 'transactions';

    if ($reportType === 'transactions') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=apex_erp_transactions_' . date('Y-m-d') . '.csv');
        $output = fopen('php://output', 'w');

        // CSV Header for external accounting imports
        fputcsv($output, [
            'Transaction ID',
            'Date',
            'Reference #',
            'Type',
            'Category',
            'Description',
            'Account',
            'Debit',
            'Credit',
            'Net Amount',
            'Currency',
            'Status'
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
        header('Content-Disposition: attachment; filename=apex_erp_financial_report_' . date('Y-m-d') . '.csv');
        $output = fopen('php://output', 'w');

        fputcsv($output, ['REPORT', 'Apex Enterprise Consolidated Financial & Cash Flow Statement']);
        fputcsv($output, ['GENERATED_AT', date('Y-m-d H:i:s')]);
        fputcsv($output, ['CURRENCY', 'USD']);
        fputcsv($output, []);

        $totalsStmt = $pdo->query("
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_inflows,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_outflows
            FROM transactions
        ");
        $totals = $totalsStmt->fetch();
        $net = $totals['total_inflows'] - $totals['total_outflows'];

        fputcsv($output, ['METRIC', 'AMOUNT']);
        fputcsv($output, ['Total Operating Inflows (Customer Receipts)', number_format((float)$totals['total_inflows'], 2, '.', '')]);
        fputcsv($output, ['Total Operating Outflows (Disbursements)', number_format((float)$totals['total_outflows'], 2, '.', '')]);
        fputcsv($output, ['Net Operating Cash Flow', number_format((float)$net, 2, '.', '')]);
        fputcsv($output, []);

        fputcsv($output, ['CATEGORY BREAKDOWN']);
        fputcsv($output, ['Category', 'Type', 'Transaction Count', 'Sum Amount']);
        $catStmt = $pdo->query("SELECT category, type, COUNT(*) as tx_count, SUM(amount) as cat_total FROM transactions GROUP BY category, type ORDER BY cat_total DESC");
        foreach ($catStmt->fetchAll() as $cat) {
            fputcsv($output, [
                $cat['category'],
                strtoupper($cat['type']),
                $cat['tx_count'],
                number_format((float)$cat['cat_total'], 2, '.', '')
            ]);
        }
        fclose($output);
        exit;
    }
}

$transactions = $pdo->query("SELECT * FROM transactions ORDER BY transaction_date DESC, id DESC")->fetchAll();

$financeStmt = $pdo->query("
    SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
    FROM transactions
");
$financeSummary = $financeStmt->fetch();
$netProfit = $financeSummary['total_income'] - $financeSummary['total_expense'];
$margin = $financeSummary['total_income'] > 0 ? ($netProfit / $financeSummary['total_income']) * 100 : 0;

$flash = getFlash();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apex ERP - Finance & General Ledger</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
<div class="app-container">
    <aside class="sidebar">
        <div class="sidebar-header">
            <div class="brand-badge">A</div>
            <div>
                <div class="brand-title">Apex ERP</div>
                <div class="brand-sub">Pure PHP & MySQL Stack</div>
            </div>
        </div>
        <ul class="nav-menu">
            <li><a href="index.php" class="nav-link"><span>📊 Dashboard</span></a></li>
            <li><a href="sales.php" class="nav-link"><span>🛒 Sales & Orders</span></a></li>
            <li><a href="inventory.php" class="nav-link"><span>📦 Inventory & SKUs</span></a></li>
            <li><a href="purchases.php" class="nav-link"><span>🚚 Purchasing (PO)</span></a></li>
            <li><a href="finance.php" class="nav-link active"><span>💳 Finance & Ledger</span></a></li>
            <li><a href="hr.php" class="nav-link"><span>👥 Human Resources</span></a></li>
            <li><a href="sql_runner.php" class="nav-link"><span>⚡ SQL Query Console</span></a></li>
        </ul>
    </aside>

    <div class="main-wrapper">
        <header class="topbar">
            <h1 class="page-title">General Ledger & Financial Reporting</h1>
            <div class="topbar-actions" style="display:flex; gap:8px; align-items:center;">
                <button onclick="window.print()" class="btn btn-secondary btn-sm" title="Print document or save as PDF via CSS print styling">
                    🖨️ Print / PDF Preview
                </button>
                <a href="finance.php?action=export_csv&report=transactions" class="btn btn-secondary btn-sm" title="Download Transaction Journal in CSV format for QuickBooks / Xero">
                    📥 Download Transactions CSV
                </a>
                <a href="finance.php?action=export_csv&report=financial_summary" class="btn btn-secondary btn-sm" title="Download Financial & Cash Flow Statement CSV">
                    📊 Download P&L CSV
                </a>
                <button onclick="document.getElementById('recordTxModal').style.display='flex'" class="btn btn-primary btn-sm">+ Post Journal Entry</button>
            </div>
        </header>

        <main class="content-body">
            <!-- Formal Corporate Letterhead displayed only when printed or saved to PDF -->
            <div class="print-only-header">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <h2 style="font-size:18pt; font-weight:900; margin:0; color:#0f172a;">APEX ENTERPRISE CORP</h2>
                        <div style="font-size:9pt; color:#475569; margin-top:2px;">Corporate Treasury & General Ledger Journal</div>
                        <div style="font-size:8pt; color:#64748b;">700 Industrial Parkway • Austin, TX 78701 • Tax ID: 84-2901928</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:10pt; font-weight:bold; color:#0f172a;">FINANCIAL AUDIT STATEMENT</div>
                        <div style="font-size:8pt; color:#64748b; font-family:monospace;">REF: GL-<?= date('Ymd') ?></div>
                        <div style="font-size:8pt; color:#475569;">Generated: <?= date('F j, Y - H:i') ?> UTC</div>
                    </div>
                </div>
            </div>

            <?php if ($flash): ?>
                <div class="flash-message flash-<?= e($flash['type']) ?>"><?= e($flash['message']) ?></div>
            <?php endif; ?>

            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-label">Operating Inflows</div>
                    <div class="kpi-value" style="color:#10b981;"><?= money((float)$financeSummary['total_income']) ?></div>
                    <div class="kpi-sub">Customer settlements & receivables</div>
                </div>

                <div class="kpi-card">
                    <div class="kpi-label">Operating Outflows</div>
                    <div class="kpi-value" style="color:#ef4444;"><?= money((float)$financeSummary['total_expense']) ?></div>
                    <div class="kpi-sub">Vendor settlements & payroll</div>
                </div>

                <div class="kpi-card">
                    <div class="kpi-label">Operating Margin</div>
                    <div class="kpi-value" style="color:#4338ca;"><?= number_format($margin, 1) ?>%</div>
                    <div class="kpi-sub">Net Margin Ratio</div>
                </div>

                <div class="kpi-card">
                    <div class="kpi-label">Net Operating Income</div>
                    <div class="kpi-value" style="color: <?= $netProfit >= 0 ? '#10b981' : '#ef4444' ?>;">
                        <?= money((float)$netProfit) ?>
                    </div>
                    <div class="kpi-sub">EBITDA proxy</div>
                </div>
            </div>

            <!-- General Ledger Table -->
            <div class="card">
                <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <h2 class="card-title">General Ledger Journal (transactions table)</h2>
                    <button onclick="window.print()" class="btn btn-secondary btn-sm" title="Print this transaction history table">
                        🖨️ Print / PDF
                    </button>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Voucher Ref</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Account</th>
                                <th style="text-align:right;">Debit / Credit</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($transactions as $tx): ?>
                            <tr>
                                <td><?= e($tx['transaction_date']) ?></td>
                                <td style="font-family:monospace;"><?= e($tx['reference_number']) ?></td>
                                <td><?= e($tx['category']) ?></td>
                                <td><strong><?= e($tx['description']) ?></strong></td>
                                <td><span style="font-size:11px; color:#64748b;"><?= e($tx['account']) ?></span></td>
                                <td style="text-align:right; font-weight:bold; color: <?= $tx['type'] === 'income' ? '#10b981' : '#ef4444' ?>;">
                                    <?= $tx['type'] === 'income' ? '+' : '-' ?><?= money((float)$tx['amount']) ?>
                                </td>
                                <td><span class="badge badge-success"><?= e($tx['status']) ?></span></td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>
</div>

<div id="recordTxModal" class="modal-overlay" style="display: none;">
    <div class="modal-content">
        <div class="modal-header">
            <h3 style="font-size:15px; font-weight:bold;">Post Transaction to General Ledger</h3>
            <button onclick="document.getElementById('recordTxModal').style.display='none'" style="border:none; background:transparent; font-size:18px; cursor:pointer;">&times;</button>
        </div>
        <form method="POST" action="finance.php" class="modal-body">
            <input type="hidden" name="action" value="record_tx">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <div class="form-group">
                    <label>Entry Classification *</label>
                    <select name="type" class="form-control">
                        <option value="expense">Operating Expense / Disbursement</option>
                        <option value="income">Customer Receipt / Inflow</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Category *</label>
                    <input type="text" name="category" value="Facility & Utilities" class="form-control" required>
                </div>
            </div>
            <div class="form-group">
                <label>Description *</label>
                <input type="text" name="description" placeholder="e.g. Monthly cloud computing infrastructure bill" class="form-control" required>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <div class="form-group">
                    <label>Amount ($) *</label>
                    <input type="number" step="0.01" name="amount" value="350.00" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Account</label>
                    <input type="text" name="account" value="Operating Account (JPMorgan Chase)" class="form-control" required>
                </div>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">
                <button type="button" onclick="document.getElementById('recordTxModal').style.display='none'" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">Post Entry</button>
            </div>
        </form>
    </div>
</div>
</body>
</html>
