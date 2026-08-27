import { queryOptions } from "@tanstack/react-query";

import { getStorefront, getPublicProduct } from "./catalog.functions";

export const storefrontQuery = queryOptions({
  queryKey: ["storefront"],
  queryFn: () => getStorefront(),
  staleTime: 30_000,
});

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getPublicProduct({ data: { slug } }),
    staleTime: 30_000,
  });
