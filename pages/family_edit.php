<?php
$u = require_role('admin');
$id = (int)($_GET['id'] ?? 0);

$stmt = $pdo->prepare("SELECT * FROM families WHERE id = ?");
$stmt->execute([$id]);
$fam = $stmt->fetch();

if (!$fam) {
    layout_open('Not found');
    echo '<div class="empty">Family not found.</div>';
    layout_close();
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $name = trim($_POST['name']);
    $head = trim($_POST['head_name'] ?? '');
    if (!$name) {
        flash('Name required', 'error');
    } else {
        $pdo->prepare("UPDATE families SET name = ?, head_name = ? WHERE id = ?")
            ->execute([$name, $head ?: null, $id]);
        flash('Family updated');
        redirect('index.php?page=manage&tab=families');
    }
}

layout_open('Edit Family');
?>
<form method="post">
    <?= csrf_field() ?>
    <div class="field">
        <label>Family name</label>
        <input type="text" name="name" value="<?= h($fam['name']) ?>" required>
    </div>
    <div class="field">
        <label>Head of family</label>
        <input type="text" name="head_name" value="<?= h($fam['head_name']) ?>">
    </div>
    <button type="submit" class="btn">Save changes</button>
    <a href="index.php?page=manage&tab=families" class="btn secondary mt-8">Cancel</a>
</form>
<?php layout_close(); ?>
