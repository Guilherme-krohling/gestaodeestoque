import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from "recharts";

export const Route = createFileRoute("/relatorios")({ ssr: false, component: RelatoriosPage });

function RelatoriosPage() {
    const { data: historico = [] } = useQuery({
        queryKey: ["historico-todo"],
        queryFn: async () => {
            const { data } = await api.get("/historico");
            return data ?? [];
        },
    });

    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);

    const histMes = (historico as any[]).filter((h) => new Date(h.criado_em) >= inicioMes);

    // Cirurgias = saídas únicas por cirurgia_id (fallback: paciente+data+procedimento)
    const surgeryKey = (h: any) =>
        h.cirurgia_id || `${h.paciente}|${new Date(h.criado_em).toISOString().slice(0, 10)}|${h.procedimento}`;

    const cirurgiasMes = new Set(
        histMes.filter((h) => h.tipo === "Saída" && h.paciente && h.procedimento).map(surgeryKey)
    ).size;
    const entradas = histMes.filter((h) => h.tipo === "Entrada").reduce((s, h) => s + h.quantidade, 0);
    const saidas = histMes.filter((h) => h.tipo === "Saída").reduce((s, h) => s + h.quantidade, 0);
    const validade = histMes.filter((h) => h.tipo === "Val. vencida").reduce((s, h) => s + h.quantidade, 0);

    // Gráfico do mês atual: por dia
    const cirurgiasMesPorDia: Record<string, Set<string>> = {};
    const materiaisMesPorDia: Record<string, number> = {};
    for (const h of histMes) {
        if (h.tipo !== "Saída") continue;
        const dia = new Date(h.criado_em).getDate().toString().padStart(2, "0");
        materiaisMesPorDia[dia] = (materiaisMesPorDia[dia] || 0) + h.quantidade;
        if (h.paciente && h.procedimento) {
            if (!cirurgiasMesPorDia[dia]) cirurgiasMesPorDia[dia] = new Set();
            cirurgiasMesPorDia[dia].add(surgeryKey(h));
        }
    }
    const diasMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const mesData = Array.from({ length: diasMes }, (_, i) => {
        const dia = (i + 1).toString().padStart(2, "0");
        return {
            dia,
            cirurgias: cirurgiasMesPorDia[dia]?.size || 0,
            materiais: materiaisMesPorDia[dia] || 0,
        };
    });

    // Gráfico histórico: por mês (todos os meses)
    const cirurgiasMesAno: Record<string, Set<string>> = {};
    const materiaisMesAno: Record<string, number> = {};
    for (const h of historico as any[]) {
        if (h.tipo !== "Saída") continue;
        const d = new Date(h.criado_em);
        const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
        materiaisMesAno[key] = (materiaisMesAno[key] || 0) + h.quantidade;
        if (h.paciente && h.procedimento) {
            if (!cirurgiasMesAno[key]) cirurgiasMesAno[key] = new Set();
            cirurgiasMesAno[key].add(surgeryKey(h));
        }
    }
    const allKeys = Array.from(new Set([...Object.keys(cirurgiasMesAno), ...Object.keys(materiaisMesAno)])).sort();
    const historicoData = allKeys.map((k) => ({
        mes: k,
        cirurgias: cirurgiasMesAno[k]?.size || 0,
        materiais: materiaisMesAno[k] || 0,
    }));

    // Procedimentos por tipo (mês atual)
    const proc: Record<string, number> = {};
    for (const h of histMes) {
        if (h.tipo === "Saída" && h.procedimento) proc[h.procedimento] = (proc[h.procedimento] || 0) + 1;
    }
    const procData = Object.entries(proc).map(([name, value]) => ({ name, value }));

    // Materiais mais movimentados (mês atual)
    const mat: Record<string, number> = {};
    for (const h of histMes) {
        if (h.tipo === "Saída" && h.material_nome) mat[h.material_nome] = (mat[h.material_nome] || 0) + h.quantidade;
    }
    const matData = Object.entries(mat).map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value).slice(0, 10);

    // Dados de pizza: materiais que mais saíram em TODO o período
    const saidasPorMaterial: Record<string, number> = {};
    for (const h of historico as any[]) {
        if (h.tipo === "Saída" && h.material_nome) {
            saidasPorMaterial[h.material_nome] = (saidasPorMaterial[h.material_nome] || 0) + h.quantidade;
        }
    }
    const sortedSaidas = Object.entries(saidasPorMaterial).sort((a, b) => b[1] - a[1]);
    const topN = 8;
    const totalSaidas = sortedSaidas.reduce((s, [, v]) => s + v, 0);
    let pieData: { name: string; value: number; total: number }[] = [];
    if (sortedSaidas.length > topN) {
        const top = sortedSaidas.slice(0, topN);
        const outros = sortedSaidas.slice(topN).reduce((s, [, v]) => s + v, 0);
        pieData = top.map(([name, value]) => ({ name, value, total: totalSaidas }));
        if (outros > 0) pieData.push({ name: "Outros", value: outros, total: totalSaidas });
    } else {
        pieData = sortedSaidas.map(([name, value]) => ({ name, value, total: totalSaidas }));
    }
    const COLORS = ["#0284c7", "#6366f1", "#0d9488", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#f97316", "#64748b", "#d946ef"];

    return (
        <AppLayout>
            <header className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
                <p className="text-sm text-slate-500 mt-1">Resumo do mês atual e volumetria histórica</p>
            </header>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <Mini title="Cirurgias (mês)" value={cirurgiasMes} color="sky" />
                <Mini title="Entradas" value={entradas} color="emerald" />
                <Mini title="Materiais usados" value={saidas} color="indigo" />
                <Mini title="Procedimentos" value={histMes.filter(h => h.tipo === "Saída" && h.procedimento).length} color="sky" />
                <Mini title="Retirados por validade" value={validade} color="red" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card className="p-6">
                    <h2 className="font-semibold mb-1">Materiais mais saíram (todo o período)</h2>
                    <p className="text-xs text-slate-500 mb-4">Distribuição percentual dos materiais com maior saída</p>
                    {pieData.length === 0 ? (
                        <p className="text-sm text-slate-500 py-8 text-center">Sem dados de saída.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <Tooltip formatter={(value: number, name: string, props: any) => {
                                    const total = props?.payload?.total ?? 0;
                                    const pct = total ? ((value / total) * 100).toFixed(1) : "0.0";
                                    return [`${value} (${pct}%)`, name];
                                }} />
                                <Legend />
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                                >
                                    {pieData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </Card>
                <Card className="p-6">
                    <h2 className="font-semibold mb-1">Volumetria histórica</h2>
                    <p className="text-xs text-slate-500 mb-4">Cirurgias e materiais por mês (todo o período)</p>
                    {historicoData.length === 0 ? (
                        <p className="text-sm text-slate-500 py-8 text-center">Sem dados.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={historicoData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="mes" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="cirurgias" name="Cirurgias" fill="#0284c7" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="materiais" name="Materiais" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h2 className="font-semibold mb-4">Procedimentos por tipo (mês)</h2>
                    {procData.length === 0 ? <p className="text-sm text-slate-500 py-8 text-center">Sem dados.</p> : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={procData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="value" name="Cirurgias realizadas" fill="#0284c7" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </Card>
                <Card className="p-6">
                    <h2 className="font-semibold mb-4">Materiais mais movimentados (mês)</h2>
                    {matData.length === 0 ? <p className="text-sm text-slate-500 py-8 text-center">Sem dados.</p> : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={matData} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis type="category" dataKey="name" width={140} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="value" name="Quantidade usada" fill="#6366f1" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}

function Mini({ title, value, color }: { title: string; value: number; color: "emerald" | "indigo" | "sky" | "red" }) {
    const tint = { emerald: "text-emerald-700", indigo: "text-indigo-700", sky: "text-sky-700", red: "text-red-700" }[color];
    return (
        <Card className="p-5">
            <div className="text-sm text-slate-500">{title}</div>
            <div className={`mt-2 text-3xl font-semibold ${tint}`}>{value}</div>
        </Card>
    );
}
