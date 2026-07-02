import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState, useMemo } from "react";
import { formatDate, formatDateTime } from "@/lib/stock-utils";
import { toast } from "sonner";
import {
    Activity,
    ArrowDownToLine,
    ArrowUpFromLine,
    CalendarClock,
    Download,
    FileClock,
    Pencil,
    Search,
    Trash2,
} from "lucide-react";

export const Route = createFileRoute("/historico")({ ssr: false, component: HistoricoPage });

function HistoricoPage() {
    const qc = useQueryClient();
    const [q, setQ] = useState("");
    const [tipo, setTipo] = useState("todos");
    const [editRow, setEditRow] = useState<any | null>(null);
    const [delRow, setDelRow] = useState<any | null>(null);

    const { data: rows = [] } = useQuery({
        queryKey: ["historico"],
        queryFn: async () => {
            const { data } = await api.get("/historico");
            return data ?? [];
        },
    });

    const filtered = useMemo(() => {
        const s = q.toLowerCase().trim();
        return rows.filter((r: any) => {
            if (tipo !== "todos" && r.tipo !== tipo) return false;
            if (!s) return true;
            return r.paciente?.toLowerCase().includes(s) || r.material_nome?.toLowerCase().includes(s);
        });
    }, [rows, q, tipo]);

    const totalEntradas = rows.filter((r: any) => r.tipo === "Entrada").length;
    const totalSaidas = rows.filter((r: any) => r.tipo === "Saída").length;
    const totalValidade = rows.filter((r: any) => r.tipo === "Val. vencida").length;

    // Ajusta saldo do estoque quando edita/apaga uma movimentação.
    // Recalcula sempre: saldo_atual = saldo_inicial + entradas - saidas (à prova de drift).
    const ajustarEstoque = async (h: any, deltaQty: number, modo: "delete" | "edit") => {
        if (!h.material_id || !h.lote) return;
        const { data: estoqueList } = await api.get("/estoque");
        const lote = estoqueList.find((e: any) => e.material_id === h.material_id && e.lote === h.lote);
        if (!lote) return;

        let novasEntradas = lote.entradas;
        let novasSaidas = lote.saidas;

        if (h.tipo === "Entrada") {
            const change = modo === "delete" ? -h.quantidade : deltaQty;
            novasEntradas = Math.max(0, lote.entradas + change);
        } else {
            const change = modo === "delete" ? -h.quantidade : deltaQty;
            novasSaidas = Math.max(0, lote.saidas + change);
        }

        const novoSaldo = Math.max(0, lote.saldo_inicial + novasEntradas - novasSaidas);

        await api.put(`/estoque/${lote.id}`, {
            entradas: novasEntradas,
            saidas: novasSaidas,
            saldo_atual: novoSaldo,
            ultima_movimentacao: new Date().toISOString(),
        });
    };

    const salvar = useMutation({
        mutationFn: async (form: any) => {
            const original = editRow;
            const novaQtd = parseInt(form.quantidade) || 0;
            if (novaQtd <= 0) throw new Error("Quantidade deve ser maior que zero.");
            const deltaQty = novaQtd - original.quantidade;
            if (deltaQty !== 0) await ajustarEstoque(original, deltaQty, "edit");
            await api.put(`/historico/${original.id}`, {
                paciente: form.paciente || null,
                convenio: form.convenio || null,
                hospital: form.hospital || null,
                procedimento: form.procedimento || null,
                quantidade: novaQtd,
            });
        },
        onSuccess: () => { toast.success("Registro atualizado"); qc.invalidateQueries(); setEditRow(null); },
        onError: (e: any) => toast.error(e.message),
    });

    const apagar = useMutation({
        mutationFn: async (h: any) => {
            await ajustarEstoque(h, 0, "delete");
            await api.delete(`/historico/${h.id}`);
        },
        onSuccess: () => { toast.success("Registro apagado e estoque ajustado"); qc.invalidateQueries(); setDelRow(null); },
        onError: (e: any) => toast.error(e.message),
    });

    const exportCsv = () => {
        const headers = ["Data/hora", "Tipo", "Material", "Ref. CFN", "Tamanho", "Lote", "Validade", "Paciente", "Convênio", "Hospital", "Procedimento", "Quantidade"];
        const lines = [headers.join(",")];
        for (const r of filtered as any[]) {
            const row = [
                formatDateTime(r.criado_em), r.tipo, r.material_nome ?? "", r.referencia_cfn ?? "",
                r.tamanho ?? "", r.lote ?? "", formatDate(r.validade), r.paciente ?? "", r.convenio ?? "",
                r.hospital ?? "", r.procedimento ?? "", r.quantidade,
            ].map((v) => `"${String(v).replaceAll('"', '""')}"`);
            lines.push(row.join(","));
        }
        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `historico-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-sky-100 blur-3xl" />
                    <div className="absolute bottom-0 left-20 h-32 w-32 rounded-full bg-indigo-100 blur-3xl" />

                    <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                                Auditoria de estoque
                            </span>

                            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                                Histórico
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm text-slate-500">
                                Consulte todas as movimentações registradas. Editar ou apagar um registro ajusta o estoque automaticamente.
                            </p>
                        </div>

                        <Button
                            variant="outline"
                            onClick={exportCsv}
                            className="h-11 rounded-xl border-slate-200 bg-white px-5 shadow-sm hover:bg-slate-50"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Exportar CSV
                        </Button>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Card className="border-slate-200 p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total</p>
                                <p className="mt-2 text-3xl font-bold text-slate-950">{rows.length}</p>
                                <p className="mt-1 text-xs text-slate-400">Movimentações</p>
                            </div>
                            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                                <Activity className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-slate-200 p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Entradas</p>
                                <p className="mt-2 text-3xl font-bold text-slate-950">{totalEntradas}</p>
                                <p className="mt-1 text-xs text-slate-400">Itens adicionados</p>
                            </div>
                            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                                <ArrowDownToLine className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-slate-200 p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Saídas</p>
                                <p className="mt-2 text-3xl font-bold text-slate-950">{totalSaidas}</p>
                                <p className="mt-1 text-xs text-slate-400">Procedimentos</p>
                            </div>
                            <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-700">
                                <ArrowUpFromLine className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-slate-200 p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Validade</p>
                                <p className="mt-2 text-3xl font-bold text-slate-950">{totalValidade}</p>
                                <p className="mt-1 text-xs text-slate-400">Retiradas vencidas</p>
                            </div>
                            <div className="rounded-2xl bg-red-100 p-3 text-red-700">
                                <CalendarClock className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>
                </div>

                <Card className="border-slate-200 p-4 shadow-sm">
                    <div className="flex flex-col gap-3 lg:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Buscar por paciente ou material..."
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-11 focus-visible:ring-sky-500"
                            />
                        </div>

                        <Select value={tipo} onValueChange={setTipo}>
                            <SelectTrigger className="h-12 w-full rounded-2xl border-slate-200 bg-slate-50 lg:w-56">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos os tipos</SelectItem>
                                <SelectItem value="Entrada">Entrada</SelectItem>
                                <SelectItem value="Saída">Saída</SelectItem>
                                <SelectItem value="Val. vencida">Val. vencida</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </Card>

                <Card className="overflow-hidden border-slate-200 shadow-sm">
                    <div className="border-b border-slate-100 bg-white px-6 py-5">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-950">
                                    Registros de movimentação
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Mais recentes primeiro, com filtros por tipo e busca.
                                </p>
                            </div>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                {filtered.length} registro(s)
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="font-semibold text-slate-600">Data/hora</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Tipo</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Material</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Tamanho</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Lote</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Validade</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Paciente</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Hospital</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Procedimento</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-600">Qtd</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-600">Ações</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={11} className="py-14 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <FileClock className="h-10 w-10 text-slate-300" />
                                                <p className="mt-3 text-sm font-medium text-slate-600">
                                                    Nenhum registro encontrado
                                                </p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    As movimentações cadastradas aparecerão aqui.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {filtered.map((r: any) => (
                                    <TableRow key={r.id} className="transition-colors hover:bg-slate-50">
                                        <TableCell className="whitespace-nowrap text-xs text-slate-500">
                                            {formatDateTime(r.criado_em)}
                                        </TableCell>

                                        <TableCell>
                                            <span
                                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                    r.tipo === "Entrada"
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : r.tipo === "Saída"
                                                        ? "bg-indigo-100 text-indigo-700"
                                                        : "bg-red-100 text-red-700"
                                                }`}
                                            >
                                                {r.tipo}
                                            </span>
                                        </TableCell>

                                        <TableCell>
                                            <div className="font-semibold text-slate-800">
                                                {r.material_nome || "—"}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                Ref: {r.referencia_cfn || "—"}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-slate-600">{r.tamanho || "—"}</TableCell>

                                        <TableCell>
                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                                {r.lote || "—"}
                                            </span>
                                        </TableCell>

                                        <TableCell className="text-slate-600">{formatDate(r.validade)}</TableCell>
                                        <TableCell className="text-slate-600">{r.paciente || "—"}</TableCell>
                                        <TableCell className="text-slate-600">{r.hospital || "—"}</TableCell>
                                        <TableCell className="text-slate-600">{r.procedimento || "—"}</TableCell>

                                        <TableCell className="text-right">
                                            <span className="font-bold text-slate-950">
                                                {r.quantidade}
                                            </span>
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setEditRow(r)}
                                                    className="h-8 w-8 rounded-lg p-0 text-slate-500 hover:bg-sky-50 hover:text-sky-700"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setDelRow(r)}
                                                    className="h-8 w-8 rounded-lg p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                <Dialog open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)}>
                    {editRow && <EditDialog row={editRow} onSave={(f) => salvar.mutate(f)} pending={salvar.isPending} />}
                </Dialog>

                <AlertDialog open={!!delRow} onOpenChange={(o) => !o && setDelRow(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Apagar registro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                {delRow && `Esta ação vai apagar o registro e ${delRow.tipo === "Entrada" ? "reduzir" : "devolver"} ${delRow.quantidade} unidade(s) do lote ${delRow.lote} no estoque. Não pode ser desfeita.`}
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => delRow && apagar.mutate(delRow)}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Apagar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );
}

function EditDialog({ row, onSave, pending }: { row: any; onSave: (f: any) => void; pending: boolean }) {
    const [form, setForm] = useState({
        paciente: row.paciente || "",
        convenio: row.convenio || "",
        hospital: row.hospital || "",
        procedimento: row.procedimento || "",
        quantidade: row.quantidade,
    });
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Editar registro · {row.material_nome} · Lote {row.lote}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
                {row.tipo === "Saída" && (
                    <>
                        <div className="col-span-2"><Label>Paciente</Label>
                            <Input value={form.paciente} onChange={(e) => setForm({ ...form, paciente: e.target.value })} /></div>
                        <div><Label>Convênio</Label>
                            <Input value={form.convenio} onChange={(e) => setForm({ ...form, convenio: e.target.value })} /></div>
                        <div><Label>Hospital</Label>
                            <Input value={form.hospital} onChange={(e) => setForm({ ...form, hospital: e.target.value })} /></div>
                        <div className="col-span-2"><Label>Procedimento</Label>
                            <Input value={form.procedimento} onChange={(e) => setForm({ ...form, procedimento: e.target.value })} /></div>
                    </>
                )}
                <div><Label>Quantidade</Label>
                    <Input type="number" min={1} value={form.quantidade}
                        onChange={(e) => setForm({ ...form, quantidade: parseInt(e.target.value || "0") })} /></div>
            </div>
            <DialogFooter>
                <Button onClick={() => onSave(form)} disabled={pending}>Salvar</Button>
            </DialogFooter>
        </DialogContent>
    );
}
