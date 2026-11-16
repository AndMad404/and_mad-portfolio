export default {
  async fetch(request: Request, env: { ASSETS: Fetcher }) {
    const url = new URL(request.url);
    if (!["GET", "HEAD"].includes(request.method))
      return new Response(null, { status: 405 });
    let response = await env.ASSETS.fetch(request);
    if (response.status === 404) {
      response = new Response(
        '<!doctype html><html lang="es"><head><meta name="robots" content="noindex,nofollow"><title>Página no encontrada</title></head><body><main><h1>Esta página no existe.</h1><a href="/">Volver al inicio</a></main></body></html>',
        {
          status: 404,
          headers: { "content-type": "text/html; charset=utf-8" },
        },
      );
    }
    const headers = new Headers(response.headers);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    headers.set(
      "Content-Security-Policy",
      "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
    );
    if (url.pathname.includes("/api") || url.pathname.includes("/admin"))
      headers.set("Cache-Control", "no-store");
    return new Response(request.method === "HEAD" ? null : response.body, {
      status: response.status,
      headers,
    });
  },
};
