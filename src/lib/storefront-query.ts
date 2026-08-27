import { queryOptions } from "@tanstack/react-query";

import { getStorefront, getPublicProduct, getSiteSettings } from "./catalog.functions";

export const storefrontQuery = queryOptions({
  queryKey: ["storefront"],
  queryFn: () => getStorefront(),
  staleTime: 30_000,
});

/** Lightweight settings-only fetch used by SiteLayout (header/footer/WhatsApp button)
 * on every public page, so pages that don't need the full catalog (cart, checkout,
 * product detail) don't pay for one. */
export const siteSettingsQuery = queryOptions({
  queryKey: ["site-settings"],
  queryFn: () => getSiteSettings(),
  staleTime: 30_000,
});

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getPublicProduct({ data: { slug } }),
    staleTime: 30_000,
  });
