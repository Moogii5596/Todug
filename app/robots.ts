import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/* Нэвтэрсний дараах хуудсуудыг хайлтын системд оруулахгүй */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/children", "/account", "/reset", "/admin", "/billing"] }],
    sitemap: SITE_URL + "/sitemap.xml",
    host: SITE_URL,
  };
}
