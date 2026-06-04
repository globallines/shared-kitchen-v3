<?php
$u = current_user();

$cuisine = $_GET['cuisine'] ?? '';
$diet = $_GET['diet'] ?? '';
$q = trim($_GET['q'] ?? '');

$where = ['1=1'];
$params = [];
if ($cuisine) { $where[] = 'r.cuisine = ?'; $params[] = $cuisine; }
if ($diet) { $where[] = 'r.diet_tags LIKE ?'; $params[] = '%' . $diet . '%'; }
if ($q) { $where[] = '(r.title LIKE ? OR r.description LIKE ?)'; $params[] = "%$q%"; $params[] = "%$q%"; }

$sql = "SELECT r.*, u.name AS author FROM recipes r JOIN users u ON r.created_by = u.id WHERE " . implode(' AND ', $where) . " ORDER BY r.created_at DESC";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$recipes = $stmt->fetchAll();

$cuisines_used = $pdo->query("SELECT DISTINCT cuisine FROM recipes WHERE cuisine IS NOT NULL ORDER BY cuisine")->fetchAll(PDO::FETCH_COLUMN);

layout_open('Recipes', 'Library');

function recipe_url_with($params_to_set) {
    $merged = array_merge(['page' => 'recipes', 'q' => $_GET['q'] ?? '', 'cuisine' => $_GET['cuisine'] ?? '', 'diet' => $_GET['diet'] ?? ''], $params_to_set);
    return 'index.php?' . http_build_query(array_filter($merged));
}
?>

<form method="get" class="mb-12">
    <input type="hidden" name="page" value="recipes">
    <?php if ($cuisine): ?><input type="hidden" name="cuisine" value="<?= h($cuisine) ?>"><?php endif; ?>
    <?php if ($diet): ?><input type="hidden" name="diet" value="<?= h($diet) ?>"><?php endif; ?>
    <div class="field" style="margin-bottom:8px;">
        <input type="search" name="q" value="<?= h($q) ?>" placeholder="🔍 Search recipes...">
    </div>
</form>

<div class="chips" style="margin-bottom:6px;">
    <a href="<?= h(recipe_url_with(['cuisine' => ''])) ?>" class="chip <?= !$cuisine ? 'on' : '' ?>">All cuisines</a>
    <?php foreach ($cuisines_used as $c): ?>
        <a href="<?= h(recipe_url_with(['cuisine' => $c])) ?>" class="chip <?= $cuisine === $c ? 'on' : '' ?>"><?= h($c) ?></a>
    <?php endforeach; ?>
</div>

<div class="chips" style="margin-bottom:14px;">
    <?php foreach (DIET_TAGS as $tag): ?>
        <a href="<?= h(recipe_url_with(['diet' => $diet === $tag ? '' : $tag])) ?>" class="chip diet-chip <?= $diet === $tag ? 'on' : '' ?>"><?= h($tag) ?></a>
    <?php endforeach; ?>
</div>

<div class="section">
    <div class="section-h">
        <span class="lead"><?= count($recipes) ?> recipe<?= count($recipes) !== 1 ? 's' : '' ?></span>
        <a href="index.php?page=recipe_new">+ New</a>
    </div>

    <?php if (!$recipes): ?>
        <div class="card"><div class="empty">No recipes match your filters.<br><a href="index.php?page=recipes" class="btn small mt-12" style="display:inline-flex;">Clear filters</a></div></div>
    <?php else: ?>
        <?php foreach ($recipes as $r): ?>
            <a href="index.php?page=recipe_view&id=<?= (int)$r['id'] ?>" class="card-link">
                <div class="card">
                    <?= dish_photo($r['title'], $r['color_theme'] ?: 'fi-default', $r['photo']) ?>
                    <div class="card-row">
                        <div class="grow">
                            <div class="card-name"><?= h($r['title']) ?></div>
                            <div class="card-meta">
                                <?= h($r['cuisine']) ?> · <?= h($r['difficulty']) ?> · <?= (int)$r['time_min'] ?> min · <?= (int)$r['servings'] ?> servings
                            </div>
                            <?= diet_tags_pills($r['diet_tags']) ?>
                            <div class="small mt-4">by <?= h($r['author']) ?></div>
                        </div>
                        <?php if ($r['video_url']): ?>
                            <span class="pill warn">▶</span>
                        <?php endif; ?>
                    </div>
                </div>
            </a>
        <?php endforeach; ?>
    <?php endif; ?>
</div>

<a href="index.php?page=recipe_new" class="fab">+</a>

<?php layout_close(); ?>
