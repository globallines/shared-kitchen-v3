<?php
$u = current_user();
$id = (int)($_GET['id'] ?? 0);

$stmt = $pdo->prepare("SELECT r.*, u.name AS author FROM recipes r JOIN users u ON r.created_by = u.id WHERE r.id = ?");
$stmt->execute([$id]);
$r = $stmt->fetch();

if (!$r) {
    layout_open('Not found');
    echo '<div class="empty">Recipe not found.</div>';
    layout_close();
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['comment'])) {
    csrf_check();
    $comment = trim($_POST['comment']);
    $rating = (int)($_POST['rating'] ?? 0) ?: null;
    if ($comment) {
        $pdo->prepare("INSERT INTO recipe_comments (recipe_id, user_id, comment, rating) VALUES (?,?,?,?)")
            ->execute([$id, $u['id'], $comment, $rating]);
        flash('Comment added');
        redirect('index.php?page=recipe_view&id=' . $id);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_to_plan'])) {
    csrf_check();
    if ($u['family_id']) {
        // Add to tomorrow's plan as custom_dish
        $pdo->prepare("INSERT INTO menu_plans (date, family_id, meal_type, custom_dish, people, status, created_by) VALUES (?, ?, 'Lunch', ?, 4, 'requested', ?)")
            ->execute([tomorrow(), $u['family_id'], $r['title'], $u['id']]);
        flash('Added "' . $r['title'] . '" to tomorrow\'s plan!');
        redirect('index.php?page=plan');
    } else {
        flash('Family role required to add to plan', 'error');
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete'])) {
    csrf_check();
    if ($u['role'] === 'admin' || $r['created_by'] == $u['id']) {
        $pdo->prepare("DELETE FROM recipes WHERE id = ?")->execute([$id]);
        flash('Recipe deleted');
        redirect('index.php?page=recipes');
    }
}

$ings = $pdo->prepare("SELECT * FROM recipe_ingredients WHERE recipe_id = ? ORDER BY sort_order, id");
$ings->execute([$id]);
$ingredients = $ings->fetchAll();

$cmt_stmt = $pdo->prepare("SELECT c.*, u.name FROM recipe_comments c JOIN users u ON c.user_id = u.id WHERE recipe_id = ? ORDER BY c.created_at DESC");
$cmt_stmt->execute([$id]);
$comments = $cmt_stmt->fetchAll();

// Basic nutrition lookup
$NUTRI_DB = [
    'rice' => [130, 2.7, 28, 0.3, 0.4],
    'basmati rice' => [121, 3.5, 25, 0.4, 0.4],
    'brown rice' => [111, 2.6, 23, 0.9, 1.8],
    'chicken' => [165, 31, 0, 3.6, 0],
    'mutton' => [294, 25, 0, 21, 0],
    'fish' => [206, 22, 0, 12, 0],
    'egg' => [155, 13, 1.1, 11, 0],
    'paneer' => [265, 18, 1.2, 21, 0],
    'tofu' => [76, 8, 1.9, 4.8, 0.3],
    'toor dal' => [343, 22, 63, 1.5, 15],
    'urad dal' => [341, 25, 59, 1.6, 18],
    'dal' => [343, 22, 63, 1.5, 15],
    'oil' => [884, 0, 0, 100, 0],
    'olive oil' => [884, 0, 0, 100, 0],
    'ghee' => [900, 0, 0, 100, 0],
    'mixed vegetables' => [65, 2.5, 13, 0.3, 4],
    'vegetables' => [50, 2, 10, 0.3, 3],
    'onion' => [40, 1.1, 9, 0.1, 1.7],
    'tomato' => [18, 0.9, 3.9, 0.2, 1.2],
    'potato' => [77, 2, 17, 0.1, 2.2],
    'pasta' => [131, 5, 25, 1.1, 1.8],
    'milk' => [60, 3.2, 4.8, 3.3, 0],
    'curd' => [60, 3.5, 4.7, 3.3, 0],
    'butter' => [717, 0.8, 0.1, 81, 0],
];
function nutri_lookup($name) {
    global $NUTRI_DB;
    $k = strtolower(trim($name));
    if (isset($NUTRI_DB[$k])) return $NUTRI_DB[$k];
    foreach ($NUTRI_DB as $key => $v) {
        if (strpos($k, $key) !== false || strpos($key, $k) !== false) return $v;
    }
    return null;
}

$nut_total = [0,0,0,0,0];
$unknown = [];
foreach ($ingredients as $ing) {
    $vals = nutri_lookup($ing['name']);
    if (!$vals) { $unknown[] = $ing['name']; continue; }
    $g = (float)$ing['qty'];
    if ($ing['unit'] === 'kg' || $ing['unit'] === 'l') $g *= 1000;
    $factor = $g / 100;
    foreach ($vals as $i => $v) $nut_total[$i] += $v * $factor;
}
$serv = max(1, (int)$r['servings']);
$nut_per = array_map(fn($x) => $x / $serv, $nut_total);

layout_open($r['title'], 'Recipe');
?>

<?= dish_photo($r['title'], $r['color_theme'] ?: 'fi-default', $r['photo'], 'large') ?>

<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">
    <span class="pill"><?= h($r['cuisine']) ?></span>
    <span class="pill"><?= h($r['difficulty']) ?></span>
    <span class="pill"><?= (int)$r['time_min'] ?> min</span>
    <?php if ($r['diet_tags']): foreach (explode(',', $r['diet_tags']) as $tag): $tag = trim($tag); if (!$tag) continue; ?>
        <span class="pill diet"><?= h($tag) ?></span>
    <?php endforeach; endif; ?>
</div>

<?php if ($r['description']): ?>
    <div class="card mb-12"><?= nl2br(h($r['description'])) ?></div>
<?php endif; ?>

<?php if ($ingredients): ?>
<div class="stat-grid mb-12">
    <div class="stat"><span class="label">Calories</span><span class="value"><?= round($nut_per[0]) ?></span><span class="sub">kcal/serving</span></div>
    <div class="stat"><span class="label">Protein</span><span class="value"><?= round($nut_per[1], 1) ?>g</span><span class="sub">per serving</span></div>
</div>
<?php endif; ?>

<?php if ($u['role'] === 'family'): ?>
<form method="post" class="mb-12">
    <?= csrf_field() ?>
    <button type="submit" name="add_to_plan" value="1" class="btn">＋ Add to Tomorrow Plan</button>
</form>
<?php endif; ?>

<?php if ($r['video_url']): ?>
<a href="<?= h($r['video_url']) ?>" target="_blank" class="btn secondary mb-12">▶ Watch video</a>
<?php endif; ?>

<?php if ($ingredients): ?>
<div class="section">
    <div class="section-h"><span class="lead">Ingredients</span></div>
    <div class="card">
        <?php foreach ($ingredients as $ing): ?>
            <div class="kv">
                <span class="k"><?= h($ing['name']) ?></span>
                <span class="v"><?= h((float)$ing['qty']) ?> <?= h($ing['unit']) ?></span>
            </div>
        <?php endforeach; ?>
    </div>
</div>

<div class="section">
    <div class="section-h"><span class="lead">Full nutrition (approx)</span></div>
    <div class="card">
        <h4 class="mb-8">Per serving (1 of <?= $serv ?>)</h4>
        <div class="stat-grid">
            <div class="stat"><span class="label">Carbs</span><span class="value small"><?= round($nut_per[2], 1) ?>g</span></div>
            <div class="stat"><span class="label">Fat</span><span class="value small"><?= round($nut_per[3], 1) ?>g</span></div>
        </div>
        <hr class="dashed">
        <div class="kv"><span class="k">Total recipe</span><span class="v"><?= round($nut_total[0]) ?> kcal</span></div>
        <div class="kv"><span class="k">Fiber per serving</span><span class="v"><?= round($nut_per[4], 1) ?>g</span></div>
        <?php if ($unknown): ?>
            <div class="suggest mt-8"><b>Note:</b> No data for: <?= h(implode(', ', $unknown)) ?>.</div>
        <?php endif; ?>
    </div>
    <div class="disclaimer">Nutrition values are approximate, for general wellness only. Not medical advice.</div>
</div>
<?php endif; ?>

<?php if ($r['steps']): ?>
<div class="section">
    <div class="section-h"><span class="lead">Cooking steps</span></div>
    <div class="card"><div style="white-space:pre-line; line-height:1.7;"><?= h($r['steps']) ?></div></div>
</div>
<?php endif; ?>

<?php if ($r['notes']): ?>
<div class="section">
    <div class="section-h"><span class="lead">Tips</span></div>
    <div class="card"><div style="white-space:pre-line;"><?= h($r['notes']) ?></div></div>
</div>
<?php endif; ?>

<div class="section">
    <div class="section-h"><span class="lead">Comments (<?= count($comments) ?>)</span></div>
    <form method="post" class="card">
        <?= csrf_field() ?>
        <input type="hidden" name="comment" value="1">
        <div class="field">
            <label>Your rating</label>
            <div class="stars" data-input="rating">
                <span class="star">★</span><span class="star">★</span><span class="star">★</span><span class="star">★</span><span class="star">★</span>
            </div>
            <input type="hidden" name="rating" value="">
        </div>
        <div class="field" style="margin-bottom:0;">
            <textarea name="comment" rows="2" placeholder="Share your tip or feedback..." required></textarea>
        </div>
        <button type="submit" class="btn small mt-12">Post comment</button>
    </form>

    <?php if ($comments): ?>
        <div class="list mt-12">
        <?php foreach ($comments as $c): ?>
            <div class="card">
                <div class="card-row">
                    <div class="grow">
                        <div class="strong"><?= h($c['name']) ?> <?php if ($c['rating']): ?><span style="color:#f59e0b;font-size:13px;"><?= str_repeat('★', $c['rating']) ?></span><?php endif; ?></div>
                        <div class="small mb-4"><?= fmt_date($c['created_at']) ?></div>
                        <div><?= nl2br(h($c['comment'])) ?></div>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>
        </div>
    <?php endif; ?>
</div>

<?php if ($u['role'] === 'admin' || $r['created_by'] == $u['id']): ?>
    <form method="post" class="mt-12">
        <?= csrf_field() ?>
        <button type="submit" name="delete" value="1" class="btn ghost small" data-confirm="Delete this recipe?" style="color:var(--danger);">Delete recipe</button>
    </form>
<?php endif; ?>

<?php layout_close(); ?>
