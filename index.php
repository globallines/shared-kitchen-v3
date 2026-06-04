<?php
require __DIR__ . '/includes/config.php';
require __DIR__ . '/includes/helpers.php';
require __DIR__ . '/includes/layout.php';

$page = $_GET['page'] ?? 'home';

if ($page === 'login') { require __DIR__ . '/pages/login.php'; exit; }
if ($page === 'logout') {
    session_destroy();
    redirect('index.php?page=login');
}

require_login();

$page_map = [
    'home'         => 'pages/home.php',
    'cuisine'      => 'pages/cuisine.php',
    'cuisine_view' => 'pages/cuisine_view.php',
    'menu_view'    => 'pages/menu_view.php',
    'order'        => 'pages/order.php',
    'requirement'  => 'pages/order.php',
    'plan'         => 'pages/plan.php',
    'recipes'      => 'pages/recipes.php',
    'recipe_view'  => 'pages/recipe_view.php',
    'recipe_new'   => 'pages/recipe_new.php',
    'expenses'     => 'pages/expenses.php',
    'expense_new'  => 'pages/expense_new.php',
    'payment_new'  => 'pages/payment_new.php',
    'feedback'     => 'pages/feedback.php',
    'feedback_new' => 'pages/feedback_new.php',
    'shopping'     => 'pages/shopping.php',
    'manage'       => 'pages/manage.php',
    'menu_new'     => 'pages/menu_new.php',
    'menu_edit'    => 'pages/menu_edit.php',
    'user_new'     => 'pages/user_new.php',
    'user_edit'    => 'pages/user_edit.php',
    'family_edit'  => 'pages/family_edit.php',
    'settlement'   => 'pages/settlement.php',
];

$file = $page_map[$page] ?? null;
if ($file && file_exists(__DIR__ . '/' . $file)) {
    require __DIR__ . '/' . $file;
} else {
    layout_open('Not found');
    echo '<div class="empty"><div class="ico">?</div>Page not found.</div>';
    layout_close();
}
