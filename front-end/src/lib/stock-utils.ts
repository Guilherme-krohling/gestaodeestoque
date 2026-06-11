export type StockStatus =
  | { kind: "vencido"; label: "Vencido"; tone: "destructive" }
  | { kind: "critico"; label: string; tone: "destructive" }
  | { kind: "atencao"; label: string; tone: "warning" }
  | { kind: "abaixo"; label: "Abaixo mín."; tone: "destructive" }
  | { kind: "ok"; label: "OK"; tone: "success" };

export function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null;
  const target = new Date(date + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

export function computeStatus(params: {
  validade: string | null;
  saldo_atual: number;
  estoque_minimo: number;
  saldo_total_material?: number;
}): StockStatus {
  const d = daysUntil(params.validade);
  const saldoParaMinimo = params.saldo_total_material ?? params.saldo_atual;
  if (d !== null && d < 0) return { kind: "vencido", label: "Vencido", tone: "destructive" };
  // Regra: 5 ou mais unidades no total do material → sempre OK (não considera abaixo do mínimo)
  if (saldoParaMinimo < 5 && saldoParaMinimo <= params.estoque_minimo && params.estoque_minimo > 0)
    return { kind: "abaixo", label: "Abaixo mín.", tone: "destructive" };
  if (d !== null && d <= 50) return { kind: "critico", label: `Vence em ${d}d`, tone: "destructive" };
  if (d !== null && d <= 60) return { kind: "atencao", label: `Vence em ${d}d`, tone: "warning" };
  return { kind: "ok", label: "OK", tone: "success" };
}

export function statusBadgeClass(tone: StockStatus["tone"]): string {
  switch (tone) {
    case "destructive":
      return "bg-red-100 text-red-800 border-red-200";
    case "warning":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "success":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }
}

export function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  const dt = new Date(d.length === 10 ? d + "T00:00:00" : d);
  return dt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function formatDateTime(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}
