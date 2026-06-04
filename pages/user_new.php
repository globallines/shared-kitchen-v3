<?php
$u = require_role('admin');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $username = trim($_POST['username']);
    $password = $_POST['password'];
    $name = trim($_POST['name']);
    $role = $_POST['role'];
    $family_id = $role === 'family' ? (int)$_POST['family_id'] : null;
    $phone = trim($_POST['phone'] ?? '');

    $check = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $check->execute([$username]);
    if ($check->fetch()) {
        flash('Username already exists', 'error');
    } elseif (!$username || !$password || !$name) {
        flash('Username, password and name are required', 'error');
    } elseif (strlen($password) < 4) {
        flash('Password must be at least 4 characters', 'error');
    } else {
        $stmt = $pdo->prepare("INSERT INTO users (username, password_hash, name, role, family_id, phone) VALUES (?,?,?,?,?,?)");
        $stmt->execute([$username, password_hash($password, PASSWORD_DEFAULT), $name, $role, $family_id, $phone ?: null]);
        flash('User created');
        redirect('index.php?page=manage&tab=users');
    }
}

$families = $pdo->query("SELECT * FROM families ORDER BY name")->fetchAll();
layout_open('New User');
?>

<form method="post">
    <?= csrf_field() ?>

    <div class="field">
        <label>Full name</label>
        <input type="text" name="name" required placeholder="e.g. Anita Sharma">
    </div>

    <div class="field">
        <label>Username (for login)</label>
        <input type="text" name="username" required pattern="[a-zA-Z0-9_]+" placeholder="lowercase, no spaces">
        <span class="hint">Letters, numbers, underscores only</span>
    </div>

    <div class="field">
        <label>Password</label>
        <input type="text" name="password" required minlength="4" placeholder="min 4 characters">
        <span class="hint">Tell the user their password — they can change it later</span>
    </div>

    <div class="field">
        <label>Role</label>
        <select name="role" id="roleSel" required onchange="document.getElementById('famWrap').style.display = this.value==='family'?'block':'none';">
            <option value="">— select role —</option>
            <option value="family">Family member</option>
            <option value="cook">Cook</option>
            <option value="driver">Driver / Purchaser</option>
            <option value="admin">Admin</option>
        </select>
    </div>

    <div class="field" id="famWrap" style="display:none;">
        <label>Which family?</label>
        <select name="family_id">
            <?php foreach ($families as $f): ?>
                <option value="<?= (int)$f['id'] ?>"><?= h($f['name']) ?></option>
            <?php endforeach; ?>
        </select>
    </div>

    <div class="field">
        <label>Phone (optional)</label>
        <input type="tel" name="phone" placeholder="+91 ...">
    </div>

    <button type="submit" class="btn">Create user</button>
    <a href="index.php?page=manage&tab=users" class="btn secondary mt-8">Cancel</a>
</form>

<?php layout_close(); ?>
