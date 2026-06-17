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
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/configuracoes")({ ssr: false, component: ConfigPage });

function ConfigPage() {
    return (
        <AppLayout>
            <header className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
                <p className="text-sm text-slate-500 mt-1">Procedimentos e cadastro de materiais</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ProcedimentosCard />
                <MateriaisCard />
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
        <Card className="p-6">
            <h2 className="font-semibold mb-4">Tipos de procedimento</h2>
            <div className="flex gap-2 mb-4">
                <Input placeholder="Novo procedimento..." value={novo} onChange={(e) => setNovo(e.target.value)} />
                <Button onClick={() => add.mutate()}><Plus className="h-4 w-4" /></Button>
            </div>
            <ul className="divide-y">
                {(procs as any[]).map((p) => (
                    <li key={p.id} className="py-2 flex justify-between items-center">
                        <span>{p.nome}</span>
                        <Button size="sm" variant="ghost" onClick={() => del.mutate(p.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                    </li>
                ))}
            </ul>
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
        <Card className="p-6">
            <h2 className="font-semibold mb-4">Cadastro de materiais</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="col-span-2"><Label className="text-xs">Nome</Label>
                    <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
                <div><Label className="text-xs">Ref. (CFN)</Label>
                    <Input value={form.referencia_cfn} onChange={(e) => setForm({ ...form, referencia_cfn: e.target.value })} /></div>
                <div><Label className="text-xs">Tamanho</Label>
                    <Input value={form.tamanho} onChange={(e) => setForm({ ...form, tamanho: e.target.value })} /></div>
                <div><Label className="text-xs">Estoque mínimo</Label>
                    <Input type="number" min={0} value={form.estoque_minimo}
                        onChange={(e) => setForm({ ...form, estoque_minimo: parseInt(e.target.value || "0") })} /></div>
                <div>
                    <Label className="text-xs">Unidade</Label>
                    <Select value={form.unidade} onValueChange={(v) => setForm({ ...form, unidade: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="unidade">Unidade</SelectItem>
                            <SelectItem value="caixa">Caixa</SelectItem>
                            <SelectItem value="pacote">Pacote</SelectItem>
                            <SelectItem value="par">Par</SelectItem>
                            <SelectItem value="kit">Kit</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="col-span-2"><Label className="text-xs">Fornecedor padrão</Label>
                    <Input value={form.fornecedor_padrao} onChange={(e) => setForm({ ...form, fornecedor_padrao: e.target.value })} /></div>
            </div>
            <Button onClick={() => add.mutate()} className="w-full mb-4">Adicionar material</Button>

            <div className="max-h-72 overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Ref.</TableHead>
                            <TableHead>Tamanho</TableHead>
                            <TableHead className="text-right">Mín.</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(mats as any[]).map((m) => (
                            <TableRow key={m.id}>
                                <TableCell className="font-medium">{m.nome}</TableCell>
                                <TableCell>{m.referencia_cfn || "—"}</TableCell>
                                <TableCell>{m.tamanho || "—"}</TableCell>
                                <TableCell className="text-right">{m.estoque_minimo}</TableCell>
                                <TableCell>
                                    <Button size="sm" variant="ghost" onClick={() => del.mutate(m.id)}>
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}
