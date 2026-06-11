import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase-browser";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { formatDate, daysUntil } from "@/lib/stock-utils";

export const Route = createFileRoute("/movimentacao")({ ssr: false, component: MovimentacaoPage });

function MovimentacaoPage() {
    return (
        <AppLayout>
            <header className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight">Movimentação</h1>
                <p className="text-sm text-slate-500 mt-1">Entradas, saídas por procedimento e retiradas por validade</p>
            </header>

            <Tabs defaultValue="entrada">
                <TabsList>
                    <TabsTrigger value="entrada">Entrada</TabsTrigger>
                    <TabsTrigger value="saida">Saída (procedimento)</TabsTrigger>
                    <TabsTrigger value="validade">Retirada por validade</TabsTrigger>
                </TabsList>
                <TabsContent value="entrada" className="mt-4"><EntradaTab /></TabsContent>
                <TabsContent value="saida" className="mt-4"><SaidaTab /></TabsContent>
                <TabsContent value="validade" className="mt-4"><ValidadeTab /></TabsContent>
            </Tabs>
        </AppLayout>
    );
}

function EntradaTab() {
    const qc = useQueryClient();
    const { data: materiais = [] } = useQuery({
        queryKey: ["materiais"],
        queryFn: async () => {
            const supabase = await getSupabase();
            return (await supabase.from("materiais").select("*").order("nome")).data ?? [];
        },
    });

    const [form, setForm] = useState({
        material_id: "", referencia_cfn: "", tamanho: "", lote: "", validade: "",
        quantidade: 1, fornecedor: "",
    });

    const mat = materiais.find((m: any) => m.id === form.material_id);

    const onSelectMaterial = (id: string) => {
        const m: any = materiais.find((x: any) => x.id === id);
        setForm({
            ...form, material_id: id,
            referencia_cfn: m?.referencia_cfn || "",
            tamanho: m?.tamanho || "",
            fornecedor: m?.fornecedor_padrao || "",
        });
    };

    const submit = useMutation({
        mutationFn: async () => {
            if (!form.material_id || !form.lote || form.quantidade <= 0)
                throw new Error("Preencha material, lote e quantidade.");
            const supabase = await getSupabase();
            const { data: existente } = await supabase
                .from("estoque")
                .select("*")
                .eq("material_id", form.material_id)
                .eq("lote", form.lote)
                .maybeSingle();

            const agora = new Date().toISOString();
            if (existente) {
                const { error } = await supabase.from("estoque").update({
                    entradas: existente.entradas + form.quantidade,
                    saldo_atual: existente.saldo_atual + form.quantidade,
                    validade: form.validade || existente.validade,
                    ultima_movimentacao: agora,
                }).eq("id", existente.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("estoque").insert({
                    material_id: form.material_id,
                    lote: form.lote,
                    validade: form.validade || null,
                    saldo_inicial: form.quantidade,
                    entradas: form.quantidade,
                    saidas: 0,
                    saldo_atual: form.quantidade,
                    ultima_movimentacao: agora,
                });
                if (error) throw error;
            }

            await supabase.from("historico").insert({
                tipo: "Entrada",
                material_id: form.material_id,
                material_nome: mat?.nome,
                referencia_cfn: form.referencia_cfn,
                tamanho: form.tamanho,
                lote: form.lote,
                validade: form.validade || null,
                quantidade: form.quantidade,
            });
        },
        onSuccess: () => {
            toast.success("Entrada registrada");
            qc.invalidateQueries();
            setForm({ material_id: "", referencia_cfn: "", tamanho: "", lote: "", validade: "", quantidade: 1, fornecedor: "" });
        },
        onError: (e: any) => toast.error(e.message),
    });

    return (
        <Card className="p-6">
            <p className="text-sm text-slate-600 mb-4">
                O código de barras da caixa do produto já contém lote, referência e validade. Use o leitor USB para preencher os campos abaixo, ou digite manualmente.
            </p>
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <Label>Material</Label>
                    <Select value={form.material_id} onValueChange={onSelectMaterial}>
                        <SelectTrigger><SelectValue placeholder="Selecione um material cadastrado" /></SelectTrigger>
                        <SelectContent>
                            {materiais.map((m: any) => (
                                <SelectItem key={m.id} value={m.id}>{m.nome} {m.tamanho ? `· ${m.tamanho}` : ""}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div><Label>Referência (CFN)</Label>
                    <Input value={form.referencia_cfn} onChange={(e) => setForm({ ...form, referencia_cfn: e.target.value })} /></div>
                <div><Label>Tamanho</Label>
                    <Input value={form.tamanho} onChange={(e) => setForm({ ...form, tamanho: e.target.value })} /></div>
                <div><Label>Lote</Label>
                    <Input value={form.lote} onChange={(e) => setForm({ ...form, lote: e.target.value })} /></div>
                <div><Label>Validade</Label>
                    <Input type="date" value={form.validade} onChange={(e) => setForm({ ...form, validade: e.target.value })} /></div>
                <div><Label>Quantidade</Label>
                    <Input type="number" min={1} value={form.quantidade}
                        onChange={(e) => setForm({ ...form, quantidade: parseInt(e.target.value || "0") })} /></div>
                <div><Label>Fornecedor</Label>
                    <Input value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} /></div>
            </div>
            <div className="mt-6 flex justify-end">
                <Button onClick={() => submit.mutate()} disabled={submit.isPending}>Confirmar entrada</Button>
            </div>
        </Card>
    );
}

function SaidaTab() {
    const qc = useQueryClient();
    const { data: lotes = [] } = useQuery({
        queryKey: ["lotes-disponiveis"],
        queryFn: async () => {
            const supabase = await getSupabase();
            const { data } = await supabase.from("estoque").select("*, materiais(*)").gt("saldo_atual", 0);
            return data ?? [];
        },
    });
    const { data: procedimentos = [] } = useQuery({
        queryKey: ["procedimentos"],
        queryFn: async () => {
            const supabase = await getSupabase();
            return (await supabase.from("procedimentos").select("*").order("nome")).data ?? [];
        },
    });

    type Item = { estoque_id: string; quantidade: number };
    const emptyForm = {
        paciente: "", convenio: "", hospital: "", data: new Date().toISOString().slice(0, 10),
        procedimento: "",
        itens: [{ estoque_id: "", quantidade: 1 }] as Item[],
    };
    const [form, setForm] = useState(emptyForm);

    const updateItem = (i: number, patch: Partial<Item>) => {
        setForm({ ...form, itens: form.itens.map((it, idx) => idx === i ? { ...it, ...patch } : it) });
    };
    const addItem = () => setForm({ ...form, itens: [...form.itens, { estoque_id: "", quantidade: 1 }] });
    const removeItem = (i: number) => setForm({ ...form, itens: form.itens.filter((_, idx) => idx !== i) });

    const submit = useMutation({
        mutationFn: async () => {
            if (!form.paciente || !form.convenio || !form.procedimento)
                throw new Error("Paciente, convênio e procedimento são obrigatórios.");
            if (form.itens.length === 0 || form.itens.some(it => !it.estoque_id || it.quantidade <= 0))
                throw new Error("Adicione ao menos um material com quantidade válida.");

            // Agrega quantidades por lote (caso o usuário escolha o mesmo lote 2x)
            const agg = new Map<string, number>();
            for (const it of form.itens) agg.set(it.estoque_id, (agg.get(it.estoque_id) || 0) + it.quantidade);

            const lotesSelecionados = Array.from(agg.entries()).map(([id, qtd]) => {
                const lote: any = lotes.find((l: any) => l.id === id);
                if (!lote) throw new Error("Lote não encontrado.");
                if (qtd > lote.saldo_atual) throw new Error(`Quantidade maior que saldo de ${lote.materiais.nome} (lote ${lote.lote}).`);
                return { lote, qtd };
            });

            const supabase = await getSupabase();
            const agora = new Date().toISOString();
            const cirurgiaId = crypto.randomUUID();

            for (const { lote, qtd } of lotesSelecionados) {
                const { error: e1 } = await supabase.from("estoque").update({
                    saidas: lote.saidas + qtd,
                    saldo_atual: lote.saldo_atual - qtd,
                    ultima_movimentacao: agora,
                }).eq("id", lote.id);
                if (e1) throw e1;

                const { error: e2 } = await supabase.from("historico").insert({
                    tipo: "Saída",
                    material_id: lote.material_id,
                    material_nome: lote.materiais.nome,
                    referencia_cfn: lote.materiais.referencia_cfn,
                    tamanho: lote.materiais.tamanho,
                    lote: lote.lote,
                    validade: lote.validade,
                    paciente: form.paciente,
                    convenio: form.convenio,
                    hospital: form.hospital || null,
                    procedimento: form.procedimento,
                    quantidade: qtd,
                    cirurgia_id: cirurgiaId,
                    criado_em: new Date(form.data).toISOString(),
                } as any);
                if (e2) throw e2;
            }
        },
        onSuccess: () => {
            toast.success("Saída registrada");
            qc.invalidateQueries();
            setForm({ ...emptyForm, data: new Date().toISOString().slice(0, 10), itens: [{ estoque_id: "", quantidade: 1 }] });
        },
        onError: (e: any) => toast.error(e.message),
    });

    return (
        <Card className="p-6">
            <div className="grid grid-cols-2 gap-4">
                <div><Label>Paciente *</Label>
                    <Input value={form.paciente} onChange={(e) => setForm({ ...form, paciente: e.target.value })} /></div>
                <div><Label>Convênio *</Label>
                    <Input value={form.convenio} onChange={(e) => setForm({ ...form, convenio: e.target.value })} /></div>
                <div><Label>Hospital</Label>
                    <Input value={form.hospital} onChange={(e) => setForm({ ...form, hospital: e.target.value })} placeholder="Nome do hospital" /></div>
                <div><Label>Data do procedimento</Label>
                    <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
                <div className="col-span-2">
                    <Label>Tipo de procedimento *</Label>
                    <Select value={form.procedimento} onValueChange={(v) => setForm({ ...form, procedimento: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                            {procedimentos.map((p: any) => <SelectItem key={p.id} value={p.nome}>{p.nome}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                    <Label>Materiais utilizados *</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>+ Adicionar material</Button>
                </div>
                <div className="space-y-3">
                    {form.itens.map((it, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-9">
                                <Select value={it.estoque_id} onValueChange={(v) => updateItem(i, { estoque_id: v })}>
                                    <SelectTrigger><SelectValue placeholder="Selecione material · tamanho · lote" /></SelectTrigger>
                                    <SelectContent>
                                        {lotes.map((l: any) => (
                                            <SelectItem key={l.id} value={l.id}>
                                                {l.materiais.nome} · {l.materiais.tamanho || "s/ tamanho"} · Lote {l.lote} · Saldo {l.saldo_atual} · Val. {formatDate(l.validade)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2">
                                <Input type="number" min={1} value={it.quantidade}
                                    onChange={(e) => updateItem(i, { quantidade: parseInt(e.target.value || "0") })} />
                            </div>
                            <div className="col-span-1">
                                <Button type="button" variant="ghost" size="sm"
                                    disabled={form.itens.length === 1}
                                    onClick={() => removeItem(i)}>✕</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <Button onClick={() => submit.mutate()} disabled={submit.isPending}>Confirmar saída</Button>
            </div>
        </Card>
    );
}

function ValidadeTab() {
    const qc = useQueryClient();
    const { data: itens = [] } = useQuery({
        queryKey: ["validade-proxima"],
        queryFn: async () => {
            const supabase = await getSupabase();
            const { data } = await supabase.from("estoque").select("*, materiais(*)").gt("saldo_atual", 0);
            return (data ?? []).filter((r: any) => {
                const d = daysUntil(r.validade);
                return d !== null && d <= 60;
            });
        },
    });

    const retirar = useMutation({
        mutationFn: async (lote: any) => {
            const supabase = await getSupabase();
            const agora = new Date().toISOString();
            const qty = lote.saldo_atual;
            const { error: e1 } = await supabase.from("estoque").update({
                saidas: lote.saidas + qty, saldo_atual: 0, ultima_movimentacao: agora,
            }).eq("id", lote.id);
            if (e1) throw e1;
            const { error: e2 } = await supabase.from("historico").insert({
                tipo: "Val. vencida",
                material_id: lote.material_id,
                material_nome: lote.materiais.nome,
                referencia_cfn: lote.materiais.referencia_cfn,
                tamanho: lote.materiais.tamanho,
                lote: lote.lote,
                validade: lote.validade,
                quantidade: qty,
            });
            if (e2) throw e2;
        },
        onSuccess: () => { toast.success("Item retirado por validade"); qc.invalidateQueries(); },
        onError: (e: any) => toast.error(e.message),
    });

    return (
        <Card className="p-6">
            <p className="text-sm text-slate-600 mb-4">
                Regra: retirar sempre 2 meses antes do vencimento. Lista mostra itens com validade em até 60 dias.
            </p>
            {itens.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">Nenhum item próximo do vencimento.</p>
            ) : (
                <div className="divide-y">
                    {itens.map((l: any) => {
                        const d = daysUntil(l.validade);
                        return (
                            <div key={l.id} className="py-3 flex items-center justify-between">
                                <div>
                                    <div className="font-medium">{l.materiais.nome}</div>
                                    <div className="text-sm text-slate-500">
                                        Lote {l.lote} · Val. {formatDate(l.validade)} · Saldo {l.saldo_atual}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs px-2 py-1 rounded ${d! < 0 ? "bg-red-100 text-red-700" : d! <= 50 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                                        {d! < 0 ? "Vencido" : `${d}d restantes`}
                                    </span>
                                    <Button size="sm" variant="destructive" onClick={() => retirar.mutate(l)}>
                                        Retirar tudo
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}
