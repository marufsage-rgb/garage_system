<?php
require_once __DIR__ . '/config.php';
$pdo = getDbConnection();

// Add Employee
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add_employee') {
    $empCode = 'E-' . rand(100, 999);
    $fullName = trim($_POST['full_name']);
    $role = trim($_POST['role']);
    $dept = trim($_POST['department']);
    $salary = (float)$_POST['annual_salary'];
    $email = trim($_POST['email'] ?: strtolower(str_replace(' ', '.', $fullName)) . '@enterprise.io');
    $phone = trim($_POST['phone'] ?: '+1 (555) 000-0000');
    $joinDate = date('Y-m-d');

    if ($fullName && $salary > 0) {
        $stmt = $pdo->prepare("INSERT INTO employees (emp_code, full_name, email, phone, role, department, annual_salary, join_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$empCode, $fullName, $email, $phone, $role, $dept, $salary, $joinDate]);
        setFlash('success', "Employee {$fullName} ({$empCode}) added to payroll roster.");
    }
    header("Location: hr.php");
    exit;
}

$employees = $pdo->query("SELECT * FROM employees ORDER BY department ASC, full_name ASC")->fetchAll();

$payrollStmt = $pdo->query("SELECT COALESCE(SUM(annual_salary), 0) as total_payroll, COUNT(*) as headcount FROM employees WHERE status = 'active'");
$payroll = $payrollStmt->fetch();
$monthlyPayroll = $payroll['total_payroll'] / 12;

$flash = getFlash();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apex ERP - Human Resources & Payroll</title>
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
            <li><a href="hr.php" class="nav-link active"><span>👥 Human Resources</span></a></li>
            <li><a href="sql_runner.php" class="nav-link"><span>⚡ SQL Query Console</span></a></li>
        </ul>
    </aside>

    <div class="main-wrapper">
        <header class="topbar">
            <h1 class="page-title">Human Resources & Workforce Directory</h1>
            <div class="topbar-actions">
                <button onclick="document.getElementById('addEmpModal').style.display='flex'" class="btn btn-primary btn-sm">+ Add Employee</button>
            </div>
        </header>

        <main class="content-body">
            <?php if ($flash): ?>
                <div class="flash-message flash-<?= e($flash['type']) ?>"><?= e($flash['message']) ?></div>
            <?php endif; ?>

            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-label">Active Headcount</div>
                    <div class="kpi-value" style="color:#4338ca;"><?= (int)$payroll['headcount'] ?> Staff</div>
                    <div class="kpi-sub">Full-time verified employees</div>
                </div>

                <div class="kpi-card">
                    <div class="kpi-label">Monthly Payroll Burn</div>
                    <div class="kpi-value" style="color:#0f172a;"><?= money((float)$monthlyPayroll) ?></div>
                    <div class="kpi-sub">Estimated gross monthly disbursement</div>
                </div>

                <div class="kpi-card">
                    <div class="kpi-label">Annualized Payroll</div>
                    <div class="kpi-value" style="color:#059669;"><?= money((float)$payroll['total_payroll']) ?></div>
                    <div class="kpi-sub">Base compensation budget</div>
                </div>
            </div>

            <!-- Employee Directory -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Staff Master Roster (employees table)</h2>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Emp ID</th>
                                <th>Name & Role</th>
                                <th>Department</th>
                                <th>Contact Email</th>
                                <th>Phone</th>
                                <th>Annual Base</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($employees as $emp): ?>
                            <tr>
                                <td style="font-family:monospace; font-weight:bold;"><?= e($emp['emp_code']) ?></td>
                                <td>
                                    <strong><?= e($emp['full_name']) ?></strong>
                                    <div style="font-size:11px; color:#64748b;"><?= e($emp['role']) ?></div>
                                </td>
                                <td><span class="badge badge-neutral"><?= e($emp['department']) ?></span></td>
                                <td><?= e($emp['email']) ?></td>
                                <td><?= e($emp['phone']) ?></td>
                                <td style="font-weight:bold;"><?= money((float)$emp['annual_salary']) ?></td>
                                <td><span class="badge badge-success"><?= e($emp['status']) ?></span></td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>
</div>

<div id="addEmpModal" class="modal-overlay" style="display: none;">
    <div class="modal-content">
        <div class="modal-header">
            <h3 style="font-size:15px; font-weight:bold;">Register New Employee</h3>
            <button onclick="document.getElementById('addEmpModal').style.display='none'" style="border:none; background:transparent; font-size:18px; cursor:pointer;">&times;</button>
        </div>
        <form method="POST" action="hr.php" class="modal-body">
            <input type="hidden" name="action" value="add_employee">
            <div class="form-group">
                <label>Full Legal Name *</label>
                <input type="text" name="full_name" placeholder="e.g. Jordan Sterling" class="form-control" required>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <div class="form-group">
                    <label>Position / Role *</label>
                    <input type="text" name="role" placeholder="e.g. Quality Assurance Specialist" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>Department *</label>
                    <select name="department" class="form-control">
                        <option value="Operations">Operations</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Sales & Marketing">Sales & Marketing</option>
                        <option value="Finance">Finance</option>
                        <option value="Human Resources">Human Resources</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Annual Base Salary ($) *</label>
                <input type="number" name="annual_salary" value="78000" class="form-control" required>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <div class="form-group">
                    <label>Corporate Email</label>
                    <input type="email" name="email" placeholder="j.sterling@enterprise.io" class="form-control">
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <input type="text" name="phone" placeholder="+1 (555) 890-1211" class="form-control">
                </div>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">
                <button type="button" onclick="document.getElementById('addEmpModal').style.display='none'" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Employee</button>
            </div>
        </form>
    </div>
</div>
</body>
</html>
