import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import logoDogliotti from "@/assets/logo-dogliotti.png";

export const Route = createFileRoute("/login")({
    component: LoginPage,
});

function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            toast.success("Login efetuado com sucesso!");
            navigate({ to: "/" });
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Erro ao fazer login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-sky-100 flex items-center justify-center p-6">
            <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 grid md:grid-cols-2">
                
                {/* Lado visual */}
                <div className="hidden md:flex flex-col justify-between bg-slate-950 p-10 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-600/30 via-transparent to-blue-900/40" />
                    <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />
                    <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white">
                                <img
                                    src={logoDogliotti}
                                    alt="Logo Dogliotti"
                                    className="h-10 w-10 object-contain"
                                />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">Dogliotti</h2>
                                <p className="text-sm text-slate-300">Gestão de Estoque Vascular</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 space-y-4">
                        <h1 className="text-4xl font-bold leading-tight">
                            Controle seu estoque com mais segurança.
                        </h1>
                        <p className="text-sm leading-6 text-slate-300">
                            Acompanhe materiais, movimentações, reposições, alertas e relatórios em um único painel.
                        </p>
                    </div>

                    <div className="relative z-10 grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                            <p className="text-2xl font-bold">24h</p>
                            <p className="text-xs text-slate-300">Controle</p>
                        </div>
                        <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                            <p className="text-2xl font-bold">100%</p>
                            <p className="text-xs text-slate-300">Rastreável</p>
                        </div>
                        <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                            <p className="text-2xl font-bold">+Ágil</p>
                            <p className="text-xs text-slate-300">Reposição</p>
                        </div>
                    </div>
                </div>

                {/* Formulário */}
                <div className="flex items-center justify-center p-8 md:p-12">
                    <div className="w-full max-w-sm">
                        <div className="mb-8 text-center md:text-left">
                            <div className="mb-6 flex justify-center md:hidden">
                                <img
                                    src={logoDogliotti}
                                    alt="Logo Dogliotti"
                                    className="h-16 w-16 object-contain"
                                />
                            </div>

                            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                                Bem-vindo
                            </h1>
                            <p className="mt-2 text-sm text-slate-500">
                                Entre com suas credenciais para acessar o sistema.
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">
                                    Email
                                </Label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Digite seu email"
                                    required
                                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-sky-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">
                                    Senha
                                </Label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Digite sua senha"
                                    required
                                    className="h-11 rounded-xl border-slate-200 bg-slate-50 focus-visible:ring-sky-500"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="h-11 w-full rounded-xl bg-slate-950 font-semibold text-white shadow-lg shadow-slate-900/20 hover:bg-sky-700 transition-all"
                                disabled={loading}
                            >
                                {loading ? "Entrando..." : "Entrar"}
                            </Button>
                        </form>

                        <p className="mt-8 text-center text-xs text-slate-400">
                            © {new Date().getFullYear()} Dogliotti. Sistema interno de gestão.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
