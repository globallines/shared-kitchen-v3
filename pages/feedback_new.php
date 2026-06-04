<?php
$u = require_role(['family','admin']);

$req_id = (int)($_GET['req'] ?? 0);
$req = null;
if ($req_id) {
    $stmt = $pdo->prepare("
        SELECT mr.*, m.name AS dish, f.name AS family_name
        FROM meal_requirements mr
        LEFT JOIN menu_items m ON mr.menu_item_id = m.id
        LEFT JOIN families f ON mr.family_id = f.id
        WHERE mr.id = ?
    ");
    $stmt->execute([$req_id]);
    $req = $stmt->fetch();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $rating = (int)$_POST['rating'];
    $comment = trim($_POST['comment'] ?? '');
    $improvement = trim($_POST['improvement'] ?? '');

    if ($rating < 1 || $rating > 5) {
        flash('Please give a star rating', 'error');
    } else {
        $stmt = $pdo->prepare("INSERT INTO feedback (requirement_id, menu_item_id, user_id, family_id, date, rating, comment, improvement) VALUES (?,?,?,?,?,?,?,?)");
        $stmt->execute([
            $req_id ?: null,
            $req['menu_item_id'] ?? null,
            $u['id'],
            $u['family_id'] ?: ($req['family_id'] ?? 1),
            $req['date'] ?? today(),
            $rating,
            $comment ?: null,
            $improvement ?: null
        ]);
        flash('Thank you for the feedback!');
        redirect('index.php?page=home');
    }
}

layout_open('Add Feedback');
?>

<?php if ($req): ?>
<div class="card mb-12">
    <div class="card-name"><?= h($req['dish'] ?: $req['custom_dish']) ?></div>
    <div class="card-meta"><?= h($req['meal_type']) ?> · <?= fmt_date($req['date']) ?> · <?= h($req['family_name']) ?></div>
</div>
<?php endif; ?>

<form method="post" class="card">
    <?= csrf_field() ?>

    <div class="field">
        <label>How was the dish?</label>
        <div class="stars" data-input="rating" style="font-size:32px;gap:8px;">
            <span class="star">★</span><span class="star">★</span><span class="star">★</span><span class="star">★</span><span class="star">★</span>
        </div>
        <input type="hidden" name="rating" value="" required>
    </div>

    <div class="field">
        <label>Suggestion for next time</label>
        <select name="improvement">
            <option value="">— none —</option>
            <option>Less spicy</option>
            <option>More spicy</option>
            <option>More salt</option>
            <option>Less salt</option>
            <option>Less oil</option>
            <option>Cook longer</option>
            <option>Better taste needed</option>
            <option>Smaller portion</option>
            <option>Larger portion</option>
            <option>Other (see comment)</option>
        </select>
    </div>

    <div class="field">
        <label>Additional comment (optional)</label>
        <textarea name="comment" rows="3" placeholder="What was good or what could be better"></textarea>
    </div>

    <button type="submit" class="btn">Submit feedback</button>
    <a href="index.php?page=home" class="btn secondary mt-8">Cancel</a>
</form>

<?php layout_close(); ?>
