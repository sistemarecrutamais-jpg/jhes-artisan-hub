import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export type PublicProduct = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  price: number;
  production_days: number;
  allow_customization: boolean;
  featured: boolean;
  category_id: string | null;
  images: { url: string; is_primary: boolean }[];
  colors: { name: string; hex: string | null }[];
};

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data: settings } = await supabase.from("settings").select("*").maybeSingle();
  return settings ?? null;
});

export const getStorefront = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const [{ data: settings }, { data: categories }, { data: products }] = await Promise.all([
    supabase.from("settings").select("*").maybeSingle(),
    supabase.from("categories").select("id, name, slug, description").order("sort_order"),
    supabase
      .from("products")
      .select(
        "id, name, slug, short_description, description, price, production_days, allow_customization, featured, category_id, product_images(url, is_primary, sort_order), product_colors(name, hex, sort_order)",
      )
      .eq("active", true)
      .order("created_at", { ascending: false }),
  ]);

  const mapped: PublicProduct[] = (products ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    short_description: p.short_description,
    description: p.description,
    price: Number(p.price),
    production_days: p.production_days,
    allow_customization: p.allow_customization,
    featured: p.featured,
    category_id: p.category_id,
    images: (p.product_images ?? [])
      .slice()
      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
      .map((i) => ({ url: i.url, is_primary: i.is_primary })),
    colors: (p.product_colors ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => ({ name: c.name, hex: c.hex })),
  }));

  return { settings: settings ?? null, categories: categories ?? [], products: mapped };
});

export const getPublicProduct = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(data))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: p } = await supabase
      .from("products")
      .select(
        "id, name, slug, short_description, description, price, production_days, allow_customization, featured, category_id, product_images(url, is_primary, sort_order), product_colors(name, hex, sort_order)",
      )
      .eq("slug", data.slug)
      .eq("active", true)
      .maybeSingle();

    if (!p) return null;

    const product: PublicProduct = {
      id: p.id,
      name: p.name,
      slug: p.slug,
      short_description: p.short_description,
      description: p.description,
      price: Number(p.price),
      production_days: p.production_days,
      allow_customization: p.allow_customization,
      featured: p.featured,
      category_id: p.category_id,
      images: (p.product_images ?? [])
        .slice()
        .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
        .map((i) => ({ url: i.url, is_primary: i.is_primary })),
      colors: (p.product_colors ?? [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((c) => ({ name: c.name, hex: c.hex })),
    };
    return product;
  });
