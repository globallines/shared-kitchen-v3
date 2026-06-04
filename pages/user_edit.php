<?php
$u = require_role('admin');
$id = (int)($_GET['id'] ?? 0);

$stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
$stmt->execute([$id]);
$usr = $stmt->fetch();

if (!$usr) {
    layout_open('Not found');
    echo '<div class="empty">User not found.</div>';
    layout_close();
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $name = trim($_POST['name']);
    $role = $_POST['role'];
    $family_id = $role === 'family' ? (int)$_POST['family_id'] : null;
    $phone = trim($_POST['phone'] ?? '');
    $reset_password = $_POST['new_password'] ?? '';

    if (!$name) {
        flash('Name required', 'error');
    } else {
        $pdo->prepare("UPDATE users SET name = ?, role = ?, family_id = ?, phone = ? WHERE id = ?")
            ->execute([$name, $role, $family_id, $phone ?: null, $id]);

        if ($reset_password) {
            if (strlen($reset_password) < 4) {
                flash('Password updated, but it should be at least 4 characters', 'error');
            } else {
                $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?")
                    ->execute([password_hash($reset_password, PASSWORD_DEFAULT), $id]);
                flash('User updated · password reset');
                redirect('index.php?page=manage&tab=users');
            }
        }
        flash('User updated');
        redirect('index.php?page=manage&tab=users');
    }
}

$families = $pdo->query("SELECT * FROM families ORDER BY name")->fetchAll();
layout_open('Edit User');
?>

<form method="post">
    <?= csrf_field() ?>

    <div class="card mb-12">
        <div class="kv"><span class="k">Username</span><span class="v">@<?= h($usr['username']) ?></span></div>
        <div class="small mt-4 muted">Username cannot be changed</div>
    </div>

    <div class="field">
        <label>Full name</label>
        <input type="text" name="name" value="<?= h($usr['name']) ?>" required>
    </div>

    <div class="field">
        <label>Role</label>
        <select name="role" id="roleSel" required onchange="document.getElementById('famWrap').style.display = this.value==='family'?'block':'none';">
            <?php foreach (['family'=>'Family member','cook'=>'Cook','driver'=>'Driver / Purchaser','admin'=>'Admin'] as $k=>$v): ?>
                <option value="<?= $k ?>" <?= $usr['role']===$k?'selected':'' ?>><?= $v ?></option>
            <?php endforeach; ?>
        </select>
    </div>

    <div class="field" id="famWrap" style="<?= $usr['role']==='family'?'':'display:none;' ?>">
        <label>Which family?</label>
        <select name="family_id">
            <?php foreach ($families as $f): ?>
                <option value="<?= (int)$f['id'] ?>" <?= $usr['family_id']==$f['id']?'selected':'' ?>><?= h($f['name']) ?></option>
            <?php endforeach; ?>
        </select>
    </div>

    <div class="field">
        <label>Phone</label>
        <input type="tel" name="phone" value="<?= h($usr['phone']) ?>">
    </div>

    <hr>

    <div class="field">
        <label>Reset password (optional)</label>
        <input type="text" name="new_password" placeholder="Leave blank to keep current">
        <span class="hint">Min 4 characters. Tell the user their new password.</span>
    </div>

    <button type="submit" class="btn">Save changes</button>
    <a href="index.php?page=manage&tab=users" class="btn secondary mt-8">Cancel</a>
</form>

<?php layout_close(); ?>
