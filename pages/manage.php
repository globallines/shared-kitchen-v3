<?php
$u = require_role('admin');
$tab = $_GET['tab'] ?? 'users';

// Handle deletes
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    if (isset($_POST['delete_user'])) {
        $id = (int)$_POST['delete_user'];
        if ($id != $u['id']) {
            $pdo->prepare("UPDATE users SET is_active = 0 WHERE id = ?")->execute([$id]);
            flash('User deactivated');
        } else {
            flash('Cannot deactivate your own account', 'error');
        }
        redirect('index.php?page=manage&tab=users');
    }
    if (isset($_POST['activate_user'])) {
        $pdo->prepare("UPDATE users SET is_active = 1 WHERE id = ?")->execute([(int)$_POST['activate_user']]);
        flash('User activated');
        redirect('index.php?page=manage&tab=users');
    }
    if (isset($_POST['delete_menu'])) {
        $pdo->prepare("UPDATE menu_items SET is_active = 0 WHERE id = ?")->execute([(int)$_POST['delete_menu']]);
        flash('Menu item hidden');
        redirect('index.php?page=manage&tab=menu');
    }
    if (isset($_POST['activate_menu'])) {
        $pdo->prepare("UPDATE menu_items SET is_active = 1 WHERE id = ?")->execute([(int)$_POST['activate_menu']]);
        flash('Menu item activated');
        redirect('index.php?page=manage&tab=menu');
    }
}

layout_open('Setup');
?>

<div class="tabs">
    <a href="index.php?page=manage&tab=users" class="<?= $tab==='users'?'active':'' ?>">Users</a>
    <a href="index.php?page=manage&tab=families" class="<?= $tab==='families'?'active':'' ?>">Families</a>
    <a href="index.php?page=manage&tab=menu" class="<?= $tab==='menu'?'active':'' ?>">Menu</a>
</div>

<?php if ($tab === 'users'):
    $users = $pdo->query("SELECT u.*, f.name AS family_name FROM users u LEFT JOIN families f ON u.family_id = f.id ORDER BY u.is_active DESC, u.role, u.name")->fetchAll();
?>
    <div class="section">
        <div class="section-h">
            <span class="lead">All users (<?= count($users) ?>)</span>
            <a href="index.php?page=user_new" class="btn ghost small">+ New user</a>
        </div>
        <div class="list">
        <?php foreach ($users as $usr): ?>
            <div class="card" style="<?= !$usr['is_active'] ? 'opacity:0.5;' : '' ?>">
                <div class="card-row">
                    <div class="grow">
                        <div class="card-name"><?= h($usr['name']) ?>
                            <?php if (!$usr['is_active']): ?><span class="pill muted">inactive</span><?php endif; ?>
                        </div>
                        <div class="card-meta">
                            @<?= h($usr['username']) ?> · <?= h(role_label($usr['role'])) ?>
                            <?php if ($usr['family_name']): ?> · <?= h($usr['family_name']) ?><?php endif; ?>
                        </div>
                        <?php if ($usr['phone']): ?><div class="small"><?= h($usr['phone']) ?></div><?php endif; ?>
                    </div>
                    <div class="text-right">
                        <a href="index.php?page=user_edit&id=<?= (int)$usr['id'] ?>" class="btn ghost small">Edit</a>
                        <?php if ($usr['id'] != $u['id']): ?>
                            <form method="post" style="display:inline;">
                                <?= csrf_field() ?>
                                <?php if ($usr['is_active']): ?>
                                    <button type="submit" name="delete_user" value="<?= (int)$usr['id'] ?>" class="btn ghost small" data-confirm="Deactivate <?= h($usr['name']) ?>?" style="color:var(--danger);">×</button>
                                <?php else: ?>
                                    <button type="submit" name="activate_user" value="<?= (int)$usr['id'] ?>" class="btn ghost small" style="color:var(--ok);">↺</button>
                                <?php endif; ?>
                            </form>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>
        </div>
    </div>
    <a href="index.php?page=user_new" class="fab">+</a>

<?php elseif ($tab === 'families'):
    $fams = $pdo->query("SELECT f.*, COUNT(u.id) AS member_count FROM families f LEFT JOIN users u ON u.family_id = f.id AND u.is_active = 1 GROUP BY f.id ORDER BY f.name")->fetchAll();
?>
    <div class="section">
        <div class="section-h"><span class="lead">Families (<?= count($fams) ?>)</span></div>
        <div class="list">
        <?php foreach ($fams as $f): ?>
            <div class="card">
                <div class="card-row">
                    <div class="grow">
                        <div class="card-name"><?= h($f['name']) ?></div>
                        <div class="card-meta">
                            Head: <?= h($f['head_name'] ?: '—') ?> · <?= (int)$f['member_count'] ?> members
                        </div>
                    </div>
                    <a href="index.php?page=family_edit&id=<?= (int)$f['id'] ?>" class="btn ghost small">Edit</a>
                </div>
            </div>
        <?php endforeach; ?>
        </div>
        <p class="small mt-12 muted">Note: System works best with exactly 2 families (for 50/50 cost split).</p>
    </div>

<?php elseif ($tab === 'menu'):
    $items = $pdo->query("SELECT * FROM menu_items ORDER BY is_active DESC, category, name")->fetchAll();
    $by_cat = [];
    foreach ($items as $i) $by_cat[$i['category']][] = $i;
?>
    <div class="section">
        <div class="section-h">
            <span class="lead">Menu items (<?= count($items) ?>)</span>
            <a href="index.php?page=menu_new" class="btn ghost small">+ New</a>
        </div>
        <?php foreach ($by_cat as $cat => $list): ?>
            <h4 style="margin: 14px 0 8px;"><?= h($cat) ?></h4>
            <div class="list">
            <?php foreach ($list as $m): ?>
                <div class="card" style="<?= !$m['is_active'] ? 'opacity:0.5;' : '' ?>">
                    <div class="card-row">
                        <div class="grow">
                            <div class="card-name"><?= h($m['name']) ?>
                                <?php if (!$m['is_active']): ?><span class="pill muted">hidden</span><?php endif; ?>
                            </div>
                            <div class="card-meta"><?= h($m['cuisine']) ?></div>
                            <?php if ($m['ingredients']): ?>
                                <div class="small mt-4"><?= h(mb_strimwidth($m['ingredients'], 0, 80, '...')) ?></div>
                            <?php endif; ?>
                        </div>
                        <div class="text-right">
                            <a href="index.php?page=menu_edit&id=<?= (int)$m['id'] ?>" class="btn ghost small">Edit</a>
                            <form method="post" style="display:inline;">
                                <?= csrf_field() ?>
                                <?php if ($m['is_active']): ?>
                                    <button type="submit" name="delete_menu" value="<?= (int)$m['id'] ?>" class="btn ghost small" data-confirm="Hide this dish?" style="color:var(--danger);">×</button>
                                <?php else: ?>
                                    <button type="submit" name="activate_menu" value="<?= (int)$m['id'] ?>" class="btn ghost small" style="color:var(--ok);">↺</button>
                                <?php endif; ?>
                            </form>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
            </div>
        <?php endforeach; ?>
    </div>
    <a href="index.php?page=menu_new" class="fab">+</a>

<?php endif; ?>

<?php layout_close(); ?>
