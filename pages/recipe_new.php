<?php
$u = current_user();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $title = trim($_POST['title']);
    $cat = $_POST['category'];
    $cuisine = $_POST['cuisine'];
    $diff = $_POST['difficulty'];
    $time = (int)$_POST['time_min'];
    $serv = max(1, (int)$_POST['servings']);
    $desc = trim($_POST['description'] ?? '');
    $steps = trim($_POST['steps'] ?? '');
    $notes = trim($_POST['notes'] ?? '');
    $video = trim($_POST['video_url'] ?? '');
    $color = $_POST['color_theme'] ?? auto_color($cat, $cuisine);
    $diets = $_POST['diet_tags'] ?? [];
    $diet_str = implode(',', array_filter($diets));
    $photo = handle_upload('photo', 'recipes');

    if (!$title) {
        flash('Title required', 'error');
    } else {
        $stmt = $pdo->prepare("INSERT INTO recipes (title, category, cuisine, difficulty, time_min, servings, description, steps, notes, video_url, photo, color_theme, diet_tags, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
        $stmt->execute([$title, $cat ?: null, $cuisine ?: null, $diff, $time, $serv, $desc ?: null, $steps ?: null, $notes ?: null, $video ?: null, $photo, $color, $diet_str ?: null, $u['id']]);
        $rid = $pdo->lastInsertId();

        $names = $_POST['ing_name'] ?? [];
        $qtys = $_POST['ing_qty'] ?? [];
        $units = $_POST['ing_unit'] ?? [];
        $ins = $pdo->prepare("INSERT INTO recipe_ingredients (recipe_id, name, qty, unit, sort_order) VALUES (?,?,?,?,?)");
        foreach ($names as $i => $n) {
            $n = trim($n);
            if (!$n) continue;
            $ins->execute([$rid, $n, (float)($qtys[$i] ?? 0), $units[$i] ?? 'g', $i]);
        }

        flash('Recipe saved');
        redirect('index.php?page=recipe_view&id=' . $rid);
    }
}

layout_open('New Recipe');
?>

<form method="post" enctype="multipart/form-data">
    <?= csrf_field() ?>

    <div class="field">
        <label>Recipe title</label>
        <input type="text" name="title" required placeholder="e.g. Healthy Veg Pulao">
    </div>

    <div class="row2">
        <div class="field">
            <label>Category</label>
            <select name="category">
                <?php foreach (['Breakfast','Lunch','Dinner','Snacks','Veg','Chicken','Mutton','Fish','Egg','Other'] as $c): ?>
                    <option><?= $c ?></option>
                <?php endforeach; ?>
            </select>
        </div>
        <div class="field">
            <label>Cuisine</label>
            <select name="cuisine">
                <?php foreach (CUISINES as $c): ?>
                    <option><?= h($c) ?></option>
                <?php endforeach; ?>
            </select>
        </div>
    </div>

    <div class="row3">
        <div class="field">
            <label>Difficulty</label>
            <select name="difficulty"><option>Easy</option><option>Medium</option><option>Hard</option></select>
        </div>
        <div class="field">
            <label>Time (min)</label>
            <input type="number" name="time_min" value="30" min="1">
        </div>
        <div class="field">
            <label>Servings</label>
            <input type="number" name="servings" value="4" min="1">
        </div>
    </div>

    <div class="field">
        <label>Description</label>
        <textarea name="description" rows="2"></textarea>
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
        <label>Color theme (for the photo placeholder)</label>
        <select name="color_theme">
            <?php foreach (FOOD_COLORS as $cls => $name): ?>
                <option value="<?= h($cls) ?>"><?= h($name) ?></option>
            <?php endforeach; ?>
        </select>
        <span class="hint">Used until you upload a real photo</span>
    </div>

    <div class="field">
        <label>Video link (YouTube etc.)</label>
        <input type="url" name="video_url" placeholder="https://youtube.com/watch?v=...">
    </div>

    <div class="field">
        <label>Photo (optional)</label>
        <input type="file" name="photo" accept="image/*">
    </div>

    <hr>
    <h3>Ingredients</h3>
    <p class="small mb-12">Add each ingredient. Nutrition is auto-calculated.</p>

    <div id="ings">
        <?php for ($i = 0; $i < 5; $i++): ?>
        <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:6px;margin-bottom:6px;">
            <input type="text" name="ing_name[]" placeholder="Ingredient" style="padding:10px;border:1px solid var(--line);border-radius:8px;">
            <input type="number" name="ing_qty[]" step="0.01" placeholder="Qty" style="padding:10px;border:1px solid var(--line);border-radius:8px;">
            <select name="ing_unit[]" style="padding:10px;border:1px solid var(--line);border-radius:8px;">
                <option>g</option><option>kg</option><option>ml</option><option>l</option>
                <option>tsp</option><option>tbsp</option><option>cup</option><option>pcs</option>
            </select>
        </div>
        <?php endfor; ?>
    </div>
    <button type="button" class="btn secondary small" onclick="addIng()">+ Add another</button>

    <hr>
    <div class="field">
        <label>Cooking steps</label>
        <textarea name="steps" rows="6" placeholder="Step by step..."></textarea>
    </div>

    <div class="field">
        <label>Tips / notes</label>
        <textarea name="notes" rows="2"></textarea>
    </div>

    <button type="submit" class="btn">Save recipe</button>
    <a href="index.php?page=recipes" class="btn secondary mt-8">Cancel</a>
</form>

<script>
function addIng() {
    const wrap = document.getElementById('ings');
    const row = document.createElement('div');
    row.style.cssText = 'display:grid;grid-template-columns:2fr 1fr 1fr;gap:6px;margin-bottom:6px;';
    row.innerHTML = `
        <input type="text" name="ing_name[]" placeholder="Ingredient" style="padding:10px;border:1px solid var(--line);border-radius:8px;">
        <input type="number" name="ing_qty[]" step="0.01" placeholder="Qty" style="padding:10px;border:1px solid var(--line);border-radius:8px;">
        <select name="ing_unit[]" style="padding:10px;border:1px solid var(--line);border-radius:8px;">
            <option>g</option><option>kg</option><option>ml</option><option>l</option>
            <option>tsp</option><option>tbsp</option><option>cup</option><option>pcs</option>
        </select>`;
    wrap.appendChild(row);
}
</script>

<?php layout_close(); ?>
