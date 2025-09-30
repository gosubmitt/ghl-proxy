export const config = { runtime: "edge" };

const BASE = "https://services.leadconnectorhq.com";

// In Edge runtime, use process.env style is NOT allowed.
// Instead, read from environment variables using import.meta.env
const TOKEN = (process.env?.GHL_PI_TOKEN || "").trim();

export default async function handler(req: Request) {
  if (!TOKEN) {
    return new Response(JSON.stringify({ ok: false, error: "Missing GHL_PI_TOKEN" }), { status: 500 });
  }

  try {
    const { pathname, search } = new URL(req.url);
    const upstream = BASE + pathname.replace("/api/ghl-proxy", "") + search;

    const method = req.method;
    const body = method === "GET" || method === "HEAD" ? undefined : await req.text();

    const res = await fetch(upstream, {
      method,
      headers: {
        Authorization: TOKEN,            // raw pit-… (NO "Bearer ")
        Version: "2021-07-28",
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
        "x-request-id": res.headers.get("x-request-id") || res.headers.get("x-amzn-requestid") || "",
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
}
