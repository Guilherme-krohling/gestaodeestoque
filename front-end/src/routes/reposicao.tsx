import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, ShoppingCart } from "lucide-react";

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
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Reposição de Estoque</h1>
                    <p className="text-sm text-slate-500 mt-1">Materiais que atingiram ou estão abaixo do estoque mínimo</p>
                </div>
                <Button variant="outline" onClick={exportCsv}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Pedido (CSV)
                </Button>
            </header>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Material</TableHead>
                                <TableHead>Ref. (CFN)</TableHead>
                                <TableHead>Tamanho</TableHead>
                                <TableHead>Fornecedor Padrão</TableHead>
                                <TableHead className="text-center">Estoque Mín.</TableHead>
                                <TableHead className="text-center">Saldo Atual</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paraRepor.length === 0 && (
                                <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">Nenhum material precisando de reposição no momento.</TableCell></TableRow>
                            )}
                            {paraRepor.map((g: any) => (
                                <TableRow key={g.material.id}>
                                    <TableCell className="font-medium">{g.material.nome || "—"}</TableCell>
                                    <TableCell>{g.material.referencia_cfn || "—"}</TableCell>
                                    <TableCell>{g.material.tamanho || "—"}</TableCell>
                                    <TableCell>{g.material.fornecedor_padrao || "—"}</TableCell>
                                    <TableCell className="text-center font-semibold">{g.material.estoque_minimo}</TableCell>
                                    <TableCell className="text-center font-bold text-red-600">{g.saldo}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2 text-amber-600 font-medium">
                                            <ShoppingCart className="h-4 w-4" />
                                            {g.saldo === 0 ? "Faltante" : "Baixo"}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </AppLayout>
    );
}
