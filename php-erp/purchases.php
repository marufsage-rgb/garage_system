<?php
require_once __DIR__ . '/config.php';
$pdo = getDbConnection();

// Receive Goods Action (Auto-updates inventory via SQL)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'receive_goods') {
    $poId = (int)$_POST['po_id'];
    $pdo->beginTransaction();
    try {
        // Fetch PO items
        $itemsStmt = $pdo->prepare("SELECT product_id, quantity FROM purchase_order_items WHERE purchase_order_id = ?");
        $itemsStmt->execute([$poId]);
        $items = $itemsStmt->fetchAll();

        foreach ($items as $item) {
            $upd = $pdo->prepare("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?");
            $upd->execute([$item['quantity'], $item['product_id']]);
        }

        $statStmt = $pdo->prepare("UPDATE purchase_orders SET status = 'received' WHERE id = ?");
        $statStmt->execute([$poId]);

        $pdo->commit();
        setFlash('success', "Goods received for PO #{$poId}. Warehouse inventory automatically increased!");
    } catch (Exception $e) {
        $pdo->rollBack();
        setFlash('danger', "Error processing receipt: " . $e->getMessage());
    }
    header("Location: purchases.php");
    exit;
}

// Fetch all POs
$pos = $pdo->query("
    SELECT po.*, v.company_name, v.contact_name, v.payment_terms 
    FROM purchase_orders po 
    JOIN vendors v ON po.vendor_id = v.id 
    ORDER BY po.id DESC
")->fetchAll();

$vendors = $pdo->query("SELECT * FROM vendors ORDER BY company_name ASC")->fetchAll();
$flash = getFlash();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apex ERP - Purchasing & Procurement</title>
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
            <li><a href="purchases.php" class="nav-link active"><span>🚚 Purchasing (PO)</span></a></li>
            <li><a href="finance.php" class="nav-link"><span>💳 Finance & Ledger</span></a></li>
            <li><a href="hr.php" class="nav-link"><span>👥 Human Resources</span></a></li>
            <li><a href="sql_runner.php" class="nav-link"><span>⚡ SQL Query Console</span></a></li>
        </ul>
    </aside>

    <div class="main-wrapper">
        <header class="topbar">
            <h1 class="page-title">Purchasing & Vendor Procurement</h1>
            <div class="topbar-actions">
                <a href="#vendors-card" class="btn btn-secondary btn-sm">Vendors Directory</a>
            </div>
        </header>

        <main class="content-body">
            <?php if ($flash): ?>
                <div class="flash-message flash-<?= e($flash['type']) ?>"><?= e($flash['message']) ?></div>
            <?php endif; ?>

            <!-- Purchase Orders Table -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Active Purchase Orders (Procurement)</h2>
                    <span style="font-size:12px; color:#64748b;"><?= count($pos) ?> Purchase Orders</span>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>PO Number</th>
                                <th>Vendor / Supplier</th>
                                <th>Order Date</th>
                                <th>Expected ETA</th>
                                <th>PO Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($pos as $po): ?>
                            <tr>
                                <td style="font-family:monospace; font-weight:bold;"><?= e($po['po_number']) ?></td>
                                <td>
                                    <strong><?= e($po['company_name']) ?></strong>
                                    <div style="font-size:11px; color:#64748b;"><?= e($po['payment_terms']) ?></div>
                                </td>
                                <td><?= e($po['order_date']) ?></td>
                                <td><?= e($po['expected_date']) ?></td>
                                <td><strong><?= money((float)$po['total_amount']) ?></strong></td>
                                <td>
                                    <span class="badge <?= $po['status'] === 'received' ? 'badge-success' : 'badge-warning' ?>">
                                        <?= e($po['status']) ?>
                                    </span>
                                </td>
                                <td>
                                    <?php if ($po['status'] !== 'received'): ?>
                                    <form method="POST" style="display:inline;">
                                        <input type="hidden" name="action" value="receive_goods">
                                        <input type="hidden" name="po_id" value="<?= (int)$po['id'] ?>">
                                        <button type="submit" class="btn btn-primary btn-sm" onclick="return confirm('Confirm receipt of shipment? Inventory stocks will be automatically incremented.')">
                                            📦 Receive Goods
                                        </button>
                                    </form>
                                    <?php else: ?>
                                        <span style="font-size:12px; color:#10b981; font-weight:600;">✓ In Stock</span>
                                    <?php endif; ?>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Approved Vendors Section -->
            <div class="card" id="vendors-card">
                <div class="card-header">
                    <h2 class="card-title">Approved Supplier Directory (vendors table)</h2>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Supplier Company</th>
                                <th>Contact Representative</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Payment Terms</th>
                                <th>Balance Owed (AP)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($vendors as $v): ?>
                            <tr>
                                <td><strong><?= e($v['company_name']) ?></strong></td>
                                <td><?= e($v['contact_name']) ?></td>
                                <td><?= e($v['email']) ?></td>
                                <td><?= e($v['phone']) ?></td>
                                <td><span class="badge badge-neutral"><?= e($v['payment_terms']) ?></span></td>
                                <td style="font-weight:bold; color: <?= $v['balance_owed'] > 0 ? '#b91c1c' : '#475569' ?>;">
                                    <?= money((float)$v['balance_owed']) ?>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>
</div>
</body>
</html>
