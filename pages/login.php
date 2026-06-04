<?php
$error = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $u = trim($_POST['username'] ?? '');
    $p = $_POST['password'] ?? '';
    $stmt = $pdo->prepare('SELECT * FROM users WHERE username = ? AND is_active = 1');
    $stmt->execute([$u]);
    $user = $stmt->fetch();
    if ($user && password_verify($p, $user['password_hash'])) {
        $_SESSION['user_id'] = $user['id'];
        session_regenerate_id(true);
        redirect('index.php');
    }
    $error = 'Invalid username or password';
}
?><!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0f4c3a">
<link rel="icon" href="assets/favicon.png">
<link rel="manifest" href="manifest.json">
<link rel="stylesheet" href="assets/css/app.css">
<title>Sign in — <?= h(APP_NAME) ?></title>
</head>
<body>
<div class="login-wrap">
    <div class="login-card">
        <h1><?= h(APP_NAME) ?></h1>
        <p class="lead">Two families. One cook. Zero confusion.</p>

        <?php if ($error): ?>
            <div class="flash error"><?= h($error) ?></div>
        <?php endif; ?>

        <form method="post" autocomplete="on">
            <?= csrf_field() ?>
            <div class="field">
                <label>Username</label>
                <input name="username" required autocomplete="username" placeholder="e.g. karthi">
            </div>
            <div class="field">
                <label>Password</label>
                <input type="password" name="password" required autocomplete="current-password" placeholder="•••••">
            </div>
            <button type="submit" class="btn">Sign in</button>
        </form>

        <div style="margin-top:24px;">
            <div class="small mb-8">Demo accounts (username = password):</div>
            <div class="login-presets">
                <button type="button" onclick="fill('admin')"><b>Admin</b>admin</button>
                <button type="button" onclick="fill('karthi')"><b>Family A</b>karthi</button>
                <button type="button" onclick="fill('raj')"><b>Family B</b>raj</button>
                <button type="button" onclick="fill('cook')"><b>Cook</b>cook</button>
            </div>
        </div>
    </div>
</div>
<script>
function fill(u) {
    document.querySelector('[name=username]').value = u;
    document.querySelector('[name=password]').value = u;
}
</script>
</body>
</html>
