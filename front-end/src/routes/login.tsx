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
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md p-8">
                <div className="flex flex-col items-center mb-8">
                    <img src={logoDogliotti} alt="Logo Dogliotti" className="h-16 w-16 mb-4 object-contain" />
                    <h1 className="text-2xl font-bold text-slate-900">Gestão de Estoque</h1>
                    {/* <p className="text-sm text-slate-500">Gestão de Estoque</p> */}
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <Label>Email</Label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <Label>Senha</Label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Entrando..." : "Entrar"}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
