import { addDaysISO, monthBoundsISO, todayISO } from "@/lib/format";

export type Period = "hoje" | "semana" | "mes" | "mes_anterior" | "personalizado";

export const PERIOD_OPTIONS: readonly (readonly [Period, string])[] = [
  ["hoje", "Hoje"],
  ["semana", "Últimos 7 dias"],
  ["mes", "Este mês"],
  ["mes_anterior", "Mês anterior"],
  ["personalizado", "Personalizado"],
] as const;

export function periodRange(
  period: Period,
  customStart: string,
  customEnd: string,
): { start: string; end: string } {
  const today = todayISO();
  switch (period) {
    case "hoje":
      return { start: today, end: today };
    case "semana":
      return { start: addDaysISO(today, -6), end: today };
    case "mes":
      return { start: monthBoundsISO(0).start, end: today };
    case "mes_anterior":
      return monthBoundsISO(-1);
    case "personalizado":
      return { start: customStart || today, end: customEnd || today };
  }
}
