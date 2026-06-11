import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase-browser";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Package, ArrowDownToLine, ArrowUpFromLine, AlertTriangle } from "lucide-react";
import { computeStatus, formatDate } from "@/lib/stock-utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/")({ ssr: false, component: Dashboard });

function Dashboard() {
  const { data: estoque = [] } = useQuery({
    queryKey: ["estoque-all"],
    queryFn: async () => {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("estoque")
        .select("*, materiais(nome, referencia_cfn, tamanho, estoque_minimo)");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: historico = [] } = useQuery({
    queryKey: ["historico-mes"],
    queryFn: async () => {
      const supabase = await getSupabase();
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("historico")
        .select("*")
        .gte("criado_em", start.toISOString());
      if (error) throw error;
      return data ?? [];
    },
  });

  const totalItens = estoque.reduce((s, r: any) => s + (r.saldo_atual || 0), 0);
  const entradasMes = historico.filter((h: any) => h.tipo === "Entrada")
    .reduce((s, h: any) => s + (h.quantidade || 0), 0);
  const saidasMes = historico.filter((h: any) => h.tipo === "Saída")
    .reduce((s, h: any) => s + (h.quantidade || 0), 0);

  // Total por material (nome + tamanho) para alertas de mínimo
  const totaisPorMaterial = new Map<string, number>();
  for (const r of estoque as any[]) {
    if (!r.material_id) continue;
    totaisPorMaterial.set(r.material_id, (totaisPorMaterial.get(r.material_id) || 0) + (r.saldo_atual || 0));
  }

  const itensAlerta = estoque.filter((r: any) => {
    if (!r.materiais) return false;
    const s = computeStatus({
      validade: r.validade,
      saldo_atual: r.saldo_atual,
      estoque_minimo: r.materiais.estoque_minimo,
      saldo_total_material: totaisPorMaterial.get(r.material_id) ?? r.saldo_atual,
    });
    return s.kind !== "ok";
  });
  const vencendo = estoque.filter((r: any) => {
    if (!r.validade || r.saldo_atual <= 0) return false;
    const d = (new Date(r.validade + "T00:00:00").getTime() - Date.now()) / 86400000;
    return d <= 60;
  });

  const proceduresCount: Record<string, number> = {};
  for (const h of historico as any[]) {
    if (h.tipo === "Saída" && h.procedimento) {
      proceduresCount[h.procedimento] = (proceduresCount[h.procedimento] || 0) + 1;
    }
  }
  const chartData = Object.entries(proceduresCount).map(([name, value]) => ({ name, value }));

  // Agrupar abaixo do mínimo por material (nome + tamanho)
  const gruposMin = new Map<string, { material: any; saldo: number; lotes: number }>();
  for (const r of estoque as any[]) {
    if (!r.materiais) continue;
    const g = gruposMin.get(r.material_id);
    if (g) {
      g.saldo += r.saldo_atual || 0;
      g.lotes += 1;
    } else {
      gruposMin.set(r.material_id, { material: r.materiais, saldo: r.saldo_atual || 0, lotes: 1 });
    }
  }
  const abaixoMin = Array.from(gruposMin.values()).filter(
    (g) => g.material.estoque_minimo > 0 && g.saldo <= g.material.estoque_minimo && g.saldo < 5
  );


  return (
    <AppLayout>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Painel</h1>
        <p className="text-sm text-slate-500 mt-1">Visão geral do estoque cirúrgico</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Itens em estoque" value={totalItens} icon={Package} tint="sky" />
        <MetricCard title="Entradas no mês" value={entradasMes} icon={ArrowDownToLine} tint="emerald" />
        <MetricCard title="Saídas no mês" value={saidasMes} icon={ArrowUpFromLine} tint="indigo" />
        <MetricCard title="Próx. vencimento" value={vencendo.length} icon={AlertTriangle} tint="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-semibold mb-4">Procedimentos no mês</h2>
          {chartData.length === 0 ? (
            <p className="text-sm text-slate-500 py-12 text-center">Nenhum procedimento registrado este mês.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={140} />
                <Tooltip />
                <Bar dataKey="value" fill="#0284c7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Alertas ativos</h2>
          <div className="space-y-3 max-h-[260px] overflow-y-auto">
            {itensAlerta.length === 0 && (
              <p className="text-sm text-slate-500">Nenhum alerta no momento.</p>
            )}
            {itensAlerta.slice(0, 10).map((r: any) => {
              const s = computeStatus({
                validade: r.validade,
                saldo_atual: r.saldo_atual,
                estoque_minimo: r.materiais.estoque_minimo,
                saldo_total_material: totaisPorMaterial.get(r.material_id) ?? r.saldo_atual,
              });
              return (
                <div key={r.id} className="flex items-start justify-between border-b pb-2 last:border-0">
                  <div>
                    <div className="text-sm font-medium">{r.materiais.nome}</div>
                    <div className="text-xs text-slate-500">Lote {r.lote} · Val. {formatDate(r.validade)}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${s.tone === "destructive" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {abaixoMin.length > 0 && (
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Estoque abaixo do mínimo</h2>
          <ul className="space-y-2 text-sm">
            {abaixoMin.map((g) => (
              <li key={g.material.id} className="flex justify-between border-b pb-2 last:border-0">
                <span>{g.material.nome}{g.material.tamanho ? ` · ${g.material.tamanho}` : ""} <span className="text-xs text-slate-500">({g.saldo} unid. em {g.lotes} lote{g.lotes > 1 ? "s" : ""})</span></span>
                <span className="text-red-700 font-medium">{g.saldo} / mín. {g.material.estoque_minimo}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </AppLayout>
  );
}

function MetricCard({
  title, value, icon: Icon, tint,
}: { title: string; value: number; icon: any; tint: "sky" | "emerald" | "indigo" | "amber" }) {
  const tintMap = {
    sky: "bg-sky-50 text-sky-700",
    emerald: "bg-emerald-50 text-emerald-700",
    indigo: "bg-indigo-50 text-indigo-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-slate-500">{title}</div>
          <div className="mt-2 text-3xl font-semibold">{value}</div>
        </div>
        <div className={`p-2 rounded-lg ${tintMap[tint]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
