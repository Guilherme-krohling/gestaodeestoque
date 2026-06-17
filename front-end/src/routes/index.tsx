import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Package, History, Activity } from "lucide-react";
import { daysUntil } from "@/lib/stock-utils";

export const Route = createFileRoute("/")({
    component: DashboardPage,
});

function DashboardPage() {
    const { data: estoque = [] } = useQuery({
        queryKey: ["estoque-dashboard"],
        queryFn: async () => {
            const { data } = await api.get("/estoque");
            return data ?? [];
        },
    });

    const { data: historico = [] } = useQuery({
        queryKey: ["historico-dashboard"],
        queryFn: async () => {
            const { data } = await api.get("/historico");
            return data ?? [];
        },
    });

    // Cálculos para os cards
    const lotesCriticos = (estoque as any[]).filter(r => r.saldo_atual > 0 && r.validade && (daysUntil(r.validade) ?? 999) <= 60).length;
    const movsHoje = (historico as any[]).filter(h => new Date(h.criado_em).toDateString() === new Date().toDateString()).length;
    const itensAtivos = new Set((estoque as any[]).filter(r => r.saldo_atual > 0).map(r => r.material_id)).size;

    return (
        <AppLayout>
            <header className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Painel Geral</h1>
                <p className="text-sm text-slate-500 mt-1">Visão geral do estoque vascular</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-100 p-3 rounded-lg text-amber-600">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{lotesCriticos}</div>
                            <div className="text-sm text-slate-500">Lotes a Vencer</div>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-sky-100 p-3 rounded-lg text-sky-600">
                            <Activity className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{movsHoje}</div>
                            <div className="text-sm text-slate-500">Movimentações Hoje</div>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600">
                            <Package className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{itensAtivos}</div>
                            <div className="text-sm text-slate-500">Materiais em Estoque</div>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600">
                            <History className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{historico.length}</div>
                            <div className="text-sm text-slate-500">Total de Registros</div>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold">Últimas Movimentações</h2>
                        <Link to="/historico" className="text-sm text-sky-600 hover:underline">Ver tudo</Link>
                    </div>
                    <div className="space-y-4">
                        {(historico as any[]).slice(0, 5).map((h: any) => (
                            <div key={h.id} className="flex justify-between items-center pb-4 border-b last:border-0">
                                <div>
                                    <div className="font-medium text-sm">{h.material_nome || 'Material não informado'}</div>
                                    <div className="text-xs text-slate-500">{new Date(h.criado_em).toLocaleString()}</div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-sm font-semibold ${h.tipo === 'Entrada' ? 'text-emerald-600' : 'text-indigo-600'}`}>
                                        {h.tipo === 'Entrada' ? '+' : '-'}{h.quantidade}
                                    </div>
                                    <div className="text-xs text-slate-500">{h.tipo}</div>
                                </div>
                            </div>
                        ))}
                        {historico.length === 0 && <p className="text-sm text-slate-500">Nenhuma movimentação registrada.</p>}
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold">Alertas de Vencimento</h2>
                        <Link to="/alertas" className="text-sm text-sky-600 hover:underline">Ver alertas</Link>
                    </div>
                    <div className="space-y-4">
                        {(estoque as any[])
                            .filter(r => r.saldo_atual > 0 && r.validade && (daysUntil(r.validade) ?? 999) <= 60)
                            .sort((a, b) => (daysUntil(a.validade) ?? 0) - (daysUntil(b.validade) ?? 0))
                            .slice(0, 5)
                            .map((r: any) => {
                                const d = daysUntil(r.validade)!;
                                return (
                                    <div key={r.id} className="flex justify-between items-center pb-4 border-b last:border-0">
                                        <div>
                                            <div className="font-medium text-sm">{r.material?.nome || 'Material desconhecido'}</div>
                                            <div className="text-xs text-slate-500">Lote: {r.lote}</div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-xs px-2 py-1 rounded ${d < 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                                                {d < 0 ? "Vencido" : `Vence em ${d} dias`}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        {lotesCriticos === 0 && <p className="text-sm text-slate-500">Nenhum lote próximo ao vencimento.</p>}
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}
