-- ==========================================================
-- APEX ERP - Relational Database Schema (MySQL / MariaDB)
-- Stack: HTML5, Pure CSS3, PHP 8+, MySQL/MariaDB
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `apex_erp` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `apex_erp`;

-- 1. Users / Auth
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `role` ENUM('admin', 'manager', 'accountant', 'warehouse', 'sales') DEFAULT 'admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Customers
CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_name` VARCHAR(150) NOT NULL,
  `contact_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100),
  `phone` VARCHAR(30),
  `address` TEXT,
  `outstanding_balance` DECIMAL(12,2) DEFAULT 0.00,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Vendors / Suppliers
CREATE TABLE IF NOT EXISTS `vendors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_name` VARCHAR(150) NOT NULL,
  `contact_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100),
  `phone` VARCHAR(30),
  `payment_terms` VARCHAR(50) DEFAULT 'Net 30',
  `balance_owed` DECIMAL(12,2) DEFAULT 0.00,
  `rating` DECIMAL(3,2) DEFAULT 4.80,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Products / Inventory SKUs
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sku` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(200) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `unit` VARCHAR(20) DEFAULT 'pcs',
  `cost_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `unit_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `stock_quantity` INT NOT NULL DEFAULT 0,
  `reorder_level` INT NOT NULL DEFAULT 10,
  `warehouse_location` VARCHAR(100) DEFAULT 'WH-A',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. Sales Orders
CREATE TABLE IF NOT EXISTS `sales_orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_number` VARCHAR(50) NOT NULL UNIQUE,
  `customer_id` INT NOT NULL,
  `order_date` DATE NOT NULL,
  `due_date` DATE NOT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'draft',
  `payment_status` ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid',
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Sales Order Line Items
CREATE TABLE IF NOT EXISTS `sales_order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sales_order_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `total_price` DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (`sales_order_id`) REFERENCES `sales_orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Purchase Orders (Procurement)
CREATE TABLE IF NOT EXISTS `purchase_orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `po_number` VARCHAR(50) NOT NULL UNIQUE,
  `vendor_id` INT NOT NULL,
  `order_date` DATE NOT NULL,
  `expected_date` DATE NOT NULL,
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('draft', 'submitted', 'approved', 'received', 'cancelled') DEFAULT 'draft',
  `payment_status` ENUM('unpaid', 'paid') DEFAULT 'unpaid',
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Purchase Order Line Items
CREATE TABLE IF NOT EXISTS `purchase_order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `purchase_order_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `total_price` DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. General Ledger / Transactions
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `transaction_date` DATE NOT NULL,
  `type` ENUM('income', 'expense') NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `account` VARCHAR(100) NOT NULL,
  `reference_number` VARCHAR(100),
  `status` ENUM('cleared', 'pending') DEFAULT 'cleared',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 10. Employees / Human Resources
CREATE TABLE IF NOT EXISTS `employees` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `emp_code` VARCHAR(20) NOT NULL UNIQUE,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(30),
  `role` VARCHAR(100) NOT NULL,
  `department` VARCHAR(100) NOT NULL,
  `annual_salary` DECIMAL(12,2) NOT NULL,
  `status` ENUM('active', 'on_leave', 'inactive') DEFAULT 'active',
  `join_date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 11. Manufacturing / Work Orders
CREATE TABLE IF NOT EXISTS `work_orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_number` VARCHAR(50) NOT NULL UNIQUE,
  `product_id` INT NOT NULL,
  `quantity` INT NOT NULL,
  `status` ENUM('planned', 'in_progress', 'completed', 'on_hold') DEFAULT 'planned',
  `start_date` DATE NOT NULL,
  `target_date` DATE NOT NULL,
  `priority` ENUM('low', 'medium', 'high') DEFAULT 'medium',
  `assigned_to` VARCHAR(100) NOT NULL,
  `progress` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 12. Job Cards (Auto Workshop & Service Orders)
CREATE TABLE IF NOT EXISTS `job_cards` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `job_card_number` VARCHAR(50) NOT NULL UNIQUE,
  `customer_name` VARCHAR(150) NOT NULL,
  `contact_phone` VARCHAR(30),
  `vehicle_details` VARCHAR(255),
  `status` ENUM('draft', 'in_progress', 'completed', 'delivered') DEFAULT 'draft',
  `notes` TEXT,
  `before_photo` VARCHAR(255) NULL,
  `after_photo` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 13. Estimates / Quotations (with 5% Oman VAT breakdown)
CREATE TABLE IF NOT EXISTS `estimates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `estimate_number` VARCHAR(50) NOT NULL UNIQUE,
  `job_card_id` INT NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `estimate_date` DATE NOT NULL,
  `total_amount` DECIMAL(10,3) NOT NULL DEFAULT 0.000,
  `subtotal` DECIMAL(10,3) DEFAULT 0.000,
  `vat_amount` DECIMAL(10,3) DEFAULT 0.000,
  `grand_total` DECIMAL(10,3) DEFAULT 0.000,
  `status` ENUM('draft', 'sent', 'approved', 'invoiced', 'declined') DEFAULT 'draft',
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`job_card_id`) REFERENCES `job_cards`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 14. Notification Log (WhatsApp, Email, SMS Audit Trail)
CREATE TABLE IF NOT EXISTS `notification_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `job_card_id` INT NULL,
  `channel` ENUM('WHATSAPP','EMAIL','SMS') NOT NULL,
  `recipient` VARCHAR(150) NOT NULL,
  `message` TEXT,
  `status` ENUM('SENT','FAILED','PENDING') DEFAULT 'SENT',
  `sent_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_jc` (`job_card_id`),
  FOREIGN KEY (`job_card_id`) REFERENCES `job_cards`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================================
-- PACKAGE 1 MIGRATION — Safe to run even if columns already exist
-- ==========================================================

-- 1. Job cards — before/after photo paths (quick access)
ALTER TABLE `job_cards` 
ADD COLUMN IF NOT EXISTS `before_photo` VARCHAR(255) NULL AFTER `notes`,
ADD COLUMN IF NOT EXISTS `after_photo`  VARCHAR(255) NULL AFTER `before_photo`;

-- 2. Estimates — 5% Oman VAT breakdown
ALTER TABLE `estimates` 
ADD COLUMN IF NOT EXISTS `subtotal`    DECIMAL(10,3) DEFAULT 0.000 AFTER `total_amount`,
ADD COLUMN IF NOT EXISTS `vat_amount`  DECIMAL(10,3) DEFAULT 0.000 AFTER `subtotal`,
ADD COLUMN IF NOT EXISTS `grand_total` DECIMAL(10,3) DEFAULT 0.000 AFTER `vat_amount`;

-- 3. Backfill existing estimates (subtotal=total, VAT on top)
UPDATE `estimates` 
SET `subtotal`    = `total_amount`,
    `vat_amount`  = ROUND(`total_amount` * 0.05, 3),
    `grand_total` = ROUND(`total_amount` * 1.05, 3)
WHERE `subtotal` = 0 AND `total_amount` > 0;

-- ==========================================================
-- SEED DATA INSERTION
-- ==========================================================

INSERT INTO `customers` (`company_name`, `contact_name`, `email`, `phone`, `address`, `outstanding_balance`) VALUES
('Apex Automation Corp', 'Elena Rostova', 'e.rostova@apexautomation.io', '+1 (555) 234-8901', '450 Industrial Pkwy, Austin, TX', 14250.00),
('Vance Robotics & Systems', 'Marcus Vance', 'marcus@vancerobotics.com', '+1 (555) 491-0023', '1200 Innovation Way, Detroit, MI', 3180.00),
('Skyline Aerospace Ltd', 'Claire Moreau', 'cmoreau@skylineaero.org', '+1 (555) 872-9114', '88 Hangar Rd, Seattle, WA', 28900.00),
('Quantum Dynamics Tech', 'Devon Patel', 'd.patel@quantumdynamics.co', '+1 (555) 603-4419', '710 Silicon Blvd, San Jose, CA', 0.00);

INSERT INTO `vendors` (`company_name`, `contact_name`, `email`, `phone`, `payment_terms`, `balance_owed`, `rating`) VALUES
('Kyoto Precision Metals Inc', 'Kenji Takahashi', 'orders@kyotometals.jp', '+81 75 901 3211', 'Net 30', 18400.00, 4.90),
('Global Microchips Logistics', 'Arthur Sterling', 'sales@globalmicrochips.net', '+1 (555) 789-2210', 'Net 15', 24650.00, 4.70),
('EuroFluid Hydraulics SARL', 'Valerie Dupont', 'contact@eurofluid.fr', '+33 1 42 68 55 00', 'Net 45', 8900.00, 4.80),
('Allied Fasteners & Hardware', 'Samuel Thorne', 'sthorne@alliedfasteners.com', '+1 (555) 345-9801', 'Due on Receipt', 1200.00, 4.50);

INSERT INTO `products` (`sku`, `name`, `category`, `unit`, `cost_price`, `unit_price`, `stock_quantity`, `reorder_level`, `warehouse_location`) VALUES
('SKU-IND-401', 'Heavy Duty Stepper Motor 24V', 'Industrial Components', 'pcs', 85.00, 145.00, 42, 20, 'WH-A / Row 4 / Shelf 2'),
('SKU-IND-402', 'Precision Optical Sensor V3', 'Sensors & IoT', 'pcs', 42.00, 88.50, 12, 25, 'WH-A / Row 2 / Shelf 1'),
('SKU-RAW-105', 'Aircraft Grade Aluminum Extrusion 2m', 'Raw Materials', 'bars', 130.00, 220.00, 85, 30, 'WH-B / Yard 1'),
('SKU-PCB-909', 'Microcontroller Logic Board ARM Cortex', 'Electronics', 'pcs', 190.00, 310.00, 4, 15, 'WH-A / ESD Room'),
('SKU-CAB-012', 'Shielded Industrial Ethernet Cat7 (100m)', 'Cabling & Network', 'spools', 95.00, 175.00, 36, 10, 'WH-B / Row 1 / Shelf 5'),
('SKU-HYD-502', 'Hydraulic Control Valve 350 Bar', 'Hydraulics', 'units', 320.00, 520.00, 18, 8, 'WH-C / Bay 3'),
('SKU-FST-210', 'Titanium Fastener Bolt M8x40 (Box of 200)', 'Fasteners', 'boxes', 32.00, 65.00, 0, 10, 'WH-A / Row 8 / Bin 14');

INSERT INTO `sales_orders` (`order_number`, `customer_id`, `order_date`, `due_date`, `subtotal`, `tax_amount`, `discount_amount`, `total_amount`, `status`, `payment_status`, `notes`) VALUES
('SO-2026-089', 1, '2026-09-14', '2026-09-28', 6575.00, 526.00, 100.00, 7001.00, 'confirmed', 'partial', 'Expedited delivery'),
('SO-2026-090', 3, '2026-09-15', '2026-09-30', 7260.00, 580.80, 200.00, 7640.80, 'processing', 'paid', 'Contract milestone 2'),
('SO-2026-091', 2, '2026-09-16', '2026-10-05', 3262.50, 261.00, 0.00, 3523.50, 'shipped', 'paid', 'Tracking FEDEX-9812');

INSERT INTO `sales_order_items` (`sales_order_id`, `product_id`, `quantity`, `unit_price`, `total_price`) VALUES
(1, 1, 15, 145.00, 2175.00),
(1, 3, 20, 220.00, 4400.00),
(2, 6, 8, 520.00, 4160.00),
(2, 4, 10, 310.00, 3100.00),
(3, 2, 25, 88.50, 2212.50),
(3, 5, 6, 175.00, 1050.00);

INSERT INTO `purchase_orders` (`po_number`, `vendor_id`, `order_date`, `expected_date`, `subtotal`, `tax_amount`, `total_amount`, `status`, `payment_status`) VALUES
('PO-2026-044', 2, '2026-09-10', '2026-09-22', 9500.00, 475.00, 9975.00, 'approved', 'unpaid'),
('PO-2026-045', 1, '2026-09-12', '2026-09-25', 5200.00, 260.00, 5460.00, 'submitted', 'unpaid');

INSERT INTO `purchase_order_items` (`purchase_order_id`, `product_id`, `quantity`, `unit_price`, `total_price`) VALUES
(1, 4, 50, 190.00, 9500.00),
(2, 3, 40, 130.00, 5200.00);

INSERT INTO `transactions` (`transaction_date`, `type`, `category`, `description`, `amount`, `account`, `reference_number`, `status`) VALUES
('2026-09-16', 'income', 'Customer Receipts', 'Payment for SO-2026-091', 3523.50, 'Operating Account', 'WIRE-89104', 'cleared'),
('2026-09-15', 'expense', 'Vendor Settlement', 'PO-2026-046 Allied Fasteners', 672.00, 'Operating Account', 'ACH-48192', 'cleared'),
('2026-09-14', 'income', 'Customer Receipts', 'Advance SO-2026-090 Skyline Aero', 7640.80, 'Operating Account', 'WIRE-77312', 'cleared'),
('2026-09-12', 'expense', 'Facility & Utilities', 'Warehouse refrigeration & power', 2150.00, 'Commercial Card', 'AUTOPAY-551', 'cleared'),
('2026-09-08', 'expense', 'Payroll & Benefits', 'Bi-weekly workforce payroll run', 28400.00, 'Payroll Reserve', 'PAYROLL-26-17', 'cleared');

INSERT INTO `employees` (`emp_code`, `full_name`, `email`, `phone`, `role`, `department`, `annual_salary`, `status`, `join_date`) VALUES
('E-101', 'Julian Montgomery', 'j.montgomery@enterprise.io', '+1 (555) 101-4490', 'VP Operations', 'Operations', 145000.00, 'active', '2021-04-12'),
('E-102', 'Samantha Wei', 's.wei@enterprise.io', '+1 (555) 203-9912', 'Lead Systems Architect', 'Engineering', 138000.00, 'active', '2022-01-18'),
('E-103', 'Carlos Mendoza', 'c.mendoza@enterprise.io', '+1 (555) 782-1144', 'Supply Chain Manager', 'Operations', 98000.00, 'active', '2023-06-01'),
('E-104', 'Aisha Al-Mansoor', 'a.mansoor@enterprise.io', '+1 (555) 304-8821', 'Financial Controller', 'Finance', 115000.00, 'active', '2022-09-15'),
('E-105', 'David Keller', 'd.keller@enterprise.io', '+1 (555) 441-2099', 'Sales Executive', 'Sales & Marketing', 92000.00, 'active', '2023-11-10');

INSERT INTO `work_orders` (`order_number`, `product_id`, `quantity`, `status`, `start_date`, `target_date`, `priority`, `assigned_to`, `progress`) VALUES
('WO-2026-081', 1, 50, 'in_progress', '2026-09-12', '2026-09-24', 'high', 'Assembly Cell 3', 68),
('WO-2026-082', 4, 100, 'planned', '2026-09-18', '2026-09-28', 'high', 'SMT Line 1', 15),
('WO-2026-083', 6, 25, 'in_progress', '2026-09-14', '2026-09-21', 'medium', 'Testing Lab B', 80);

INSERT INTO `job_cards` (`job_card_number`, `customer_name`, `contact_phone`, `vehicle_details`, `status`, `notes`, `before_photo`, `after_photo`, `created_at`) VALUES
('JC-2026-101', 'Sultan Al-Harthy', '+968 9123 4567', 'Toyota Land Cruiser V8 (Muscat 48291-A)', 'in_progress', 'Brake pad replacement and comprehensive 40,000 km general service.', 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=80', '2026-09-17 09:15:00'),
('JC-2026-102', 'Fatima Al-Balushi', '+968 9988 2341', 'Nissan Patrol Titanium (Barka 19482-B)', 'completed', 'Front bumper paint repair & ceramic coating polish.', 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&auto=format&fit=crop&q=80', '2026-09-18 11:30:00'),
('JC-2026-103', 'Al-Khadra Logistics LLC', '+968 9541 7720', 'Isuzu NPR 4.5T Fleet Truck (Sohar 8201-C)', 'draft', 'Transmission fluid flush, hydraulic check, differential inspection.', NULL, NULL, '2026-09-19 08:00:00');

INSERT INTO `estimates` (`estimate_number`, `job_card_id`, `customer_name`, `estimate_date`, `total_amount`, `subtotal`, `vat_amount`, `grand_total`, `status`, `notes`) VALUES
('EST-2026-051', 1, 'Sultan Al-Harthy', '2026-09-17', 140.000, 140.000, 7.000, 147.000, 'approved', 'OEM Ceramic brake pads (front + rear), hydraulic bleeding, 5% Oman VAT applied.'),
('EST-2026-052', 2, 'Fatima Al-Balushi', '2026-09-18', 320.000, 320.000, 16.000, 336.000, 'invoiced', 'Premium 3-stage polishing, ceramic coat, front bumper panel refinish.'),
('EST-2026-053', 3, 'Al-Khadra Logistics LLC', '2026-09-19', 85.000, 85.000, 4.250, 89.250, 'sent', 'Fleet discount applied. 5% Oman VAT breakdown included.');

INSERT INTO `notification_log` (`job_card_id`, `channel`, `recipient`, `message`, `status`, `sent_at`) VALUES
(1, 'WHATSAPP', '+96891234567', 'Hello Sultan, your vehicle inspection for JC-2026-101 is complete. Estimate EST-2026-051 for OMR 147.000 (inc. 5% VAT) is ready for your approval: https://erp.apex.om/est/051', 'SENT', '2026-09-17 10:02:15'),
(1, 'WHATSAPP', '+96891234567', 'Work in progress update: Before & after service photos uploaded to your job card JC-2026-101.', 'SENT', '2026-09-17 14:22:40'),
(2, 'WHATSAPP', '+96899882341', 'Greetings Fatima, job card JC-2026-102 is completed and ready for pickup. Invoice grand total: OMR 336.000.', 'SENT', '2026-09-18 16:45:10'),
(3, 'SMS', '+96895417720', 'Apex ERP: Estimate EST-2026-053 sent to Al-Khadra Logistics for OMR 89.250.', 'SENT', '2026-09-19 08:15:22');
