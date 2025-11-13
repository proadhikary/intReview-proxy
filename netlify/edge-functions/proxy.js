export default async (request, context) => {
  try {
    const target = "https://lcs2.pythonanywhere.com";

    // Build correct target URL path
    const url = new URL(request.url);
    const path = url.pathname + url.search;
    const targetUrl = target + path;

    // Prepare request init
    const init = {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers),
        "Host": "lcs2.pythonanywhere.com"
      },
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
      redirect: "follow"
    };

    const response = await fetch(targetUrl, init);

    // Create proxy response
    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    });

  } catch (err) {
    return new Response("Proxy error: " + err.message, { status: 500 });
  }
};
