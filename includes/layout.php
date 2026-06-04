<?php
function layout_open($page_title = '', $subtitle = '') {
    $u = current_user();
    ?><!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<meta name="theme-color" content="#0f4c3a">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Kitchen">
<link rel="icon" href="assets/favicon.png">
<link rel="apple-touch-icon" href="assets/icon-192.png">
<link rel="manifest" href="manifest.json">
<link rel="stylesheet" href="assets/css/app.css">
<title><?= h($page_title ? $page_title . ' · ' : '') ?><?= h(APP_NAME) ?></title>
</head>
<body>
<div class="app">
<?php if ($u): ?>
    <div class="topbar">
        <div class="title">
            <span class="small"><?= h($subtitle ?: APP_NAME) ?></span>
            <h2><?= h($page_title ?: 'Home') ?></h2>
        </div>
        <div class="right">
            <?php if ($u['role'] === 'admin'): ?>
                <a href="index.php?page=manage" class="gear" title="Setup">⚙</a>
            <?php endif; ?>
            <a href="index.php?page=logout" style="text-decoration:none;" title="<?= h($u['name']) ?> · Sign out">
                <div class="avatar"><?= h(avatar_initial($u['name'])) ?></div>
            </a>
        </div>
    </div>
<?php endif; ?>
<main>
<?php $flash = get_flash(); if ($flash): ?>
    <div class="flash <?= $flash['type'] === 'error' ? 'error' : 'ok' ?>"><?= h($flash['msg']) ?></div>
<?php endif; ?>
<?php
}

function layout_close() {
    $u = current_user();
    $tabs = $u ? nav_tabs() : [];
?>
</main>
<?php if ($u && $tabs): ?>
<nav class="bottomnav">
    <?php foreach ($tabs as $t): ?>
        <a href="index.php?page=<?= h($t[0]) ?>" class="<?= tab_active($t[0]) ?>">
            <span class="ico"><?= h($t[2]) ?></span>
            <span><?= h($t[1]) ?></span>
        </a>
    <?php endforeach; ?>
</nav>
<?php endif; ?>
</div>
<script src="assets/js/app.js"></script>
</body>
</html>
<?php
}
