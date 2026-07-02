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
            <div className="space-y-8">
                {/* Header */}
                <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-sky-100 blur-3xl" />
                    <div className="absolute bottom-0 left-20 h-32 w-32 rounded-full bg-indigo-100 blur-3xl" />

                    <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                                Dashboard
                            </span>

                            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                                Painel Geral
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm text-slate-500">
                                Acompanhe movimentações, alertas de vencimento e o status atual do estoque vascular.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Atualizado em
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-700">
                                {new Date().toLocaleDateString("pt-BR")}
                            </p>
                        </div>
                    </div>
                </header>

                {/* Cards principais */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                    <Card className="group overflow-hidden border-slate-200 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Lotes a Vencer
                                </p>
                                <p className="mt-3 text-4xl font-bold text-slate-950">
                                    {lotesCriticos}
                                </p>
                                <p className="mt-2 text-xs text-slate-400">
                                    Próximos de 60 dias
                                </p>
                            </div>

                            <div className="rounded-2xl bg-amber-100 p-4 text-amber-600 transition-transform group-hover:scale-110">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                        </div>
                    </Card>

                    <Card className="group overflow-hidden border-slate-200 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Movimentações Hoje
                                </p>
                                <p className="mt-3 text-4xl font-bold text-slate-950">
                                    {movsHoje}
                                </p>
                                <p className="mt-2 text-xs text-slate-400">
                                    Entradas e saídas no dia
                                </p>
                            </div>

                            <div className="rounded-2xl bg-sky-100 p-4 text-sky-600 transition-transform group-hover:scale-110">
                                <Activity className="h-6 w-6" />
                            </div>
                        </div>
                    </Card>

                    <Card className="group overflow-hidden border-slate-200 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Materiais em Estoque
                                </p>
                                <p className="mt-3 text-4xl font-bold text-slate-950">
                                    {itensAtivos}
                                </p>
                                <p className="mt-2 text-xs text-slate-400">
                                    Itens com saldo ativo
                                </p>
                            </div>

                            <div className="rounded-2xl bg-emerald-100 p-4 text-emerald-600 transition-transform group-hover:scale-110">
                                <Package className="h-6 w-6" />
                            </div>
                        </div>
                    </Card>

                    <Card className="group overflow-hidden border-slate-200 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Total de Registros
                                </p>
                                <p className="mt-3 text-4xl font-bold text-slate-950">
                                    {historico.length}
                                </p>
                                <p className="mt-2 text-xs text-slate-400">
                                    Histórico completo
                                </p>
                            </div>

                            <div className="rounded-2xl bg-indigo-100 p-4 text-indigo-600 transition-transform group-hover:scale-110">
                                <History className="h-6 w-6" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Conteúdo inferior */}
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <Card className="overflow-hidden border-slate-200 shadow-sm">
                        <div className="border-b border-slate-100 px-6 py-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-950">
                                        Últimas Movimentações
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Registros mais recentes do estoque
                                    </p>
                                </div>

                                <Link
                                    to="/historico"
                                    className="rounded-full bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100"
                                >
                                    Ver tudo
                                </Link>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="space-y-4">
                                {(historico as any[]).slice(0, 5).map((h: any) => (
                                    <div
                                        key={h.id}
                                        className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                                    >
                                        <div>
                                            <div className="text-sm font-semibold text-slate-800">
                                                {h.material_nome || "Material não informado"}
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                {new Date(h.criado_em).toLocaleString("pt-BR")}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div
                                                className={`text-sm font-bold ${
                                                    h.tipo === "Entrada"
                                                        ? "text-emerald-600"
                                                        : "text-indigo-600"
                                                }`}
                                            >
                                                {h.tipo === "Entrada" ? "+" : "-"}
                                                {h.quantidade}
                                            </div>

                                            <div className="mt-1 text-xs text-slate-500">
                                                {h.tipo}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {historico.length === 0 && (
                                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                                        <Activity className="h-8 w-8 text-slate-300" />
                                        <p className="mt-3 text-sm font-medium text-slate-600">
                                            Nenhuma movimentação registrada
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            As últimas entradas e saídas aparecerão aqui.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card className="overflow-hidden border-slate-200 shadow-sm">
                        <div className="border-b border-slate-100 px-6 py-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-950">
                                        Alertas de Vencimento
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Lotes que precisam de atenção
                                    </p>
                                </div>

                                <Link
                                    to="/alertas"
                                    className="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
                                >
                                    Ver alertas
                                </Link>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="space-y-4">
                                {(estoque as any[])
                                    .filter(
                                        (r) =>
                                            r.saldo_atual > 0 &&
                                            r.validade &&
                                            (daysUntil(r.validade) ?? 999) <= 60
                                    )
                                    .sort(
                                        (a, b) =>
                                            (daysUntil(a.validade) ?? 0) -
                                            (daysUntil(b.validade) ?? 0)
                                    )
                                    .slice(0, 5)
                                    .map((r: any) => {
                                        const d = daysUntil(r.validade)!;

                                        return (
                                            <div
                                                key={r.id}
                                                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                                            >
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-800">
                                                        {r.material?.nome || "Material desconhecido"}
                                                    </div>
                                                    <div className="mt-1 text-xs text-slate-500">
                                                        Lote: {r.lote}
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                            d < 0
                                                                ? "bg-red-100 text-red-700"
                                                                : "bg-amber-100 text-amber-700"
                                                        }`}
                                                    >
                                                        {d < 0 ? "Vencido" : `Vence em ${d} dias`}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}

                                {lotesCriticos === 0 && (
                                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                                        <AlertTriangle className="h-8 w-8 text-slate-300" />
                                        <p className="mt-3 text-sm font-medium text-slate-600">
                                            Nenhum lote próximo ao vencimento
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            Os alertas aparecerão aqui quando houver lotes críticos.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
