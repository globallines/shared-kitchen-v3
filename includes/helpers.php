<?php
// =======================================================
// Helper functions
// =======================================================

// Diet tags - canonical list (10)
const DIET_TAGS = [
    'Diabetic-friendly',
    'Heart-healthy',
    'Low-sodium',
    'Gluten-free',
    'Lactose-free',
    'Keto',
    'High-protein',
    'Vegan',
    'Jain',
    'Mediterranean',
];

// All cuisines
const CUISINES = [
    'Indian', 'South Indian', 'North Indian',
    'Chinese', 'Japanese', 'Thai', 'Korean',
    'Italian', 'Mexican',
    'Mediterranean', 'Middle Eastern',
    'Continental', 'Other'
];

// Cuisine color slug map (for CSS class fi-c-...)
function cuisine_slug($cuisine) {
    return strtolower(str_replace(' ', '-', $cuisine));
}

// Color theme map for dishes (CSS class)
const FOOD_COLORS = [
    'fi-default'  => 'Warm Orange',
    'fi-biryani'  => 'Saffron',
    'fi-veg'      => 'Fresh Green',
    'fi-paneer'   => 'Tomato Red',
    'fi-fish'     => 'Coral Pink',
    'fi-pasta'    => 'Mustard',
    'fi-japanese' => 'Pink Plum',
    'fi-dosa'     => 'Burnt Orange',
    'fi-dal'      => 'Golden',
    'fi-egg'      => 'Yellow',
    'fi-chicken'  => 'Deep Red',
];

// Auto-pick a color based on category/cuisine
function auto_color($category, $cuisine = '') {
    $cat = strtolower($category);
    $cui = strtolower($cuisine);
    if (str_contains($cat, 'veg') && !str_contains($cat, 'non')) return 'fi-veg';
    if (str_contains($cat, 'chicken')) return 'fi-chicken';
    if (str_contains($cat, 'fish')) return 'fi-fish';
    if (str_contains($cat, 'mutton')) return 'fi-paneer';
    if (str_contains($cat, 'egg')) return 'fi-egg';
    if (str_contains($cui, 'japanese')) return 'fi-japanese';
    if (str_contains($cui, 'italian')) return 'fi-pasta';
    if (str_contains($cat, 'breakfast')) return 'fi-dosa';
    return 'fi-default';
}

function redirect($url) { header('Location: ' . $url); exit; }

function current_user() {
    global $pdo;
    if (empty($_SESSION['user_id'])) return null;
    $stmt = $pdo->prepare('SELECT u.*, f.name AS family_name FROM users u LEFT JOIN families f ON u.family_id = f.id WHERE u.id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    return $stmt->fetch();
}

function require_login() {
    if (empty($_SESSION['user_id'])) redirect('index.php?page=login');
}

function require_role($roles) {
    require_login();
    $u = current_user();
    if (!$u || !in_array($u['role'], (array)$roles)) {
        die('<div style="padding:30px;font-family:sans-serif;text-align:center;max-width:400px;margin:50px auto;">
            <h2>Access denied</h2>
            <p>You don\'t have permission to view this page.</p>
            <a href="index.php">← Back to home</a>
        </div>');
    }
    return $u;
}

function flash($msg, $type = 'ok') { $_SESSION['flash'] = ['msg' => $msg, 'type' => $type]; }
function get_flash() {
    if (!empty($_SESSION['flash'])) {
        $f = $_SESSION['flash']; unset($_SESSION['flash']); return $f;
    }
    return null;
}

function fmt_money($n) { return APP_CURRENCY . number_format((float)$n, 0, '.', ','); }
function fmt_date($d) { return $d ? date('d M Y', strtotime($d)) : ''; }
function fmt_date_short($d) { return $d ? date('d M', strtotime($d)) : ''; }

function csrf_token() {
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16));
    return $_SESSION['csrf'];
}
function csrf_check() {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (empty($_POST['csrf']) || !hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'])) {
            die('Invalid request token. Please go back and try again.');
        }
    }
}
function csrf_field() { return '<input type="hidden" name="csrf" value="' . h(csrf_token()) . '">'; }

function role_label($r) {
    $map = ['admin' => 'Admin', 'family' => 'Family', 'cook' => 'Cook', 'driver' => 'Driver'];
    return $map[$r] ?? $r;
}

function this_month() { return date('Y-m'); }
function month_label($ym) { return date('F Y', strtotime($ym . '-01')); }
function today() { return date('Y-m-d'); }
function tomorrow() { return date('Y-m-d', strtotime('+1 day')); }

function handle_upload($input_name, $sub_dir = '') {
    if (empty($_FILES[$input_name]) || $_FILES[$input_name]['error'] === UPLOAD_ERR_NO_FILE) return null;
    if ($_FILES[$input_name]['error'] !== UPLOAD_ERR_OK) return null;
    if ($_FILES[$input_name]['size'] > MAX_UPLOAD_MB * 1024 * 1024) return null;

    $allowed = ['jpg','jpeg','png','webp','gif'];
    $ext = strtolower(pathinfo($_FILES[$input_name]['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $allowed)) return null;

    $dir = UPLOAD_DIR . $sub_dir;
    if (!is_dir($dir)) @mkdir($dir, 0775, true);
    $name = date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $path = $dir . '/' . $name;
    if (move_uploaded_file($_FILES[$input_name]['tmp_name'], $path)) {
        return $sub_dir . '/' . $name;
    }
    return null;
}

// Avatar from name
function avatar_initial($name) {
    $name = trim($name);
    return $name ? strtoupper(substr($name, 0, 1)) : '?';
}

// Get user's avatar initial (1 letter)
function user_avatar($name) {
    return '<div class="avatar">' . h(avatar_initial($name)) . '</div>';
}

// Render a dish photo block (gradient placeholder, optionally with real photo)
function dish_photo($name, $color_theme = 'fi-default', $photo = null, $size = '') {
    $cls = 'food-img ' . h($color_theme) . ($size ? ' ' . $size : '');
    if ($photo && (file_exists(UPLOAD_DIR . $photo) || preg_match('#^https?://#', UPLOAD_URL))) {
        $url = h(UPLOAD_URL . $photo);
        return '<div class="' . $cls . '" style="background-image:url(\''. $url .'\');background-size:cover;background-position:center;"><div class="food-img-label">' . h($name) . '</div></div>';
    }
    return '<div class="' . $cls . '"><div class="food-img-label">' . h($name) . '</div></div>';
}

// Render diet tag pills
function diet_tags_pills($tags_str) {
    if (!$tags_str) return '';
    $tags = array_filter(array_map('trim', explode(',', $tags_str)));
    if (!$tags) return '';
    $html = '<div class="diet-tags-row">';
    foreach ($tags as $t) {
        $html .= '<span class="pill diet">' . h($t) . '</span>';
    }
    return $html . '</div>';
}

// Unified bottom nav - SAME for all roles (Home/Cuisine/Plan/Shop/Rate)
function nav_tabs() {
    return [
        ['home',     'Home',    '⌂'],
        ['cuisine',  'Cuisine', '☷'],
        ['plan',     'Plan',    '＋'],
        ['shopping', 'Shop',    '🛒'],
        ['feedback', 'Rate',    '★'],
    ];
}

function tab_active($name) {
    $current = $_GET['page'] ?? 'home';
    // Map sub-pages to nav tabs
    $map = [
        'home'         => 'home',
        'order'        => 'plan',
        'plan'         => 'plan',
        'cuisine'      => 'cuisine',
        'cuisine_view' => 'cuisine',
        'recipes'      => 'cuisine',
        'recipe_view'  => 'cuisine',
        'recipe_new'   => 'cuisine',
        'shopping'     => 'shopping',
        'feedback'     => 'feedback',
        'feedback_new' => 'feedback',
    ];
    $active = $map[$current] ?? $current;
    return $active === $name ? 'active' : '';
}
