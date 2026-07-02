import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from "recharts";
import {
    Activity,
    BarChart3,
    CalendarDays,
    ClipboardList,
    Package,
    PieChart as PieChartIcon,
    RotateCcw,
    Stethoscope,
} from "lucide-react";

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
            <div className="space-y-6">
                <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-indigo-100 blur-3xl" />
                    <div className="absolute bottom-0 left-20 h-32 w-32 rounded-full bg-sky-100 blur-3xl" />

                    <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                                Análise operacional
                            </span>

                            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                                Relatórios
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm text-slate-500">
                                Resumo do mês atual, distribuição de materiais e volumetria histórica do estoque.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Período atual
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-700">
                                {now.toLocaleDateString("pt-BR", {
                                    month: "long",
                                    year: "numeric",
                                })}
                            </p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <Mini
                        title="Cirurgias"
                        subtitle="No mês atual"
                        value={cirurgiasMes}
                        color="sky"
                        icon={<Stethoscope className="h-5 w-5" />}
                    />

                    <Mini
                        title="Entradas"
                        subtitle="Materiais recebidos"
                        value={entradas}
                        color="emerald"
                        icon={<Package className="h-5 w-5" />}
                    />

                    <Mini
                        title="Materiais usados"
                        subtitle="Saídas do mês"
                        value={saidas}
                        color="indigo"
                        icon={<Activity className="h-5 w-5" />}
                    />

                    <Mini
                        title="Procedimentos"
                        subtitle="Registros de saída"
                        value={histMes.filter((h) => h.tipo === "Saída" && h.procedimento).length}
                        color="sky"
                        icon={<ClipboardList className="h-5 w-5" />}
                    />

                    <Mini
                        title="Validade"
                        subtitle="Retirados vencidos"
                        value={validade}
                        color="red"
                        icon={<RotateCcw className="h-5 w-5" />}
                    />
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <Card className="overflow-hidden border-slate-200 shadow-sm">
                        <div className="border-b border-slate-100 bg-white px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                                    <PieChartIcon className="h-5 w-5" />
                                </div>

                                <div>
                                    <h2 className="text-lg font-semibold text-slate-950">
                                        Materiais que mais saíram
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Distribuição percentual dos materiais com maior saída em todo o período.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            {pieData.length === 0 ? (
                                <EmptyChart text="Sem dados de saída." />
                            ) : (
                                <ResponsiveContainer width="100%" height={320}>
                                    <PieChart>
                                        <Tooltip
                                            formatter={(value: number, name: string, props: any) => {
                                                const total = props?.payload?.total ?? 0;
                                                const pct = total ? ((value / total) * 100).toFixed(1) : "0.0";
                                                return [`${value} (${pct}%)`, name];
                                            }}
                                        />
                                        <Legend />
                                        <Pie
                                            data={pieData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={105}
                                            label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                                        >
                                            {pieData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </Card>

                    <Card className="overflow-hidden border-slate-200 shadow-sm">
                        <div className="border-b border-slate-100 bg-white px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-700">
                                    <BarChart3 className="h-5 w-5" />
                                </div>

                                <div>
                                    <h2 className="text-lg font-semibold text-slate-950">
                                        Volumetria histórica
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Cirurgias e materiais por mês considerando todo o período.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            {historicoData.length === 0 ? (
                                <EmptyChart text="Sem dados históricos." />
                            ) : (
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart data={historicoData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="cirurgias" name="Cirurgias" fill="#0284c7" radius={[6, 6, 0, 0]} />
                                        <Bar dataKey="materiais" name="Materiais" fill="#6366f1" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <Card className="overflow-hidden border-slate-200 shadow-sm">
                        <div className="border-b border-slate-100 bg-white px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                                    <CalendarDays className="h-5 w-5" />
                                </div>

                                <div>
                                    <h2 className="text-lg font-semibold text-slate-950">
                                        Procedimentos por tipo
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Quantidade de procedimentos registrados no mês atual.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            {procData.length === 0 ? (
                                <EmptyChart text="Sem dados de procedimentos." />
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={procData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="value" name="Cirurgias realizadas" fill="#0284c7" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </Card>

                    <Card className="overflow-hidden border-slate-200 shadow-sm">
                        <div className="border-b border-slate-100 bg-white px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                                    <BarChart3 className="h-5 w-5" />
                                </div>

                                <div>
                                    <h2 className="text-lg font-semibold text-slate-950">
                                        Materiais mais movimentados
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Top 10 materiais com maior saída no mês atual.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            {matData.length === 0 ? (
                                <EmptyChart text="Sem dados de materiais." />
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={matData} layout="vertical" margin={{ left: 40 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                                        <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="value" name="Quantidade usada" fill="#6366f1" radius={[0, 6, 6, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

function Mini({
    title,
    subtitle,
    value,
    color,
    icon,
}: {
    title: string;
    subtitle: string;
    value: number;
    color: "emerald" | "indigo" | "sky" | "red";
    icon: React.ReactNode;
}) {
    const styles = {
        emerald: {
            text: "text-emerald-700",
            bg: "bg-emerald-100",
        },
        indigo: {
            text: "text-indigo-700",
            bg: "bg-indigo-100",
        },
        sky: {
            text: "text-sky-700",
            bg: "bg-sky-100",
        },
        red: {
            text: "text-red-700",
            bg: "bg-red-100",
        },
    }[color];

    return (
        <Card className="group border-slate-200 p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <p className={`mt-2 text-3xl font-bold ${styles.text}`}>{value}</p>
                    <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
                </div>

                <div className={`rounded-2xl p-3 ${styles.bg} ${styles.text} transition-transform group-hover:scale-110`}>
                    {icon}
                </div>
            </div>
        </Card>
    );
}

function EmptyChart({ text }: { text: string }) {
    return (
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
            <BarChart3 className="h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-600">{text}</p>
            <p className="mt-1 text-xs text-slate-400">
                Os gráficos serão preenchidos conforme as movimentações forem registradas.
            </p>
        </div>
    );
}