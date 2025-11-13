export default async (request) => {
  try {
    const targetOrigin = "https://lcs2.pythonanywhere.com";
    const reqUrl = new URL(request.url);

    // Build the forwarded URL
    const targetUrl = new URL(
      reqUrl.pathname + reqUrl.search,
      targetOrigin
    ).toString();

    const init = {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers),
        "Host": "lcs2.pythonanywhere.com",
      },
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.arrayBuffer(),
      redirect: "manual"
    };

    let response = await fetch(targetUrl, init);

    // -----------------------
    //  FIX FLASK REDIRECTS
    // -----------------------
    if ([301, 302, 303].includes(response.status)) {
      let loc = response.headers.get("Location") || "";

      // Absolute redirect → convert to relative
      if (loc.startsWith(targetOrigin)) {
        loc = loc.replace(targetOrigin, "");
      }

      // Relative redirect → keep it
      if (loc.startsWith("/")) {
        return Response.redirect(loc, response.status);
      }

      // Unhandled → fallback
      return new Response("Redirect blocked", { status: 500 });
    }

    // -----------------------
    //  FIX ABSOLUTE STATIC URLS
    // -----------------------
    const headers = new Headers(response.headers);

    // Remove HSTS to avoid HTTPS forcing issues
    headers.delete("Strict-Transport-Security");

    // Fix content location for browsers
    if (headers.get("Location")?.startsWith(targetOrigin)) {
      headers.set(
        "Location",
        headers.get("Location").replace(targetOrigin, "")
      );
    }

    return new Response(response.body, {
      status: response.status,
      headers
    });
  } catch (err) {
    return new Response("Proxy error: " + err.message, { status: 500 });
  }
};
