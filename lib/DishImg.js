"use client";
import { useState } from "react";

// Deterministic, food-warm gradient palettes
const PALETTES = [
  ["#1a4a37", "#2e6b4f"],
  ["#7a4a1e", "#b07a3c"],
  ["#4a2e6b", "#7a5aa8"],
  ["#6b1e3a", "#a83c5e"],
  ["#1e4a6b", "#3c7aa8"],
  ["#5a6b1e", "#8aa83c"],
  ["#6b4a1e", "#a8853c"],
  ["#1e6b5a", "#3ca88a"],
];

const EMOJI_RULES = [
  [/dosa|idli|uttapam|appam|paniyaram/, "🥞"],
  [/rice|biryani|pulao|pongal|caulirice/, "🍚"],
  [/roti|chapati|naan|paratha|wheat|bread/, "🫓"],
  [/dal|sambar|rasam|curry|gravy|kuzhambu|kootu/, "🍛"],
  [/soup|broth|shorba/, "🥣"],
  [/salad|greens|sprout|cucumber/, "🥗"],
  [/egg|omelet|scramble|bhurji/, "🍳"],
  [/chicken|mutton|fish|prawn|meat|kebab|tikka/, "🍗"],
  [/paneer|tofu|cheese/, "🧀"],
  [/smoothie|shake|juice|shot|grass|detox|drink/, "🥤"],
  [/protein|whey|oats|muesli/, "💪"],
  [/fruit|apple|banana|berry|mango/, "🍎"],
  [/sweet|halwa|kheer|payasam|dessert|laddu/, "🍮"],
  [/veg|sabzi|poriyal|stir/, "🥦"],
  [/tea|coffee|chai/, "☕"],
];

function hash(s) {
  let h = 0;
  const t = s || "";
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickEmoji(label) {
  const l = (label || "").toLowerCase();
  for (const [re, e] of EMOJI_RULES) if (re.test(l)) return e;
  return "🍲";
}

export default function DishImg({ src, label = "", fallback, className }) {
  const [ok, setOk] = useState(Boolean(src));
  if (src && ok) return <img src={src} alt={label} onError={() => setOk(false)} />;
  const [a, b] = PALETTES[hash(label || fallback || "x") % PALETTES.length];
  return (
    <div
      className={className || "ph"}
      style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
    >
      <span className="ph-emoji">{fallback || pickEmoji(label)}</span>
    </div>
  );
}
