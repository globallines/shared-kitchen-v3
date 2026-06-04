<?php
$u = require_role(['cook','driver','admin']);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $date = $_POST['date'] ?: today();
    $cat = $_POST['category'];
    $item = trim($_POST['item_name']);
    $qty = trim($_POST['quantity'] ?? '');
    $amount = (float)$_POST['amount'];
    $notes = trim($_POST['notes'] ?? '');
    $by = $u['role'] === 'admin' ? (int)($_POST['purchased_by'] ?? $u['id']) : $u['id'];

    $bill = handle_upload('bill', 'bills');

    if (!$item || $amount <= 0) {
        flash('Item name and amount required', 'error');
    } else {
        $stmt = $pdo->prepare("INSERT INTO expenses (date, purchased_by, category, item_name, quantity, amount, notes, bill_image) VALUES (?,?,?,?,?,?,?,?)");
        $stmt->execute([$date, $by, $cat, $item, $qty ?: null, $amount, $notes ?: null, $bill]);
        flash('Expense added: ' . fmt_money($amount));
        redirect('index.php?page=expenses');
    }
}

$staff = $pdo->query("SELECT * FROM users WHERE role IN ('cook','driver','admin') AND is_active = 1 ORDER BY name")->fetchAll();

layout_open('Add Expense');
?>
<form method="post" enctype="multipart/form-data">
    <?= csrf_field() ?>

    <div class="row2">
        <div class="field">
            <label>Date</label>
            <input type="date" name="date" value="<?= h(today()) ?>" required>
        </div>
        <div class="field">
            <label>Amount (<?= APP_CURRENCY ?>)</label>
            <input type="number" name="amount" step="0.01" min="0" required placeholder="0">
        </div>
    </div>

    <div class="field">
        <label>Category</label>
        <select name="category" required>
            <?php foreach (['Vegetables','Chicken','Mutton','Fish','Rice','Dal','Oil','Spices','Milk','Other'] as $c): ?>
                <option><?= $c ?></option>
            <?php endforeach; ?>
        </select>
    </div>

    <div class="field">
        <label>Item name</label>
        <input type="text" name="item_name" required placeholder="e.g. Tomatoes, Chicken thigh, Rice 5kg">
    </div>

    <div class="field">
        <label>Quantity (optional)</label>
        <input type="text" name="quantity" placeholder="e.g. 2 kg, 1 dozen, 500g">
    </div>

    <?php if ($u['role'] === 'admin'): ?>
    <div class="field">
        <label>Purchased by</label>
        <select name="purchased_by" required>
            <?php foreach ($staff as $s): ?>
                <option value="<?= (int)$s['id'] ?>"><?= h($s['name']) ?> (<?= h(role_label($s['role'])) ?>)</option>
            <?php endforeach; ?>
        </select>
    </div>
    <?php endif; ?>

    <div class="field">
        <label>Notes</label>
        <textarea name="notes" rows="2" placeholder="Optional notes"></textarea>
    </div>

    <div class="field">
        <label>Bill photo (optional)</label>
        <input type="file" name="bill" accept="image/*" capture="environment">
        <span class="hint">Max <?= MAX_UPLOAD_MB ?>MB · jpg/png/webp</span>
    </div>

    <button type="submit" class="btn">Save expense</button>
    <a href="index.php?page=expenses" class="btn secondary mt-8">Cancel</a>
</form>

<?php layout_close(); ?>
