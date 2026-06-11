import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase-browser";
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
import { Download, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
            const supabase = await getSupabase();
            const { data } = await supabase.from("historico").select("*").order("criado_em", { ascending: false }).limit(1000);
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

    // Ajusta saldo do estoque quando edita/apaga uma movimentação.
    // Recalcula sempre: saldo_atual = saldo_inicial + entradas - saidas (à prova de drift).
    const ajustarEstoque = async (h: any, deltaQty: number, modo: "delete" | "edit") => {
        if (!h.material_id || !h.lote) return;
        const supabase = await getSupabase();
        const { data: lote } = await supabase
            .from("estoque").select("*")
            .eq("material_id", h.material_id).eq("lote", h.lote).maybeSingle();
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

        await supabase.from("estoque").update({
            entradas: novasEntradas,
            saidas: novasSaidas,
            saldo_atual: novoSaldo,
            ultima_movimentacao: new Date().toISOString(),
        }).eq("id", lote.id);
    };

    const salvar = useMutation({
        mutationFn: async (form: any) => {
            const supabase = await getSupabase();
            const original = editRow;
            const novaQtd = parseInt(form.quantidade) || 0;
            if (novaQtd <= 0) throw new Error("Quantidade deve ser maior que zero.");
            const deltaQty = novaQtd - original.quantidade;
            if (deltaQty !== 0) await ajustarEstoque(original, deltaQty, "edit");
            const { error } = await supabase.from("historico").update({
                paciente: form.paciente || null,
                convenio: form.convenio || null,
                hospital: form.hospital || null,
                procedimento: form.procedimento || null,
                quantidade: novaQtd,
            }).eq("id", original.id);
            if (error) throw error;
        },
        onSuccess: () => { toast.success("Registro atualizado"); qc.invalidateQueries(); setEditRow(null); },
        onError: (e: any) => toast.error(e.message),
    });

    const apagar = useMutation({
        mutationFn: async (h: any) => {
            const supabase = await getSupabase();
            await ajustarEstoque(h, 0, "delete");
            const { error } = await supabase.from("historico").delete().eq("id", h.id);
            if (error) throw error;
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
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Histórico</h1>
                    <p className="text-sm text-slate-500 mt-1">Todas as movimentações (mais recentes primeiro). Editar ou apagar ajusta o estoque automaticamente.</p>
                </div>
                <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />Exportar CSV</Button>
            </header>

            <Card className="p-4 mb-4 flex flex-wrap gap-3">
                <Input placeholder="Buscar por paciente ou material..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
                <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="todos">Todos os tipos</SelectItem>
                        <SelectItem value="Entrada">Entrada</SelectItem>
                        <SelectItem value="Saída">Saída</SelectItem>
                        <SelectItem value="Val. vencida">Val. vencida</SelectItem>
                    </SelectContent>
                </Select>
            </Card>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data/hora</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Material</TableHead>
                                <TableHead>Tamanho</TableHead>
                                <TableHead>Lote</TableHead>
                                <TableHead>Validade</TableHead>
                                <TableHead>Paciente</TableHead>
                                <TableHead>Hospital</TableHead>
                                <TableHead>Procedimento</TableHead>
                                <TableHead className="text-right">Qtd</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 && (
                                <TableRow><TableCell colSpan={11} className="text-center py-8 text-slate-500">Nenhum registro.</TableCell></TableRow>
                            )}
                            {filtered.map((r: any) => (
                                <TableRow key={r.id}>
                                    <TableCell className="text-xs whitespace-nowrap">{formatDateTime(r.criado_em)}</TableCell>
                                    <TableCell>
                                        <span className={`text-xs px-2 py-1 rounded ${r.tipo === "Entrada" ? "bg-emerald-100 text-emerald-700" : r.tipo === "Saída" ? "bg-indigo-100 text-indigo-700" : "bg-red-100 text-red-700"}`}>
                                            {r.tipo}
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-medium">{r.material_nome || "—"}</TableCell>
                                    <TableCell>{r.tamanho || "—"}</TableCell>
                                    <TableCell>{r.lote || "—"}</TableCell>
                                    <TableCell>{formatDate(r.validade)}</TableCell>
                                    <TableCell>{r.paciente || "—"}</TableCell>
                                    <TableCell>{r.hospital || "—"}</TableCell>
                                    <TableCell>{r.procedimento || "—"}</TableCell>
                                    <TableCell className="text-right font-semibold">{r.quantidade}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button size="sm" variant="ghost" onClick={() => setEditRow(r)}><Pencil className="h-4 w-4" /></Button>
                                            <Button size="sm" variant="ghost" onClick={() => setDelRow(r)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
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
                        <AlertDialogAction onClick={() => delRow && apagar.mutate(delRow)} className="bg-red-600 hover:bg-red-700">Apagar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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
