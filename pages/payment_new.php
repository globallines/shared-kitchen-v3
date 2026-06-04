<?php
$u = require_role('admin');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $date = $_POST['date'] ?: today();
    $fam = (int)$_POST['family_id'];
    $amount = (float)$_POST['amount'];
    $mode = trim($_POST['mode'] ?? '');
    $notes = trim($_POST['notes'] ?? '');

    if (!$fam || $amount <= 0) {
        flash('Family and amount required', 'error');
    } else {
        $stmt = $pdo->prepare("INSERT INTO payments (date, family_id, amount, mode, notes, recorded_by) VALUES (?,?,?,?,?,?)");
        $stmt->execute([$date, $fam, $amount, $mode ?: null, $notes ?: null, $u['id']]);
        flash('Payment recorded: ' . fmt_money($amount));
        redirect('index.php?page=expenses&tab=payments');
    }
}

$families = $pdo->query("SELECT * FROM families ORDER BY name")->fetchAll();

layout_open('Record Payment');
?>
<form method="post">
    <?= csrf_field() ?>

    <div class="field">
        <label>Family paying</label>
        <select name="family_id" required>
            <?php foreach ($families as $f): ?>
                <option value="<?= (int)$f['id'] ?>"><?= h($f['name']) ?> (<?= h($f['head_name']) ?>)</option>
            <?php endforeach; ?>
        </select>
    </div>

    <div class="row2">
        <div class="field">
            <label>Date</label>
            <input type="date" name="date" value="<?= h(today()) ?>" required>
        </div>
        <div class="field">
            <label>Amount (<?= APP_CURRENCY ?>)</label>
            <input type="number" name="amount" step="0.01" min="0" required>
        </div>
    </div>

    <div class="field">
        <label>Payment mode</label>
        <select name="mode">
            <option value="">— select —</option>
            <option>Cash</option>
            <option>UPI</option>
            <option>Bank transfer</option>
            <option>Cheque</option>
            <option>Other</option>
        </select>
    </div>

    <div class="field">
        <label>Notes</label>
        <textarea name="notes" rows="2"></textarea>
    </div>

    <button type="submit" class="btn">Record payment</button>
    <a href="index.php?page=expenses&tab=payments" class="btn secondary mt-8">Cancel</a>
</form>

<?php layout_close(); ?>
