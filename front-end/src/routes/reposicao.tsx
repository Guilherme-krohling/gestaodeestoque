import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    AlertTriangle,
    ClipboardList,
    Download,
    PackageCheck,
    PackageX,
    ShoppingCart,
} from "lucide-react";

export const Route = createFileRoute("/reposicao")({ ssr: false, component: ReposicaoPage });

function ReposicaoPage() {
    const { data: rows = [] } = useQuery({
        queryKey: ["estoque-reposicao"],
        queryFn: async () => {
            const { data } = await api.get("/estoque");
            return data ?? [];
        },
    });

    // Agrupar saldos por material (somando todos os lotes do mesmo material)
    const grupos = new Map<string, { material: any; saldo: number }>();
    for (const r of rows as any[]) {
        if (!r.material) continue;
        const key = r.material_id;
        const g = grupos.get(key);
        if (g) {
            g.saldo += r.saldo_atual || 0;
        } else {
            grupos.set(key, { material: r.material, saldo: r.saldo_atual || 0 });
        }
    }

    // Filtrar apenas materiais que têm estoque mínimo cadastrado E cujo saldo atual <= estoque mínimo
    const paraRepor = Array.from(grupos.values()).filter(
        (g) => g.material.estoque_minimo > 0 && g.saldo <= g.material.estoque_minimo
    );

    const materiaisMonitorados = Array.from(grupos.values()).filter(
        (g) => g.material.estoque_minimo > 0
    ).length;

    const itensFaltantes = paraRepor.filter((g) => g.saldo === 0).length;

    const itensBaixos = paraRepor.filter((g) => g.saldo > 0).length;

    const sugestaoTotal = paraRepor.reduce((acc, g) => {
        const sugestao =
            Math.max(0, g.material.estoque_minimo - g.saldo) +
            Math.ceil(g.material.estoque_minimo * 0.5);

        return acc + sugestao;
    }, 0);

    const exportCsv = () => {
        const headers = ["Material", "Referência (CFN)", "Tamanho", "Fornecedor", "Estoque Mínimo", "Saldo Atual", "Sugestão de Compra"];
        const lines = [headers.join(",")];
        for (const g of paraRepor) {
            const sugestao = Math.max(0, g.material.estoque_minimo - g.saldo) + Math.ceil(g.material.estoque_minimo * 0.5); // Sugere repor até 1.5x o mínimo
            const row = [
                g.material.nome ?? "",
                g.material.referencia_cfn ?? "",
                g.material.tamanho ?? "",
                g.material.fornecedor_padrao ?? "",
                g.material.estoque_minimo,
                g.saldo,
                sugestao
            ].map((v) => `"${String(v).replaceAll('"', '""')}"`);
            lines.push(row.join(","));
        }
        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `relatorio-reposicao-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-amber-100 blur-3xl" />
                    <div className="absolute bottom-0 left-20 h-32 w-32 rounded-full bg-sky-100 blur-3xl" />

                    <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                Controle de reposição
                            </span>

                            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                                Reposição de Estoque
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm text-slate-500">
                                Materiais que atingiram ou estão abaixo do estoque mínimo cadastrado.
                            </p>
                        </div>

                        <Button
                            variant="outline"
                            onClick={exportCsv}
                            className="h-11 rounded-xl border-slate-200 bg-white px-5 shadow-sm hover:bg-slate-50"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Exportar Pedido (CSV)
                        </Button>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Card className="border-slate-200 p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Monitorados
                                </p>
                                <p className="mt-2 text-3xl font-bold text-slate-950">
                                    {materiaisMonitorados}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                    Com estoque mínimo
                                </p>
                            </div>

                            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                                <ClipboardList className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-slate-200 p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Para repor
                                </p>
                                <p className="mt-2 text-3xl font-bold text-slate-950">
                                    {paraRepor.length}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                    Abaixo do mínimo
                                </p>
                            </div>

                            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-slate-200 p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Faltantes
                                </p>
                                <p className="mt-2 text-3xl font-bold text-slate-950">
                                    {itensFaltantes}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                    Saldo zerado
                                </p>
                            </div>

                            <div className="rounded-2xl bg-red-100 p-3 text-red-700">
                                <PackageX className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-slate-200 p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Sugestão total
                                </p>
                                <p className="mt-2 text-3xl font-bold text-slate-950">
                                    {sugestaoTotal}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                    Quantidade estimada
                                </p>
                            </div>

                            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                                <PackageCheck className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>
                </div>

                <Card className="overflow-hidden border-slate-200 shadow-sm">
                    <div className="border-b border-slate-100 bg-white px-6 py-5">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-950">
                                    Materiais para reposição
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Lista agrupada por material, considerando o saldo total dos lotes.
                                </p>
                            </div>

                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                {itensBaixos} baixo(s) · {itensFaltantes} faltante(s)
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="font-semibold text-slate-600">Material</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Ref. (CFN)</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Tamanho</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Fornecedor</TableHead>
                                    <TableHead className="text-center font-semibold text-slate-600">Estoque mín.</TableHead>
                                    <TableHead className="text-center font-semibold text-slate-600">Saldo atual</TableHead>
                                    <TableHead className="text-center font-semibold text-slate-600">Sugestão</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-600">Status</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {paraRepor.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-14 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <PackageCheck className="h-10 w-10 text-emerald-300" />
                                                <p className="mt-3 text-sm font-medium text-slate-600">
                                                    Nenhum material precisando de reposição
                                                </p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    Todos os materiais estão acima do estoque mínimo cadastrado.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {paraRepor.map((g: any) => {
                                    const sugestao =
                                        Math.max(0, g.material.estoque_minimo - g.saldo) +
                                        Math.ceil(g.material.estoque_minimo * 0.5);

                                    const faltante = g.saldo === 0;

                                    return (
                                        <TableRow
                                            key={g.material.id}
                                            className="transition-colors hover:bg-slate-50"
                                        >
                                            <TableCell>
                                                <div className="font-semibold text-slate-800">
                                                    {g.material.nome || "—"}
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-slate-600">
                                                {g.material.referencia_cfn || "—"}
                                            </TableCell>

                                            <TableCell className="text-slate-600">
                                                {g.material.tamanho || "—"}
                                            </TableCell>

                                            <TableCell className="text-slate-600">
                                                {g.material.fornecedor_padrao || "—"}
                                            </TableCell>

                                            <TableCell className="text-center font-semibold text-slate-700">
                                                {g.material.estoque_minimo}
                                            </TableCell>

                                            <TableCell className="text-center">
                                                <span className="font-bold text-red-600">
                                                    {g.saldo}
                                                </span>
                                            </TableCell>

                                            <TableCell className="text-center">
                                                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                                                    Comprar {sugestao}
                                                </span>
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <div
                                                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                                                        faltante
                                                            ? "bg-red-100 text-red-700"
                                                            : "bg-amber-100 text-amber-700"
                                                    }`}
                                                >
                                                    <ShoppingCart className="h-3.5 w-3.5" />
                                                    {faltante ? "Faltante" : "Baixo"}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}
