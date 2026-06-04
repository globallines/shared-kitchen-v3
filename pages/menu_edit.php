<?php
$u = require_role('admin');
$id = (int)($_GET['id'] ?? 0);

$stmt = $pdo->prepare("SELECT * FROM menu_items WHERE id = ?");
$stmt->execute([$id]);
$m = $stmt->fetch();
if (!$m) { flash('Item not found', 'error'); redirect('index.php?page=manage&tab=menu'); }

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $diets = $_POST['diet_tags'] ?? [];
    $diet_str = implode(',', array_filter($diets));
    $color = $_POST['color_theme'] ?? $m['color_theme'];

    $new_photo = handle_upload('photo', 'menu');

    $sql = "UPDATE menu_items SET name=?, category=?, cuisine=?, description=?, ingredients=?, diet_tags=?, color_theme=?, is_active=?";
    $params = [
        trim($_POST['name']),
        $_POST['category'],
        $_POST['cuisine'],
        trim($_POST['description'] ?? '') ?: null,
        trim($_POST['ingredients'] ?? '') ?: null,
        $diet_str ?: null,
        $color,
        isset($_POST['is_active']) ? 1 : 0,
    ];
    if ($new_photo) {
        $sql .= ", photo=?";
        $params[] = $new_photo;
    }
    $sql .= " WHERE id=?";
    $params[] = $id;
    $pdo->prepare($sql)->execute($params);
    flash('Saved');
    redirect('index.php?page=manage&tab=menu');
}

$current_diets = array_filter(array_map('trim', explode(',', $m['diet_tags'] ?? '')));

layout_open('Edit Menu Item');
?>

<?= dish_photo($m['name'], $m['color_theme'] ?: 'fi-default', $m['photo']) ?>

<form method="post" enctype="multipart/form-data">
    <?= csrf_field() ?>

    <div class="field">
        <label>Dish name</label>
        <input type="text" name="name" required value="<?= h($m['name']) ?>">
    </div>

    <div class="row2">
        <div class="field">
            <label>Category</label>
            <select name="category" required>
                <?php foreach (['Veg','Chicken','Mutton','Fish','Egg','Snacks','Breakfast','Other'] as $c): ?>
                    <option <?= $m['category']===$c?'selected':'' ?>><?= $c ?></option>
                <?php endforeach; ?>
            </select>
        </div>
        <div class="field">
            <label>Cuisine</label>
            <select name="cuisine">
                <?php foreach (CUISINES as $c): ?>
                    <option <?= $m['cuisine']===$c?'selected':'' ?>><?= h($c) ?></option>
                <?php endforeach; ?>
            </select>
        </div>
    </div>

    <div class="field">
        <label>Description</label>
        <textarea name="description" rows="2"><?= h($m['description']) ?></textarea>
    </div>

    <div class="field">
        <label>Ingredients (comma-separated)</label>
        <textarea name="ingredients" rows="2"><?= h($m['ingredients']) ?></textarea>
        <span class="hint">Used for shopping list</span>
    </div>

    <div class="field">
        <label>Diet tags</label>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <?php foreach (DIET_TAGS as $tag): $checked = in_array($tag, $current_diets); ?>
                <label class="chip diet-chip <?= $checked ? 'on' : '' ?>" style="cursor:pointer;">
                    <input type="checkbox" name="diet_tags[]" value="<?= h($tag) ?>" <?= $checked ? 'checked' : '' ?> style="display:none;" onchange="this.parentElement.classList.toggle('on', this.checked)">
                    <?= h($tag) ?>
                </label>
            <?php endforeach; ?>
        </div>
    </div>

    <div class="field">
        <label>Color theme</label>
        <select name="color_theme">
            <?php foreach (FOOD_COLORS as $cls => $name): ?>
                <option value="<?= h($cls) ?>" <?= $m['color_theme']===$cls?'selected':'' ?>><?= h($name) ?></option>
            <?php endforeach; ?>
        </select>
    </div>

    <div class="field">
        <label>Replace photo (optional)</label>
        <input type="file" name="photo" accept="image/*">
    </div>

    <div class="field">
        <label style="display:flex;align-items:center;gap:8px;">
            <input type="checkbox" name="is_active" value="1" <?= $m['is_active']?'checked':'' ?> style="width:auto;">
            Active (visible in menu)
        </label>
    </div>

    <button type="submit" class="btn">Save changes</button>
    <a href="index.php?page=manage&tab=menu" class="btn secondary mt-8">Cancel</a>
</form>

<?php layout_close(); ?>
