<?php
$u = require_role('admin');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $name = trim($_POST['name']);
    $cat = $_POST['category'];
    $cui = $_POST['cuisine'];
    $desc = trim($_POST['description'] ?? '');
    $ings = trim($_POST['ingredients'] ?? '');
    $diets = $_POST['diet_tags'] ?? [];
    $diet_str = implode(',', array_filter($diets));
    $color = $_POST['color_theme'] ?? auto_color($cat, $cui);
    $photo = handle_upload('photo', 'menu');

    if (!$name) {
        flash('Name required', 'error');
    } else {
        $pdo->prepare("INSERT INTO menu_items (name, category, cuisine, description, ingredients, diet_tags, color_theme, photo) VALUES (?,?,?,?,?,?,?,?)")
            ->execute([$name, $cat, $cui, $desc ?: null, $ings ?: null, $diet_str ?: null, $color, $photo]);
        flash('Menu item added');
        redirect('index.php?page=manage&tab=menu');
    }
}

layout_open('New Menu Item');
?>

<form method="post" enctype="multipart/form-data">
    <?= csrf_field() ?>

    <div class="field">
        <label>Dish name</label>
        <input type="text" name="name" required placeholder="e.g. Palak Paneer">
    </div>

    <div class="row2">
        <div class="field">
            <label>Category</label>
            <select name="category" required>
                <?php foreach (['Veg','Chicken','Mutton','Fish','Egg','Snacks','Breakfast','Other'] as $c): ?>
                    <option><?= $c ?></option>
                <?php endforeach; ?>
            </select>
        </div>
        <div class="field">
            <label>Cuisine</label>
            <select name="cuisine">
                <?php foreach (CUISINES as $c): ?><option><?= h($c) ?></option><?php endforeach; ?>
            </select>
        </div>
    </div>

    <div class="field">
        <label>Short description</label>
        <textarea name="description" rows="2" placeholder="One-line description"></textarea>
    </div>

    <div class="field">
        <label>Ingredients (comma-separated)</label>
        <textarea name="ingredients" rows="2" placeholder="e.g. spinach, paneer, onion, tomato, masala"></textarea>
        <span class="hint">Used to auto-generate the shopping list</span>
    </div>

    <div class="field">
        <label>Diet tags (tap to select)</label>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <?php foreach (DIET_TAGS as $tag): ?>
                <label class="chip diet-chip" style="cursor:pointer;">
                    <input type="checkbox" name="diet_tags[]" value="<?= h($tag) ?>" style="display:none;" onchange="this.parentElement.classList.toggle('on', this.checked)">
                    <?= h($tag) ?>
                </label>
            <?php endforeach; ?>
        </div>
    </div>

    <div class="field">
        <label>Color theme</label>
        <select name="color_theme">
            <?php foreach (FOOD_COLORS as $cls => $name): ?>
                <option value="<?= h($cls) ?>"><?= h($name) ?></option>
            <?php endforeach; ?>
        </select>
    </div>

    <div class="field">
        <label>Photo (optional)</label>
        <input type="file" name="photo" accept="image/*">
        <span class="hint">If no photo, the color theme will show with the dish name</span>
    </div>

    <button type="submit" class="btn">Add menu item</button>
    <a href="index.php?page=manage&tab=menu" class="btn secondary mt-8">Cancel</a>
</form>

<?php layout_close(); ?>
