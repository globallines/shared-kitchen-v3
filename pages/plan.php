<?php
$u = current_user();
$plan_date = $_GET['date'] ?? tomorrow();
$preselect_menu = (int)($_GET['menu_id'] ?? 0);

// Add plan item
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_plan'])) {
    csrf_check();
    $fam = $u['role'] === 'admin' ? (int)$_POST['family_id'] : $u['family_id'];
    $meal = $_POST['meal_type'];
    $menu_id = (int)($_POST['menu_item_id'] ?: 0) ?: null;
    $custom = trim($_POST['custom_dish'] ?? '');
    $people = max(1, (int)$_POST['people']);
    $notes = trim($_POST['notes'] ?? '');

    if ($fam && ($menu_id || $custom)) {
        $stmt = $pdo->prepare("INSERT INTO menu_plans (date, family_id, meal_type, menu_item_id, custom_dish, people, notes, status, created_by) VALUES (?,?,?,?,?,?,?,'requested',?)");
        $stmt->execute([$plan_date, $fam, $meal, $menu_id, $custom ?: null, $people, $notes ?: null, $u['id']]);
        flash('Plan added');
        redirect('index.php?page=plan&date=' . $plan_date);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['confirm'])) {
    csrf_check();
    $pid = (int)$_POST['confirm'];
    $pdo->prepare("UPDATE menu_plans SET status = 'confirmed' WHERE id = ?")->execute([$pid]);
    flash('Plan confirmed');
    redirect('index.php?page=plan&date=' . $plan_date);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete'])) {
    csrf_check();
    $pid = (int)$_POST['delete'];
    $pdo->prepare("DELETE FROM menu_plans WHERE id = ?")->execute([$pid]);
    flash('Plan removed');
    redirect('index.php?page=plan&date=' . $plan_date);
}

// Generate shopping list
function _guess_category($name) {
    $n = strtolower($name);
    if (preg_match('/chicken/', $n)) return 'Chicken';
    if (preg_match('/mutton|lamb/', $n)) return 'Mutton';
    if (preg_match('/fish/', $n)) return 'Fish';
    if (preg_match('/dal|lentil|chickpea/', $n)) return 'Dal';
    if (preg_match('/rice|wheat|flour/', $n)) return 'Rice';
    if (preg_match('/oil|ghee|butter/', $n)) return 'Oil';
    if (preg_match('/milk|paneer|curd|yogurt/', $n)) return 'Milk';
    if (preg_match('/onion|tomato|potato|veg|carrot|beans|garlic|ginger|chilli/', $n)) return 'Vegetables';
    if (preg_match('/masala|spice|salt|pepper|cumin|turmeric/', $n)) return 'Spices';
    return 'Other';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['gen_shopping']) && in_array($u['role'], ['admin','cook'])) {
    csrf_check();
    $pdo->prepare("DELETE FROM shopping_list WHERE plan_date = ?")->execute([$plan_date]);

    $plans_q = $pdo->prepare("
        SELECT mp.*, m.ingredients
        FROM menu_plans mp
        LEFT JOIN menu_items m ON mp.menu_item_id = m.id
        WHERE mp.date = ? AND mp.status IN ('confirmed','requested')
    ");
    $plans_q->execute([$plan_date]);
    $plans = $plans_q->fetchAll();

    $items = [];
    foreach ($plans as $p) {
        if ($p['ingredients']) {
            foreach (explode(',', $p['ingredients']) as $ing) {
                $ing = trim($ing);
                if (!$ing) continue;
                if (!isset($items[$ing])) $items[$ing] = ['count' => 0, 'people' => 0];
                $items[$ing]['count']++;
                $items[$ing]['people'] += $p['people'];
            }
        }
    }

    $ins = $pdo->prepare("INSERT INTO shopping_list (plan_date, item_name, category, qty_needed, notes) VALUES (?,?,?,?,?)");
    foreach ($items as $name => $info) {
        $cat = _guess_category($name);
        $qty = "for ~{$info['people']} people";
        $ins->execute([$plan_date, $name, $cat, $qty, "needed for {$info['count']} dishes"]);
    }

    $pdo->prepare("UPDATE menu_plans SET status = 'shopping' WHERE date = ? AND status IN ('confirmed','requested')")->execute([$plan_date]);

    flash('Shopping list generated with ' . count($items) . ' items');
    redirect('index.php?page=shopping&date=' . $plan_date);
}

// Load plans
$plans_stmt = $pdo->prepare("
    SELECT mp.*, f.name AS family_name, m.name AS dish, m.color_theme, m.photo, m.diet_tags, u.name AS by_name
    FROM menu_plans mp
    JOIN families f ON mp.family_id = f.id
    JOIN users u ON mp.created_by = u.id
    LEFT JOIN menu_items m ON mp.menu_item_id = m.id
    WHERE mp.date = ?
    ORDER BY mp.family_id, FIELD(mp.meal_type,'Breakfast','Lunch','Snacks','Dinner')
");
$plans_stmt->execute([$plan_date]);
$plans = $plans_stmt->fetchAll();

$by_family = [];
foreach ($plans as $p) $by_family[$p['family_name']][] = $p;

$status_counts = ['draft'=>0, 'requested'=>0, 'confirmed'=>0, 'shopping'=>0, 'prepared'=>0];
foreach ($plans as $p) $status_counts[$p['status']]++;

$menu_items = $pdo->query("SELECT * FROM menu_items WHERE is_active = 1 ORDER BY cuisine, category, name")->fetchAll();
$grouped_menu = [];
foreach ($menu_items as $m) $grouped_menu[$m['cuisine']][] = $m;
$families = $pdo->query("SELECT * FROM families ORDER BY name")->fetchAll();

layout_open('Tomorrow Plan', 'Plan ahead');
?>

<form method="get" style="margin-bottom:14px;">
    <input type="hidden" name="page" value="plan">
    <div class="field" style="margin-bottom:0;">
        <label>Plan date</label>
        <input type="date" name="date" value="<?= h($plan_date) ?>" onchange="this.form.submit()">
    </div>
</form>

<div class="stat-grid three">
    <div class="stat"><span class="label">Plans</span><span class="value"><?= count($plans) ?></span></div>
    <div class="stat"><span class="label">Confirmed</span><span class="value"><?= $status_counts['confirmed'] + $status_counts['shopping'] ?></span></div>
    <div class="stat"><span class="label">Pending</span><span class="value"><?= $status_counts['requested'] ?></span></div>
</div>

<?php if (in_array($u['role'], ['admin','cook'])): ?>
<div class="section">
    <form method="post">
        <?= csrf_field() ?>
        <button type="submit" name="gen_shopping" value="1" class="btn" data-confirm="Generate shopping list from all plans?">
            🛒 Generate shopping list
        </button>
    </form>
</div>
<?php endif; ?>

<?php if (in_array($u['role'], ['family','admin'])): ?>
<div class="section">
    <div class="section-h"><span class="lead">Add to plan</span></div>
    <form method="post" class="card">
        <?= csrf_field() ?>
        <input type="hidden" name="add_plan" value="1">

        <?php if ($u['role'] === 'admin'): ?>
        <div class="field">
            <label>Family</label>
            <select name="family_id" required>
                <?php foreach ($families as $f): ?>
                    <option value="<?= (int)$f['id'] ?>"><?= h($f['name']) ?></option>
                <?php endforeach; ?>
            </select>
        </div>
        <?php endif; ?>

        <div class="row2">
            <div class="field">
                <label>Meal</label>
                <select name="meal_type">
                    <option>Breakfast</option><option selected>Lunch</option>
                    <option>Snacks</option><option>Dinner</option>
                </select>
            </div>
            <div class="field">
                <label>People</label>
                <input type="number" name="people" min="1" value="3">
            </div>
        </div>

        <div class="field">
            <label>Dish (grouped by cuisine)</label>
            <select name="menu_item_id">
                <option value="">— choose —</option>
                <?php foreach ($grouped_menu as $cuisine => $items): ?>
                    <optgroup label="<?= h($cuisine) ?>">
                    <?php foreach ($items as $m): ?>
                        <option value="<?= (int)$m['id'] ?>" <?= $m['id']==$preselect_menu?'selected':'' ?>><?= h($m['name']) ?></option>
                    <?php endforeach; ?>
                    </optgroup>
                <?php endforeach; ?>
            </select>
        </div>

        <div class="field">
            <label>Or custom dish</label>
            <input type="text" name="custom_dish" placeholder="e.g. Tom Yum">
        </div>

        <div class="field" style="margin-bottom:0;">
            <label>Notes</label>
            <input type="text" name="notes" placeholder="Optional">
        </div>

        <button type="submit" class="btn mt-12">+ Add plan</button>
    </form>
</div>
<?php endif; ?>

<div class="section">
    <div class="section-h"><span class="lead">Plans for <?= h(fmt_date($plan_date)) ?></span></div>
    <?php if (!$plans): ?>
        <div class="card"><div class="empty">No plans yet for this date.</div></div>
    <?php else: ?>
        <?php foreach ($by_family as $fam => $items): ?>
            <h4 style="margin: 16px 0 10px;"><?= h($fam) ?></h4>
            <?php foreach ($items as $p): ?>
                <div class="card">
                    <?= dish_photo($p['dish'] ?: $p['custom_dish'] ?: 'Custom', $p['color_theme'] ?: 'fi-default', $p['photo'], 'small') ?>
                    <div class="card-row">
                        <div class="grow">
                            <div class="card-name"><?= h($p['dish'] ?: $p['custom_dish']) ?></div>
                            <div class="card-meta"><?= h($p['meal_type']) ?> · <?= (int)$p['people'] ?> ppl · by <?= h($p['by_name']) ?></div>
                            <?= diet_tags_pills($p['diet_tags']) ?>
                            <?php if ($p['notes']): ?>
                                <div class="card-meta mt-4"><?= h($p['notes']) ?></div>
                            <?php endif; ?>
                        </div>
                        <span class="pill <?= $p['status']==='confirmed'||$p['status']==='shopping'?'ok':($p['status']==='requested'?'warn':'muted') ?>">
                            <?= h(ucfirst($p['status'])) ?>
                        </span>
                    </div>
                    <?php if ($p['status'] === 'requested' && (in_array($u['role'], ['admin','cook']) || $p['family_id'] == $u['family_id'])): ?>
                        <div class="btn-row">
                            <form method="post" style="flex:1">
                                <?= csrf_field() ?>
                                <button type="submit" name="confirm" value="<?= (int)$p['id'] ?>" class="btn small">✓ Confirm</button>
                            </form>
                            <form method="post" style="flex:1">
                                <?= csrf_field() ?>
                                <button type="submit" name="delete" value="<?= (int)$p['id'] ?>" class="btn secondary small" data-confirm="Remove?">Remove</button>
                            </form>
                        </div>
                    <?php endif; ?>
                </div>
            <?php endforeach; ?>
        <?php endforeach; ?>
    <?php endif; ?>
</div>

<?php layout_close(); ?>
