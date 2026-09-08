import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** One page, but a sitemap is how a crawler learns the canonical host. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl(),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
