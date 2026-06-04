<?php
// =======================================================
// Shared Kitchen — Configuration
// Reads DB settings from environment (Railway) when present,
// falling back to local constants for cPanel/local dev.
// =======================================================

$__dbUrl = getenv('DATABASE_URL') ?: getenv('MYSQL_URL') ?: getenv('MYSQL_PUBLIC_URL') ?: '';
if ($__dbUrl) {
    $__p = parse_url($__dbUrl);
    define('DB_HOST', $__p['host'] ?? 'localhost');
    define('DB_PORT', (string)($__p['port'] ?? 3306));
    define('DB_NAME', ltrim($__p['path'] ?? '', '/') ?: 'railway');
    define('DB_USER', isset($__p['user']) ? urldecode($__p['user']) : 'root');
    define('DB_PASS', isset($__p['pass']) ? urldecode($__p['pass']) : '');
} else {
    define('DB_HOST', getenv('MYSQLHOST') ?: 'localhost');
    define('DB_PORT', (string)(getenv('MYSQLPORT') ?: 3306));
    define('DB_NAME', getenv('MYSQLDATABASE') ?: 'kitchen');
    define('DB_USER', getenv('MYSQLUSER') ?: 'root');
    define('DB_PASS', getenv('MYSQLPASSWORD') ?: '');
}

// =======================================================
define('APP_NAME', 'Shared Kitchen');
define('APP_TIMEZONE', 'Asia/Kolkata');
define('APP_CURRENCY', '₹');
define('APP_SECRET', getenv('APP_SECRET') ?: 'change-this-to-any-random-long-string-12345');
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
// Where dish/recipe/bill photos are served from. The original media still
// lives on the old host, so default to its absolute URL; override with PHOTO_BASE_URL.
define('UPLOAD_URL', getenv('PHOTO_BASE_URL') ?: 'https://avanith.com/kitchen/uploads/');
define('MAX_UPLOAD_MB', 5);

date_default_timezone_set(APP_TIMEZONE);
if (session_status() === PHP_SESSION_NONE) session_start();

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER, DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    die('<div style="font-family:sans-serif;padding:30px;max-width:500px;margin:50px auto;background:#fff;border:1px solid #fcc;border-radius:10px;">
        <h2 style="color:#b91c1c;">Database connection failed</h2>
        <p style="color:#888;font-size:12px;margin-top:20px;">Error: ' . htmlspecialchars($e->getMessage()) . '</p>
    </div>');
}

function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
