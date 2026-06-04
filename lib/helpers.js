// Faithful port of the original includes/helpers.php (non-UI parts)

export const PHOTO_BASE = process.env.PHOTO_BASE_URL || "https://avanith.com/kitchen/uploads/";
export const APP_CURRENCY = "₹";

export const DIET_TAGS = [
  "Diabetic-friendly", "Heart-healthy", "Low-sodium", "Gluten-free", "Lactose-free",
  "Keto", "High-protein", "Vegan", "Jain", "Mediterranean",
];

export const CUISINES = [
  "Indian", "South Indian", "North Indian", "Chinese", "Japanese", "Thai", "Korean",
  "Italian", "Mexican", "Mediterranean", "Middle Eastern", "Continental", "Other",
];

export const FOOD_COLORS = {
  "fi-default": "Warm Orange", "fi-biryani": "Saffron", "fi-veg": "Fresh Green",
  "fi-paneer": "Tomato Red", "fi-fish": "Coral Pink", "fi-pasta": "Mustard",
  "fi-japanese": "Pink Plum", "fi-dosa": "Burnt Orange", "fi-dal": "Golden",
  "fi-egg": "Yellow", "fi-chicken": "Deep Red",
};

export const cuisineSlug = (c) => String(c || "").toLowerCase().replaceAll(" ", "-");

export function autoColor(category, cuisine = "") {
  const cat = String(category || "").toLowerCase();
  const cui = String(cuisine || "").toLowerCase();
  if (cat.includes("veg") && !cat.includes("non")) return "fi-veg";
  if (cat.includes("chicken")) return "fi-chicken";
  if (cat.includes("fish")) return "fi-fish";
  if (cat.includes("mutton")) return "fi-paneer";
  if (cat.includes("egg")) return "fi-egg";
  if (cui.includes("japanese")) return "fi-japanese";
  if (cui.includes("italian")) return "fi-pasta";
  if (cat.includes("breakfast")) return "fi-dosa";
  return "fi-default";
}

export const roleLabel = (r) =>
  ({ admin: "Admin", family: "Family", cook: "Cook", driver: "Driver" }[r] || r);

export const fmtMoney = (n) =>
  APP_CURRENCY + Math.round(Number(n || 0)).toLocaleString("en-IN");

// --- date helpers, computed in Asia/Kolkata to match the original ---
function istYMD(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
}
export const today = () => istYMD();
export const tomorrow = () => istYMD(new Date(Date.now() + 86400000));
export const thisMonth = () => today().slice(0, 7);

function ymdParts(d) {
  if (!d) return null;
  const s = String(d).slice(0, 10);
  const [y, m, day] = s.split("-").map(Number);
  if (!y) return null;
  return new Date(Date.UTC(y, m - 1, day));
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function fmtDate(d) {
  const dt = ymdParts(d);
  if (!dt) return "";
  return `${String(dt.getUTCDate()).padStart(2, "0")} ${MONTHS[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
}
export function fmtDateShort(d) {
  const dt = ymdParts(d);
  if (!dt) return "";
  return `${String(dt.getUTCDate()).padStart(2, "0")} ${MONTHS[dt.getUTCMonth()]}`;
}
export function monthLabel(ym) {
  const [y, m] = String(ym).split("-").map(Number);
  return `${MONTHS_FULL[m - 1]} ${y}`;
}
export const avatarInitial = (name) => (name ? String(name).trim()[0].toUpperCase() : "?");
export const ucfirst = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
