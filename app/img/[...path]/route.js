export const dynamic = "force-dynamic";

export async function GET(req, ctx) {
  const params = await ctx.params;
  const path = (params.path || []).join("/");
  if (!path) return new Response("missing path", { status: 400 });
  const url = "https://avanith.com/kitchen/" + path;
  try {
    const r = await fetch(url, {
      headers: { Referer: "https://avanith.com/kitchen/", "User-Agent": "Mozilla/5.0 (SharedKitchen)" },
      cache: "no-store",
    });
    if (!r.ok) return new Response("not found", { status: 404 });
    const buf = await r.arrayBuffer();
    return new Response(buf, {
      headers: {
        "Content-Type": r.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch (e) {
    return new Response("error", { status: 502 });
  }
}
