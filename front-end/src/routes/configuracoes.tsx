import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { toast } from "sonner";
import {
    ClipboardList,
    PackagePlus,
    Plus,
    Settings,
    Trash2,
} from "lucide-react";

export const Route = createFileRoute("/configuracoes")({ ssr: false, component: ConfigPage });

function ConfigPage() {
    return (
        <AppLayout>
            <div className="space-y-6">
                <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-sky-100 blur-3xl" />
                    <div className="absolute bottom-0 left-20 h-32 w-32 rounded-full bg-indigo-100 blur-3xl" />

                    <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                                Administração
                            </span>

                            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                                Configurações
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm text-slate-500">
                                Gerencie tipos de procedimento, materiais, unidades, estoque mínimo e fornecedores padrão.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
                            <Settings className="h-6 w-6" />
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <ProcedimentosCard />
                    <MateriaisCard />
                </div>
            </div>
        </AppLayout>
    );
}

function ProcedimentosCard() {
    const qc = useQueryClient();
    const [novo, setNovo] = useState("");
    const { data: procs = [] } = useQuery({
        queryKey: ["procedimentos"],
        queryFn: async () => {
            const { data } = await api.get("/procedimentos");
            return data ?? [];
        },
    });

    const add = useMutation({
        mutationFn: async () => {
            if (!novo.trim()) throw new Error("Nome obrigatório");
            await api.post("/procedimentos", { nome: novo.trim() });
        },
        onSuccess: () => { toast.success("Adicionado"); setNovo(""); qc.invalidateQueries({ queryKey: ["procedimentos"] }); },
        onError: (e: any) => toast.error(e.message),
    });

    const del = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/procedimentos/${id}`);
        },
        onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["procedimentos"] }); },
    });

    return (
        <Card className="overflow-hidden border-slate-200 shadow-sm">
            <div className="border-b border-slate-100 bg-white px-6 py-5">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                        <ClipboardList className="h-5 w-5" />
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-slate-950">
                            Tipos de procedimento
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Cadastre os procedimentos usados nas saídas de estoque.
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="mb-5 flex gap-2">
                    <Input
                        placeholder="Novo procedimento..."
                        value={novo}
                        onChange={(e) => setNovo(e.target.value)}
                        className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-sky-500"
                    />

                    <Button
                        onClick={() => add.mutate()}
                        disabled={add.isPending}
                        className="h-11 rounded-xl bg-slate-950 px-4 text-white hover:bg-sky-700"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                {(procs as any[]).length === 0 ? (
                    <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                        <ClipboardList className="h-10 w-10 text-slate-300" />
                        <p className="mt-3 text-sm font-medium text-slate-600">
                            Nenhum procedimento cadastrado
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                            Os tipos cadastrados aparecerão nesta lista.
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {(procs as any[]).map((p) => (
                            <li
                                key={p.id}
                                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                            >
                                <span className="text-sm font-medium text-slate-700">
                                    {p.nome}
                                </span>

                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => del.mutate(p.id)}
                                    className="h-8 w-8 rounded-lg p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </Card>
    );
}

function MateriaisCard() {
    const qc = useQueryClient();
    const [form, setForm] = useState({
        nome: "", referencia_cfn: "", tamanho: "", estoque_minimo: 0, fornecedor_padrao: "", unidade: "unidade",
    });

    const { data: mats = [] } = useQuery({
        queryKey: ["materiais-config"],
        queryFn: async () => {
            const { data } = await api.get("/materiais");
            return data ?? [];
        },
    });

    const add = useMutation({
        mutationFn: async () => {
            if (!form.nome) throw new Error("Nome obrigatório");
            await api.post("/materiais", form);
        },
        onSuccess: () => {
            toast.success("Material cadastrado");
            setForm({ nome: "", referencia_cfn: "", tamanho: "", estoque_minimo: 0, fornecedor_padrao: "", unidade: "unidade" });
            qc.invalidateQueries({ queryKey: ["materiais-config"] });
            qc.invalidateQueries({ queryKey: ["materiais"] });
        },
        onError: (e: any) => toast.error(e.message),
    });

    const del = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/materiais/${id}`);
        },
        onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["materiais-config"] }); },
        onError: (e: any) => toast.error(e.message),
    });

    return (
        <Card className="overflow-hidden border-slate-200 shadow-sm">
            <div className="border-b border-slate-100 bg-white px-6 py-5">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-700">
                        <PackagePlus className="h-5 w-5" />
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-slate-950">
                            Cadastro de materiais
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Mantenha materiais, referências, tamanhos e estoque mínimo atualizados.
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-slate-700">Nome</Label>
                        <Input
                            value={form.nome}
                            onChange={(e) => setForm({ ...form, nome: e.target.value })}
                            className="mt-2 h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-sky-500"
                            placeholder="Nome do material"
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-slate-700">Ref. (CFN)</Label>
                        <Input
                            value={form.referencia_cfn}
                            onChange={(e) => setForm({ ...form, referencia_cfn: e.target.value })}
                            className="mt-2 h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-sky-500"
                            placeholder="Referência"
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-slate-700">Tamanho</Label>
                        <Input
                            value={form.tamanho}
                            onChange={(e) => setForm({ ...form, tamanho: e.target.value })}
                            className="mt-2 h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-sky-500"
                            placeholder="Ex: 6mm"
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-slate-700">Estoque mínimo</Label>
                        <Input
                            type="number"
                            min={0}
                            value={form.estoque_minimo}
                            onChange={(e) =>
                                setForm({ ...form, estoque_minimo: parseInt(e.target.value || "0") })
                            }
                            className="mt-2 h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-sky-500"
                        />
                    </div>

                    <div>
                        <Label className="text-sm font-medium text-slate-700">Unidade</Label>
                        <Select
                            value={form.unidade}
                            onValueChange={(v) => setForm({ ...form, unidade: v })}
                        >
                            <SelectTrigger className="mt-2 h-11 rounded-xl border-slate-200 bg-slate-50">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unidade">Unidade</SelectItem>
                                <SelectItem value="caixa">Caixa</SelectItem>
                                <SelectItem value="pacote">Pacote</SelectItem>
                                <SelectItem value="par">Par</SelectItem>
                                <SelectItem value="kit">Kit</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-slate-700">Fornecedor padrão</Label>
                        <Input
                            value={form.fornecedor_padrao}
                            onChange={(e) => setForm({ ...form, fornecedor_padrao: e.target.value })}
                            className="mt-2 h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-sky-500"
                            placeholder="Fornecedor padrão"
                        />
                    </div>
                </div>

                <Button
                    onClick={() => add.mutate()}
                    disabled={add.isPending}
                    className="mt-6 h-11 w-full rounded-xl bg-slate-950 font-semibold text-white shadow-lg shadow-slate-900/20 hover:bg-sky-700"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    {add.isPending ? "Adicionando..." : "Adicionar material"}
                </Button>

                <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                    <div className="max-h-72 overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead className="font-semibold text-slate-600">Nome</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Ref.</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Tamanho</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-600">Mín.</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-600">Ações</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {(mats as any[]).length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-10 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <PackagePlus className="h-9 w-9 text-slate-300" />
                                                <p className="mt-3 text-sm font-medium text-slate-600">
                                                    Nenhum material cadastrado
                                                </p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    Os materiais aparecerão aqui após o cadastro.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {(mats as any[]).map((m) => (
                                    <TableRow key={m.id} className="transition-colors hover:bg-slate-50">
                                        <TableCell>
                                            <div className="font-semibold text-slate-800">{m.nome}</div>
                                            <div className="text-xs text-slate-400">
                                                {m.fornecedor_padrao || "Sem fornecedor padrão"}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-slate-600">
                                            {m.referencia_cfn || "—"}
                                        </TableCell>

                                        <TableCell className="text-slate-600">
                                            {m.tamanho || "—"}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                                {m.estoque_minimo}
                                            </span>
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => del.mutate(m.id)}
                                                className="h-8 w-8 rounded-lg p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </Card>
    );
}
