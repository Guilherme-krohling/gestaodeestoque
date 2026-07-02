import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { computeStatus, formatDate, formatDateTime, statusBadgeClass } from "@/lib/stock-utils";
import { Search, Plus, ScanLine, Package } from "lucide-react";

export const Route = createFileRoute("/estoque")({ ssr: false, component: EstoquePage });

function EstoquePage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState("");
    const [openMat, setOpenMat] = useState(false);
    const [openBipar, setOpenBipar] = useState(false);

    const { data: rows = [], isLoading } = useQuery({
        queryKey: ["estoque-list"],
        queryFn: async () => {
            const { data } = await api.get("/estoque");
            return data ?? [];
        },
    });

    const totaisPorMaterial = useMemo(() => {
        const map = new Map<string, number>();
        for (const r of rows as any[]) {
            map.set(r.material_id, (map.get(r.material_id) || 0) + (r.saldo_atual || 0));
        }
        return map;
    }, [rows]);

    const filtered = useMemo(() => {
        const s = search.toLowerCase().trim();
        if (!s) return rows;
        return rows.filter((r: any) =>
            r.materiais?.nome?.toLowerCase().includes(s) ||
            r.materiais?.referencia_cfn?.toLowerCase().includes(s) ||
            r.lote?.toLowerCase().includes(s)
        );
    }, [rows, search]);

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Header */}
                <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-sky-100 blur-3xl" />
                    <div className="absolute bottom-0 left-20 h-32 w-32 rounded-full bg-indigo-100 blur-3xl" />

                    <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                                Controle de estoque
                            </span>

                            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                                Estoque
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm text-slate-500">
                                Consulte saldos por lote, validade, movimentações e status dos materiais vasculares.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Dialog open={openBipar} onOpenChange={setOpenBipar}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="h-11 rounded-xl border-slate-200 bg-white px-5 shadow-sm hover:bg-slate-50"
                                    >
                                        <ScanLine className="mr-2 h-4 w-4" />
                                        Bipar entrada
                                    </Button>
                                </DialogTrigger>
                                <BiparDialog onClose={() => setOpenBipar(false)} />
                            </Dialog>

                            <Dialog open={openMat} onOpenChange={setOpenMat}>
                                <DialogTrigger asChild>
                                    <Button className="h-11 rounded-xl bg-slate-950 px-5 font-semibold text-white shadow-lg shadow-slate-900/20 hover:bg-sky-700">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Novo material
                                    </Button>
                                </DialogTrigger>

                                <NovoMaterialDialog
                                    onSaved={() => {
                                        setOpenMat(false);
                                        qc.invalidateQueries({ queryKey: ["estoque-list"] });
                                        qc.invalidateQueries({ queryKey: ["materiais"] });
                                    }}
                                />
                            </Dialog>
                        </div>
                    </div>
                </header>

                {/* Resumo rápido */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Card className="border-slate-200 p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">Registros encontrados</p>
                        <p className="mt-2 text-3xl font-bold text-slate-950">
                            {filtered.length}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                            Itens listados na tabela
                        </p>
                    </Card>

                    <Card className="border-slate-200 p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">Materiais ativos</p>
                        <p className="mt-2 text-3xl font-bold text-slate-950">
                            {totaisPorMaterial.size}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                            Agrupados por material
                        </p>
                    </Card>

                    <Card className="border-slate-200 p-5 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">Busca atual</p>
                        <p className="mt-2 truncate text-lg font-semibold text-slate-950">
                            {search || "Sem filtro aplicado"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                            Material, referência ou lote
                        </p>
                    </Card>
                </div>

                {/* Busca */}
                <Card className="border-slate-200 p-4 shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Buscar por material, referência ou lote..."
                            className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-11 text-sm focus-visible:ring-sky-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </Card>

                {/* Tabela */}
                <Card className="overflow-hidden border-slate-200 shadow-sm">
                    <div className="border-b border-slate-100 bg-white px-6 py-5">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-950">
                                    Lista de materiais
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Saldos atualizados por lote e validade
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
                                    <TableHead className="font-semibold text-slate-600">Material</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Ref. (CFN)</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Tamanho</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Lote</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Validade</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Última mov.</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-600">Inicial</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-600">Entradas</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-600">Saídas</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-600">Saldo</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-600">Mín.</TableHead>
                                    <TableHead className="font-semibold text-slate-600">Status</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {isLoading && (
                                    <TableRow>
                                        <TableCell colSpan={12} className="py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600" />
                                                <p className="mt-3 text-sm text-slate-500">
                                                    Carregando estoque...
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!isLoading && filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={12} className="py-14 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <Package className="h-10 w-10 text-slate-300" />
                                                <p className="mt-3 text-sm font-medium text-slate-600">
                                                    Nenhum item encontrado
                                                </p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    Tente alterar a busca ou cadastre um novo material.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}

                                {filtered.map((r: any) => {
                                    const m = r.materiais || {};
                                    const status = computeStatus({
                                        validade: r.validade,
                                        saldo_atual: r.saldo_atual,
                                        estoque_minimo: m.estoque_minimo || 0,
                                        saldo_total_material:
                                            totaisPorMaterial.get(r.material_id) ?? r.saldo_atual,
                                    });

                                    return (
                                        <TableRow
                                            key={r.id}
                                            className="transition-colors hover:bg-slate-50"
                                        >
                                            <TableCell>
                                                <div className="font-semibold text-slate-800">
                                                    {m.nome || "—"}
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    ID: {r.material_id || "—"}
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-slate-600">
                                                {m.referencia_cfn || "—"}
                                            </TableCell>

                                            <TableCell className="text-slate-600">
                                                {m.tamanho || "—"}
                                            </TableCell>

                                            <TableCell>
                                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                                    {r.lote || "—"}
                                                </span>
                                            </TableCell>

                                            <TableCell className="text-slate-600">
                                                {formatDate(r.validade)}
                                            </TableCell>

                                            <TableCell className="text-xs text-slate-500">
                                                {formatDateTime(r.ultima_movimentacao)}
                                            </TableCell>

                                            <TableCell className="text-right text-slate-600">
                                                {r.saldo_inicial}
                                            </TableCell>

                                            <TableCell className="text-right font-semibold text-emerald-700">
                                                +{r.entradas}
                                            </TableCell>

                                            <TableCell className="text-right font-semibold text-indigo-700">
                                                -{r.saidas}
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <span className="text-base font-bold text-slate-950">
                                                    {r.saldo_atual}
                                                </span>
                                            </TableCell>

                                            <TableCell className="text-right text-slate-600">
                                                {m.estoque_minimo || 0}
                                            </TableCell>

                                            <TableCell>
                                                <span
                                                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(
                                                        status.tone
                                                    )}`}
                                                >
                                                    {status.label}
                                                </span>
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

function NovoMaterialDialog({ onSaved }: { onSaved: () => void }) {
    const [form, setForm] = useState({
        nome: "", referencia_cfn: "", tamanho: "", estoque_minimo: 0, fornecedor_padrao: "", unidade: "unidade",
    });
    const m = useMutation({
        mutationFn: async () => {
            await api.post("/materiais", form);
        },
        onSuccess: () => { toast.success("Material cadastrado"); onSaved(); },
        onError: (e: any) => toast.error(e.message),
    });

    return (
        <DialogContent>
            <DialogHeader><DialogTitle>Novo material</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <Label>Nome</Label>
                    <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                </div>
                <div>
                    <Label>Referência (CFN)</Label>
                    <Input value={form.referencia_cfn} onChange={(e) => setForm({ ...form, referencia_cfn: e.target.value })} />
                </div>
                <div>
                    <Label>Tamanho</Label>
                    <Input value={form.tamanho} onChange={(e) => setForm({ ...form, tamanho: e.target.value })} />
                </div>
                <div>
                    <Label>Estoque mínimo</Label>
                    <Input type="number" min={0} value={form.estoque_minimo}
                        onChange={(e) => setForm({ ...form, estoque_minimo: parseInt(e.target.value || "0") })} />
                </div>
                <div>
                    <Label>Unidade</Label>
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
                <div className="col-span-2">
                    <Label>Fornecedor padrão</Label>
                    <Input value={form.fornecedor_padrao} onChange={(e) => setForm({ ...form, fornecedor_padrao: e.target.value })} />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={() => m.mutate()} disabled={!form.nome || m.isPending}>Salvar</Button>
            </DialogFooter>
        </DialogContent>
    );
}

function BiparDialog({ onClose }: { onClose: () => void }) {
    const [code, setCode] = useState("");
    return (
        <DialogContent>
            <DialogHeader><DialogTitle>Bipar entrada</DialogTitle></DialogHeader>
            <p className="text-sm text-slate-600">
                Use o leitor USB com o cursor neste campo. Em seguida, vá para <strong>Movimentação → Entrada</strong> para confirmar os dados (referência, lote e validade).
            </p>
            <div>
                <Label>Código lido</Label>
                <Input autoFocus value={code} onChange={(e) => setCode(e.target.value)} placeholder="Aguardando leitura..." />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Fechar</Button>
            </DialogFooter>
        </DialogContent>
    );
}
