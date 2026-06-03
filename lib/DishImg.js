"use client";
import { useState } from "react";

export default function DishImg({ src, fallback = "🍽️", className }) {
  const [ok, setOk] = useState(Boolean(src));
  if (!src || !ok) return <div className={className || "ph"}>{fallback}</div>;
  return <img src={src} alt="" onError={() => setOk(false)} />;
}
