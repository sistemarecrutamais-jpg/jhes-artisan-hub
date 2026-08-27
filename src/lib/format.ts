export const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function money(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return BRL.format(Number.isFinite(n) ? n : 0);
}

export function percent(value: number): string {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(2).replace(".", ",")}%`;
}

/** Today in the atelier timezone (America/Sao_Paulo) as YYYY-MM-DD. */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const only = iso.slice(0, 10);
  const [y, m, d] = only.split("-");
  return `${d}/${m}/${y}`;
}

export function addDaysISO(iso: string, days: number): string {
  const dt = parseISODate(iso);
  dt.setDate(dt.getDate() + days);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** First/last day (YYYY-MM-DD) of the calendar month `offsetMonths` away from now. */
export function monthBoundsISO(offsetMonths: number): { start: string; end: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1);
  const last = new Date(now.getFullYear(), now.getMonth() + offsetMonths + 1, 0);
  const toISO = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { start: toISO(first), end: toISO(last) };
}

/** Every ISO date from start to end, inclusive. */
export function daysInRangeISO(startISO: string, endISO: string): string[] {
  const days: string[] = [];
  let cur = startISO;
  while (cur <= endISO && days.length < 400) {
    days.push(cur);
    cur = addDaysISO(cur, 1);
  }
  return days;
}

export function daysBetween(startISO: string, endISO: string): number {
  const a = parseISODate(startISO).getTime();
  const b = parseISODate(endISO).getTime();
  return Math.round((b - a) / 86400000);
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export const STATUS_LABEL: Record<string, string> = {
  novo: "Novo",
  confirmado: "Confirmado",
  em_producao: "Em produção",
  pronto: "Pronto",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const STATUS_ORDER = [
  "novo",
  "confirmado",
  "em_producao",
  "pronto",
  "entregue",
  "cancelado",
] as const;

export const PAYMENT_LABEL: Record<string, string> = {
  pendente: "Pendente",
  parcial: "Parcial",
  pago: "Pago",
  reembolsado: "Reembolsado",
};

export function isLate(order: { expected_date: string | null; status: string }): boolean {
  if (!order.expected_date) return false;
  if (order.status === "entregue" || order.status === "cancelado") return false;
  return order.expected_date < todayISO();
}
