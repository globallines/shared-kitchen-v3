# Porting brief — PHP → Next.js (faithful)

We are porting a PHP app to **Next.js 15 App Router (JavaScript, server components)**. Reproduce each PHP page's markup, CSS classes, queries, and logic **faithfully**. Do not redesign.

## Paths
- PHP source (read-only): `/Users/karthikaraja/Library/Application Support/Claude/local-agent-mode-sessions/4fe1b247-cf02-480b-aa22-766ec8004f85/27a0137d-aa8d-4293-ae2e-7e7cb7053d82/local_c4eca817-31b5-440b-b858-9b2d2c224f06/outputs/orig_kitchen/handover_full/kitchen`
  - pages in `pages/*.php`, helpers in `includes/helpers.php`, schema in `includes/schema.sql`
- Repo to WRITE into: `/Users/karthikaraja/Documents/GitHub/shared-kitchen-v3`

## READ FIRST (these are the worked examples + the API)
- `app/page.js` (home — all 4 roles, server actions) and `app/login/page.js`
- `lib/server.js`, `lib/helpers.js`, `lib/ui.jsx`

## Library API
From `lib/server` (compute relative path, e.g. a page at `app/foo/page.js` imports `../../lib/server`):
- `db()` → mysql2 promise pool. Use `const [rows] = await db().query(sql, params)`. **DATE columns come back as strings** ("YYYY-MM-DD").
- `requireUser()` → full user row `{id, role, family_id, name, family_name, diet_pref, phone, ...}`; redirects to /login if logged out.
- `currentUser()` → light `{id, role, family_id, name}` (use inside server actions).
- `setFlash(msg, type='ok')` and `getFlash()` (call getFlash once in the page, pass to `<Layout flash={...}>`).

From `lib/ui.jsx`:
- `<Layout title subtitle user={u} flash={flash} active="/cuisine">…</Layout>` — renders topbar + main + bottomnav. `active` is the nav key (`/`, `/cuisine`, `/plan`, `/shopping`, `/feedback`).
- `<DishPhoto name colorTheme={…} photo={…} size="small|tiny|large|''" />` ← replaces `dish_photo($name,$color,$photo,$size)`.
- `<DietPills tags={…} />` ← replaces `diet_tags_pills($tags)`.
- `<Pill kind="ok|warn|muted|danger|diet">…</Pill>`, `<Stars n={rating} />`.

From `lib/helpers`:
- `fmtMoney` (=fmt_money), `fmtDate` (=fmt_date), `fmtDateShort` (=fmt_date_short), `today()`, `tomorrow()`, `thisMonth()`, `monthLabel()`, `ucfirst()`, `avatarInitial()`, `cuisineSlug()`, `autoColor()`, `roleLabel()`, `DIET_TAGS`, `CUISINES`, `FOOD_COLORS`, `PHOTO_BASE`.

## Translation rules
- Top of every page file: `export const dynamic = "force-dynamic";`
- Page = `export default async function Name({ params, searchParams }) { const u = await requireUser(); const flash = await getFlash(); … return <Layout …>…</Layout>; }`. `params`/`searchParams` are async — `const { id } = await params; const sp = (await searchParams)||{};`
- `h($x)` → just `{x}` (React escapes). `htmlspecialchars` → none needed.
- `csrf_field()` / `csrf_check()` → **omit** (Next server actions are origin-protected).
- PHP `$_POST` handler blocks → a **server action**:
  ```js
  async function doThing(formData){ "use server";
    const { db, currentUser, setFlash } = await import("<rel>/lib/server");
    const { redirect } = await import("next/navigation");
    const u = await currentUser(); if(!u) redirect("/login");
    … await db().query(...); await setFlash("…"); redirect("/target");
  }
  ```
  Wire with `<form action={doThing}>` and `<input type="hidden" name="…" value={…}>`. For multiple buttons use distinct hidden `name=kind` values (see home cook actions).
- `require_role(['admin'])` → `if (u.role !== 'admin') redirect('/');` (or check array membership).
- `flash($m)` → `await setFlash($m)`. `redirect('index.php?page=x')` → `redirect('/x-route')`.
- Keep all CSS class names IDENTICAL to the PHP output.
- File uploads (bill/photo): the original media is remote. For now, **skip handling new uploads** (omit the file input or accept it and ignore), and render existing images via `` `${PHOTO_BASE}${row.photo}` ``. Don't break the page over uploads.

## Route map (convert every `index.php?page=…` link)
| PHP page | Next route | File |
|---|---|---|
| home | `/` | (done) |
| login/logout | `/login`, `/logout` | (done) |
| cuisine | `/cuisine` | `app/cuisine/page.js` |
| cuisine_view (`&c=`/`&cat=`) | `/cuisine/[slug]` | `app/cuisine/[cuisine]/page.js` (read the real query params from cuisine.php links and map; pass via `params`/`searchParams`) |
| menu_view (`&id=`) | `/dish/[id]` | `app/dish/[id]/page.js` |
| order / requirement | `/order` | `app/order/page.js` |
| plan | `/plan` | `app/plan/page.js` |
| shopping | `/shopping` | `app/shopping/page.js` |
| expenses | `/expenses` | `app/expenses/page.js` |
| expense_new | `/expense/new` | `app/expense/new/page.js` |
| payment_new | `/payment/new` | `app/payment/new/page.js` |
| settlement | `/settlement` | `app/settlement/page.js` |
| recipes | `/recipes` | `app/recipes/page.js` |
| recipe_view (`&id=`) | `/recipe/[id]` | `app/recipe/[id]/page.js` |
| recipe_new | `/recipe/new` | `app/recipe/new/page.js` |
| feedback | `/feedback` | `app/feedback/page.js` |
| feedback_new (`&req=`) | `/feedback/new` | `app/feedback/new/page.js` (read `req` from searchParams) |
| manage | `/manage` | `app/manage/page.js` |
| menu_new | `/menu/new` | `app/menu/new/page.js` |
| menu_edit (`&id=`) | `/menu/[id]/edit` | `app/menu/[id]/edit/page.js` |
| user_new | `/user/new` | `app/user/new/page.js` |
| user_edit (`&id=`) | `/user/[id]/edit` | `app/user/[id]/edit/page.js` |
| family_edit (`&id=`) | `/family/[id]/edit` | `app/family/[id]/edit/page.js` |

## Quality bar
Faithful to the PHP: same data, same sections, same classes, same order. When in doubt, mirror the PHP exactly. Only touch the files in your assigned list. Do NOT edit lib/*, app/page.js, app/login, globals.css.
