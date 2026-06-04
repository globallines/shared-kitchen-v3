<?php
$u = current_user();
$cuisine = $_GET['c'] ?? 'Indian';
$diet_filter = $_GET['diet'] ?? '';

$where = ['is_active = 1', 'cuisine = ?'];
$params = [$cuisine];
if ($diet_filter) {
    $where[] = "diet_tags LIKE ?";
    $params[] = '%' . $diet_filter . '%';
}

$sql = "SELECT * FROM menu_items WHERE " . implode(' AND ', $where) . " ORDER BY category, name";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$dishes = $stmt->fetchAll();

// Also recipes from this cuisine
$rec_stmt = $pdo->prepare("SELECT * FROM recipes WHERE cuisine = ? " . ($diet_filter ? "AND diet_tags LIKE ?" : "") . " ORDER BY created_at DESC LIMIT 10");
$rec_params = [$cuisine];
if ($diet_filter) $rec_params[] = '%' . $diet_filter . '%';
$rec_stmt->execute($rec_params);
$recipes = $rec_stmt->fetchAll();

layout_open($cuisine, 'Cuisine');
?>

<div class="chips" style="margin-bottom:6px;">
    <a href="index.php?page=cuisine_view&c=<?= urlencode($cuisine) ?>" class="chip <?= !$diet_filter ? 'on' : '' ?>">All</a>
    <?php foreach (DIET_TAGS as $tag): ?>
        <a href="index.php?page=cuisine_view&c=<?= urlencode($cuisine) ?>&diet=<?= urlencode($tag) ?>" class="chip diet-chip <?= $diet_filter === $tag ? 'on' : '' ?>"><?= h($tag) ?></a>
    <?php endforeach; ?>
</div>

<?php if (!$dishes && !$recipes): ?>
    <div class="card mt-12">
        <div class="empty">
            <div class="ico">🍽</div>
            No dishes found<?= $diet_filter ? ' for "' . h($diet_filter) . '"' : '' ?>.<br>
            <?php if ($diet_filter): ?>
                <a href="index.php?page=cuisine_view&c=<?= urlencode($cuisine) ?>" class="btn small mt-12" style="display:inline-flex;">Clear filter</a>
            <?php endif; ?>
        </div>
    </div>
<?php endif; ?>

<?php if ($dishes): ?>
<div class="section">
    <div class="section-h"><span class="lead">Dishes (<?= count($dishes) ?>)</span></div>
    <?php foreach ($dishes as $d): ?>
        <div class="card">
            <a href="index.php?page=menu_view&id=<?= (int)$d['id'] ?>" class="card-link" style="display:block;">
                <?= dish_photo($d['name'], $d['color_theme'] ?: 'fi-default', $d['photo']) ?>
                <div class="card-row">
                    <div class="grow">
                        <div class="card-name"><?= h($d['name']) ?></div>
                        <div class="card-meta">
                            <?= h($d['category']) ?>
                            <?php if ($d['description']): ?> · <?= h($d['description']) ?><?php endif; ?>
                        </div>
                        <?= diet_tags_pills($d['diet_tags']) ?>
                    </div>
                    <div class="small" style="white-space:nowrap;color:var(--primary);">View →</div>
                </div>
            </a>
            <?php if (in_array($u['role'], ['family','admin'])): ?>
            <div class="btn-row">
                <a href="index.php?page=order&menu_id=<?= (int)$d['id'] ?>" class="btn small">＋ Order today</a>
                <a href="index.php?page=plan&menu_id=<?= (int)$d['id'] ?>" class="btn secondary small">＋ Plan tomorrow</a>
            </div>
            <?php endif; ?>
        </div>
    <?php endforeach; ?>
</div>
<?php endif; ?>

<?php if ($recipes): ?>
<div class="section">
    <div class="section-h"><span class="lead">Recipes (<?= count($recipes) ?>)</span></div>
    <?php foreach ($recipes as $r): ?>
        <a href="index.php?page=recipe_view&id=<?= (int)$r['id'] ?>" class="card-link">
            <div class="card">
                <?= dish_photo($r['title'], $r['color_theme'] ?: 'fi-default', $r['photo'], 'small') ?>
                <div class="card-row">
                    <div class="grow">
                        <div class="card-name"><?= h($r['title']) ?></div>
                        <div class="card-meta"><?= h($r['difficulty']) ?> · <?= (int)$r['time_min'] ?> min · <?= (int)$r['servings'] ?> servings</div>
                        <?= diet_tags_pills($r['diet_tags']) ?>
                    </div>
                </div>
            </div>
        </a>
    <?php endforeach; ?>
</div>
<?php endif; ?>

<?php layout_close(); ?>
