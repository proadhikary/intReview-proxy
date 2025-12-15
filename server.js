const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cookieParser = require("cookie-parser");
const dns = require('node:dns');
const https = require('https');

// FORCE IPV4 FIRST (Keep this, it is working!)
dns.setDefaultResultOrder('ipv4first');

const app = express();
app.use(cookieParser());

// Fix trusted proxies
app.set("trust proxy", true);

// Create a custom HTTPS agent to handle the connection better
const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 256,
  rejectUnauthorized: false // Be lenient with SSL if needed
});

// Proxy settings
const proxy = createProxyMiddleware({
  target: "https://lcs2.pythonanywhere.com",
  changeOrigin: true,
  secure: false, // Don't crash on SSL verification
  agent: httpsAgent, // Use our custom agent
  
  // Important: PythonAnywhere often redirects HTTP to HTTPS.
  // We want the proxy to handle that if it happens.
  followRedirects: true,

  onProxyReq: (proxyReq, req, res) => {
    // 1. Forward real IP
    proxyReq.setHeader("X-Forwarded-For", req.ip);
    proxyReq.setHeader("X-Forwarded-Proto", "https");

    // 2. Ensure Host header matches PythonAnywhere
    proxyReq.setHeader("Host", "lcs2.pythonanywhere.com");

    // 3. FAKE A BROWSER (Crucial Fix) 
    // This makes PythonAnywhere think a real Chrome user is visiting, not a bot.
    proxyReq.setHeader(
      "User-Agent", 
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    );
  },

  onProxyRes: (proxyRes, req, res) => {
    // Fix cookies from PythonAnywhere → your domain
    const cookies = proxyRes.headers["set-cookie"];
    if (cookies) {
      const fixed = cookies.map((c) =>
        c
          .replace(/Domain=[^;]+/i, "Domain=review.lcs2.in") 
          .replace(/; Secure/gi, "") 
      );
      proxyRes.headers["set-cookie"] = fixed;
    }
  },

  logLevel: "debug"
});

// Apply proxy to ALL routes
app.use("/", proxy);

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Reverse proxy running on port", PORT);
});
