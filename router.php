<?php
// Router for PHP's built-in web server (php -S).
// Adds the security denies the old .htaccess provided, then serves
// real files directly and sends everything else to the front controller.

$path = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$base = basename($path);

// Block sensitive paths / files
if (preg_match('#^/(includes|\.git)(/|$)#', $path)
    || preg_match('#\.(sql|md|dockerignore)$#i', $path)
    || in_array($base, ['Dockerfile', '.DS_Store', 'install.php', 'router.php'], true)) {
    http_response_code(403);
    echo 'Forbidden';
    return true;
}

$full = __DIR__ . $path;

// Let the built-in server serve existing static files / php files directly
if ($path !== '/' && file_exists($full) && !is_dir($full)) {
    return false;
}

// Front controller
require __DIR__ . '/index.php';
