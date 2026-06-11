import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase-browser";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Fragment, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatDate } from "@/lib/stock-utils";
import { Plus, Trash2, Search, PackagePlus } from "lucide-react";

export const Route = createFileRoute("/reposicao")({ ssr: false, component: ReposicaoPage });

function ReposicaoPage() {
    const qc = useQueryClient();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [filtro, setFiltro] = useState<"todos" | "pendentes" | "parciais" | "completos">("todos");
    const [chegadaRow, setChegadaRow] = useState<any>(null);

    const { data: rows = [] } = useQuery({
        queryKey: ["reposicoes"],
        queryFn: async () => {
            const supabase = await getSupabase();
            const { data, error } = await (supabase as any)
                .from("reposicoes")
                .select("*")
                .order("data_pedido", { ascending: false });
            if (error) throw error;
            return data ?? [];
        },
    });

    const { data: chegadas = [] } = useQuery({
        queryKey: ["reposicao_chegadas"],
        queryFn: async () => {
            const supabase = await getSupabase();
            const { data, error } = await (supabase as any)
                .from("reposicao_chegadas")
                .select("*")
                .order("data_chegada", { ascending: false });
            if (error) throw error;
            return data ?? [];
        },
    });

    const chegadasPorPedido = useMemo(() => {
        const map = new Map<string, any[]>();
        for (const c of chegadas as any[]) {
            const arr = map.get(c.reposicao_id) || [];
            arr.push(c);
            map.set(c.reposicao_id, arr);
        }
        return map;
    }, [chegadas]);

    const calcStatus = (r: any) => {
        const recebido = (chegadasPorPedido.get(r.id) || []).reduce((s, c) => s + (c.quantidade || 0), 0);
        const pendente = Math.max(0, r.quantidade - recebido);
        let status: "pendente" | "parcial" | "completo" = "pendente";
        if (recebido >= r.quantidade) status = "completo";
        else if (recebido > 0) status = "parcial";
        return { recebido, pendente, status };
    };

    const excluir = useMutation({
        mutationFn: async (id: string) => {
            const supabase = await getSupabase();
            const { error } = await (supabase as any).from("reposicoes").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Pedido removido");
            qc.invalidateQueries({ queryKey: ["reposicoes"] });
            qc.invalidateQueries({ queryKey: ["reposicao_chegadas"] });
        },
        onError: (e: any) => toast.error(e.message),
    });

    const filtered = useMemo(() => {
        const s = search.toLowerCase().trim();
        return (rows as any[]).filter((r) => {
            const { status } = calcStatus(r);
            if (filtro === "pendentes" && status !== "pendente") return false;
            if (filtro === "parciais" && status !== "parcial") return false;
            if (filtro === "completos" && status !== "completo") return false;
            if (!s) return true;
            return (
                r.material_nome?.toLowerCase().includes(s) ||
                r.tamanho?.toLowerCase().includes(s) ||
                r.fornecedor?.toLowerCase().includes(s)
            );
        });
    }, [rows, search, filtro, chegadasPorPedido]);

    const counts = useMemo(() => {
        let pendente = 0, parcial = 0, completo = 0;
        for (const r of rows as any[]) {
            const { status } = calcStatus(r);
            if (status === "pendente") pendente++;
            else if (status === "parcial") parcial++;
            else completo++;
        }
        return { pendente, parcial, completo };
    }, [rows, chegadasPorPedido]);

    return (
        <AppLayout>
            <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Reposição</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Pedidos e recebimentos (inclusive parciais por data). Não soma ao estoque automaticamente.
                    </p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="h-4 w-4 mr-2" />Novo pedido</Button>
                    </DialogTrigger>
                    <NovoPedidoDialog onSaved={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["reposicoes"] }); }} />
                </Dialog>
            </header>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <Card className="p-5"><div className="text-sm text-slate-500">Total</div><div className="mt-1 text-2xl font-semibold">{rows.length}</div></Card>
                <Card className="p-5"><div className="text-sm text-slate-500">Pendentes</div><div className="mt-1 text-2xl font-semibold text-amber-700">{counts.pendente}</div></Card>
                <Card className="p-5"><div className="text-sm text-slate-500">Parciais</div><div className="mt-1 text-2xl font-semibold text-indigo-700">{counts.parcial}</div></Card>
                <Card className="p-5"><div className="text-sm text-slate-500">Completos</div><div className="mt-1 text-2xl font-semibold text-emerald-700">{counts.completo}</div></Card>
            </div>

            <Card className="p-4">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input placeholder="Buscar material, tamanho, fornecedor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                    </div>
                    <Select value={filtro} onValueChange={(v: any) => setFiltro(v)}>
                        <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="pendentes">Pendentes</SelectItem>
                            <SelectItem value="parciais">Parciais</SelectItem>
                            <SelectItem value="completos">Completos</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Material</TableHead>
                                <TableHead>Tamanho</TableHead>
                                <TableHead className="text-right">Pedido</TableHead>
                                <TableHead className="text-right">Recebido</TableHead>
                                <TableHead className="text-right">Pendente</TableHead>
                                <TableHead>Fornecedor</TableHead>
                                <TableHead>Data pedido</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={9} className="text-center text-sm text-slate-500 py-8">Nenhum pedido encontrado.</TableCell></TableRow>
                            ) : filtered.map((r) => {
                                const { recebido, pendente, status } = calcStatus(r);
                                const cheg = chegadasPorPedido.get(r.id) || [];
                                return (
                                    <Fragment key={r.id}>
                                        <TableRow>
                                            <TableCell className="font-medium">{r.material_nome}</TableCell>
                                            <TableCell>{r.tamanho || "—"}</TableCell>
                                            <TableCell className="text-right font-semibold">{r.quantidade}</TableCell>
                                            <TableCell className="text-right text-emerald-700">{recebido}</TableCell>
                                            <TableCell className="text-right text-amber-700">{pendente}</TableCell>
                                            <TableCell>{r.fornecedor || "—"}</TableCell>
                                            <TableCell>{formatDate(r.data_pedido)}</TableCell>
                                            <TableCell>
                                                {status === "completo" && <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700">Completo</span>}
                                                {status === "parcial" && <span className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700">Parcial</span>}
                                                {status === "pendente" && <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700">Pendente</span>}
                                            </TableCell>
                                            <TableCell className="text-right space-x-1 whitespace-nowrap">
                                                <Button size="sm" variant="outline" onClick={() => setChegadaRow(r)} disabled={status === "completo"}>
                                                    <PackagePlus className="h-3 w-3 mr-1" />Registrar chegada
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remover este pedido e todas as chegadas?")) excluir.mutate(r.id); }}>
                                                    <Trash2 className="h-3 w-3 text-red-600" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                        {cheg.length > 0 && (
                                            <TableRow className="bg-slate-50/60">
                                                <TableCell colSpan={9} className="py-2">
                                                    <div className="text-xs text-slate-500 mb-1 pl-2">Chegadas registradas:</div>
                                                    <div className="flex flex-wrap gap-2 pl-2">
                                                        {cheg.map((c: any) => (<ChegadaChip key={c.id} chegada={c} qc={qc} />))}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <Dialog open={!!chegadaRow} onOpenChange={(o) => !o && setChegadaRow(null)}>
                {chegadaRow && (
                    <RegistrarChegadaDialog
                        pedido={chegadaRow}
                        jaRecebido={(chegadasPorPedido.get(chegadaRow.id) || []).reduce((s, c) => s + (c.quantidade || 0), 0)}
                        onSaved={() => {
                            setChegadaRow(null);
                            qc.invalidateQueries({ queryKey: ["reposicao_chegadas"] });
                            qc.invalidateQueries({ queryKey: ["reposicoes"] });
                        }}
                    />
                )}
            </Dialog>
        </AppLayout>
    );
}

function ChegadaChip({ chegada, qc }: { chegada: any; qc: any }) {
    const remover = useMutation({
        mutationFn: async () => {
            const supabase = await getSupabase();
            const { error } = await (supabase as any).from("reposicao_chegadas").delete().eq("id", chegada.id);
            if (error) throw error;
        },
        onSuccess: () => { toast.success("Chegada removida"); qc.invalidateQueries({ queryKey: ["reposicao_chegadas"] }); },
        onError: (e: any) => toast.error(e.message),
    });
    return (
        <span className="inline-flex items-center gap-2 text-xs bg-white border rounded px-2 py-1">
            <strong className="text-emerald-700">+{chegada.quantidade}</strong>
            <span className="text-slate-600">em {formatDate(chegada.data_chegada)}</span>
            {chegada.observacao && <span className="text-slate-400 italic">· {chegada.observacao}</span>}
            <button className="text-red-500 hover:text-red-700 ml-1" onClick={() => { if (confirm("Remover esta chegada?")) remover.mutate(); }} title="Remover chegada">×</button>
        </span>
    );
}

function RegistrarChegadaDialog({ pedido, jaRecebido, onSaved }: { pedido: any; jaRecebido: number; onSaved: () => void }) {
    const pendente = Math.max(0, pedido.quantidade - jaRecebido);
    const [quantidade, setQuantidade] = useState(String(pendente || 1));
    const [dataChegada, setDataChegada] = useState(new Date().toISOString().slice(0, 10));
    const [observacao, setObservacao] = useState("");

    const salvar = useMutation({
        mutationFn: async () => {
            const qtd = Number(quantidade) || 0;
            if (qtd <= 0) throw new Error("Informe uma quantidade maior que zero.");
            if (!dataChegada) throw new Error("Informe a data de chegada.");
            const supabase = await getSupabase();
            const { error } = await (supabase as any).from("reposicao_chegadas").insert({
                reposicao_id: pedido.id,
                quantidade: qtd,
                data_chegada: dataChegada,
                observacao: observacao || null,
            });
            if (error) throw error;
            if (!pedido.data_chegada) {
                await (supabase as any).from("reposicoes").update({ data_chegada: dataChegada }).eq("id", pedido.id);
            }
        },
        onSuccess: () => { toast.success("Chegada registrada"); onSaved(); },
        onError: (e: any) => toast.error(e.message),
    });

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Registrar chegada · {pedido.material_nome}{pedido.tamanho ? ` · ${pedido.tamanho}` : ""}</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-slate-600 mb-2">
                Pedido: <strong>{pedido.quantidade}</strong> · Já recebido: <strong className="text-emerald-700">{jaRecebido}</strong> · Pendente: <strong className="text-amber-700">{pendente}</strong>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <Label>Quantidade que chegou</Label>
                    <Input type="number" min="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
                </div>
                <div>
                    <Label>Data de chegada</Label>
                    <Input type="date" value={dataChegada} onChange={(e) => setDataChegada(e.target.value)} />
                </div>
                <div className="col-span-2">
                    <Label>Observação (opcional)</Label>
                    <Input value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Ex.: nota fiscal, transportadora..." />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
                    {salvar.isPending ? "Salvando..." : "Registrar chegada"}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}

function NovoPedidoDialog({ onSaved }: { onSaved: () => void }) {
    const { data: materiais = [] } = useQuery({
        queryKey: ["materiais"],
        queryFn: async () => {
            const supabase = await getSupabase();
            const { data } = await supabase.from("materiais").select("*").order("nome");
            return data ?? [];
        },
    });

    const [materialId, setMaterialId] = useState("");
    const [quantidade, setQuantidade] = useState("1");
    const [dataPedido, setDataPedido] = useState(new Date().toISOString().slice(0, 10));
    const [fornecedor, setFornecedor] = useState("");
    const [observacoes, setObservacoes] = useState("");

    const save = useMutation({
        mutationFn: async () => {
            if (!materialId) throw new Error("Selecione o material");
            const mat = (materiais as any[]).find((m) => m.id === materialId);
            const supabase = await getSupabase();
            const { error } = await (supabase as any).from("reposicoes").insert({
                material_id: materialId,
                material_nome: mat?.nome ?? null,
                tamanho: mat?.tamanho ?? null,
                quantidade: Number(quantidade) || 0,
                data_pedido: dataPedido,
                fornecedor: fornecedor || mat?.fornecedor_padrao || null,
                observacoes: observacoes || null,
            });
            if (error) throw error;
        },
        onSuccess: () => { toast.success("Pedido registrado"); onSaved(); },
        onError: (e: any) => toast.error(e.message),
    });

    return (
        <DialogContent>
            <DialogHeader><DialogTitle>Novo pedido de reposição</DialogTitle></DialogHeader>
            <div className="space-y-3">
                <div>
                    <Label>Material</Label>
                    <Select value={materialId} onValueChange={setMaterialId}>
                        <SelectTrigger><SelectValue placeholder="Selecione o material" /></SelectTrigger>
                        <SelectContent>
                            {(materiais as any[]).map((m) => (
                                <SelectItem key={m.id} value={m.id}>{m.nome}{m.tamanho ? ` · ${m.tamanho}` : ""}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label>Quantidade pedida</Label>
                        <Input type="number" min="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
                    </div>
                    <div>
                        <Label>Fornecedor</Label>
                        <Input value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} placeholder="Opcional" />
                    </div>
                </div>
                <div>
                    <Label>Data do pedido</Label>
                    <Input type="date" value={dataPedido} onChange={(e) => setDataPedido(e.target.value)} />
                </div>
                <div>
                    <Label>Observações</Label>
                    <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={() => save.mutate()} disabled={save.isPending}>
                    {save.isPending ? "Salvando..." : "Salvar pedido"}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}
