<?php
require __DIR__ . '/includes/config.php';

$messages = [];
$errors = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['install'])) {
    try {
        $sql = file_get_contents(__DIR__ . '/includes/schema.sql');
        $statements = array_filter(array_map('trim', explode(';', $sql)));
        foreach ($statements as $stmt) {
            if ($stmt) $pdo->exec($stmt);
        }
        $messages[] = 'Tables created successfully.';

        $count = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
        if ($count > 0) {
            $messages[] = 'Users already exist. Skipping seed data.';
        } else {
            $pdo->exec("INSERT INTO families (id, name, head_name) VALUES
                (1, 'Family A', 'Karthi'),
                (2, 'Family B', 'Raj')");

            $users = [
                ['admin',  'Admin',           'admin',  null],
                ['karthi', 'Karthi',          'family', 1],
                ['priya',  'Priya',           'family', 1],
                ['raj',    'Raj',             'family', 2],
                ['meena',  'Meena',           'family', 2],
                ['cook',   'Lakshmi (Cook)',  'cook',   null],
                ['driver', 'Suresh (Driver)', 'driver', null],
            ];
            $stmt = $pdo->prepare("INSERT INTO users (username, password_hash, name, role, family_id) VALUES (?, ?, ?, ?, ?)");
            foreach ($users as $u) {
                $stmt->execute([$u[0], password_hash($u[0], PASSWORD_DEFAULT), $u[1], $u[2], $u[3]]);
            }

            // Seed menu items with diet tags + color themes
            // Format: [name, category, cuisine, description, ingredients, diet_tags, color_theme]
            $menus = [
                ['Idli Sambar',     'Breakfast', 'South Indian', 'Soft idlis with sambar & chutney', 'Idli rice, urad dal, toor dal, vegetables', 'Vegan,Gluten-free,Heart-healthy', 'fi-dosa'],
                ['Masala Dosa',     'Breakfast', 'South Indian', 'Crispy dosa with potato masala',   'Rice, urad dal, potato, onion', 'Gluten-free,Vegan', 'fi-dosa'],
                ['Pongal',          'Breakfast', 'South Indian', 'Rice and moong dal porridge',      'Rice, moong dal, ghee, pepper', 'Vegan,Gluten-free,Heart-healthy', 'fi-dal'],
                ['Veg Pulao',       'Veg',       'Indian',       'Mixed vegetable rice',             'Basmati rice, mixed veg, ghee, spices', 'Vegan,Heart-healthy,Gluten-free', 'fi-veg'],
                ['Dal Tadka',       'Veg',       'North Indian', 'Yellow dal with tempering',        'Toor dal, ghee, cumin, garlic', 'Vegan,High-protein,Diabetic-friendly,Gluten-free', 'fi-dal'],
                ['Paneer Butter Masala', 'Veg',  'North Indian', 'Creamy paneer curry',              'Paneer, tomato, butter, cream', 'High-protein,Gluten-free', 'fi-paneer'],
                ['Chicken Curry',   'Chicken',   'Indian',       'Home style chicken curry',         'Chicken, onion, tomato, masala', 'High-protein,Gluten-free,Lactose-free', 'fi-chicken'],
                ['Chicken Biryani', 'Chicken',   'Indian',       'Aromatic chicken biryani',         'Chicken, basmati rice, masala', 'High-protein,Gluten-free', 'fi-biryani'],
                ['Mutton Curry',    'Mutton',    'Indian',       'Slow cooked mutton',               'Mutton, onion, masala, ghee', 'High-protein,Keto,Gluten-free', 'fi-paneer'],
                ['Fish Fry',        'Fish',      'South Indian', 'Pan fried fish',                   'Fish, turmeric, chilli, salt', 'High-protein,Keto,Gluten-free,Lactose-free', 'fi-fish'],
                ['Fish Curry',      'Fish',      'South Indian', 'Tangy fish curry',                 'Fish, tamarind, coconut, spices', 'High-protein,Heart-healthy,Mediterranean,Gluten-free,Lactose-free', 'fi-fish'],
                ['Egg Curry',       'Egg',       'Indian',       'Boiled eggs in onion gravy',       'Eggs, onion, tomato, masala', 'High-protein,Keto,Gluten-free', 'fi-egg'],
                ['Veg Stir Fry',    'Veg',       'Chinese',      'Quick stir-fried veg',             'Mixed veg, soy, garlic, oil', 'Vegan,Heart-healthy,Low-sodium', 'fi-veg'],
                ['Pasta Aglio',     'Veg',       'Italian',      'Garlic & olive oil pasta',         'Pasta, garlic, olive oil, chilli', 'Vegan,Mediterranean,Heart-healthy', 'fi-pasta'],
                ['Teriyaki Chicken','Chicken',   'Japanese',     'Sweet-salty glazed chicken',       'Chicken, soy, mirin, sugar', 'High-protein,Lactose-free', 'fi-japanese'],
                ['Miso Soup',       'Other',     'Japanese',     'Light tofu and seaweed soup',      'Miso, tofu, seaweed, spring onion', 'Vegan,Heart-healthy,Low-sodium,Lactose-free', 'fi-japanese'],
                ['Greek Salad',     'Veg',       'Mediterranean','Fresh salad with feta and olives', 'Cucumber, tomato, feta, olives, olive oil', 'Mediterranean,Heart-healthy,Diabetic-friendly,Keto', 'fi-veg'],
                ['Hummus & Pita',   'Snacks',    'Middle Eastern','Chickpea dip with flatbread',     'Chickpeas, tahini, garlic, lemon, pita', 'Vegan,Heart-healthy,Mediterranean', 'fi-pasta'],
            ];
            $stmt = $pdo->prepare("INSERT INTO menu_items (name, category, cuisine, description, ingredients, diet_tags, color_theme) VALUES (?, ?, ?, ?, ?, ?, ?)");
            foreach ($menus as $m) $stmt->execute($m);

            // Sample recipe with diet tags
            $pdo->exec("INSERT INTO recipes (title, category, cuisine, difficulty, time_min, servings, description, steps, notes, diet_tags, color_theme, created_by) VALUES
                ('Healthy Veg Pulao', 'Lunch', 'Indian', 'Easy', 30, 4, 'A wholesome one-pot rice meal',
                'Wash basmati rice. Heat ghee, add cumin and onion. Saute mixed veg for 5 min. Add rice and water (1:2). Cover and cook 15 min on low.',
                'Use brown rice for more fiber. Add green peas for extra protein.',
                'Vegan,Heart-healthy,Gluten-free', 'fi-veg', 1)");
            $rid = $pdo->lastInsertId();
            $pdo->exec("INSERT INTO recipe_ingredients (recipe_id, name, qty, unit, sort_order) VALUES
                ($rid, 'Basmati rice', 200, 'g', 1),
                ($rid, 'Mixed vegetables', 250, 'g', 2),
                ($rid, 'Ghee', 15, 'g', 3),
                ($rid, 'Onion', 100, 'g', 4)");

            $messages[] = 'Seed data added: 7 users, 2 families, 18 menu items (with cuisine + diet tags), 1 sample recipe.';
        }

    } catch (Exception $e) {
        $errors[] = $e->getMessage();
    }
}

$installed = false;
try {
    $r = $pdo->query("SHOW TABLES LIKE 'users'")->fetchColumn();
    if ($r) {
        $count = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
        if ($count > 0) $installed = true;
    }
} catch (Exception $e) {}
?>
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Install — Shared Kitchen</title>
<style>
body { font-family: -apple-system, system-ui, sans-serif; background: #faf7f2; color: #1a1a1a; padding: 30px 16px; }
.box { max-width: 500px; margin: 0 auto; background: white; border-radius: 14px; padding: 24px; border: 1px solid #e8e4dc; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
h1 { font-family: Georgia, serif; margin: 0 0 6px; font-size: 24px; color: #0f4c3a; }
.lead { color: #6b6b6b; font-size: 14px; margin-bottom: 20px; }
.btn { display: inline-block; background: #0f4c3a; color: white; padding: 12px 22px; border-radius: 10px; border: none; font-size: 15px; font-weight: 600; cursor: pointer; text-decoration: none; }
.btn:hover { opacity: 0.9; }
.ok { background: #e8f1ed; color: #0f4c3a; padding: 12px; border-radius: 8px; margin-bottom: 10px; }
.err { background: #fee; color: #b91c1c; padding: 12px; border-radius: 8px; margin-bottom: 10px; }
.info { background: #fef3e6; color: #5b3a08; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 13px; line-height: 1.5; }
table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px; }
th, td { text-align: left; padding: 8px 6px; border-bottom: 1px solid #eee; }
th { font-size: 12px; color: #6b6b6b; text-transform: uppercase; letter-spacing: 0.05em; }
code { background: #f5f1e8; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
</style>
</head>
<body>
<div class="box">
    <h1>Shared Kitchen — Setup</h1>
    <p class="lead">One-click installer. Run this once after uploading.</p>

    <?php foreach ($messages as $m): ?><div class="ok">✓ <?= h($m) ?></div><?php endforeach; ?>
    <?php foreach ($errors as $e): ?><div class="err">✗ <?= h($e) ?></div><?php endforeach; ?>

    <?php if ($installed && empty($messages)): ?>
        <div class="info">
            <b>Already installed.</b> The app is ready to use.
            <br><br>
            <a href="index.php" class="btn">Open the app →</a>
            <br><br>
            <small style="color:#888;">For security, delete <code>install.php</code> from your server after setup.</small>
        </div>
    <?php elseif ($installed && !empty($messages)): ?>
        <div class="info">
            <b>Setup complete!</b>
            <br><br>
            <a href="index.php" class="btn">Open the app →</a>
            <br><br>
            <b>Default login accounts</b> (username = password):
            <table>
                <tr><th>Role</th><th>Username</th><th>Password</th></tr>
                <tr><td>Admin</td><td><code>admin</code></td><td><code>admin</code></td></tr>
                <tr><td>Family A</td><td><code>karthi</code></td><td><code>karthi</code></td></tr>
                <tr><td>Family A</td><td><code>priya</code></td><td><code>priya</code></td></tr>
                <tr><td>Family B</td><td><code>raj</code></td><td><code>raj</code></td></tr>
                <tr><td>Family B</td><td><code>meena</code></td><td><code>meena</code></td></tr>
                <tr><td>Cook</td><td><code>cook</code></td><td><code>cook</code></td></tr>
                <tr><td>Driver</td><td><code>driver</code></td><td><code>driver</code></td></tr>
            </table>
            <br>
            <b>⚠ Important:</b>
            <ol style="margin:8px 0 0 20px; padding:0;">
                <li>Change all passwords from Admin → ⚙ → Users</li>
                <li>Delete <code>install.php</code> from your server</li>
            </ol>
        </div>
    <?php else: ?>
        <div class="info">
            This will:
            <ul style="margin:8px 0 0 20px;padding:0;">
                <li>Create all database tables in <b><?= h(DB_NAME) ?></b></li>
                <li>Add 2 families, 7 users, 18 menu items, sample recipe</li>
                <li>Tag dishes with cuisine + diet info (vegan, gluten-free, etc.)</li>
                <li>Set up demo passwords (you can change them later)</li>
            </ul>
        </div>
        <form method="post">
            <button type="submit" name="install" value="1" class="btn">Install now</button>
        </form>
    <?php endif; ?>
</div>
</body>
</html>
