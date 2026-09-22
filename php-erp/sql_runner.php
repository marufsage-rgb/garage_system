<?php
require_once __DIR__ . '/config.php';
$pdo = getDbConnection();

$query = trim($_POST['query'] ?? "SELECT id, sku, name, stock_quantity, reorder_level, warehouse_location FROM products WHERE stock_quantity <= reorder_level");
$result = null;
$error = null;
$executionTime = 0;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $query) {
    $start = microtime(true);
    try {
        $stmt = $pdo->query($query);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $executionTime = round((microtime(true) - $start) * 1000, 2);
    } catch (Exception $e) {
        $error = $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apex ERP - SQL Console & Query Runner</title>
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
            <li><a href="finance.php" class="nav-link"><span>💳 Finance & Ledger</span></a></li>
            <li><a href="hr.php" class="nav-link"><span>👥 Human Resources</span></a></li>
            <li><a href="sql_runner.php" class="nav-link active"><span>⚡ SQL Query Console</span></a></li>
        </ul>
    </aside>

    <div class="main-wrapper">
        <header class="topbar">
            <h1 class="page-title">Direct SQL Query Console (MySQL / MariaDB)</h1>
            <div class="topbar-actions">
                <a href="schema.sql" download class="btn btn-secondary btn-sm">💾 Download schema.sql</a>
            </div>
        </header>

        <main class="content-body">
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Execute SQL Statement</h2>
                    <div style="font-size:11px; color:#64748b;">Presets: 
                        <a href="javascript:void(0)" onclick="setQ('SELECT so.order_number, c.company_name, so.total_amount, so.status FROM sales_orders so JOIN customers c ON so.customer_id = c.id')" style="color:#4338ca; margin:0 4px;">Orders & Customers</a> |
                        <a href="javascript:void(0)" onclick="setQ('SELECT category, count(*) as items, sum(stock_quantity * cost_price) as valuation FROM products GROUP BY category')" style="color:#4338ca; margin:0 4px;">Valuation by Category</a> |
                        <a href="javascript:void(0)" onclick="setQ('SELECT type, sum(amount) as total FROM transactions GROUP BY type')" style="color:#4338ca; margin:0 4px;">Cashflow Summary</a>
                    </div>
                </div>
                <form method="POST" style="padding: 20px;">
                    <textarea id="sqlQuery" name="query" rows="4" class="form-control" style="font-family:monospace; font-size:13px; font-weight:600; background:#0f172a; color:#38bdf8; padding:12px; margin-bottom:12px;"><?= e($query) ?></textarea>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:12px; color:#64748b;">Supports SELECT, INSERT, UPDATE, JOINs across 11 relational tables.</span>
                        <button type="submit" class="btn btn-primary">⚡ Execute Query</button>
                    </div>
                </form>
            </div>

            <?php if ($error): ?>
                <div class="flash-message flash-danger" style="font-family:monospace;">
                    SQL Error: <?= e($error) ?>
                </div>
            <?php endif; ?>

            <?php if ($result !== null): ?>
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Query Results (<?= count($result) ?> rows returned in <?= $executionTime ?>ms)</h2>
                </div>
                <div class="table-responsive">
                    <?php if (empty($result)): ?>
                        <div style="padding:20px; color:#64748b; text-align:center;">Query executed successfully with 0 rows returned.</div>
                    <?php else: ?>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <?php foreach (array_keys($result[0]) as $col): ?>
                                    <th><?= e($col) ?></th>
                                    <?php endforeach; ?>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($result as $row): ?>
                                <tr>
                                    <?php foreach ($row as $val): ?>
                                    <td><?= e((string)$val) ?></td>
                                    <?php endforeach; ?>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    <?php endif; ?>
                </div>
            </div>
            <?php endif; ?>
        </main>
    </div>
</div>
<script>
function setQ(str) {
    document.getElementById('sqlQuery').value = str;
}
</script>
</body>
</html>
