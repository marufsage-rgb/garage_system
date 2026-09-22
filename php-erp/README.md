# APEX ERP - Pure PHP, MySQL, HTML & CSS Stack

A complete, production-ready Enterprise Resource Planning (ERP) suite built strictly with:
- **HTML5**: Semantic, accessible markup.
- **Pure CSS3**: Responsive grid/flexbox layout, high-contrast typography, print stylesheet for tax invoices, zero CSS frameworks.
- **PHP 8+**: Clean, procedural/object-oriented PHP using PDO with prepared statements, strict typing, and session security.
- **MySQL / MariaDB**: Fully normalized relational database schema with foreign keys, cascading actions, and seed data.

---

## 🚀 Quick Setup (XAMPP / WAMP / LAMP)

1. **Clone or Copy Files**  
   Place the contents of this folder into your web root:
   - XAMPP: `C:\xampp\htdocs\apex-erp`
   - WAMP: `C:\wamp64\www\apex-erp`
   - Linux / Ubuntu: `/var/www/html/apex-erp`

2. **Import Database Schema**  
   Open phpMyAdmin or MySQL CLI and run:
   ```bash
   mysql -u root -p < schema.sql
   ```
   This will create the `apex_erp` database, all 11 tables, and initial seed records.

3. **Configure Database Credentials**  
   Edit `config.php` if your MySQL username, password, or port differ from defaults:
   ```php
   define('DB_HOST', '127.0.0.1');
   define('DB_PORT', '3306');
   define('DB_NAME', 'apex_erp');
   define('DB_USER', 'root');
   define('DB_PASS', '');
   ```

4. **Launch in Browser**  
   Open [http://localhost/apex-erp](http://localhost/apex-erp)

---

## 📁 System Architecture & File Structure

```
├── config.php        # Database PDO connection & helper functions
├── schema.sql        # Full MySQL relational schema & seed data
├── style.css         # Pure CSS3 styling (print media, tables, modals)
├── index.php         # Executive KPI Dashboard & operational alerts
├── sales.php         # Sales orders, customers & printable invoices
├── inventory.php     # SKU catalog, stock adjustments & reorder levels
├── purchases.php     # Procurement, purchase orders & receiving goods
├── finance.php       # General ledger transactions & cash flow
├── hr.php            # Employee directory & monthly payroll burn
├── sql_runner.php    # Interactive web SQL query console
└── README.md         # Deployment documentation
```

---

## 🛡️ Security Features
- **SQL Injection Prevention**: All queries use PDO prepared statements with parameter binding.
- **XSS Sanitization**: All output rendered via `htmlspecialchars(..., ENT_QUOTES, 'UTF-8')`.
- **Database Integrity**: Foreign key constraints with `ON DELETE CASCADE` prevent orphaned records.
- **Transactional Consistency**: Multi-table operations (such as sales orders and inventory adjustments) wrapped in `PDO::beginTransaction()` and `commit()`.
