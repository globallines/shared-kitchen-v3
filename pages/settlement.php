<?php
$u = current_user();
$month = $_GET['month'] ?? this_month();

$exp = $pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM expenses WHERE DATE_FORMAT(date,'%Y-%m') = ?");
$exp->execute([$month]);
$total = $exp->fetchColumn();
$share = $total / 2;

$pa = $pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM payments WHERE family_id = 1 AND DATE_FORMAT(date,'%Y-%m') = ?");
$pa->execute([$month]);
$a = $pa->fetchColumn();

$pb = $pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM payments WHERE family_id = 2 AND DATE_FORMAT(date,'%Y-%m') = ?");
$pb->execute([$month]);
$b = $pb->fetchColumn();

$bal_a = $a - $share;
$bal_b = $b - $share;

// Category breakdown
$cat_sql = $pdo->prepare("SELECT category, SUM(amount) AS amt, COUNT(*) AS cnt FROM expenses WHERE DATE_FORMAT(date,'%Y-%m') = ? GROUP BY category ORDER BY amt DESC");
$cat_sql->execute([$month]);
$cats = $cat_sql->fetchAll();

layout_open('Settlement');
?>

<form method="get" style="margin-bottom:14px;">
    <input type="hidden" name="page" value="settlement">
    <div class="field" style="margin-bottom:0;">
        <label>Month</label>
        <input type="month" name="month" value="<?= h($month) ?>" onchange="this.form.submit()">
    </div>
</form>

<div class="card">
    <h3 style="margin-bottom:10px;"><?= h(month_label($month)) ?></h3>
    <div class="kv"><span class="k">Total expenses</span><span class="v"><?= fmt_money($total) ?></span></div>
    <div class="kv"><span class="k">Each family's share (÷2)</span><span class="v"><?= fmt_money($share) ?></span></div>
</div>

<div class="section">
    <div class="section-h"><span class="lead">Family A — Karthi</span></div>
    <div class="card">
        <div class="kv"><span class="k">Share to pay</span><span class="v"><?= fmt_money($share) ?></span></div>
        <div class="kv"><span class="k">Already paid</span><span class="v"><?= fmt_money($a) ?></span></div>
        <hr class="dashed">
        <div class="kv">
            <span class="k strong"><?= $bal_a >= 0 ? 'Excess paid' : 'Balance due' ?></span>
            <span class="v <?= $bal_a >= 0 ? 'ok' : 'danger' ?>" style="font-size:18px;">
                <?= fmt_money(abs($bal_a)) ?>
            </span>
        </div>
    </div>
</div>

<div class="section">
    <div class="section-h"><span class="lead">Family B — Raj</span></div>
    <div class="card">
        <div class="kv"><span class="k">Share to pay</span><span class="v"><?= fmt_money($share) ?></span></div>
        <div class="kv"><span class="k">Already paid</span><span class="v"><?= fmt_money($b) ?></span></div>
        <hr class="dashed">
        <div class="kv">
            <span class="k strong"><?= $bal_b >= 0 ? 'Excess paid' : 'Balance due' ?></span>
            <span class="v <?= $bal_b >= 0 ? 'ok' : 'danger' ?>" style="font-size:18px;">
                <?= fmt_money(abs($bal_b)) ?>
            </span>
        </div>
    </div>
</div>

<?php if ($cats): ?>
<div class="section">
    <div class="section-h"><span class="lead">Where the money went</span></div>
    <div class="card">
        <?php foreach ($cats as $c): ?>
            <div class="kv">
                <span class="k"><?= h($c['category']) ?> <span class="small">(<?= (int)$c['cnt'] ?>)</span></span>
                <span class="v"><?= fmt_money($c['amt']) ?></span>
            </div>
        <?php endforeach; ?>
    </div>
</div>
<?php endif; ?>

<?php layout_close(); ?>
