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
            <aside className="hidden md:flex w-64 flex-col border-r bg-white">
                <div className="flex items-center gap-3 px-6 py-5 border-b">
                    <img
                        src={logoDogliotti}
                        alt="Dogliotti"
                        className="h-10 w-10 object-contain"
                    />
                    <div>
                        <div className="text-sm font-semibold leading-tight">Dogliotti</div>
                        <div className="text-xs text-slate-500">Gestão de Estoque - Vascular</div>
                    </div>
                </div>
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {nav.map((item) => {
                        const Icon = item.icon;
                        const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={cn(
                                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                    active
                                        ? "bg-sky-50 text-sky-700"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="border-t px-3 py-3">
                    <button
                        type="button"
                        onClick={async () => {
                            await api.post('/auth/logout');
                            localStorage.removeItem('token');
                            window.location.href = "/login";
                        }}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    >
                        <LogOut className="h-4 w-4" />
                        Sair
                    </button>
                </div>
            </aside>
            <main className="flex-1 overflow-x-auto">
                <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
            </main>
        </div>
    );
}
