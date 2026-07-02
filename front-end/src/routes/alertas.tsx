import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { daysUntil, formatDate } from "@/lib/stock-utils";
import {
    AlertTriangle,
    CalendarClock,
    CheckCircle2,
    PackageX,
    ShieldCheck,
    Siren,
} from "lucide-react";

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

        (g) => g.material.estoque_minimo > 0 && g.material.estoque_minimo > 0 && g.saldo <= g.material.estoque_minimo
    );

    const vencidos = vencendo.filter((r: any) => (daysUntil(r.validade) ?? 999) < 0).length;
    const criticos = vencendo.filter((r: any) => {
        const d = daysUntil(r.validade) ?? 999;
        return d >= 0 && d <= 30;
    }).length;
    const totalAlertas = vencendo.length + abaixoMin.length;

    return (
        <AppLayout>
            <div className="space-y-6">
                <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-red-100 blur-3xl" />
                    <div className="absolute bottom-0 left-20 h-32 w-32 rounded-full bg-amber-100 blur-3xl" />

                    <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                                Monitoramento crítico
                            </span>

                            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                                Alertas
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm text-slate-500">
                                Acompanhe vencimentos próximos, lotes vencidos e materiais abaixo do estoque mínimo.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Total de alertas
                            </p>
                            <p className="mt-1 text-2xl font-bold text-slate-950">
                                {totalAlertas}
                            </p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Card className="border-slate-200 p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Vencimento</p>
                                <p className="mt-2 text-3xl font-bold text-slate-950">
                                    {vencendo.length}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                    Próximos 60 dias
                                </p>
                            </div>

                            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                                <CalendarClock className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-slate-200 p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Vencidos</p>
                                <p className="mt-2 text-3xl font-bold text-slate-950">
                                    {vencidos}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                    Lotes já vencidos
                                </p>
                            </div>

                            <div className="rounded-2xl bg-red-100 p-3 text-red-700">
                                <Siren className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-slate-200 p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Críticos</p>
                                <p className="mt-2 text-3xl font-bold text-slate-950">
                                    {criticos}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                    Até 30 dias
                                </p>
                            </div>

                            <div className="rounded-2xl bg-orange-100 p-3 text-orange-700">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-slate-200 p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Abaixo mínimo</p>
                                <p className="mt-2 text-3xl font-bold text-slate-950">
                                    {abaixoMin.length}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                    Materiais com baixo saldo
                                </p>
                            </div>

                            <div className="rounded-2xl bg-red-100 p-3 text-red-700">
                                <PackageX className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <Card className="overflow-hidden border-slate-200 shadow-sm">
                        <div className="border-b border-slate-100 bg-white px-6 py-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-950">
                                        Vencimento próximo
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Lotes vencidos ou com validade dentro de 60 dias.
                                    </p>
                                </div>

                                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                    {vencendo.length} alerta(s)
                                </span>
                            </div>
                        </div>

                        <div className="p-6">
                            {vencendo.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                                    <ShieldCheck className="h-10 w-10 text-emerald-400" />
                                    <p className="mt-3 text-sm font-medium text-slate-600">
                                        Nenhum item próximo ao vencimento
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        Não há lotes com vencimento nos próximos 60 dias.
                                    </p>
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {vencendo.map((r: any) => {
                                        const d = daysUntil(r.validade)!;
                                        const vencido = d < 0;
                                        const critico = d >= 0 && d <= 30;

                                        return (
                                            <li
                                                key={r.id}
                                                className="flex items-start justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
                                            >
                                                <div>
                                                    <div className="font-semibold text-slate-800">
                                                        {r.material.nome}
                                                    </div>

                                                    <div className="mt-1 text-xs text-slate-500">
                                                        Lote {r.lote} · Val. {formatDate(r.validade)} · Saldo {r.saldo_atual}
                                                    </div>
                                                </div>

                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                        vencido
                                                            ? "bg-red-100 text-red-700"
                                                            : critico
                                                            ? "bg-orange-100 text-orange-700"
                                                            : "bg-amber-100 text-amber-700"
                                                    }`}
                                                >
                                                    {vencido ? "Vencido" : `${d} dias`}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </Card>

                    <Card className="overflow-hidden border-slate-200 shadow-sm">
                        <div className="border-b border-slate-100 bg-white px-6 py-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-950">
                                        Estoque abaixo do mínimo
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Materiais com saldo total abaixo do mínimo definido.
                                    </p>
                                </div>

                                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                                    {abaixoMin.length} item(ns)
                                </span>
                            </div>
                        </div>

                        <div className="p-6">
                            {abaixoMin.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                                    <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                                    <p className="mt-3 text-sm font-medium text-slate-600">
                                        Todos os itens estão acima do mínimo
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        Os materiais críticos aparecerão aqui quando o saldo ficar baixo.
                                    </p>
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {abaixoMin.map((g) => (
                                        <li
                                            key={g.material.id}
                                            className="flex items-start justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
                                        >
                                            <div>
                                                <div className="font-semibold text-slate-800">
                                                    {g.material.nome}
                                                    {g.material.tamanho ? ` · ${g.material.tamanho}` : ""}
                                                </div>

                                                <div className="mt-1 text-xs text-slate-500">
                                                    {g.saldo} unid. em {g.lotes} lote{g.lotes > 1 ? "s" : ""}
                                                </div>
                                            </div>

                                            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                                {g.saldo} / mín. {g.material.estoque_minimo}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
