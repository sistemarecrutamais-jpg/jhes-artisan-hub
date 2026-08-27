import { useRef, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSession } from "@/lib/use-admin-session";

export const Route = createFileRoute("/admin/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações | Ateliê da JHE" }] }),
  component: ConfiguracoesPage,
});

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";

function ConfiguracoesPage() {
  const session = useAdminSession();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*").eq("id", true).single();
      if (error) throw error;
      return data;
    },
    enabled: session.status === "authorized",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (session.status !== "authorized") return null;

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const form = new FormData(e.currentTarget);
    const str = (key: string) => String(form.get(key) ?? "").trim();

    setSaving(true);
    const { error: updateError } = await supabase
      .from("settings")
      .update({
        atelier_name: str("atelier_name") || "Ateliê da JHE",
        tagline: str("tagline") || "Costura • Crochê • Artesanato",
        description: str("description") || null,
        whatsapp: str("whatsapp") || null,
        email: str("email") || null,
        address: str("address") || null,
        opening_hours: str("opening_hours") || null,
        instagram: str("instagram") || null,
        facebook: str("facebook") || null,
        delivery_info: str("delivery_info") || null,
        pickup_info: str("pickup_info") || null,
        confirmation_message:
          str("confirmation_message") ||
          "Pedido recebido com sucesso! Em breve entraremos em contato pelo WhatsApp.",
      })
      .eq("id", true);

    setSaving(false);
    if (updateError) {
      setError("Não foi possível salvar as configurações.");
      return;
    }
    setSaved(true);
    await refresh();
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setLogoError(null);

    const path = `logo-${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("site-assets").upload(path, file, {
      upsert: true,
    });

    if (uploadError) {
      setUploadingLogo(false);
      setLogoError("Não foi possível enviar a logo. Verifique se o bucket 'site-assets' existe.");
      return;
    }

    const { data: publicUrl } = supabase.storage.from("site-assets").getPublicUrl(path);
    const { error: updateError } = await supabase
      .from("settings")
      .update({ logo_url: publicUrl.publicUrl })
      .eq("id", true);

    setUploadingLogo(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (updateError) {
      setLogoError("Logo enviada, mas não foi possível salvar a referência.");
      return;
    }
    await refresh();
  }

  if (settingsQuery.isLoading || !settingsQuery.data) {
    return (
      <AdminShell>
        <p className="text-sm text-muted-foreground">Carregando configurações...</p>
      </AdminShell>
    );
  }

  const settings = settingsQuery.data;

  return (
    <AdminShell>
      <h1 className="text-display text-2xl font-semibold">Configurações</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Essas informações alimentam o site público (rodapé, contato, WhatsApp).
      </p>

      <section className="mt-6 max-w-xl rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Logo</h2>
        <div className="mt-3 flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-secondary">
            {settings.logo_url && (
              <img src={settings.logo_url} alt="Logo" className="h-full w-full object-cover" />
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            disabled={uploadingLogo}
            className="text-sm"
          />
        </div>
        {uploadingLogo && <p className="mt-1 text-xs text-muted-foreground">Enviando...</p>}
        {logoError && <p className="mt-1 text-xs text-destructive">{logoError}</p>}
      </section>

      <form
        key={settings.updated_at}
        onSubmit={handleSubmit}
        className="mt-6 max-w-2xl space-y-4 rounded-2xl border border-border bg-card p-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Nome do ateliê
            <input
              name="atelier_name"
              defaultValue={settings.atelier_name}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-medium">
            Frase de identidade
            <input name="tagline" defaultValue={settings.tagline} className={fieldClass} />
          </label>
        </div>

        <label className="block text-sm font-medium">
          Descrição
          <textarea
            name="description"
            defaultValue={settings.description ?? ""}
            rows={3}
            className={fieldClass}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            WhatsApp
            <input
              name="whatsapp"
              defaultValue={settings.whatsapp ?? ""}
              placeholder="5511999999999"
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-medium">
            E-mail de contato
            <input name="email" defaultValue={settings.email ?? ""} className={fieldClass} />
          </label>
        </div>

        <label className="block text-sm font-medium">
          Endereço / atendimento
          <input name="address" defaultValue={settings.address ?? ""} className={fieldClass} />
        </label>

        <label className="block text-sm font-medium">
          Horário de funcionamento
          <input
            name="opening_hours"
            defaultValue={settings.opening_hours ?? ""}
            className={fieldClass}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Instagram
            <input
              name="instagram"
              defaultValue={settings.instagram ?? ""}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-medium">
            Facebook
            <input name="facebook" defaultValue={settings.facebook ?? ""} className={fieldClass} />
          </label>
        </div>

        <label className="block text-sm font-medium">
          Informações de entrega
          <textarea
            name="delivery_info"
            defaultValue={settings.delivery_info ?? ""}
            rows={2}
            className={fieldClass}
          />
        </label>

        <label className="block text-sm font-medium">
          Informações de retirada
          <textarea
            name="pickup_info"
            defaultValue={settings.pickup_info ?? ""}
            rows={2}
            className={fieldClass}
          />
        </label>

        <label className="block text-sm font-medium">
          Mensagem de confirmação do pedido
          <textarea
            name="confirmation_message"
            defaultValue={settings.confirmation_message}
            rows={2}
            className={fieldClass}
          />
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {saved && <p className="text-sm text-primary">Configurações salvas.</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar configurações"}
        </button>
      </form>
    </AdminShell>
  );
}
