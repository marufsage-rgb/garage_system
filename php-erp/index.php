<?php
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
    SELECT so.*, c.company_name, c.contact_name 
    FROM sales_orders so 
    JOIN customers c ON so.customer_id = c.id 
    ORDER BY so.id DESC LIMIT 5
");
$recentOrders = $recentOrdersStmt->fetchAll();

$financeStmt = $pdo->query("
    SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
    FROM transactions
");
$financeData = $financeStmt->fetch();
$netProfit = $financeData['total_income'] - $financeData['total_expense'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apex ERP - Executive Dashboard</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
<div class="app-container">
    <!-- Navigation Sidebar -->
    <aside class="sidebar">
        <div class="sidebar-header">
            <div class="brand-badge">A</div>
            <div>
                <div class="brand-title">Apex ERP</div>
                <div class="brand-sub">Pure PHP & MySQL Stack</div>
            </div>
        </div>
        <ul class="nav-menu">
            <li><a href="index.php" class="nav-link active"><span>📊 Dashboard</span></a></li>
            <li><a href="sales.php" class="nav-link"><span>🛒 Sales & Orders</span></a></li>
            <li><a href="inventory.php" class="nav-link"><span>📦 Inventory & SKUs</span><?php if (count($lowStockItems) > 0): ?><span class="nav-badge"><?= count($lowStockItems) ?></span><?php endif; ?></a></li>
            <li><a href="purchases.php" class="nav-link"><span>🚚 Purchasing (PO)</span></a></li>
            <li><a href="finance.php" class="nav-link"><span>💳 Finance & Ledger</span></a></li>
            <li><a href="hr.php" class="nav-link"><span>👥 Human Resources</span></a></li>
            <li><a href="sql_runner.php" class="nav-link"><span>⚡ SQL Query Console</span></a></li>
        </ul>
        <div style="padding: 16px; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b;">
            Stack: HTML5 • CSS3 • PHP 8 • MySQL<br>
            Zero external frontend libs
        </div>
    </aside>

    <!-- Main Content Workspace -->
    <div class="main-wrapper">
        <header class="topbar">
            <h1 class="page-title">Executive Operations Dashboard</h1>
            <div class="topbar-actions">
                <a href="sales.php?action=new" class="btn btn-primary btn-sm">+ New Sales Order</a>
                <a href="sql_runner.php" class="btn btn-secondary btn-sm">Terminal</a>
            </div>
        </header>

        <main class="content-body">
            <!-- Operational KPI Metrics (Real SQL Aggregates) -->
            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-label">Gross Revenue</div>
                    <div class="kpi-value" style="color: #4338ca;"><?= money((float)$salesData['total_sales']) ?></div>
                    <div class="kpi-sub"><?= (int)$salesData['order_count'] ?> Total Sales Orders</div>
                </div>

                <div class="kpi-card">
                    <div class="kpi-label">Inventory Asset Valuation</div>
                    <div class="kpi-value"><?= money((float)$inventoryData['inventory_valuation']) ?></div>
                    <div class="kpi-sub"><?= (int)$inventoryData['sku_count'] ?> Active Catalog SKUs</div>
                </div>

                <div class="kpi-card">
                    <div class="kpi-label">Net Operating Cash Flow</div>
                    <div class="kpi-value" style="color: <?= $netProfit >= 0 ? '#10b981' : '#ef4444' ?>;">
                        <?= money((float)$netProfit) ?>
                    </div>
                    <div class="kpi-sub">Receipts: <?= money((float)$financeData['total_income']) ?></div>
                </div>

                <div class="kpi-card">
                    <div class="kpi-label">Critical Replenishment</div>
                    <div class="kpi-value" style="color: <?= count($lowStockItems) > 0 ? '#f59e0b' : '#10b981' ?>;">
                        <?= count($lowStockItems) ?> SKUs
                    </div>
                    <div class="kpi-sub">Items below safety threshold</div>
                </div>
            </div>

            <!-- Recent Orders Data Table -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Recent Sales Orders (SQL Query: sales_orders JOIN customers)</h2>
                    <a href="sales.php" class="btn btn-secondary btn-sm">View All Orders</a>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Order #</th>
                                <th>Client / Customer</th>
                                <th>Date</th>
                                <th>Order Total</th>
                                <th>Fulfillment</th>
                                <th>Payment</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($recentOrders as $order): ?>
                            <tr>
                                <td><strong><?= e($order['order_number']) ?></strong></td>
                                <td><?= e($order['company_name']) ?></td>
                                <td><?= e($order['order_date']) ?></td>
                                <td><strong><?= money((float)$order['total_amount']) ?></strong></td>
                                <td>
                                    <span class="badge <?= $order['status'] === 'delivered' ? 'badge-success' : ($order['status'] === 'processing' ? 'badge-info' : 'badge-warning') ?>">
                                        <?= e($order['status']) ?>
                                    </span>
                                </td>
                                <td>
                                    <span class="badge <?= $order['payment_status'] === 'paid' ? 'badge-success' : 'badge-danger' ?>">
                                        <?= e($order['payment_status']) ?>
                                    </span>
                                </td>
                                <td>
                                    <a href="sales.php?view_id=<?= (int)$order['id'] ?>" class="btn btn-secondary btn-sm">Invoice</a>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Low Stock Warehouse Alerts -->
            <?php if (!empty($lowStockItems)): ?>
            <div class="card">
                <div class="card-header" style="background: #fffbeb;">
                    <h2 class="card-title" style="color: #92400e;">⚠️ Inventory Replenishment Needed</h2>
                    <a href="purchases.php?action=new" class="btn btn-primary btn-sm">Create PO</a>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>Item Description</th>
                                <th>Category</th>
                                <th>Current Stock</th>
                                <th>Reorder Point</th>
                                <th>Location</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($lowStockItems as $item): ?>
                            <tr>
                                <td style="font-family:monospace;"><?= e($item['sku']) ?></td>
                                <td><strong><?= e($item['name']) ?></strong></td>
                                <td><?= e($item['category']) ?></td>
                                <td style="color: #dc2626; font-weight: bold;"><?= (int)$item['stock_quantity'] ?> <?= e($item['unit']) ?></td>
                                <td><?= (int)$item['reorder_level'] ?></td>
                                <td><?= e($item['warehouse_location']) ?></td>
                                <td>
                                    <a href="purchases.php?sku=<?= urlencode($item['sku']) ?>" class="btn btn-secondary btn-sm">Order from Supplier</a>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
            <?php endif; ?>
        </main>
    </div>
</div>
</body>
</html>
