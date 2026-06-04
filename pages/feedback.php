<?php
$u = current_user();

// Aggregate feedback by menu item
$by_item = $pdo->query("
    SELECT m.id, m.name, m.category,
        COUNT(f.id) AS cnt,
        AVG(f.rating) AS avg_rating
    FROM feedback f
    JOIN menu_items m ON f.menu_item_id = m.id
    GROUP BY m.id
    ORDER BY cnt DESC
")->fetchAll();

// Recent feedback
$recent = $pdo->query("
    SELECT f.*, u.name AS user_name, m.name AS dish, fa.name AS family_name
    FROM feedback f
    JOIN users u ON f.user_id = u.id
    LEFT JOIN families fa ON f.family_id = fa.id
    LEFT JOIN menu_items m ON f.menu_item_id = m.id
    ORDER BY f.created_at DESC
    LIMIT 30
")->fetchAll();

layout_open('Reviews');
?>

<?php if ($by_item): ?>
<div class="section">
    <div class="section-h"><span class="lead">By dish — average rating</span></div>
    <div class="list">
    <?php foreach ($by_item as $b): ?>
        <div class="card">
            <div class="card-row">
                <div class="grow">
                    <div class="card-name"><?= h($b['name']) ?></div>
                    <div class="card-meta"><?= h($b['category']) ?> · <?= (int)$b['cnt'] ?> review<?= $b['cnt']>1?'s':'' ?></div>
                </div>
                <div class="text-right">
                    <div style="color:#f59e0b;font-size:16px;">
                        <?= str_repeat('★', round($b['avg_rating'])) ?><?= str_repeat('☆', 5 - round($b['avg_rating'])) ?>
                    </div>
                    <div class="small"><?= number_format($b['avg_rating'], 1) ?> / 5</div>
                </div>
            </div>
        </div>
    <?php endforeach; ?>
    </div>
</div>
<?php endif; ?>

<div class="section">
    <div class="section-h"><span class="lead">Recent feedback</span></div>
    <?php if (!$recent): ?>
        <div class="card"><div class="empty"><div class="ico">★</div>No feedback yet.<br><span class="small">Families will rate dishes after meals are marked prepared.</span></div></div>
    <?php else: ?>
        <div class="list">
        <?php foreach ($recent as $f): ?>
            <div class="card">
                <div class="card-row">
                    <div class="grow">
                        <div class="card-name"><?= h($f['dish'] ?: 'Custom dish') ?></div>
                        <div class="card-meta"><?= h($f['user_name']) ?> · <?= h($f['family_name']) ?> · <?= fmt_date_short($f['date']) ?></div>
                        <?php if ($f['improvement']): ?>
                            <div class="card-meta mt-4" style="color:var(--accent);"><?= h($f['improvement']) ?></div>
                        <?php endif; ?>
                        <?php if ($f['comment']): ?>
                            <div class="mt-4"><?= h($f['comment']) ?></div>
                        <?php endif; ?>
                    </div>
                    <div style="color:#f59e0b;font-size:14px;"><?= str_repeat('★', $f['rating']) ?></div>
                </div>
            </div>
        <?php endforeach; ?>
        </div>
    <?php endif; ?>
</div>

<?php layout_close(); ?>
