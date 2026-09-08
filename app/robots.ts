import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * The portfolio wants to be found; the tool behind it does not. `/studio`
 * answers 404 in production anyway — this keeps crawlers from asking.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/studio", "/api/"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
