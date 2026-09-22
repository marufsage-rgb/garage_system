<?php
require_once __DIR__ . '/config.php';
$pdo = getDbConnection();

// Handle Order Creation via POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'create_order') {
    $customerId = (int)$_POST['customer_id'];
    $orderDate = $_POST['order_date'] ?: date('Y-m-d');
    $dueDate = $_POST['due_date'] ?: date('Y-m-d', strtotime('+14 days'));
    $notes = trim($_POST['notes'] ?? '');
    $productIds = $_POST['product_id'] ?? [];
    $quantities = $_POST['quantity'] ?? [];
    $prices = $_POST['unit_price'] ?? [];

    if (!empty($productIds) && $customerId > 0) {
        $pdo->beginTransaction();
        try {
            $orderNumber = 'SO-2026-' . rand(100, 999);
            $subtotal = 0.0;
            $itemsToInsert = [];

            for ($i = 0; $i < count($productIds); $i++) {
                $pid = (int)$productIds[$i];
                $qty = max(1, (int)($quantities[$i] ?? 1));
                $price = (float)($prices[$i] ?? 0);
                $lineTotal = $qty * $price;
                $subtotal += $lineTotal;

                $itemsToInsert[] = [
                    'product_id' => $pid,
                    'quantity' => $qty,
                    'unit_price' => $price,
                    'total_price' => $lineTotal
                ];

                // Deduct stock from inventory
                $deductStmt = $pdo->prepare("UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - ?) WHERE id = ?");
                $deductStmt->execute([$qty, $pid]);
            }

            $tax = $subtotal * 0.08; // 8% sales tax
            $total = $subtotal + $tax;

            $soStmt = $pdo->prepare("
                INSERT INTO sales_orders (order_number, customer_id, order_date, due_date, subtotal, tax_amount, total_amount, status, payment_status, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', 'unpaid', ?)
            ");
            $soStmt->execute([$orderNumber, $customerId, $orderDate, $dueDate, $subtotal, $tax, $total, $notes]);
            $orderId = (int)$pdo->lastInsertId();

            $itemStmt = $pdo->prepare("INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)");
            foreach ($itemsToInsert as $item) {
                $itemStmt->execute([$orderId, $item['product_id'], $item['quantity'], $item['unit_price'], $item['total_price']]);
            }

            $pdo->commit();
            setFlash('success', "Sales Order {$orderNumber} successfully posted and inventory allocated!");
            header("Location: sales.php?view_id={$orderId}");
            exit;
        } catch (Exception $e) {
            $pdo->rollBack();
            setFlash('danger', "Database error: " . $e->getMessage());
        }
    }
}

// Handle Order Status / Payment Updates
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_status') {
    $orderId = (int)$_POST['order_id'];
    $status = $_POST['status'];
    $paymentStatus = $_POST['payment_status'];
    $updateStmt = $pdo->prepare("UPDATE sales_orders SET status = ?, payment_status = ? WHERE id = ?");
    $updateStmt->execute([$status, $paymentStatus, $orderId]);
    setFlash('success', "Order #{$orderId} status updated.");
    header("Location: sales.php?view_id={$orderId}");
    exit;
}

// Check if viewing single invoice
$viewOrder = null;
$viewItems = [];
if (isset($_GET['view_id'])) {
    $viewId = (int)$_GET['view_id'];
    $orderStmt = $pdo->prepare("
        SELECT so.*, c.company_name, c.contact_name, c.email, c.phone, c.address 
        FROM sales_orders so 
        JOIN customers c ON so.customer_id = c.id 
        WHERE so.id = ?
    ");
    $orderStmt->execute([$viewId]);
    $viewOrder = $orderStmt->fetch();

    if ($viewOrder) {
        $itemsStmt = $pdo->prepare("
            SELECT soi.*, p.sku, p.name as product_name, p.unit 
            FROM sales_order_items soi 
            JOIN products p ON soi.product_id = p.id 
            WHERE soi.sales_order_id = ?
        ");
        $itemsStmt->execute([$viewId]);
        $viewItems = $itemsStmt->fetchAll();
    }
}

// Fetch all sales orders
$orders = $pdo->query("
    SELECT so.*, c.company_name, c.contact_name 
    FROM sales_orders so 
    JOIN customers c ON so.customer_id = c.id 
    ORDER BY so.id DESC
")->fetchAll();

$customers = $pdo->query("SELECT * FROM customers ORDER BY company_name ASC")->fetchAll();
$products = $pdo->query("SELECT * FROM products WHERE stock_quantity > 0 ORDER BY name ASC")->fetchAll();
$flash = getFlash();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apex ERP - Sales Orders & Invoicing</title>
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
            <li><a href="sales.php" class="nav-link active"><span>🛒 Sales & Orders</span></a></li>
            <li><a href="inventory.php" class="nav-link"><span>📦 Inventory & SKUs</span></a></li>
            <li><a href="purchases.php" class="nav-link"><span>🚚 Purchasing (PO)</span></a></li>
            <li><a href="finance.php" class="nav-link"><span>💳 Finance & Ledger</span></a></li>
            <li><a href="hr.php" class="nav-link"><span>👥 Human Resources</span></a></li>
            <li><a href="sql_runner.php" class="nav-link"><span>⚡ SQL Query Console</span></a></li>
        </ul>
    </aside>

    <div class="main-wrapper">
        <header class="topbar">
            <h1 class="page-title">Sales Orders & Customer Accounts</h1>
            <div class="topbar-actions">
                <button onclick="document.getElementById('newOrderModal').style.display='flex'" class="btn btn-primary btn-sm">+ Create Sales Order</button>
            </div>
        </header>

        <main class="content-body">
            <?php if ($flash): ?>
                <div class="flash-message flash-<?= e($flash['type']) ?>">
                    <?= e($flash['message']) ?>
                </div>
            <?php endif; ?>

            <?php if ($viewOrder): ?>
            <!-- Printable Tax Invoice Section -->
            <div class="card" style="border: 2px solid #4338ca;">
                <div class="card-header no-print" style="background: #eef2ff;">
                    <div>
                        <strong style="color: #4338ca;">Tax Invoice: <?= e($viewOrder['order_number']) ?></strong>
                        <span style="font-size: 12px; color: #64748b; margin-left: 10px;">Status: <?= e($viewOrder['status']) ?> (<?= e($viewOrder['payment_status']) ?>)</span>
                    </div>
                    <div>
                        <button onclick="window.print()" class="btn btn-primary btn-sm">🖨️ Print Invoice</button>
                        <a href="sales.php" class="btn btn-secondary btn-sm">Close Invoice</a>
                    </div>
                </div>

                <div style="padding: 30px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom: 24px;">
                        <div>
                            <h2 style="font-size: 20px; font-weight:800; color:#0f172a; margin-bottom:4px;">APEX INDUSTRIAL SYSTEMS LLC</h2>
                            <p style="font-size:12px; color:#64748b;">400 Technology Way, Silicon Valley, CA 94025<br>Tax ID: US-EIN-98402198 • support@apexerp.internal</p>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 22px; font-weight: 800; color: #4338ca;">COMMERCIAL INVOICE</div>
                            <div style="font-family: monospace; font-size: 14px; font-weight: bold;"><?= e($viewOrder['order_number']) ?></div>
                            <div style="font-size: 12px; color: #64748b;">Date: <?= e($viewOrder['order_date']) ?> | Due: <?= e($viewOrder['due_date']) ?></div>
                        </div>
                    </div>

                    <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px; display:flex; justify-content:space-between;">
                        <div>
                            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Billed To:</div>
                            <div style="font-size: 14px; font-weight: bold; color: #0f172a;"><?= e($viewOrder['company_name']) ?></div>
                            <div style="font-size: 12px; color: #475569;">Attn: <?= e($viewOrder['contact_name']) ?><br><?= e($viewOrder['address']) ?><br><?= e($viewOrder['email']) ?></div>
                        </div>
                        <div class="no-print">
                            <form method="POST" style="display:flex; gap: 8px; align-items: flex-end;">
                                <input type="hidden" name="action" value="update_status">
                                <input type="hidden" name="order_id" value="<?= (int)$viewOrder['id'] ?>">
                                <div>
                                    <label style="font-size:11px; display:block; font-weight:600;">Fulfillment</label>
                                    <select name="status" class="form-control" style="font-size:12px; padding:4px;">
                                        <?php foreach (['draft','confirmed','processing','shipped','delivered','cancelled'] as $st): ?>
                                        <option value="<?= $st ?>" <?= $viewOrder['status'] === $st ? 'selected' : '' ?>><?= ucfirst($st) ?></option>
                                        <?php endforeach; ?>
                                    </select>
                                </div>
                                <div>
                                    <label style="font-size:11px; display:block; font-weight:600;">Payment</label>
                                    <select name="payment_status" class="form-control" style="font-size:12px; padding:4px;">
                                        <?php foreach (['unpaid','partial','paid'] as $pst): ?>
                                        <option value="<?= $pst ?>" <?= $viewOrder['payment_status'] === $pst ? 'selected' : '' ?>><?= ucfirst($pst) ?></option>
                                        <?php endforeach; ?>
                                    </select>
                                </div>
                                <button type="submit" class="btn btn-secondary btn-sm">Update</button>
                            </form>
                        </div>
                    </div>

                    <table class="data-table" style="margin-bottom: 24px;">
                        <thead>
                            <tr>
                                <th>Item / SKU</th>
                                <th>Description</th>
                                <th style="text-align:center;">Qty</th>
                                <th style="text-align:right;">Unit Price</th>
                                <th style="text-align:right;">Line Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($viewItems as $item): ?>
                            <tr>
                                <td style="font-family:monospace;"><?= e($item['sku']) ?></td>
                                <td><strong><?= e($item['product_name']) ?></strong></td>
                                <td style="text-align:center;"><?= (int)$item['quantity'] ?> <?= e($item['unit']) ?></td>
                                <td style="text-align:right;"><?= money((float)$item['unit_price']) ?></td>
                                <td style="text-align:right; font-weight:bold;"><?= money((float)$item['total_price']) ?></td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>

                    <div style="display:flex; justify-content:space-between;">
                        <div style="max-width: 400px; font-size:12px; color:#64748b;">
                            <strong>Payment Instructions:</strong><br>
                            Bank: Silicon Valley Corporate Trust<br>
                            Account: 8810-4491-002 • Routing: 121000358<br>
                            Notes: <?= e($viewOrder['notes'] ?: 'Thank you for your partnership.') ?>
                        </div>
                        <div style="width: 250px; font-size:13px;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                                <span>Subtotal:</span>
                                <span><?= money((float)$viewOrder['subtotal']) ?></span>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                                <span>Sales Tax (8%):</span>
                                <span><?= money((float)$viewOrder['tax_amount']) ?></span>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-top:8px; padding-top:8px; border-top:2px solid #0f172a; font-size:16px; font-weight:800; color:#4338ca;">
                                <span>Total Amount:</span>
                                <span><?= money((float)$viewOrder['total_amount']) ?></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <?php endif; ?>

            <!-- Sales Orders Master Table -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">All Sales Orders Register (MySQL)</h2>
                    <span style="font-size:12px; color:#64748b;"><?= count($orders) ?> active orders</span>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Order Number</th>
                                <th>Customer Entity</th>
                                <th>Order Date</th>
                                <th>Due Date</th>
                                <th>Grand Total</th>
                                <th>Status</th>
                                <th>Payment</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($orders as $o): ?>
                            <tr>
                                <td><a href="sales.php?view_id=<?= (int)$o['id'] ?>" style="font-weight:bold; color:#4338ca; text-decoration:none;"><?= e($o['order_number']) ?></a></td>
                                <td><?= e($o['company_name']) ?></td>
                                <td><?= e($o['order_date']) ?></td>
                                <td><?= e($o['due_date']) ?></td>
                                <td><strong><?= money((float)$o['total_amount']) ?></strong></td>
                                <td><span class="badge badge-info"><?= e($o['status']) ?></span></td>
                                <td><span class="badge <?= $o['payment_status'] === 'paid' ? 'badge-success' : 'badge-danger' ?>"><?= e($o['payment_status']) ?></span></td>
                                <td>
                                    <a href="sales.php?view_id=<?= (int)$o['id'] ?>" class="btn btn-secondary btn-sm">Invoice</a>
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

<!-- Pure HTML5 Modal for Creating Sales Order -->
<div id="newOrderModal" class="modal-overlay" style="display: none;">
    <div class="modal-content">
        <div class="modal-header">
            <h3 style="font-size:15px; font-weight:bold;">Create New Sales Order (SQL Transaction)</h3>
            <button onclick="document.getElementById('newOrderModal').style.display='none'" style="border:none; background:transparent; font-size:18px; cursor:pointer;">&times;</button>
        </div>
        <form method="POST" action="sales.php" class="modal-body">
            <input type="hidden" name="action" value="create_order">
            
            <div class="form-group">
                <label>Customer Account *</label>
                <select name="customer_id" class="form-control" required>
                    <option value="">Select customer...</option>
                    <?php foreach ($customers as $c): ?>
                    <option value="<?= (int)$c['id'] ?>"><?= e($c['company_name']) ?> (<?= e($c['contact_name']) ?>)</option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <div class="form-group">
                    <label>Order Date</label>
                    <input type="date" name="order_date" value="<?= date('Y-m-d') ?>" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Due Date</label>
                    <input type="date" name="due_date" value="<?= date('Y-m-d', strtotime('+14 days')) ?>" class="form-control" required>
                </div>
            </div>

            <div class="form-group">
                <label>Add Products to Order</label>
                <div style="background:#f8fafc; padding:12px; border-radius:8px; border:1px solid #e2e8f0;">
                    <?php foreach (array_slice($products, 0, 3) as $idx => $p): ?>
                    <div style="display:grid; grid-template-columns: 2fr 1fr 1fr; gap:8px; margin-bottom:8px; align-items:center;">
                        <input type="hidden" name="product_id[]" value="<?= (int)$p['id'] ?>">
                        <input type="hidden" name="unit_price[]" value="<?= (float)$p['unit_price'] ?>">
                        <div style="font-size:12px; font-weight:600;"><?= e($p['name']) ?> (Stock: <?= (int)$p['stock_quantity'] ?>)</div>
                        <input type="number" name="quantity[]" value="<?= $idx === 0 ? 5 : 2 ?>" min="1" max="<?= (int)$p['stock_quantity'] ?>" class="form-control" style="font-size:12px;">
                        <div style="font-size:12px; text-align:right; font-weight:bold;"><?= money((float)$p['unit_price']) ?></div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>

            <div class="form-group">
                <label>Order Notes / Contract Reference</label>
                <input type="text" name="notes" placeholder="e.g. Standard Net 30 FOB terms" class="form-control">
            </div>

            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">
                <button type="button" onclick="document.getElementById('newOrderModal').style.display='none'" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">Post Sales Order</button>
            </div>
        </form>
    </div>
</div>
</body>
</html>
