import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
    LayoutDashboard,
    Package,
    ArrowLeftRight,
    History,
    AlertTriangle,
    BarChart3,
    Settings,
    LogOut,
    Truck,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";
import logoDogliotti from "@/assets/logo-dogliotti.png";

const nav = [
    { to: "/", label: "Painel", icon: LayoutDashboard },
    { to: "/estoque", label: "Estoque", icon: Package },
    { to: "/movimentacao", label: "Movimentação", icon: ArrowLeftRight },
    { to: "/reposicao", label: "Reposição", icon: Truck },
    { to: "/historico", label: "Histórico", icon: History },
    { to: "/alertas", label: "Alertas", icon: AlertTriangle },
    { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
    { to: "/configuracoes", label: "Configurações", icon: Settings },
];

export function AppLayout({ children }: { children: ReactNode }) {
    const { location } = useRouterState();

    const navigate = useNavigate();
    const { session, loading } = useAuth();
    const path = location.pathname;

    useEffect(() => {
        if (!loading && !session) {
            navigate({ to: "/login" });
        }
    }, [loading, session, navigate]);

    if (loading || !session) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
                Verificando sessão...
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900">
            <aside className="hidden w-72 flex-col border-r border-slate-800 bg-slate-950 text-white md:flex">
                <div className="border-b border-white/10 px-5 py-5">
                    <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white">
                            <img
                                src={logoDogliotti}
                                alt="Dogliotti"
                                className="h-9 w-9 object-contain"
                            />
                        </div>

                        <div>
                            <div className="text-sm font-semibold leading-tight text-white">
                                Dogliotti
                            </div>
                            <div className="mt-0.5 text-xs text-slate-400">
                                Gestão de Estoque
                            </div>
                            <div className="text-xs text-sky-300">
                                Vascular
                            </div>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 space-y-1 px-4 py-5">
                    {nav.map((item) => {
                        const Icon = item.icon;
                        const active = item.to === "/" ? path === "/" : path.startsWith(item.to);

                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={cn(
                                    "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all",
                                    active
                                        ? "bg-white text-slate-950 shadow-lg shadow-black/20"
                                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                {active && (
                                    <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-sky-500" />
                                )}

                                <span
                                    className={cn(
                                        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                                        active
                                            ? "bg-sky-100 text-sky-700"
                                            : "bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                </span>

                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-white/10 p-4">
                    <div className="mb-3 rounded-2xl bg-white/5 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Sistema interno
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-200">
                            Controle vascular
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={async () => {
                            await api.post("/auth/logout");
                            localStorage.removeItem("token");
                            window.location.href = "/login";
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-red-500/10 hover:text-red-300"
                    >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                            <LogOut className="h-4 w-4" />
                        </span>
                        Sair
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-x-auto">
                <div className="mx-auto max-w-7xl px-6 py-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
