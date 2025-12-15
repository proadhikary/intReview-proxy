const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cookieParser = require("cookie-parser");
const dns = require("node:dns"); // Import DNS module

// FIX: Force Node.js to use IPv4 first (Solves ECONNREFUSED on Node 17+)
dns.setDefaultResultOrder("ipv4first");

const app = express();
app.use(cookieParser());

// Fix trusted proxies (important for Flask sessions)
app.set("trust proxy", true);

// Proxy settings
const proxy = createProxyMiddleware({
  target: "https://lcs2.pythonanywhere.com",
  changeOrigin: true,
  secure: true, 
  
  // connection header override can sometimes help with pythonanywhere
  headers: {
    Connection: 'keep-alive'
  },

  onProxyReq: (proxyReq, req, res) => {
    // Forward real IP
    proxyReq.setHeader("X-Forwarded-For", req.ip);
    proxyReq.setHeader("X-Forwarded-Proto", "https");

    // Ensure Host header matches PythonAnywhere
    // Note: changeOrigin: true usually does this, but explicit setting is safe
    proxyReq.setHeader("Host", "lcs2.pythonanywhere.com");
  },

  onProxyRes: (proxyRes, req, res) => {
    // Fix cookies from PythonAnywhere -> your domain
    const cookies = proxyRes.headers["set-cookie"];
    if (cookies) {
      const fixed = cookies.map((c) =>
        c
          .replace(/Domain=[^;]+/i, "Domain=review.lcs2.in") // rewrite domain
          .replace(/; Secure/gi, "") // allow HTTP behind proxy if needed
      );
      proxyRes.headers["set-cookie"] = fixed;
    }
  },

  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(500).send('Proxy Error: ' + err.message);
  },

  logLevel: "debug"
});

// Apply proxy to ALL routes
app.use("/", proxy);

// Render runs on PORT from env
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Reverse proxy running on port", PORT);
});
