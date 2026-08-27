import { useRef, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSession } from "@/lib/use-admin-session";
import { imageSrc } from "@/lib/img";

export const Route = createFileRoute("/admin/produtos/$id")({
  head: () => ({ meta: [{ title: "Editar produto | Ateliê da JHE" }] }),
  component: EditarProdutoPage,
});

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";

function EditarProdutoPage() {
  const { id } = Route.useParams();
  const session = useAdminSession();
  const queryClient = useQueryClient();

  const productQuery = useQuery({
    queryKey: ["admin-product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_colors(*), product_images(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: session.status === "authorized",
  });

  const categoriesQuery = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
    enabled: session.status === "authorized",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [colorName, setColorName] = useState("");
  const [colorHex, setColorHex] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (session.status !== "authorized") return null;

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["admin-product", id] });
    await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const priceValue = Number(String(form.get("price")).replace(",", "."));

    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setError("Preço inválido.");
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase
      .from("products")
      .update({
        name: String(form.get("name") ?? "").trim(),
        category_id: String(form.get("category_id") ?? "") || null,
        short_description: String(form.get("short_description") ?? "").trim() || null,
        description: String(form.get("description") ?? "").trim() || null,
        price: priceValue,
        production_days: Math.max(0, Number(form.get("production_days")) || 0),
        allow_customization: form.get("allow_customization") === "on",
        featured: form.get("featured") === "on",
      })
      .eq("id", id);

    setSaving(false);
    if (updateError) {
      setError("Não foi possível salvar as alterações.");
      return;
    }
    await refresh();
  }

  async function toggleActive() {
    if (!productQuery.data) return;
    await supabase.from("products").update({ active: !productQuery.data.active }).eq("id", id);
    await refresh();
  }

  async function addColor() {
    if (!colorName.trim()) return;
    await supabase.from("product_colors").insert({
      product_id: id,
      name: colorName.trim(),
      hex: colorHex.trim() || null,
      sort_order: productQuery.data?.product_colors.length ?? 0,
    });
    setColorName("");
    setColorHex("");
    await refresh();
  }

  async function removeColor(colorId: string) {
    await supabase.from("product_colors").delete().eq("id", colorId);
    await refresh();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);

    const existing = productQuery.data?.product_images ?? [];
    const path = `${id}/${crypto.randomUUID()}-${file.name}`;

    const { error: uploadErr } = await supabase.storage.from("product-images").upload(path, file);
    if (uploadErr) {
      setUploading(false);
      setUploadError(
        "Não foi possível enviar a imagem. Verifique se o bucket 'product-images' existe.",
      );
      return;
    }

    const { error: insertErr } = await supabase.from("product_images").insert({
      product_id: id,
      url: path,
      storage_path: path,
      is_primary: existing.length === 0,
      sort_order: existing.length,
    });

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (insertErr) {
      setUploadError(`Upload feito, mas não salvou no banco: ${insertErr.message}`);
      return;
    }
    await refresh();
  }

  async function setPrimaryImage(imageId: string) {
    const images = productQuery.data?.product_images ?? [];
    await Promise.all(
      images.map((img) =>
        supabase
          .from("product_images")
          .update({ is_primary: img.id === imageId })
          .eq("id", img.id),
      ),
    );
    await refresh();
  }

  async function removeImage(imageId: string, storagePath: string | null) {
    await supabase.from("product_images").delete().eq("id", imageId);
    if (storagePath) {
      await supabase.storage.from("product-images").remove([storagePath]);
    }
    await refresh();
  }

  if (productQuery.isLoading) {
    return (
      <AdminShell>
        <p className="text-sm text-muted-foreground">Carregando produto...</p>
      </AdminShell>
    );
  }

  const product = productQuery.data;
  if (!product) {
    return (
      <AdminShell>
        <p className="text-sm text-muted-foreground">Produto não encontrado.</p>
        <Link
          to="/admin/produtos"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          Voltar para produtos
        </Link>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <Link to="/admin/produtos" className="text-sm text-muted-foreground hover:text-foreground">
        ← Voltar para produtos
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-display text-2xl font-semibold">{product.name}</h1>
        <button
          type="button"
          onClick={toggleActive}
          className={
            "rounded-full border px-4 py-1.5 text-sm font-medium " +
            (product.active
              ? "border-destructive/40 text-destructive hover:bg-destructive/10"
              : "border-primary bg-primary text-primary-foreground hover:bg-primary/90")
          }
        >
          {product.active ? "Desativar produto" : "Reativar produto"}
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <form
          key={product.updated_at}
          onSubmit={handleSave}
          className="space-y-4 rounded-2xl border border-border bg-card p-5"
        >
          <label className="block text-sm font-medium">
            Nome
            <input name="name" required defaultValue={product.name} className={fieldClass} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Categoria
              <select
                name="category_id"
                defaultValue={product.category_id ?? ""}
                className={fieldClass}
              >
                <option value="">Sem categoria</option>
                {(categoriesQuery.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Preço (R$)
              <input
                name="price"
                required
                inputMode="decimal"
                defaultValue={product.price}
                className={fieldClass}
              />
            </label>
          </div>

          <label className="block text-sm font-medium">
            Descrição resumida
            <input
              name="short_description"
              defaultValue={product.short_description ?? ""}
              maxLength={160}
              className={fieldClass}
            />
          </label>

          <label className="block text-sm font-medium">
            Descrição completa
            <textarea
              name="description"
              defaultValue={product.description ?? ""}
              rows={4}
              className={fieldClass}
            />
          </label>

          <label className="block text-sm font-medium">
            Prazo de produção (dias)
            <input
              name="production_days"
              type="number"
              min={0}
              defaultValue={product.production_days}
              className={fieldClass + " max-w-[140px]"}
            />
          </label>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                name="allow_customization"
                type="checkbox"
                defaultChecked={product.allow_customization}
              />
              Permite personalização
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input name="featured" type="checkbox" defaultChecked={product.featured} />
              Produto em destaque
            </label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Cores</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.product_colors.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs"
                >
                  {c.hex && (
                    <span
                      className="h-3 w-3 rounded-full border border-border"
                      style={{ backgroundColor: c.hex }}
                    />
                  )}
                  {c.name}
                  <button
                    type="button"
                    onClick={() => removeColor(c.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Remover cor ${c.name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              {product.product_colors.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhuma cor cadastrada.</p>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
                placeholder="Nome da cor"
                className={fieldClass + " mt-0"}
              />
              <input
                type="color"
                value={colorHex || "#cccccc"}
                onChange={(e) => setColorHex(e.target.value)}
                className="mt-0 h-[42px] w-12 shrink-0 rounded-xl border border-border bg-background"
              />
              <button
                type="button"
                onClick={addColor}
                disabled={!colorName.trim()}
                className="shrink-0 rounded-xl border border-border bg-background px-3 text-sm font-medium hover:bg-secondary disabled:opacity-50"
              >
                +
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Fotos</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {product.product_images.map((img) => {
                const src = imageSrc(img.url);
                return (
                  <div
                    key={img.id}
                    className="group relative aspect-square overflow-hidden rounded-xl bg-secondary"
                  >
                    {src && <img src={src} alt="" className="h-full w-full object-cover" />}
                    {img.is_primary && (
                      <span className="absolute left-1 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground">
                        Principal
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {!img.is_primary && (
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(img.id)}
                          className="rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-medium"
                        >
                          Tornar principal
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(img.id, img.storage_path)}
                        className="ml-auto rounded bg-destructive px-1.5 py-0.5 text-[9px] font-medium text-destructive-foreground"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="mt-3 w-full text-sm"
            />
            {uploading && <p className="mt-1 text-xs text-muted-foreground">Enviando...</p>}
            {uploadError && <p className="mt-1 text-xs text-destructive">{uploadError}</p>}
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
