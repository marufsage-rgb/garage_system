<?php
/**
 * APEX ERP - Database & System Configuration
 * Stack: Pure PHP 8+, MySQL (PDO), HTML5, Pure CSS3
 */

declare(strict_types=1);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Database Credentials (Configure for your local XAMPP/WAMP or production MySQL)
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'apex_erp');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');

/**
 * Returns a singleton PDO instance with strict error handling
 */
function getDbConnection(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_PORT, DB_NAME);
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // Render friendly error if database is not yet migrated
            die('<div style="font-family:sans-serif;padding:30px;max-width:600px;margin:50px auto;border:1px solid #e2e8f0;border-radius:12px;background:#fff5f5;color:#9b2c2c;">'
                . '<h2 style="margin-top:0">Database Connection Error</h2>'
                . '<p>Could not connect to MySQL database <strong>' . htmlspecialchars(DB_NAME) . '</strong> on ' . htmlspecialchars(DB_HOST) . '.</p>'
                . '<p style="font-size:13px;background:#fed7d7;padding:10px;border-radius:6px;font-family:monospace;">' . htmlspecialchars($e->getMessage()) . '</p>'
                . '<p><strong>Quick Fix:</strong> Import <code>schema.sql</code> into your MySQL/MariaDB database and verify credentials in <code>config.php</code>.</p>'
                . '</div>');
        }
    }
    return $pdo;
}

/**
 * Sanitizes output for HTML injection prevention
 */
function e(?string $string): string {
    return htmlspecialchars($string ?? '', ENT_QUOTES, 'UTF-8');
}

/**
 * Formats currency values
 */
function money(float $amount): string {
    return '$' . number_format($amount, 2);
}

/**
 * Flash notification helper
 */
function setFlash(string $type, string $message): void {
    $_SESSION['flash'] = ['type' => $type, 'message' => $message];
}

function getFlash(): ?array {
    if (isset($_SESSION['flash'])) {
        $f = $_SESSION['flash'];
        unset($_SESSION['flash']);
        return $f;
    }
    return null;
}
