import { useMemo, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAdminSession } from "@/lib/use-admin-session";
import { money, formatDate } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";

type Material = Database["public"]["Tables"]["materials"]["Row"];

export const Route = createFileRoute("/admin/materiais")({
  head: () => ({ meta: [{ title: "Materiais | Ateliê da JHE" }] }),
  component: MateriaisPage,
});

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";

type DraftMaterial = {
  name: string;
  category: string;
  unit: string;
  quantity: string;
  totalPaid: string;
  supplier: string;
  purchaseDate: string;
  notes: string;
};

const emptyDraft: DraftMaterial = {
  name: "",
  category: "",
  unit: "un",
  quantity: "",
  totalPaid: "",
  supplier: "",
  purchaseDate: new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
    new Date(),
  ),
  notes: "",
};

function unitCost(m: Pick<Material, "quantity" | "total_paid">): number {
  return m.quantity > 0 ? m.total_paid / m.quantity : 0;
}

function MateriaisPage() {
  const session = useAdminSession();
  const queryClient = useQueryClient();

  const materialsQuery = useQuery({
    queryKey: ["admin-materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: session.status === "authorized",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftMaterial>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalInvested = useMemo(
    () => (materialsQuery.data ?? []).reduce((sum, m) => sum + m.total_paid, 0),
    [materialsQuery.data],
  );

  if (session.status !== "authorized") return null;

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["admin-materials"] });
  }

  function startCreate() {
    setDraft(emptyDraft);
    setEditingId(null);
    setShowForm(true);
    setError(null);
  }

  function startEdit(m: Material) {
    setDraft({
      name: m.name,
      category: m.category ?? "",
      unit: m.unit,
      quantity: String(m.quantity),
      totalPaid: String(m.total_paid),
      supplier: m.supplier ?? "",
      purchaseDate: m.purchase_date,
      notes: m.notes ?? "",
    });
    setEditingId(m.id);
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const quantity = Number(draft.quantity.replace(",", "."));
    const totalPaid = Number(draft.totalPaid.replace(",", "."));

    if (!draft.name.trim() || !Number.isFinite(quantity) || !Number.isFinite(totalPaid)) {
      setError("Preencha nome, quantidade e valor pago corretamente.");
      return;
    }

    setSaving(true);
    const payload = {
      name: draft.name.trim(),
      category: draft.category.trim() || null,
      unit: draft.unit.trim() || "un",
      quantity,
      total_paid: totalPaid,
      supplier: draft.supplier.trim() || null,
      purchase_date: draft.purchaseDate,
      notes: draft.notes.trim() || null,
    };

    const { error: saveError } = editingId
      ? await supabase.from("materials").update(payload).eq("id", editingId)
      : await supabase.from("materials").insert(payload);

    setSaving(false);
    if (saveError) {
      setError("Não foi possível salvar o material.");
      return;
    }
    setShowForm(false);
    setEditingId(null);
    await refresh();
  }

  async function confirmDelete(id: string) {
    await supabase.from("materials").delete().eq("id", id);
    setConfirmingDeleteId(null);
    await refresh();
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-display text-2xl font-semibold">Materiais</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Total investido em materiais:{" "}
            <span className="font-semibold">{money(totalInvested)}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Novo material
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2"
        >
          <label className="block text-sm font-medium">
            Nome
            <input
              required
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-medium">
            Categoria
            <input
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              placeholder="Ex.: linha, tecido, aviamento"
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-medium">
            Unidade
            <input
              value={draft.unit}
              onChange={(e) => setDraft((d) => ({ ...d, unit: e.target.value }))}
              placeholder="metro, un, kg..."
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-medium">
            Fornecedor
            <input
              value={draft.supplier}
              onChange={(e) => setDraft((d) => ({ ...d, supplier: e.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-medium">
            Quantidade comprada
            <input
              required
              inputMode="decimal"
              value={draft.quantity}
              onChange={(e) => setDraft((d) => ({ ...d, quantity: e.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-medium">
            Valor pago (R$)
            <input
              required
              inputMode="decimal"
              value={draft.totalPaid}
              onChange={(e) => setDraft((d) => ({ ...d, totalPaid: e.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-medium">
            Data da compra
            <input
              type="date"
              value={draft.purchaseDate}
              onChange={(e) => setDraft((d) => ({ ...d, purchaseDate: e.target.value }))}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-medium sm:col-span-2">
            Observações
            <textarea
              value={draft.notes}
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
              rows={2}
              className={fieldClass}
            />
          </label>

          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}

          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Cadastrar material"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-full border border-border px-6 py-2.5 text-sm font-medium hover:bg-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Material</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Qtd. comprada</th>
              <th className="px-4 py-3">Valor pago</th>
              <th className="px-4 py-3">Custo unitário</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {materialsQuery.isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            ) : (materialsQuery.data ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum material cadastrado.
                </td>
              </tr>
            ) : (
              (materialsQuery.data ?? []).map((m) => (
                <tr key={m.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{m.name}</p>
                    {m.supplier && <p className="text-xs text-muted-foreground">{m.supplier}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{m.category ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.quantity} {m.unit}
                  </td>
                  <td className="px-4 py-3">{money(m.total_paid)}</td>
                  <td className="px-4 py-3 font-medium">
                    {money(unitCost(m))}/{m.unit}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(m.purchase_date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(m)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Editar
                      </button>
                      {confirmingDeleteId === m.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => confirmDelete(m.id)}
                            className="text-xs font-medium text-destructive hover:underline"
                          >
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingDeleteId(null)}
                            className="text-xs font-medium text-muted-foreground hover:underline"
                          >
                            Voltar
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmingDeleteId(m.id)}
                          className="text-xs font-medium text-muted-foreground hover:text-destructive hover:underline"
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
