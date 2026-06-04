<?php
$u = current_user();
$date = $_GET['date'] ?? tomorrow();

// Toggle purchased
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['toggle'])) {
    csrf_check();
    $id = (int)$_POST['toggle'];
    $cur = $pdo->prepare("SELECT is_purchased FROM shopping_list WHERE id = ?");
    $cur->execute([$id]);
    $row = $cur->fetch();
    if ($row) {
        $new = $row['is_purchased'] ? 0 : 1;
        $pdo->prepare("UPDATE shopping_list SET is_purchased = ?, purchased_by = ? WHERE id = ?")
            ->execute([$new, $u['id'], $id]);
    }
    redirect('index.php?page=shopping&date=' . $date);
}

// Save actual amount
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_actual'])) {
    csrf_check();
    $id = (int)$_POST['save_actual'];
    $qty = trim($_POST['actual_qty'] ?? '');
    $amt = (float)($_POST['actual_amount'] ?? 0);
    $pdo->prepare("UPDATE shopping_list SET actual_qty = ?, actual_amount = ?, is_purchased = 1, purchased_by = ? WHERE id = ?")
        ->execute([$qty ?: null, $amt ?: null, $u['id'], $id]);

    // Auto-create expense
    if ($amt > 0) {
        $item = $pdo->prepare("SELECT * FROM shopping_list WHERE id = ?");
        $item->execute([$id]);
        $sl = $item->fetch();
        $exp = $pdo->prepare("INSERT INTO expenses (date, purchased_by, category, item_name, quantity, amount, notes) VALUES (?,?,?,?,?,?,?)");
        $exp->execute([$date, $u['id'], $sl['category'] ?: 'Other', $sl['item_name'], $qty ?: '', $amt, 'Auto-added from shopping list']);
    }
    flash('Marked purchased · ' . fmt_money($amt));
    redirect('index.php?page=shopping&date=' . $date);
}

// Add manual item
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_item'])) {
    csrf_check();
    $name = trim($_POST['item_name']);
    $cat = $_POST['category'];
    $qty = trim($_POST['qty_needed'] ?? '');
    if ($name) {
        $pdo->prepare("INSERT INTO shopping_list (plan_date, item_name, category, qty_needed) VALUES (?,?,?,?)")
            ->execute([$date, $name, $cat, $qty ?: null]);
        flash('Added to list');
    }
    redirect('index.php?page=shopping&date=' . $date);
}

// Clear all
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['clear']) && in_array($u['role'], ['admin','cook'])) {
    csrf_check();
    $pdo->prepare("DELETE FROM shopping_list WHERE plan_date = ?")->execute([$date]);
    flash('List cleared');
    redirect('index.php?page=shopping&date=' . $date);
}

$stmt = $pdo->prepare("SELECT * FROM shopping_list WHERE plan_date = ? ORDER BY is_purchased ASC, category, item_name");
$stmt->execute([$date]);
$items = $stmt->fetchAll();

$pending = array_filter($items, fn($i) => !$i['is_purchased']);
$done = array_filter($items, fn($i) => $i['is_purchased']);
$total_spent = array_sum(array_map(fn($i) => (float)$i['actual_amount'], $items));

layout_open('Shopping List');
?>

<form method="get" style="margin-bottom:14px;">
    <input type="hidden" name="page" value="shopping">
    <div class="field" style="margin-bottom:0;">
        <label>For date</label>
        <input type="date" name="date" value="<?= h($date) ?>" onchange="this.form.submit()">
    </div>
</form>

<div class="stat-grid three">
    <div class="stat"><span class="label">To buy</span><span class="value"><?= count($pending) ?></span></div>
    <div class="stat"><span class="label">Bought</span><span class="value"><?= count($done) ?></span></div>
    <div class="stat"><span class="label">Spent</span><span class="value small"><?= fmt_money($total_spent) ?></span></div>
</div>

<?php if (!$items): ?>
    <div class="card mt-12">
        <div class="empty">
            <div class="ico">🛒</div>
            No shopping list yet.<br>
            <span class="small">Generate one from the Tomorrow Plan page,<br>or add items manually below.</span>
        </div>
    </div>
<?php else: ?>

    <?php if ($pending): ?>
    <div class="section">
        <div class="section-h"><span class="lead">To buy (<?= count($pending) ?>)</span></div>
        <div class="list">
        <?php foreach ($pending as $i): ?>
            <div class="card">
                <div class="card-row">
                    <div class="grow">
                        <div class="card-name"><?= h($i['item_name']) ?></div>
                        <div class="card-meta">
                            <?= h($i['category']) ?>
                            <?php if ($i['qty_needed']): ?> · <?= h($i['qty_needed']) ?><?php endif; ?>
                        </div>
                    </div>
                </div>
                <details style="margin-top:10px;">
                    <summary class="btn small secondary" style="cursor:pointer;">✓ Mark bought</summary>
                    <form method="post" style="margin-top:10px;">
                        <?= csrf_field() ?>
                        <div class="row2">
                            <div class="field" style="margin-bottom:8px;">
                                <label>Actual quantity</label>
                                <input type="text" name="actual_qty" placeholder="e.g. 2 kg">
                            </div>
                            <div class="field" style="margin-bottom:8px;">
                                <label>Amount paid (<?= APP_CURRENCY ?>)</label>
                                <input type="number" name="actual_amount" step="0.01" min="0" required>
                            </div>
                        </div>
                        <button type="submit" name="save_actual" value="<?= (int)$i['id'] ?>" class="btn small">Save & mark bought</button>
                    </form>
                </details>
            </div>
        <?php endforeach; ?>
        </div>
    </div>
    <?php endif; ?>

    <?php if ($done): ?>
    <div class="section">
        <div class="section-h"><span class="lead">Bought (<?= count($done) ?>)</span></div>
        <div class="list">
        <?php foreach ($done as $i): ?>
            <div class="card" style="opacity:0.7;">
                <div class="card-row">
                    <div class="grow">
                        <div class="card-name" style="text-decoration:line-through;"><?= h($i['item_name']) ?></div>
                        <div class="card-meta">
                            <?= h($i['actual_qty'] ?: $i['qty_needed']) ?>
                            <?php if ($i['actual_amount']): ?> · <?= fmt_money($i['actual_amount']) ?><?php endif; ?>
                        </div>
                    </div>
                    <form method="post" style="margin:0">
                        <?= csrf_field() ?>
                        <button type="submit" name="toggle" value="<?= (int)$i['id'] ?>" class="btn ghost small">Undo</button>
                    </form>
                </div>
            </div>
        <?php endforeach; ?>
        </div>
    </div>
    <?php endif; ?>

<?php endif; ?>

<div class="section">
    <div class="section-h"><span class="lead">Add manual item</span></div>
    <form method="post" class="card">
        <?= csrf_field() ?>
        <input type="hidden" name="add_item" value="1">
        <div class="field">
            <label>Item name</label>
            <input type="text" name="item_name" required placeholder="e.g. Coriander leaves">
        </div>
        <div class="row2">
            <div class="field">
                <label>Category</label>
                <select name="category">
                    <?php foreach (['Vegetables','Chicken','Mutton','Fish','Rice','Dal','Oil','Spices','Milk','Other'] as $c): ?>
                        <option><?= $c ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="field">
                <label>Quantity</label>
                <input type="text" name="qty_needed" placeholder="e.g. 1 bunch">
            </div>
        </div>
        <button type="submit" class="btn small">+ Add item</button>
    </form>
</div>

<?php if (in_array($u['role'], ['admin','cook']) && $items): ?>
<div class="section">
    <form method="post">
        <?= csrf_field() ?>
        <button type="submit" name="clear" value="1" class="btn ghost small" data-confirm="Clear entire shopping list?" style="color:var(--danger);">Clear list</button>
    </form>
</div>
<?php endif; ?>

<?php layout_close(); ?>
