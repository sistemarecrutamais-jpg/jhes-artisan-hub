import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

/**
 * Categorical palette for charts — NOT the site's brand chart-1..5 tokens.
 * Those failed the CVD-safety validator (lightness/chroma/contrast), so charts
 * use this separately validated 8-slot sequence instead. Order matters: only
 * adjacent pairs in this exact sequence are guaranteed distinguishable, and
 * slots 1–3 are the only trio validated for ALL pairwise comparisons.
 */
export const SERIES = {
  blue: "#2a78d6",
  orange: "#eb6834",
  aqua: "#1baf7a",
  yellow: "#eda100",
  magenta: "#e87ba4",
  green: "#008300",
  violet: "#4a3aa7",
  red: "#e34948",
} as const;

/** Faturamento/custos/lucro share one chart — slots 1–3, the all-pairs-safe trio. */
export const FINANCE_COLOR = {
  revenue: SERIES.blue,
  costs: SERIES.orange,
  profit: SERIES.aqua,
} as const;

/**
 * Fixed sequential assignment (matches STATUS_ORDER) so any two statuses that
 * end up visually adjacent in a chart are also adjacent in the validated
 * palette order — never reassigned based on which statuses are present.
 */
export const STATUS_COLOR: Record<OrderStatus, string> = {
  novo: SERIES.blue,
  confirmado: SERIES.orange,
  em_producao: SERIES.aqua,
  pronto: SERIES.yellow,
  entregue: SERIES.magenta,
  cancelado: SERIES.green,
};

export const CHART_GRID = "#e1e0d9";
export const CHART_AXIS = "#c3c2b7";
export const CHART_INK_SECONDARY = "#52514e";
export const CHART_INK_MUTED = "#898781";
