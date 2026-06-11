import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase-browser";
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
import { Search, Plus, ScanLine } from "lucide-react";

export const Route = createFileRoute("/estoque")({ ssr: false, component: EstoquePage });

function EstoquePage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState("");
    const [openMat, setOpenMat] = useState(false);
    const [openBipar, setOpenBipar] = useState(false);

    const { data: rows = [], isLoading } = useQuery({
        queryKey: ["estoque-list"],
        queryFn: async () => {
            const supabase = await getSupabase();
            const { data, error } = await supabase
                .from("estoque")
                .select("*, materiais(*)")
                .order("ultima_movimentacao", { ascending: false });
            if (error) throw error;
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
            <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Estoque</h1>
                    <p className="text-sm text-slate-500 mt-1">Saldos por lote, com status de validade</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={openBipar} onOpenChange={setOpenBipar}>
                        <DialogTrigger asChild>
                            <Button variant="outline"><ScanLine className="h-4 w-4 mr-2" />Bipar entrada</Button>
                        </DialogTrigger>
                        <BiparDialog onClose={() => setOpenBipar(false)} />
                    </Dialog>
                    <Dialog open={openMat} onOpenChange={setOpenMat}>
                        <DialogTrigger asChild>
                            <Button><Plus className="h-4 w-4 mr-2" />Novo material</Button>
                        </DialogTrigger>
                        <NovoMaterialDialog onSaved={() => { setOpenMat(false); qc.invalidateQueries({ queryKey: ["estoque-list"] }); qc.invalidateQueries({ queryKey: ["materiais"] }); }} />
                    </Dialog>
                </div>
            </header>

            <Card className="p-4 mb-4">
                <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                        placeholder="Buscar por material, referência ou lote..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </Card>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Material</TableHead>
                                <TableHead>Ref. (CFN)</TableHead>
                                <TableHead>Tamanho</TableHead>
                                <TableHead>Lote</TableHead>
                                <TableHead>Validade</TableHead>
                                <TableHead>Última mov.</TableHead>
                                <TableHead className="text-right">Inicial</TableHead>
                                <TableHead className="text-right">Entradas</TableHead>
                                <TableHead className="text-right">Saídas</TableHead>
                                <TableHead className="text-right">Saldo</TableHead>
                                <TableHead className="text-right">Mín.</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && (
                                <TableRow><TableCell colSpan={12} className="text-center py-8 text-slate-500">Carregando...</TableCell></TableRow>
                            )}
                            {!isLoading && filtered.length === 0 && (
                                <TableRow><TableCell colSpan={12} className="text-center py-8 text-slate-500">Nenhum item no estoque.</TableCell></TableRow>
                            )}
                            {filtered.map((r: any) => {
                                const m = r.materiais || {};
                                const status = computeStatus({
                                    validade: r.validade,
                                    saldo_atual: r.saldo_atual,
                                    estoque_minimo: m.estoque_minimo || 0,
                                    saldo_total_material: totaisPorMaterial.get(r.material_id) ?? r.saldo_atual,
                                });
                                return (
                                    <TableRow key={r.id}>
                                        <TableCell className="font-medium">{m.nome || "—"}</TableCell>
                                        <TableCell>{m.referencia_cfn || "—"}</TableCell>
                                        <TableCell>{m.tamanho || "—"}</TableCell>
                                        <TableCell>{r.lote}</TableCell>
                                        <TableCell>{formatDate(r.validade)}</TableCell>
                                        <TableCell className="text-xs">{formatDateTime(r.ultima_movimentacao)}</TableCell>
                                        <TableCell className="text-right">{r.saldo_inicial}</TableCell>
                                        <TableCell className="text-right text-emerald-700">{r.entradas}</TableCell>
                                        <TableCell className="text-right text-indigo-700">{r.saidas}</TableCell>
                                        <TableCell className="text-right font-semibold">{r.saldo_atual}</TableCell>
                                        <TableCell className="text-right">{m.estoque_minimo || 0}</TableCell>
                                        <TableCell>
                                            <span className={`text-xs px-2 py-1 rounded border ${statusBadgeClass(status.tone)}`}>
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
        </AppLayout>
    );
}

function NovoMaterialDialog({ onSaved }: { onSaved: () => void }) {
    const [form, setForm] = useState({
        nome: "", referencia_cfn: "", tamanho: "", estoque_minimo: 0, fornecedor_padrao: "", unidade: "unidade",
    });
    const m = useMutation({
        mutationFn: async () => {
            const supabase = await getSupabase();
            const { error } = await supabase.from("materiais").insert(form);
            if (error) throw error;
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
