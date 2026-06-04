<?php
$u = current_user();
$today = today();
$tomorrow = tomorrow();
$month = this_month();
$subtitle = 'Today · ' . date('d M');

// Handle cook actions (mark prepared / accepted)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $u['role'] === 'cook') {
    csrf_check();
    if (isset($_POST['mark_prepared'])) {
        $pdo->prepare("UPDATE meal_requirements SET status = 'prepared' WHERE id = ?")->execute([(int)$_POST['mark_prepared']]);
        flash('Marked as prepared');
        redirect('index.php?page=home');
    }
    if (isset($_POST['mark_accepted'])) {
        $pdo->prepare("UPDATE meal_requirements SET status = 'accepted' WHERE id = ?")->execute([(int)$_POST['mark_accepted']]);
        flash('Order accepted');
        redirect('index.php?page=home');
    }
}

// =================== ADMIN HOME ===================
if ($u['role'] === 'admin') {
    $today_reqs = $pdo->prepare("SELECT COUNT(*) FROM meal_requirements WHERE date = ?");
    $today_reqs->execute([$today]);
    $reqs_count = $today_reqs->fetchColumn();

    $today_exp = $pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM expenses WHERE date = ?");
    $today_exp->execute([$today]);
    $today_total = $today_exp->fetchColumn();

    $month_exp = $pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM expenses WHERE DATE_FORMAT(date,'%Y-%m') = ?");
    $month_exp->execute([$month]);
    $month_total = $month_exp->fetchColumn();
    $share = $month_total / 2;

    $paid_a = $pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM payments WHERE family_id = 1 AND DATE_FORMAT(date,'%Y-%m') = ?");
    $paid_a->execute([$month]);
    $a = $paid_a->fetchColumn();
    $paid_b = $pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM payments WHERE family_id = 2 AND DATE_FORMAT(date,'%Y-%m') = ?");
    $paid_b->execute([$month]);
    $b = $paid_b->fetchColumn();
    $bal_a = $a - $share; $bal_b = $b - $share;

    $orders_q = $pdo->prepare("
        SELECT mr.*, f.name AS family_name, m.name AS dish, m.color_theme, m.photo, m.diet_tags
        FROM meal_requirements mr
        JOIN families f ON mr.family_id = f.id
        LEFT JOIN menu_items m ON mr.menu_item_id = m.id
        WHERE mr.date = ?
        ORDER BY FIELD(mr.meal_type,'Breakfast','Lunch','Snacks','Dinner'), mr.family_id
    ");
    $orders_q->execute([$today]);
    $orders = $orders_q->fetchAll();

    layout_open('Admin Home', $subtitle);
?>
    <div class="stat-grid">
        <div class="stat"><span class="label">Today orders</span><span class="value"><?= $reqs_count ?></span></div>
        <div class="stat"><span class="label">Today spent</span><span class="value small"><?= fmt_money($today_total) ?></span></div>
        <div class="stat"><span class="label">Month total</span><span class="value small"><?= fmt_money($month_total) ?></span></div>
        <div class="stat"><span class="label">Each share</span><span class="value small"><?= fmt_money($share) ?></span></div>
    </div>

    <?php if ($orders): ?>
    <div class="section">
        <div class="section-h"><span class="lead">Today's menu</span></div>
        <?php foreach ($orders as $o): ?>
            <div class="hero-meal">
                <?= dish_photo($o['dish'] ?: $o['custom_dish'] ?: 'Custom', $o['color_theme'] ?: 'fi-default', $o['photo'], 'small') ?>
                <div class="body">
                    <div class="meal-cap"><?= h($o['family_name']) ?> · <?= h($o['meal_type']) ?> · <?= strtoupper($o['status']) ?></div>
                    <h3><?= h($o['dish'] ?: $o['custom_dish'] ?: 'Custom') ?></h3>
                    <div class="meta"><?= (int)$o['people'] ?> people · <?= h($o['spice_level']) ?> spice<?php if ($o['special_request']): ?> · ★ <?= h($o['special_request']) ?><?php endif; ?></div>
                    <?= diet_tags_pills($o['diet_tags']) ?>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>

    <div class="section">
        <div class="section-h"><span class="lead">Settlement — <?= h(month_label($month)) ?></span><a href="index.php?page=settlement">View →</a></div>
        <div class="card">
            <div class="kv"><span class="k">Family A balance</span><span class="v <?= $bal_a >= 0 ? 'ok' : 'danger' ?>"><?= $bal_a >= 0 ? 'Excess ' : '' ?><?= fmt_money(abs($bal_a)) ?><?= $bal_a < 0 ? ' due' : '' ?></span></div>
            <div class="kv"><span class="k">Family B balance</span><span class="v <?= $bal_b >= 0 ? 'ok' : 'danger' ?>"><?= $bal_b >= 0 ? 'Excess ' : '' ?><?= fmt_money(abs($bal_b)) ?><?= $bal_b < 0 ? ' due' : '' ?></span></div>
        </div>
    </div>

    <div class="section">
        <div class="section-h"><span class="lead">Quick links</span></div>
        <div class="btn-row">
            <a href="index.php?page=expenses" class="btn secondary small">₹ Money</a>
            <a href="index.php?page=manage" class="btn secondary small">⚙ Setup</a>
        </div>
    </div>
<?php
    layout_close();
    exit;
}

// =================== COOK HOME ===================
if ($u['role'] === 'cook') {
    $stmt = $pdo->prepare("
        SELECT mr.*, f.name AS family_name, m.name AS dish, m.color_theme, m.photo, m.diet_tags, u.name AS user_name
        FROM meal_requirements mr
        JOIN families f ON mr.family_id = f.id
        JOIN users u ON mr.user_id = u.id
        LEFT JOIN menu_items m ON mr.menu_item_id = m.id
        WHERE mr.date = ?
        ORDER BY FIELD(mr.meal_type,'Breakfast','Lunch','Snacks','Dinner'), mr.family_id
    ");
    $stmt->execute([$today]);
    $orders = $stmt->fetchAll();

    $by_meal = [];
    foreach ($orders as $o) $by_meal[$o['meal_type']][] = $o;

    $total_people = array_sum(array_column($orders, 'people'));
    $special_count = count(array_filter($orders, fn($o) => !empty($o['special_request'])));

    layout_open('Today\'s Cooking', $subtitle);
?>
    <div class="stat-grid three">
        <div class="stat"><span class="label">Orders</span><span class="value"><?= count($orders) ?></span></div>
        <div class="stat"><span class="label">People</span><span class="value"><?= $total_people ?></span></div>
        <div class="stat"><span class="label">Special</span><span class="value"><?= $special_count ?></span></div>
    </div>

    <?php if (!$orders): ?>
        <div class="card mt-16"><div class="empty"><div class="ico">🍽</div>No orders for today yet.<br><span class="small">Families will post requirements soon.</span></div></div>
    <?php else: ?>
        <?php foreach (['Breakfast','Lunch','Snacks','Dinner'] as $meal_type): if (!isset($by_meal[$meal_type])) continue; ?>
            <div class="section">
                <div class="section-h"><span class="lead"><?= h($meal_type) ?></span><span class="small"><?= count($by_meal[$meal_type]) ?> orders</span></div>
                <?php foreach ($by_meal[$meal_type] as $o): ?>
                    <div class="card">
                        <?= dish_photo($o['dish'] ?: $o['custom_dish'] ?: 'Custom', $o['color_theme'] ?: 'fi-default', $o['photo'], 'small') ?>
                        <div class="card-row">
                            <div class="grow">
                                <div class="card-name"><?= h($o['dish'] ?: $o['custom_dish'] ?: 'Custom') ?></div>
                                <div class="card-meta"><?= h($o['family_name']) ?> · <?= (int)$o['people'] ?> ppl · <?= h($o['spice_level']) ?> · by <?= h($o['user_name']) ?></div>
                                <?= diet_tags_pills($o['diet_tags']) ?>
                                <?php if ($o['special_request']): ?>
                                    <div class="suggest mt-8">★ <b>Special:</b> <?= h($o['special_request']) ?></div>
                                <?php endif; ?>
                                <?php if ($o['notes']): ?><div class="card-meta mt-8"><?= h($o['notes']) ?></div><?php endif; ?>
                                <?php
                                if ($o['menu_item_id']) {
                                    $fbs = $pdo->prepare("SELECT comment, improvement, rating FROM feedback WHERE menu_item_id = ? ORDER BY date DESC LIMIT 1");
                                    $fbs->execute([$o['menu_item_id']]);
                                    $prev_fb = $fbs->fetch();
                                    if ($prev_fb): ?>
                                        <div class="suggest primary mt-8">
                                            <b>Past feedback:</b> <?= str_repeat('★', (int)$prev_fb['rating']) ?>
                                            <?php if ($prev_fb['improvement']): ?> · <?= h($prev_fb['improvement']) ?><?php endif; ?>
                                            <?php if ($prev_fb['comment']): ?><br><?= h($prev_fb['comment']) ?><?php endif; ?>
                                        </div>
                                    <?php endif;
                                } ?>
                            </div>
                            <span class="pill <?= $o['status']==='prepared'?'ok':($o['status']==='accepted'?'':'muted') ?>"><?= h(ucfirst($o['status'])) ?></span>
                        </div>
                        <?php if ($o['status'] !== 'prepared'): ?>
                            <div class="btn-row">
                                <?php if ($o['status'] === 'pending'): ?>
                                    <form method="post" style="flex:1"><?= csrf_field() ?><button type="submit" name="mark_accepted" value="<?= (int)$o['id'] ?>" class="btn secondary small">Accept</button></form>
                                <?php endif; ?>
                                <form method="post" style="flex:1"><?= csrf_field() ?><button type="submit" name="mark_prepared" value="<?= (int)$o['id'] ?>" class="btn small">Mark prepared</button></form>
                            </div>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endforeach; ?>
    <?php endif; ?>
<?php
    layout_close();
    exit;
}

// =================== FAMILY HOME ===================
if ($u['role'] === 'family') {
    $today_q = $pdo->prepare("
        SELECT mr.*, m.name AS dish, m.color_theme, m.photo, m.diet_tags
        FROM meal_requirements mr
        LEFT JOIN menu_items m ON mr.menu_item_id = m.id
        WHERE mr.family_id = ? AND mr.date = ?
        ORDER BY FIELD(mr.meal_type,'Breakfast','Lunch','Snacks','Dinner')
    ");
    $today_q->execute([$u['family_id'], $today]);
    $my_orders = $today_q->fetchAll();

    $tom_q = $pdo->prepare("
        SELECT mp.*, m.name AS dish, m.color_theme, m.photo, m.diet_tags
        FROM menu_plans mp
        LEFT JOIN menu_items m ON mp.menu_item_id = m.id
        WHERE mp.family_id = ? AND mp.date = ?
        ORDER BY FIELD(mp.meal_type,'Breakfast','Lunch','Snacks','Dinner')
    ");
    $tom_q->execute([$u['family_id'], $tomorrow]);
    $tom_plans = $tom_q->fetchAll();

    $month_exp = $pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM expenses WHERE DATE_FORMAT(date,'%Y-%m') = ?");
    $month_exp->execute([$month]);
    $month_total = $month_exp->fetchColumn();
    $share = $month_total / 2;

    $paid_q = $pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM payments WHERE family_id = ? AND DATE_FORMAT(date,'%Y-%m') = ?");
    $paid_q->execute([$u['family_id'], $month]);
    $paid_amt = $paid_q->fetchColumn();
    $balance = $paid_amt - $share;

    $shop_count = $pdo->prepare("SELECT COUNT(*) FROM shopping_list WHERE plan_date = ? AND is_purchased = 0");
    $shop_count->execute([$tomorrow]);
    $shop_n = $shop_count->fetchColumn();

    layout_open('Kitchen Home', $subtitle);
?>
    <?php if ($my_orders): ?>
    <div class="section">
        <div class="section-h"><span class="lead">★ Today's menu</span><a href="index.php?page=order">+ Add</a></div>
        <?php foreach ($my_orders as $o): ?>
            <div class="hero-meal">
                <?= dish_photo($o['dish'] ?: $o['custom_dish'] ?: 'Custom', $o['color_theme'] ?: 'fi-default', $o['photo'], 'small') ?>
                <div class="body">
                    <div class="meal-cap"><?= strtoupper($o['meal_type']) ?> · <?= strtoupper($o['status']) ?></div>
                    <h3><?= h($o['dish'] ?: $o['custom_dish'] ?: 'Custom') ?></h3>
                    <div class="meta"><?= (int)$o['people'] ?> ppl · <?= h($o['spice_level']) ?><?php if ($o['special_request']): ?> · <?= h($o['special_request']) ?><?php endif; ?></div>
                    <?= diet_tags_pills($o['diet_tags']) ?>
                    <?php if ($o['status'] === 'prepared'): ?>
                        <a href="index.php?page=feedback_new&req=<?= (int)$o['id'] ?>" class="btn secondary small mt-12">★ Add feedback</a>
                    <?php endif; ?>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
    <?php else: ?>
    <div class="section">
        <div class="card">
            <div class="empty">
                <div class="ico">🍽</div>
                No orders posted for today yet.<br>
                <a href="index.php?page=order" class="btn small mt-12" style="display:inline-flex;">+ Post a meal request</a>
            </div>
        </div>
    </div>
    <?php endif; ?>

    <div class="section">
        <div class="section-h"><span class="lead">Tomorrow's plan</span><a href="index.php?page=plan">Plan →</a></div>
        <?php if (!$tom_plans): ?>
            <a href="index.php?page=plan" class="card-link">
                <div class="card">
                    <div class="card-row">
                        <div class="grow">
                            <div class="card-name">No plans yet</div>
                            <div class="card-meta">Tap to plan tomorrow's meals</div>
                        </div>
                        <span class="pill warn">+</span>
                    </div>
                </div>
            </a>
        <?php else: ?>
            <?php foreach ($tom_plans as $p): ?>
                <div class="card">
                    <?= dish_photo($p['dish'] ?: $p['custom_dish'] ?: 'Custom', $p['color_theme'] ?: 'fi-default', $p['photo'], 'tiny') ?>
                    <div class="card-row">
                        <div class="grow">
                            <div class="card-name"><?= h($p['dish'] ?: $p['custom_dish']) ?></div>
                            <div class="card-meta"><?= h($p['meal_type']) ?> · <?= (int)$p['people'] ?> ppl</div>
                        </div>
                        <span class="pill <?= $p['status']==='confirmed'||$p['status']==='shopping'?'ok':'warn' ?>"><?= h(ucfirst($p['status'])) ?></span>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>

    <div class="section">
        <div class="section-h"><span class="lead">My month</span></div>
        <div class="stat-grid">
            <div class="stat"><span class="label">My share</span><span class="value small"><?= fmt_money($share) ?></span><span class="sub">of <?= fmt_money($month_total) ?></span></div>
            <div class="stat"><span class="label">I paid</span><span class="value small"><?= fmt_money($paid_amt) ?></span><span class="sub" style="color:<?= $balance>=0?'var(--ok)':'var(--danger)' ?>"><?= $balance >= 0 ? 'Excess ' : '' ?><?= fmt_money(abs($balance)) ?><?= $balance < 0 ? ' due' : '' ?></span></div>
        </div>
    </div>

    <?php if ($shop_n): ?>
    <div class="section">
        <a href="index.php?page=shopping" class="card-link">
            <div class="card">
                <div class="card-row">
                    <div class="grow">
                        <div class="card-name">🛒 Shopping list</div>
                        <div class="card-meta"><?= (int)$shop_n ?> items pending for tomorrow</div>
                    </div>
                    <span class="pill"><?= (int)$shop_n ?></span>
                </div>
            </div>
        </a>
    </div>
    <?php endif; ?>

    <a href="index.php?page=order" class="fab" title="Add requirement">+</a>
<?php
    layout_close();
    exit;
}

// =================== DRIVER HOME ===================
if ($u['role'] === 'driver') {
    $tom = $tomorrow;
    $pending = $pdo->prepare("SELECT COUNT(*) FROM shopping_list WHERE plan_date = ? AND is_purchased = 0");
    $pending->execute([$tom]);
    $pending_count = $pending->fetchColumn();

    $month_exp = $pdo->prepare("SELECT COALESCE(SUM(amount),0) FROM expenses WHERE purchased_by = ? AND DATE_FORMAT(date,'%Y-%m') = ?");
    $month_exp->execute([$u['id'], $month]);
    $my_total = $month_exp->fetchColumn();

    $recent = $pdo->prepare("SELECT * FROM expenses WHERE purchased_by = ? ORDER BY date DESC, id DESC LIMIT 5");
    $recent->execute([$u['id']]);
    $recent_list = $recent->fetchAll();

    layout_open('Driver Home', $subtitle);
?>
    <div class="stat-grid">
        <div class="stat"><span class="label">Items to buy</span><span class="value"><?= $pending_count ?></span><span class="sub">for tomorrow</span></div>
        <div class="stat"><span class="label">My month total</span><span class="value small"><?= fmt_money($my_total) ?></span></div>
    </div>

    <div class="section">
        <div class="btn-row">
            <a href="index.php?page=shopping" class="btn">🛒 Shopping list</a>
            <a href="index.php?page=expense_new" class="btn secondary">+ Expense</a>
        </div>
    </div>

    <div class="section">
        <div class="section-h"><span class="lead">My recent purchases</span></div>
        <?php if (!$recent_list): ?>
            <div class="card"><div class="empty">No purchases recorded yet.</div></div>
        <?php else: ?>
            <?php foreach ($recent_list as $e): ?>
                <div class="card">
                    <div class="card-row">
                        <div class="grow">
                            <div class="card-name"><?= h($e['item_name']) ?></div>
                            <div class="card-meta"><?= h($e['category']) ?> · <?= h($e['quantity']) ?> · <?= fmt_date_short($e['date']) ?></div>
                        </div>
                        <div class="text-right strong"><?= fmt_money($e['amount']) ?></div>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>
<?php
    layout_close();
    exit;
}
