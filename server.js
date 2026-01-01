const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cookieParser = require("cookie-parser");

const app = express();
app.use(cookieParser());

// Fix trusted proxies (important for Flask sessions)
app.set("trust proxy", true);

// Proxy settings
// const proxy = createProxyMiddleware({
//   target: "https://lcs2.pythonanywhere.com",
//   changeOrigin: true,
//   secure: true,

//   // Allow websockets, POST, cookies, admin routes
//   onProxyReq: (proxyReq, req, res) => {
//     // Forward real IP
//     proxyReq.setHeader("X-Forwarded-For", req.ip);
//     proxyReq.setHeader("X-Forwarded-Proto", "https");

//     // Ensure Host header matches PythonAnywhere
//     proxyReq.setHeader("Host", "lcs2.pythonanywhere.com");
//   },

//   onProxyRes: (proxyRes, req, res) => {
//     // Fix cookies from PythonAnywhere → your domain
//     const cookies = proxyRes.headers["set-cookie"];
//     if (cookies) {
//       const fixed = cookies.map((c) =>
//         c
//           .replace(/Domain=[^;]+/i, "Domain=review.lcs2.in") // rewrite domain
//           .replace(/; Secure/gi, "") // allow HTTP behind proxy
//       );
//       proxyRes.headers["set-cookie"] = fixed;
//     }
//   },
//   logLevel: "debug"
// });

const proxy = createProxyMiddleware({
  target: "http://proadhikary.pythonanywhere.com", // ❗ HTTP not HTTPS
  changeOrigin: true,
  secure: false, // ❗ required
  ws: true,
  xfwd: true,
  agent: false, // ❗ disable keep-alive
  onProxyReq: (proxyReq) => {
    proxyReq.removeHeader("host"); // ❗ CRITICAL
  },
  logLevel: "debug",
});


// Apply proxy to ALL routes
app.use("/", proxy);

// Render runs on PORT from env
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Reverse proxy running on port", PORT);
});
