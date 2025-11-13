export default async (request, context) => {
  try {
    const targetOrigin = "https://lcs2.pythonanywhere.com";
    const url = new URL(request.url);

    // Build final target URL
    const targetUrl = targetOrigin + url.pathname + url.search;

    // Prepare request for origin
    const init = {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers),
        "Host": "lcs2.pythonanywhere.com"
      },
      body:
        request.method === "GET" || request.method === "HEAD"
        ? undefined
        : request.body,
      redirect: "manual" // <- IMPORTANT FIX
    };

    let response = await fetch(targetUrl, init);

    // 🔥 Handle 301/302 redirect manually to avoid body replay crash
    if ([301, 302, 303].includes(response.status)) {
      const loc = response.headers.get("Location");

      // Follow redirect with GET (browser behavior)
      response = await fetch(loc.startsWith("http") ? loc : targetOrigin + loc, {
        method: "GET",
        headers: {
          ...Object.fromEntries(request.headers),
          "Host": "lcs2.pythonanywhere.com"
        },
        redirect: "manual"
      });
    }

    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    });

  } catch (err) {
    return new Response("Proxy error: " + err.message, { status: 500 });
  }
};
