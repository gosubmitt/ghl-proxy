export const config = { runtime: "edge" };

const BASE = "https://services.leadconnectorhq.com";
const TOKEN = process.env.GHL_PI_TOKEN?.trim() || "";

export default async function handler(req: Request) {
  if (!TOKEN) {
    return new Response(JSON.stringify({ ok: false, error: "Missing GHL_PI_TOKEN" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);

    // Force-strip ONLY the first /api/ghl-proxy
    const stripped = url.pathname.startsWith("/api/ghl-proxy")
      ? url.pathname.substring("/api/ghl-proxy".length)
      : url.pathname;

    const upstream = BASE + stripped + url.search;

    const method = req.method;
    const body = method === "GET" || method === "HEAD" ? undefined : await req.text();

    const res = await fetch(upstream, {
      method,
      headers: {
        Authorization: TOKEN,
        Version: "2021-07-28", // required by GHL PI API
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body,
      redirect: "manual",
    });

    const text = await res.text();

    return new Response(text, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") || "application/json",
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
