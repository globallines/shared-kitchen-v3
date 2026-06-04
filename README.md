# Shared Kitchen v2

A mobile-friendly app for two families sharing one cook. Plan meals by **cuisine** (13 worldwide options), filter by **diet** (10 health-aware tags), track expenses, and auto-generate shopping lists.

---

## What's inside (v2)

- **Login & roles** — Admin, Family, Cook, Driver. Same 5 nav tabs for everyone.
- **Today's Menu hero** — Big photo cards lead the home screen
- **Cuisine browse** — 13 cuisines (Indian, S.Indian, N.Indian, Chinese, Japanese, Thai, Korean, Italian, Mexican, Mediterranean, Middle Eastern, Continental, Other) as colored tiles
- **10 Diet filters** — Diabetic, Heart-healthy, Low-sodium, Gluten-free, Lactose-free, Keto, High-protein, Vegan, Jain, Mediterranean
- **Daily meal requirements** — Each family posts what they need
- **Tomorrow plan** — Plan ahead with photo cards, both families confirm
- **Auto shopping list** — Generated from confirmed plans, marking bought auto-creates expense
- **Expenses + payments + monthly settlement** — Auto-calculates who owes what
- **Recipe library** — Photo cards, cuisine + diet chips, auto nutrition (calories/protein/carbs/fat per serving)
- **Add to Tomorrow Plan** — One tap from any recipe
- **Star feedback** with improvement suggestions for the cook
- **Admin Setup** (⚙ icon top-right) — manage users, families, menu, money
- **PWA installable** on iPhone Safari and Android Chrome
- **Mobile-first** — Warm Earthy theme, Georgia serif

---

## Setup on shared hosting (GoDaddy / Hostinger / cPanel)

Total time: ~15 minutes. No coding required.

### Step 1: Create a database

1. Login to your hosting cPanel
2. Click **MySQL Databases**
3. Create a new database — name it `kitchen` (it'll prefix with your account name)
4. Create a database user — give them a strong password
5. **Add the user to the database** with **ALL PRIVILEGES**
6. Note down: database name, username, password

### Step 2: Upload files

1. Open cPanel -> File Manager -> `public_html`
2. Click **Upload** -> upload `kitchen.zip`
3. Right-click the uploaded zip -> **Extract**
4. (Optional) Move files out of the kitchen/ folder if you want it at root

### Step 3: Edit config

1. Open `includes/config.php`
2. Edit only these 4 lines at the top:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'youraccount_kitchen');
   define('DB_USER', 'youraccount_kitchen');
   define('DB_PASS', 'your_password_here');
   ```
3. Save

### Step 4: Run installer (one time)

1. Visit `https://yoursite.com/install.php`
2. Click **Install now**
3. See "Setup complete!"

### Step 5: Delete install.php

Right-click `install.php` in File Manager -> Delete. Important for security.

### Step 6: Login

Visit `https://yoursite.com/`.

**Demo accounts** (username = password):

| Role     | Username | Password |
|----------|----------|----------|
| Admin    | admin    | admin    |
| Family A | karthi   | karthi   |
| Family A | priya    | priya    |
| Family B | raj      | raj      |
| Family B | meena    | meena    |
| Cook     | cook     | cook     |
| Driver   | driver   | driver   |

**Important:** Change all passwords immediately. Login as `admin` -> tap ⚙ -> Users -> tap each user -> reset password.

---

## Add to Home Screen (looks like a real app)

### iPhone / iPad
1. Open in Safari (must be Safari)
2. Tap Share -> **Add to Home Screen** -> Add

### Android
1. Open in Chrome
2. Menu (3 dots) -> **Install app** or **Add to Home screen**

---

## Daily use

### Family member
- **Home** -> Today's menu hero, tomorrow preview, my share
- **Cuisine** -> Browse 13 cuisines, filter by diet, tap dish to order
- **Plan** -> Add tomorrow's meals
- **Shop** -> Driver/cook view of shopping list
- **Rate** -> Add feedback after meals

### Cook
- **Home** -> All today's orders by meal type, with past feedback
- **Cuisine** / **Plan** -> See what's coming
- **Shop** -> Generate shopping list from plans
- **Rate** -> See feedback dashboard

### Driver
- **Home** -> Pending shopping count, my purchases
- **Shop** -> Tap items as bought (auto-creates expense)

### Admin
- Same 5 tabs PLUS ⚙ icon top-right -> Setup (users/families/menu/money)

---

## How shopping list works

1. Both families add tomorrow's plans
2. Admin/Cook taps **Generate shopping list**
3. App reads each menu item's `ingredients` field, combines them, categorizes
4. Driver opens **Shop** -> sees list grouped by category
5. Marks each item as bought with quantity & amount paid
6. App **auto-creates an expense entry** for each — no double work

---

## Customizing

### Add your own dishes
⚙ Setup -> Menu -> + New. Tag with cuisine + diet. Pick a color theme. Optionally upload a photo.

### Add your team
⚙ Setup -> Users -> + New. Family members get a family assigned, cook/driver/admin don't.

### Change app name / currency
Edit `includes/config.php` -> `APP_NAME`, `APP_CURRENCY`.

---

## Troubleshooting

**"Database connection failed"** -> Check `includes/config.php` values
**Page is blank** -> Hosting needs PHP 7.4+. Contact support.
**Can't upload photos** -> `uploads/` folder needs write permission (chmod 755 or 775)
**Doesn't look right** -> Hard-refresh. Service worker caches CSS.

---

## Tech notes

- **Backend**: PHP 7.4+ / 8.x with PDO MySQL
- **Database**: MySQL 5.7+ / MariaDB 10+
- **Frontend**: Vanilla CSS + small JS
- **PWA**: Service worker, installable
- **No CDN dependencies** — everything is local
