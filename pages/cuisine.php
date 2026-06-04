<?php
$u = current_user();

// Count dishes per cuisine
$counts = [];
$rows = $pdo->query("SELECT cuisine, COUNT(*) AS c FROM menu_items WHERE is_active = 1 GROUP BY cuisine")->fetchAll();
foreach ($rows as $r) $counts[$r['cuisine']] = $r['c'];

layout_open('Cuisines', 'Explore');
?>

<div class="cuisine-grid">
    <?php foreach (CUISINES as $c): ?>
        <?php $slug = cuisine_slug($c); $cnt = $counts[$c] ?? 0; ?>
        <a href="index.php?page=cuisine_view&c=<?= urlencode($c) ?>" class="cuisine-tile fi-c-<?= h($slug) ?>">
            <div class="label-overlay">
                <?= h($c) ?>
                <?php if ($cnt): ?><span style="opacity:0.7;font-size:11px;font-weight:500;display:block;">· <?= $cnt ?> dishes</span><?php endif; ?>
            </div>
        </a>
    <?php endforeach; ?>
</div>

<div class="section mt-16">
    <div class="section-h"><span class="lead">All recipes</span></div>
    <a href="index.php?page=recipes" class="btn secondary">📖 Browse recipe library</a>
</div>

<?php layout_close(); ?>
