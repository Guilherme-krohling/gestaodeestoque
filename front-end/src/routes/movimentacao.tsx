import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
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
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    CalendarClock,
    ClipboardCheck,
    PackageCheck,
    ScanLine,
    ShieldCheck,
    Trash2,
} from "lucide-react";

export const Route = createFileRoute("/movimentacao")({ ssr: false, component: MovimentacaoPage });

function MovimentacaoPage() {
    return (
        <AppLayout>
            <div className="space-y-6">
                <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-sky-100 blur-3xl" />
                    <div className="absolute bottom-0 left-20 h-32 w-32 rounded-full bg-indigo-100 blur-3xl" />

                    <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                                Movimentação de estoque
                            </span>

                            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                                Movimentação
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm text-slate-500">
                                Registre entradas, saídas por procedimento e retiradas por validade de forma controlada.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
                                <ArrowDownToLine className="mx-auto h-5 w-5 text-emerald-600" />
                                <p className="mt-2 text-xs font-medium text-slate-500">Entrada</p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
                                <ArrowUpFromLine className="mx-auto h-5 w-5 text-indigo-600" />
                                <p className="mt-2 text-xs font-medium text-slate-500">Saída</p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
                                <CalendarClock className="mx-auto h-5 w-5 text-amber-600" />
                                <p className="mt-2 text-xs font-medium text-slate-500">Validade</p>
                            </div>
                        </div>
                    </div>
                </header>

                <Tabs defaultValue="entrada" className="space-y-5">
                    <TabsList className="h-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                        <TabsTrigger
                            value="entrada"
                            className="rounded-xl px-5 py-2.5 data-[state=active]:bg-slate-950 data-[state=active]:text-white"
                        >
                            <ArrowDownToLine className="mr-2 h-4 w-4" />
                            Entrada
                        </TabsTrigger>

                        <TabsTrigger
                            value="saida"
                            className="rounded-xl px-5 py-2.5 data-[state=active]:bg-slate-950 data-[state=active]:text-white"
                        >
                            <ArrowUpFromLine className="mr-2 h-4 w-4" />
                            Saída
                        </TabsTrigger>

                        <TabsTrigger
                            value="validade"
                            className="rounded-xl px-5 py-2.5 data-[state=active]:bg-slate-950 data-[state=active]:text-white"
                        >
                            <CalendarClock className="mr-2 h-4 w-4" />
                            Retirada por validade
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="entrada" className="mt-0">
                        <EntradaTab />
                    </TabsContent>

                    <TabsContent value="saida" className="mt-0">
                        <SaidaTab />
                    </TabsContent>

                    <TabsContent value="validade" className="mt-0">
                        <ValidadeTab />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}

function EntradaTab() {
    const qc = useQueryClient();
    const { data: materiais = [] } = useQuery({
        queryKey: ["materiais"],
        queryFn: async () => {
            const { data } = await api.get("/materiais");
            return data ?? [];
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
            
            const { data: estoqueList } = await api.get("/estoque");
            const existente = estoqueList.find((e: any) => e.material_id === form.material_id && e.lote === form.lote);

            const agora = new Date().toISOString();
            if (existente) {
                await api.put(`/estoque/${existente.id}`, {
                    entradas: existente.entradas + form.quantidade,
                    saldo_atual: existente.saldo_atual + form.quantidade,
                    validade: form.validade || existente.validade,
                    ultima_movimentacao: agora,
                });
            } else {
                await api.post("/estoque", {
                    material_id: form.material_id,
                    lote: form.lote,
                    validade: form.validade ? new Date(form.validade).toISOString() : null,
                    saldo_inicial: form.quantidade,
                    entradas: form.quantidade,
                    saidas: 0,
                    saldo_atual: form.quantidade,
                    ultima_movimentacao: agora,
                });
            }

            await api.post("/historico", {
                tipo: "Entrada",
                material_id: form.material_id,
                material_nome: mat?.nome,
                referencia_cfn: form.referencia_cfn,
                tamanho: form.tamanho,
                lote: form.lote,
                validade: form.validade ? new Date(form.validade).toISOString() : null,
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
        <Card className="overflow-hidden border-slate-200 shadow-sm">
            <div className="border-b border-slate-100 bg-white px-6 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                                <PackageCheck className="h-5 w-5" />
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold text-slate-950">
                                    Registrar entrada
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Adicione novos lotes ou atualize o saldo de um lote existente.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                            <ScanLine className="h-4 w-4 text-sky-600" />
                            Leitor USB ou preenchimento manual
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="mb-6 rounded-2xl border border-sky-100 bg-sky-50 px-5 py-4">
                    <div className="flex gap-3">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
                        <p className="text-sm leading-6 text-slate-600">
                            O código de barras da caixa do produto já contém lote, referência e validade.
                            Use o leitor USB para preencher os campos abaixo ou digite manualmente.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div className="space-y-2 lg:col-span-2">
                        <Label className="text-sm font-medium text-slate-700">
                            Material
                        </Label>

                        <Select value={form.material_id} onValueChange={onSelectMaterial}>
                            <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50">
                                <SelectValue placeholder="Selecione um material cadastrado" />
                            </SelectTrigger>

                            <SelectContent>
                                {materiais.map((m: any) => (
                                    <SelectItem key={m.id} value={m.id}>
                                        {m.nome} {m.tamanho ? `· ${m.tamanho}` : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                            Referência (CFN)
                        </Label>
                        <Input
                            value={form.referencia_cfn}
                            onChange={(e) =>
                                setForm({ ...form, referencia_cfn: e.target.value })
                            }
                            className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-sky-500"
                            placeholder="Ex: CFN-0001"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                            Tamanho
                        </Label>
                        <Input
                            value={form.tamanho}
                            onChange={(e) =>
                                setForm({ ...form, tamanho: e.target.value })
                            }
                            className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-sky-500"
                            placeholder="Ex: 6mm"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                            Lote
                        </Label>
                        <Input
                            value={form.lote}
                            onChange={(e) =>
                                setForm({ ...form, lote: e.target.value })
                            }
                            className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-sky-500"
                            placeholder="Digite o lote"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                            Validade
                        </Label>
                        <Input
                            type="date"
                            value={form.validade}
                            onChange={(e) =>
                                setForm({ ...form, validade: e.target.value })
                            }
                            className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-sky-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                            Quantidade
                        </Label>
                        <Input
                            type="number"
                            min={1}
                            value={form.quantidade}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    quantidade: parseInt(e.target.value || "0"),
                                })
                            }
                            className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-sky-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                            Fornecedor
                        </Label>
                        <Input
                            value={form.fornecedor}
                            onChange={(e) =>
                                setForm({ ...form, fornecedor: e.target.value })
                            }
                            className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-sky-500"
                            placeholder="Fornecedor padrão"
                        />
                    </div>
                </div>

                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-xl border-slate-200 px-6"
                        onClick={() =>
                            setForm({
                                material_id: "",
                                referencia_cfn: "",
                                tamanho: "",
                                lote: "",
                                validade: "",
                                quantidade: 1,
                                fornecedor: "",
                            })
                        }
                    >
                        Limpar campos
                    </Button>

                    <Button
                        onClick={() => submit.mutate()}
                        disabled={submit.isPending}
                        className="h-11 rounded-xl bg-slate-950 px-6 font-semibold text-white shadow-lg shadow-slate-900/20 hover:bg-emerald-700"
                    >
                        {submit.isPending ? "Confirmando..." : "Confirmar entrada"}
                    </Button>
                </div>
            </div>
        </Card>
    );
}

function SaidaTab() {
    const qc = useQueryClient();
    const { data: lotes = [] } = useQuery({
        queryKey: ["lotes-disponiveis"],
        queryFn: async () => {
            const { data } = await api.get("/estoque");
            return (data ?? []).filter((e: any) => e.saldo_atual > 0);
        },
    });
    const { data: procedimentos = [] } = useQuery({
        queryKey: ["procedimentos"],
        queryFn: async () => {
            const { data } = await api.get("/procedimentos");
            return data ?? [];
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

            // Agrega quantidades por lote
            const agg = new Map<string, number>();
            for (const it of form.itens) agg.set(it.estoque_id, (agg.get(it.estoque_id) || 0) + it.quantidade);

            const lotesSelecionados = Array.from(agg.entries()).map(([id, qtd]) => {
                const lote: any = lotes.find((l: any) => l.id === id);
                if (!lote) throw new Error("Lote não encontrado.");
                if (qtd > lote.saldo_atual) throw new Error(`Quantidade maior que saldo de ${lote.material?.nome || 'material'} (lote ${lote.lote}).`);
                return { lote, qtd };
            });

            const agora = new Date().toISOString();

            for (const { lote, qtd } of lotesSelecionados) {
                await api.put(`/estoque/${lote.id}`, {
                    saidas: lote.saidas + qtd,
                    saldo_atual: lote.saldo_atual - qtd,
                    ultima_movimentacao: agora,
                });

                await api.post("/historico", {
                    tipo: "Saída",
                    material_id: lote.material_id,
                    material_nome: lote.material?.nome,
                    referencia_cfn: lote.material?.referencia_cfn,
                    tamanho: lote.material?.tamanho,
                    lote: lote.lote,
                    validade: lote.validade ? new Date(lote.validade).toISOString() : null,
                    paciente: form.paciente,
                    convenio: form.convenio,
                    procedimento: form.procedimento,
                    quantidade: qtd,
                });
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
                                                {l.material?.nome} · {l.material?.tamanho || "s/ tamanho"} · Lote {l.lote} · Saldo {l.saldo_atual} · Val. {formatDate(l.validade)}
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
            const { data } = await api.get("/estoque");
            return (data ?? []).filter((r: any) => {
                if (r.saldo_atual <= 0) return false;
                const d = daysUntil(r.validade);
                return d !== null && d <= 60;
            });
        },
    });

    const retirar = useMutation({
        mutationFn: async (lote: any) => {
            const agora = new Date().toISOString();
            const qty = lote.saldo_atual;
            await api.put(`/estoque/${lote.id}`, {
                saidas: lote.saidas + qty, saldo_atual: 0, ultima_movimentacao: agora,
            });
            await api.post("/historico", {
                tipo: "Val. vencida",
                material_id: lote.material_id,
                material_nome: lote.material?.nome,
                referencia_cfn: lote.material?.referencia_cfn,
                tamanho: lote.material?.tamanho,
                lote: lote.lote,
                validade: lote.validade ? new Date(lote.validade).toISOString() : null,
                quantidade: qty,
            });
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
                                    <div className="font-medium">{l.material?.nome}</div>
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
