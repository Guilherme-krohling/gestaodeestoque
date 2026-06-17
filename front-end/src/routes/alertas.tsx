import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { daysUntil, formatDate } from "@/lib/stock-utils";

export const Route = createFileRoute("/alertas")({ ssr: false, component: AlertasPage });

function AlertasPage() {
    const { data: rows = [] } = useQuery({
        queryKey: ["alertas"],
        queryFn: async () => {
            const { data } = await api.get("/estoque");
            return data ?? [];
        },
    });

    const vencendo = (rows as any[])
        .filter((r) => r.saldo_atual > 0 && r.validade && (daysUntil(r.validade) ?? 999) <= 60)
        .sort((a, b) => (daysUntil(a.validade) ?? 0) - (daysUntil(b.validade) ?? 0));

    // Agrupar por material (nome + tamanho) somando saldo de todos os lotes
    const grupos = new Map<string, { material: any; saldo: number; lotes: number }>();
    for (const r of rows as any[]) {
        if (!r.material) continue;
        const key = r.material_id;
        const g = grupos.get(key);
        if (g) {
            g.saldo += r.saldo_atual || 0;
            g.lotes += 1;
        } else {
            grupos.set(key, { material: r.material, saldo: r.saldo_atual || 0, lotes: 1 });
        }
    }
    const abaixoMin = Array.from(grupos.values()).filter(

        (g) => g.material.estoque_minimo > 0 && g.saldo <= g.material.estoque_minimo && g.saldo < 5
    );

    return (
        <AppLayout>
            <header className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight">Alertas</h1>
                <p className="text-sm text-slate-500 mt-1">Itens críticos do estoque</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h2 className="font-semibold mb-4">Vencimento próximo ({vencendo.length})</h2>
                    {vencendo.length === 0 ? (
                        <p className="text-sm text-slate-500">Nenhum item nos próximos 60 dias.</p>
                    ) : (
                        <ul className="divide-y">
                            {vencendo.map((r: any) => {
                                const d = daysUntil(r.validade)!;
                                return (
                                    <li key={r.id} className="py-3 flex justify-between items-start">
                                        <div>
                                            <div className="font-medium">{r.material.nome}</div>
                                            <div className="text-xs text-slate-500">Lote {r.lote} · Val. {formatDate(r.validade)} · Saldo {r.saldo_atual}</div>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded ${d < 0 ? "bg-red-100 text-red-700" : d <= 50 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                                            {d < 0 ? "Vencido" : `${d}d`}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Card>

                <Card className="p-6">
                    <h2 className="font-semibold mb-4">Estoque abaixo do mínimo ({abaixoMin.length})</h2>
                    {abaixoMin.length === 0 ? (
                        <p className="text-sm text-slate-500">Todos os itens estão acima do mínimo.</p>
                    ) : (
                        <ul className="divide-y">
                            {abaixoMin.map((g) => (
                                <li key={g.material.id} className="py-3 flex justify-between items-start">
                                    <div>
                                        <div className="font-medium">{g.material.nome}{g.material.tamanho ? ` · ${g.material.tamanho}` : ""}</div>
                                        <div className="text-xs text-slate-500">{g.saldo} unid. em {g.lotes} lote{g.lotes > 1 ? "s" : ""}</div>
                                    </div>
                                    <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">
                                        {g.saldo} / mín. {g.material.estoque_minimo}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}
