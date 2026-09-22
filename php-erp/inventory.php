<?php
require_once __DIR__ . '/config.php';
$pdo = getDbConnection();

// Handle SKU Creation
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'create_sku') {
    $sku = trim($_POST['sku']);
    $name = trim($_POST['name']);
    $category = trim($_POST['category']);
    $unit = trim($_POST['unit'] ?: 'pcs');
    $costPrice = (float)$_POST['cost_price'];
    $unitPrice = (float)$_POST['unit_price'];
    $stockQty = (int)$_POST['stock_quantity'];
    $reorderLevel = (int)$_POST['reorder_level'];
    $location = trim($_POST['warehouse_location']);

    try {
        $stmt = $pdo->prepare("
            INSERT INTO products (sku, name, category, unit, cost_price, unit_price, stock_quantity, reorder_level, warehouse_location)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$sku, $name, $category, $unit, $costPrice, $unitPrice, $stockQty, $reorderLevel, $location]);
        setFlash('success', "SKU {$sku} added to catalog.");
    } catch (Exception $e) {
        setFlash('danger', "Database error: " . $e->getMessage());
    }
    header("Location: inventory.php");
    exit;
}

// Handle Stock Adjustment
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'adjust_stock') {
    $prodId = (int)$_POST['product_id'];
    $adjustment = (int)$_POST['adjustment_qty'];
    $reason = trim($_POST['reason']);

    $stmt = $pdo->prepare("UPDATE products SET stock_quantity = GREATEST(0, stock_quantity + ?) WHERE id = ?");
    $stmt->execute([$adjustment, $prodId]);
    setFlash('success', "Stock updated for SKU. Reason: {$reason}");
    header("Location: inventory.php");
    exit;
}

// Handle Bulk CSV Import
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'bulk_import_csv') {
    if (isset($_FILES['csv_file']) && $_FILES['csv_file']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['csv_file']['tmp_name'];
        $handle = fopen($file, 'r');
        if ($handle !== false) {
            $header = fgetcsv($handle);
            $imported = 0;
            $stmt = $pdo->prepare("
                INSERT INTO products (sku, name, category, unit, cost_price, unit_price, stock_quantity, reorder_level, warehouse_location)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    stock_quantity = stock_quantity + VALUES(stock_quantity),
                    unit_price = VALUES(unit_price),
                    cost_price = VALUES(cost_price)
            ");
            while (($row = fgetcsv($handle)) !== false) {
                if (count($row) >= 2 && !empty(trim($row[0]))) {
                    $sku = trim($row[0]);
                    $name = trim($row[1] ?? 'Item ' . $sku);
                    $cat = trim($row[2] ?? 'General');
                    $unit = trim($row[3] ?? 'pcs');
                    $cost = (float)($row[4] ?? 0);
                    $price = (float)($row[5] ?? 0);
                    $qty = (int)($row[6] ?? 0);
                    $reorder = (int)($row[7] ?? 10);
                    $loc = trim($row[8] ?? 'WH-A / Row 1');
                    try {
                        $stmt->execute([$sku, $name, $cat, $unit, $cost, $price, $qty, $reorder, $loc]);
                        $imported++;
                    } catch (Exception $e) {}
                }
            }
            fclose($handle);
            setFlash('success', "Successfully imported {$imported} products from CSV.");
        }
    } else {
        setFlash('danger', "Please upload a valid CSV file.");
    }
    header("Location: inventory.php");
    exit;
}

$categoryFilter = $_GET['category'] ?? '';
$sql = "SELECT * FROM products";
$params = [];
if ($categoryFilter) {
    $sql .= " WHERE category = ?";
    $params[] = $categoryFilter;
}
$sql .= " ORDER BY id DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$products = $stmt->fetchAll();

$categories = $pdo->query("SELECT DISTINCT category FROM products ORDER BY category ASC")->fetchAll(PDO::FETCH_COLUMN);

$flash = getFlash();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apex ERP - Inventory & Warehouse Management</title>
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
            <li><a href="inventory.php" class="nav-link active"><span>📦 Inventory & SKUs</span></a></li>
            <li><a href="purchases.php" class="nav-link"><span>🚚 Purchasing (PO)</span></a></li>
            <li><a href="finance.php" class="nav-link"><span>💳 Finance & Ledger</span></a></li>
            <li><a href="hr.php" class="nav-link"><span>👥 Human Resources</span></a></li>
            <li><a href="sql_runner.php" class="nav-link"><span>⚡ SQL Query Console</span></a></li>
        </ul>
    </aside>

    <div class="main-wrapper">
        <header class="topbar">
            <h1 class="page-title">Inventory & Warehouse Control</h1>
            <div class="topbar-actions" style="display:flex; gap:8px;">
                <button onclick="document.getElementById('bulkImportModal').style.display='flex'" class="btn btn-secondary btn-sm">📁 Bulk Import CSV</button>
                <button onclick="document.getElementById('addSkuModal').style.display='flex'" class="btn btn-primary btn-sm">+ Add New SKU</button>
            </div>
        </header>

        <main class="content-body">
            <?php if ($flash): ?>
                <div class="flash-message flash-<?= e($flash['type']) ?>"><?= e($flash['message']) ?></div>
            <?php endif; ?>

            <div class="card">
                <div class="card-header">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <h2 class="card-title">Warehouse Catalog Master (products table)</h2>
                        <form method="GET" style="display:inline-block;">
                            <select name="category" onchange="this.form.submit()" class="form-control" style="width:auto; font-size:12px; padding:3px 8px;">
                                <option value="">All Categories</option>
                                <?php foreach ($categories as $cat): ?>
                                <option value="<?= e($cat) ?>" <?= $categoryFilter === $cat ? 'selected' : '' ?>><?= e($cat) ?></option>
                                <?php endforeach; ?>
                            </select>
                        </form>
                    </div>
                    <span style="font-size:12px; color:#64748b;"><?= count($products) ?> SKUs Listed</span>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>SKU Code</th>
                                <th>Item Name</th>
                                <th>Category</th>
                                <th>Cost Price</th>
                                <th>Selling Price</th>
                                <th>On Hand</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Adjustment</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($products as $p): 
                                $isLow = $p['stock_quantity'] <= $p['reorder_level'];
                            ?>
                            <tr>
                                <td style="font-family:monospace; font-weight:bold;"><?= e($p['sku']) ?></td>
                                <td><?= e($p['name']) ?></td>
                                <td><?= e($p['category']) ?></td>
                                <td><?= money((float)$p['cost_price']) ?></td>
                                <td><strong><?= money((float)$p['unit_price']) ?></strong></td>
                                <td>
                                    <strong style="color: <?= $isLow ? '#dc2626' : '#1e293b' ?>;">
                                        <?= (int)$p['stock_quantity'] ?> <?= e($p['unit']) ?>
                                    </strong>
                                    <div style="font-size:10px; color:#64748b;">Min: <?= (int)$p['reorder_level'] ?></div>
                                </td>
                                <td><span style="font-size:11px; background:#f1f5f9; padding:2px 6px; border-radius:4px;"><?= e($p['warehouse_location']) ?></span></td>
                                <td>
                                    <?php if ($p['stock_quantity'] == 0): ?>
                                        <span class="badge badge-danger">Out of Stock</span>
                                    <?php elseif ($isLow): ?>
                                        <span class="badge badge-warning">Low Stock</span>
                                    <?php else: ?>
                                        <span class="badge badge-success">In Stock</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <form method="POST" style="display:flex; gap:4px; align-items:center;">
                                        <input type="hidden" name="action" value="adjust_stock">
                                        <input type="hidden" name="product_id" value="<?= (int)$p['id'] ?>">
                                        <input type="hidden" name="reason" value="Cycle Count Adjustment">
                                        <input type="number" name="adjustment_qty" placeholder="±Qty" class="form-control" style="width:60px; padding:3px; font-size:11px;" required>
                                        <button type="submit" class="btn btn-secondary btn-sm" style="padding:3px 8px;">Apply</button>
                                    </form>
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

<div id="addSkuModal" class="modal-overlay" style="display: none;">
    <div class="modal-content">
        <div class="modal-header">
            <h3 style="font-size:15px; font-weight:bold;">Add New Inventory SKU</h3>
            <button onclick="document.getElementById('addSkuModal').style.display='none'" style="border:none; background:transparent; font-size:18px; cursor:pointer;">&times;</button>
        </div>
        <form method="POST" action="inventory.php" class="modal-body">
            <input type="hidden" name="action" value="create_sku">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <div class="form-group">
                    <label>SKU Code *</label>
                    <input type="text" name="sku" value="SKU-<?= rand(100,999) ?>" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Category *</label>
                    <input type="text" name="category" value="Industrial Components" class="form-control" required>
                </div>
            </div>
            <div class="form-group">
                <label>Product Name / Description *</label>
                <input type="text" name="name" placeholder="e.g. Optical Rotary Encoder 1024 PPR" class="form-control" required>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:12px;">
                <div class="form-group">
                    <label>Cost Price ($)</label>
                    <input type="number" step="0.01" name="cost_price" value="65.00" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Selling Price ($)</label>
                    <input type="number" step="0.01" name="unit_price" value="115.00" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Unit (pcs/m/kg)</label>
                    <input type="text" name="unit" value="pcs" class="form-control" required>
                </div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <div class="form-group">
                    <label>Initial Quantity</label>
                    <input type="number" name="stock_quantity" value="25" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Reorder Point Threshold</label>
                    <input type="number" name="reorder_level" value="10" class="form-control" required>
                </div>
            </div>
            <div class="form-group">
                <label>Storage Location</label>
                <input type="text" name="warehouse_location" value="WH-A / Row 3 / Shelf 1" class="form-control">
            </div>
            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">
                <button type="button" onclick="document.getElementById('addSkuModal').style.display='none'" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">Save SKU</button>
            </div>
        </form>
    </div>
</div>

<!-- Bulk Import Modal -->
<div id="bulkImportModal" class="modal-backdrop" style="display:none;">
    <div class="modal-card">
        <div class="modal-header">
            <h3>Bulk Import Products via CSV</h3>
            <button onclick="document.getElementById('bulkImportModal').style.display='none'" class="close-btn">&times;</button>
        </div>
        <form method="POST" enctype="multipart/form-data" action="inventory.php">
            <input type="hidden" name="action" value="bulk_import_csv">
            <div style="margin-bottom: 16px;">
                <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 12px;">
                    Upload a <code>.csv</code> spreadsheet formatted with the following columns:
                    <br>
                    <strong>sku, name, category, unit, cost_price, unit_price, stock_quantity, reorder_level, warehouse_location</strong>
                </p>
                <div style="padding: 10px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; font-size: 12px; font-family: monospace; color: #334155; margin-bottom: 14px;">
                    PRD-010,Precision Stepper Motor 24V,Components,pcs,45.00,89.50,120,15,WH-A / Row 2 / Shelf 1<br>
                    PRD-011,Alloy Planetary Gearbox 10:1,Mechanisms,pcs,85.00,165.00,45,8,WH-B / Bay 3
                </div>
            </div>
            <div class="form-group">
                <label>Select CSV File *</label>
                <input type="file" name="csv_file" accept=".csv,text/csv" required class="form-control">
            </div>
            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">
                <button type="button" onclick="document.getElementById('bulkImportModal').style.display='none'" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">Process CSV Import</button>
            </div>
        </form>
    </div>
</div>
</body>
</html>
