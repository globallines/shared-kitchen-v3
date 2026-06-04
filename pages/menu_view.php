<?php
$u = current_user();
$id = (int)($_GET['id'] ?? 0);

$stmt = $pdo->prepare("SELECT * FROM menu_items WHERE id = ?");
$stmt->execute([$id]);
$m = $stmt->fetch();

if (!$m) {
    layout_open('Not found');
    echo '<div class="empty"><div class="ico">?</div>Dish not found.</div>';
    layout_close();
    exit;
}

// Past feedback for this dish (aggregate)
$fb_stmt = $pdo->prepare("
    SELECT AVG(rating) AS avg_rating, COUNT(*) AS cnt
    FROM feedback
    WHERE menu_item_id = ?
");
$fb_stmt->execute([$id]);
$fb_agg = $fb_stmt->fetch();

// Recent feedback comments
$fb_list_stmt = $pdo->prepare("
    SELECT f.*, u.name AS user_name, fa.name AS family_name
    FROM feedback f
    JOIN users u ON f.user_id = u.id
    LEFT JOIN families fa ON f.family_id = fa.id
    WHERE f.menu_item_id = ?
    ORDER BY f.created_at DESC
    LIMIT 10
");
$fb_list_stmt->execute([$id]);
$fb_list = $fb_list_stmt->fetchAll();

// Times ordered (popularity)
$ord_stmt = $pdo->prepare("SELECT COUNT(*) FROM meal_requirements WHERE menu_item_id = ?");
$ord_stmt->execute([$id]);
$ord_count = (int)$ord_stmt->fetchColumn();

layout_open($m['name'], 'Dish');
?>

<?= dish_photo($m['name'], $m['color_theme'] ?: 'fi-default', $m['photo'], 'large') ?>

<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">
    <span class="pill"><?= h($m['cuisine']) ?></span>
    <span class="pill"><?= h($m['category']) ?></span>
    <?php if ($fb_agg && $fb_agg['cnt'] > 0): ?>
        <span class="pill warn">
            <?= str_repeat('★', round($fb_agg['avg_rating'])) ?>
            <?= number_format($fb_agg['avg_rating'], 1) ?>
            (<?= (int)$fb_agg['cnt'] ?>)
        </span>
    <?php endif; ?>
</div>

<?php if ($m['diet_tags']): ?>
    <?= diet_tags_pills($m['diet_tags']) ?>
<?php endif; ?>

<?php if ($m['description']): ?>
<div class="card mt-12 mb-12">
    <div class="card-name" style="margin-bottom:6px;">About this dish</div>
    <div><?= nl2br(h($m['description'])) ?></div>
</div>
<?php endif; ?>

<?php
// Order / Plan buttons - hide for cooks (they cook, don't order) and drivers
if (in_array($u['role'], ['family','admin'])):
?>
<div class="btn-row mb-16">
    <a href="index.php?page=order&menu_id=<?= (int)$m['id'] ?>" class="btn">＋ Order today</a>
    <a href="index.php?page=plan&menu_id=<?= (int)$m['id'] ?>" class="btn secondary">＋ Plan tomorrow</a>
</div>
<?php endif; ?>

<?php if ($m['ingredients']): ?>
<div class="section">
    <div class="section-h"><span class="lead">Ingredients</span></div>
    <div class="card">
        <?php
        $ings = array_filter(array_map('trim', explode(',', $m['ingredients'])));
        foreach ($ings as $ing):
        ?>
            <div class="kv"><span class="k">• <?= h($ing) ?></span><span class="v"></span></div>
        <?php endforeach; ?>
    </div>
    <?php if ($u['role'] === 'admin' || $u['role'] === 'cook'): ?>
        <div class="small mt-8 muted">These ingredients are used to auto-generate the shopping list.</div>
    <?php endif; ?>
</div>
<?php endif; ?>

<div class="section">
    <div class="section-h">
        <span class="lead">Stats</span>
    </div>
    <div class="stat-grid three">
        <div class="stat">
            <span class="label">Times ordered</span>
            <span class="value"><?= $ord_count ?></span>
        </div>
        <div class="stat">
            <span class="label">Avg rating</span>
            <span class="value small">
                <?= $fb_agg && $fb_agg['cnt'] > 0 ? number_format($fb_agg['avg_rating'], 1) . ' / 5' : '—' ?>
            </span>
        </div>
        <div class="stat">
            <span class="label">Reviews</span>
            <span class="value"><?= $fb_agg ? (int)$fb_agg['cnt'] : 0 ?></span>
        </div>
    </div>
</div>

<?php if ($fb_list): ?>
<div class="section">
    <div class="section-h"><span class="lead">Recent feedback</span></div>
    <div class="list">
    <?php foreach ($fb_list as $f): ?>
        <div class="card">
            <div class="card-row">
                <div class="grow">
                    <div class="strong"><?= h($f['user_name']) ?>
                        <?php if ($f['family_name']): ?> · <span class="small"><?= h($f['family_name']) ?></span><?php endif; ?>
                    </div>
                    <div class="small mb-4"><?= fmt_date($f['created_at']) ?></div>
                    <?php if ($f['improvement']): ?>
                        <div class="card-meta mt-4" style="color:var(--accent);">Suggestion: <?= h($f['improvement']) ?></div>
                    <?php endif; ?>
                    <?php if ($f['comment']): ?>
                        <div class="mt-4"><?= nl2br(h($f['comment'])) ?></div>
                    <?php endif; ?>
                </div>
                <div style="color:#f59e0b;font-size:14px;white-space:nowrap;">
                    <?= str_repeat('★', (int)$f['rating']) ?>
                </div>
            </div>
        </div>
    <?php endforeach; ?>
    </div>
</div>
<?php else: ?>
<div class="section">
    <div class="card">
        <div class="empty" style="padding:18px;">
            <div class="small">No feedback yet for this dish.</div>
        </div>
    </div>
</div>
<?php endif; ?>

<?php if ($u['role'] === 'admin'): ?>
<div class="section">
    <a href="index.php?page=menu_edit&id=<?= (int)$m['id'] ?>" class="btn ghost small" style="display:inline-flex;">Edit this dish</a>
</div>
<?php endif; ?>

<a href="index.php?page=cuisine_view&c=<?= urlencode($m['cuisine']) ?>" class="small mt-12" style="display:inline-block;">← Back to <?= h($m['cuisine']) ?></a>

<?php layout_close(); ?>
