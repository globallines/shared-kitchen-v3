<?php
$u = current_user();
$tab = $_GET['tab'] ?? 'expenses';
$month = $_GET['month'] ?? this_month();

// Handle delete (admin only)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_expense']) && $u['role'] === 'admin') {
    csrf_check();
    $pdo->prepare("DELETE FROM expenses WHERE id = ?")->execute([(int)$_POST['delete_expense']]);
    flash('Expense deleted');
    redirect('index.php?page=expenses');
}
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_payment']) && $u['role'] === 'admin') {
    csrf_check();
    $pdo->prepare("DELETE FROM payments WHERE id = ?")->execute([(int)$_POST['delete_payment']]);
    flash('Payment deleted');
    redirect('index.php?page=expenses&tab=payments');
}

layout_open('Money');

// Month picker
?>
<div class="tabs">
    <a href="index.php?page=expenses&tab=expenses&month=<?= h($month) ?>" class="<?= $tab === 'expenses' ? 'active' : '' ?>">Expenses</a>
    <a href="index.php?page=expenses&tab=payments&month=<?= h($month) ?>" class="<?= $tab === 'payments' ? 'active' : '' ?>">Payments</a>
    <a href="index.php?page=settlement" class="">Settlement</a>
</div>

<form method="get" style="margin-bottom:14px;">
    <input type="hidden" name="page" value="expenses">
    <input type="hidden" name="tab" value="<?= h($tab) ?>">
    <div class="field" style="margin-bottom:0;">
        <label>Month</label>
        <input type="month" name="month" value="<?= h($month) ?>" onchange="this.form.submit()">
    </div>
</form>

<?php if ($tab === 'expenses'): ?>

    <?php
    $sql = "SELECT e.*, u.name AS buyer FROM expenses e JOIN users u ON e.purchased_by = u.id WHERE DATE_FORMAT(e.date,'%Y-%m') = ? ORDER BY e.date DESC, e.id DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$month]);
    $list = $stmt->fetchAll();
    $total = array_sum(array_column($list, 'amount'));

    // Group by category
    $by_cat = [];
    foreach ($list as $e) {
        $by_cat[$e['category']] = ($by_cat[$e['category']] ?? 0) + $e['amount'];
    }
    arsort($by_cat);
    ?>

    <div class="stat-grid">
        <div class="stat"><span class="label">Total</span><span class="value"><?= fmt_money($total) ?></span></div>
        <div class="stat"><span class="label">Each share</span><span class="value"><?= fmt_money($total / 2) ?></span></div>
    </div>

    <?php if ($by_cat): ?>
    <div class="section">
        <div class="section-h"><span class="lead">By category</span></div>
        <div class="card">
            <?php foreach ($by_cat as $cat => $amt): ?>
                <div class="kv"><span class="k"><?= h($cat) ?></span><span class="v"><?= fmt_money($amt) ?></span></div>
            <?php endforeach; ?>
        </div>
    </div>
    <?php endif; ?>

    <div class="section">
        <div class="section-h">
            <span class="lead">All expenses · <?= h(month_label($month)) ?></span>
            <?php if (in_array($u['role'], ['cook','driver','admin'])): ?>
                <a href="index.php?page=expense_new" class="btn ghost small">+ Add</a>
            <?php endif; ?>
        </div>
        <?php if (!$list): ?>
            <div class="card"><div class="empty">No expenses recorded for this month.</div></div>
        <?php else: ?>
            <div class="list">
            <?php foreach ($list as $e): ?>
                <div class="card">
                    <div class="card-row">
                        <div class="grow">
                            <div class="card-name"><?= h($e['item_name']) ?></div>
                            <div class="card-meta">
                                <?= h($e['category']) ?> · <?= h($e['quantity']) ?> · <?= fmt_date_short($e['date']) ?> · by <?= h($e['buyer']) ?>
                            </div>
                            <?php if ($e['notes']): ?>
                                <div class="card-meta mt-4"><?= h($e['notes']) ?></div>
                            <?php endif; ?>
                            <?php if ($e['bill_image']): ?>
                                <a href="<?= h(UPLOAD_URL . $e['bill_image']) ?>" target="_blank" class="small mt-4" style="display:inline-block;">📎 View bill</a>
                            <?php endif; ?>
                        </div>
                        <div class="text-right">
                            <div class="strong"><?= fmt_money($e['amount']) ?></div>
                            <?php if ($u['role'] === 'admin'): ?>
                                <form method="post" style="margin-top:6px;">
                                    <?= csrf_field() ?>
                                    <button type="submit" name="delete_expense" value="<?= (int)$e['id'] ?>" class="btn ghost small" data-confirm="Delete this expense?" style="color:var(--danger);font-size:11px;padding:2px 6px;">Delete</button>
                                </form>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>

    <?php if (in_array($u['role'], ['cook','driver','admin'])): ?>
        <a href="index.php?page=expense_new" class="fab">+</a>
    <?php endif; ?>

<?php else: // payments tab ?>

    <?php
    $sql = "SELECT p.*, f.name AS family_name, u.name AS by_name FROM payments p JOIN families f ON p.family_id = f.id JOIN users u ON p.recorded_by = u.id WHERE DATE_FORMAT(p.date,'%Y-%m') = ? ORDER BY p.date DESC, p.id DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$month]);
    $list = $stmt->fetchAll();

    $totals = ['Family A' => 0, 'Family B' => 0];
    foreach ($list as $p) $totals[$p['family_name']] = ($totals[$p['family_name']] ?? 0) + $p['amount'];
    ?>

    <div class="stat-grid">
        <div class="stat"><span class="label">Family A paid</span><span class="value"><?= fmt_money($totals['Family A'] ?? 0) ?></span></div>
        <div class="stat"><span class="label">Family B paid</span><span class="value"><?= fmt_money($totals['Family B'] ?? 0) ?></span></div>
    </div>

    <div class="section">
        <div class="section-h">
            <span class="lead">All payments · <?= h(month_label($month)) ?></span>
            <?php if ($u['role'] === 'admin'): ?>
                <a href="index.php?page=payment_new" class="btn ghost small">+ Add</a>
            <?php endif; ?>
        </div>
        <?php if (!$list): ?>
            <div class="card"><div class="empty">No payments this month.</div></div>
        <?php else: ?>
            <div class="list">
            <?php foreach ($list as $p): ?>
                <div class="card">
                    <div class="card-row">
                        <div class="grow">
                            <div class="card-name"><?= h($p['family_name']) ?> paid</div>
                            <div class="card-meta">
                                <?= fmt_date_short($p['date']) ?>
                                <?php if ($p['mode']): ?> · <?= h($p['mode']) ?><?php endif; ?>
                                · recorded by <?= h($p['by_name']) ?>
                            </div>
                            <?php if ($p['notes']): ?>
                                <div class="card-meta mt-4"><?= h($p['notes']) ?></div>
                            <?php endif; ?>
                        </div>
                        <div class="text-right">
                            <div class="strong" style="color:var(--ok);"><?= fmt_money($p['amount']) ?></div>
                            <?php if ($u['role'] === 'admin'): ?>
                                <form method="post" style="margin-top:6px;">
                                    <?= csrf_field() ?>
                                    <button type="submit" name="delete_payment" value="<?= (int)$p['id'] ?>" class="btn ghost small" data-confirm="Delete this payment?" style="color:var(--danger);font-size:11px;padding:2px 6px;">Delete</button>
                                </form>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>

    <?php if ($u['role'] === 'admin'): ?>
        <a href="index.php?page=payment_new" class="fab">+</a>
    <?php endif; ?>

<?php endif; ?>

<?php layout_close(); ?>
