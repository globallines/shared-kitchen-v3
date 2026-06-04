<?php
$u = require_role(['family','admin']);
$preselect_menu = (int)($_GET['menu_id'] ?? 0);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete'])) {
    csrf_check();
    $id = (int)$_POST['delete'];
    $check = $pdo->prepare("SELECT family_id FROM meal_requirements WHERE id = ?");
    $check->execute([$id]);
    $row = $check->fetch();
    if ($row && ($u['role']==='admin' || $row['family_id'] == $u['family_id'])) {
        $pdo->prepare("DELETE FROM meal_requirements WHERE id = ?")->execute([$id]);
        flash('Order removed');
    }
    redirect('index.php?page=order');
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save'])) {
    csrf_check();
    $date = $_POST['date'] ?: today();
    $meal_type = $_POST['meal_type'];
    $menu_id = (int)($_POST['menu_item_id'] ?: 0) ?: null;
    $custom = trim($_POST['custom_dish'] ?? '');
    $people = max(1, (int)($_POST['people'] ?? 1));
    $spice = $_POST['spice_level'] ?? 'Medium';
    $special = trim($_POST['special_request'] ?? '');
    $notes = trim($_POST['notes'] ?? '');
    $fam = $u['role']==='admin' ? (int)$_POST['family_id'] : $u['family_id'];

    if (!$menu_id && !$custom) {
        flash('Please select a dish or write a custom request', 'error');
    } else {
        $stmt = $pdo->prepare("INSERT INTO meal_requirements (date, family_id, user_id, meal_type, menu_item_id, custom_dish, people, spice_level, special_request, notes) VALUES (?,?,?,?,?,?,?,?,?,?)");
        $stmt->execute([$date, $fam, $u['id'], $meal_type, $menu_id, $custom ?: null, $people, $spice, $special ?: null, $notes ?: null]);
        flash('Order added');
        redirect('index.php?page=home');
    }
}

$menu = $pdo->query("SELECT * FROM menu_items WHERE is_active = 1 ORDER BY cuisine, category, name")->fetchAll();
$families = $pdo->query("SELECT * FROM families ORDER BY name")->fetchAll();

$grouped = [];
foreach ($menu as $m) $grouped[$m['cuisine']][] = $m;

layout_open('Add Requirement', 'New request');
?>
<form method="post">
    <?= csrf_field() ?>
    <input type="hidden" name="save" value="1">

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
            <label>Date</label>
            <input type="date" name="date" value="<?= h(today()) ?>" required>
        </div>
        <div class="field">
            <label>Meal</label>
            <select name="meal_type" required>
                <option>Breakfast</option>
                <option selected>Lunch</option>
                <option>Snacks</option>
                <option>Dinner</option>
            </select>
        </div>
    </div>

    <div class="field">
        <label>Choose dish (grouped by cuisine)</label>
        <select name="menu_item_id">
            <option value="">— choose dish —</option>
            <?php foreach ($grouped as $cuisine => $items): ?>
                <optgroup label="<?= h($cuisine) ?>">
                    <?php foreach ($items as $m): ?>
                        <option value="<?= (int)$m['id'] ?>" <?= $m['id']==$preselect_menu?'selected':'' ?>><?= h($m['name']) ?> <?php if ($m['diet_tags']): ?>· <?= h($m['diet_tags']) ?><?php endif; ?></option>
                    <?php endforeach; ?>
                </optgroup>
            <?php endforeach; ?>
        </select>
        <span class="hint">Or write a custom dish below</span>
    </div>

    <div class="field">
        <label>Custom dish (optional)</label>
        <input type="text" name="custom_dish" placeholder="e.g. Tom Yum soup">
    </div>

    <div class="row2">
        <div class="field">
            <label>People</label>
            <input type="number" name="people" min="1" max="20" value="3" required>
        </div>
        <div class="field">
            <label>Spice level</label>
            <select name="spice_level">
                <option>Mild</option>
                <option selected>Medium</option>
                <option>Spicy</option>
            </select>
        </div>
    </div>

    <div class="field">
        <label>Special request</label>
        <input type="text" name="special_request" placeholder="e.g. less oil, no onion">
    </div>

    <div class="field">
        <label>Notes</label>
        <textarea name="notes" rows="2"></textarea>
    </div>

    <button type="submit" class="btn">Save requirement</button>
    <a href="index.php?page=home" class="btn secondary mt-8">Cancel</a>
</form>

<?php
$today_list = $pdo->prepare("
    SELECT mr.*, m.name AS dish, m.color_theme, m.photo
    FROM meal_requirements mr
    LEFT JOIN menu_items m ON mr.menu_item_id = m.id
    WHERE mr.family_id = ? AND mr.date = ?
    ORDER BY FIELD(mr.meal_type,'Breakfast','Lunch','Snacks','Dinner')
");
$today_list->execute([$u['family_id'] ?: 0, today()]);
$existing = $today_list->fetchAll();

if ($existing): ?>
<div class="section">
    <div class="section-h"><span class="lead">Today's orders so far</span></div>
    <?php foreach ($existing as $o): ?>
        <div class="card">
            <div class="card-row">
                <div class="grow">
                    <div class="card-name"><?= h($o['dish'] ?: $o['custom_dish']) ?></div>
                    <div class="card-meta"><?= h($o['meal_type']) ?> · <?= (int)$o['people'] ?> ppl</div>
                </div>
                <?php if ($o['status'] === 'pending'): ?>
                    <form method="post" style="margin:0">
                        <?= csrf_field() ?>
                        <button type="submit" name="delete" value="<?= (int)$o['id'] ?>" class="btn ghost small" data-confirm="Remove this order?" style="color:var(--danger);">Remove</button>
                    </form>
                <?php else: ?>
                    <span class="pill ok"><?= h(ucfirst($o['status'])) ?></span>
                <?php endif; ?>
            </div>
        </div>
    <?php endforeach; ?>
</div>
<?php endif; ?>

<?php layout_close(); ?>
