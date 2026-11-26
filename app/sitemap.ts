import type { MetadataRoute } from "next";
import { POSTS } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";

/* Зөвхөн нийтэд нээлттэй хуудсууд */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL + "/", changeFrequency: "monthly", priority: 1 },
    { url: SITE_URL + "/blog", changeFrequency: "weekly", priority: 0.8 },
    ...POSTS.map(p => ({ url: SITE_URL + "/blog/" + p.slug, lastModified: p.date, changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: SITE_URL + "/privacy", changeFrequency: "yearly", priority: 0.3 },
  ];
}
