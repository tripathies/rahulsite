import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: { proxyClientMaxBodySize: '110mb' },

  // ── Image Optimization — Whitelisted Remote Domains ──
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "rahulsitefiles.blob.core.windows.net",
      },
      {
        protocol: "https",
        hostname: "*.blob.core.windows.net",
      },
    ],
  },

  // ── Security Headers (applied to all routes) ──
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.blob.core.windows.net https://images.unsplash.com https://i.ytimg.com",
              "media-src 'self' blob: https://*.blob.core.windows.net",
              "connect-src 'self' https://*.blob.core.windows.net",
              "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },

  // ── Standalone output for Azure Web App deployment ──
  output: "standalone",

  // ── Route Redirects ──
  async redirects() {
    return [
      {
        source: "/rss.xml",
        destination: "/blog",
        permanent: false,
      },
      {
        source: "/blog/the-post-developer-era",
        destination: "https://www.joshwcomeau.com/blog/the-post-developer-era/",
        permanent: false,
      },
      {
        source: "/blog/the-post-developer-era-and-ai",
        destination: "https://www.joshwcomeau.com/blog/the-post-developer-era/",
        permanent: false,
      },
      {
        source: "/policy",
        destination: "/privacy",
        permanent: true,
      },
      {
        source: "/term",
        destination: "/terms",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
