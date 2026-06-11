import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabase } from "@/lib/supabase-browser";
import logoDogliotti from "@/assets/logo-dogliotti.png";

export const Route = createFileRoute("/login")({
    ssr: false,
    component: LoginPage,
});

// Internal email domain used to map usernames to Supabase auth emails.
// Usernames never leave the login form — the user only sees USUÁRIO / SENHA.
const USERNAME_DOMAIN = "dogliotti.local";

function usernameToEmail(username: string) {
    const clean = username.trim().toLowerCase();
    // If the user already typed an email, accept it as-is.
    if (clean.includes("@")) return clean;
    return `${clean}@${USERNAME_DOMAIN}`;
}

function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const supabase = await getSupabase();
            const email = usernameToEmail(username);
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            toast.success("Bem-vindo!");
            window.location.href = "/";
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Erro ao autenticar";
            // Avoid leaking that an account exists or not.
            toast.error(msg.toLowerCase().includes("invalid") ? "Usuário ou senha inválidos" : msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-sm rounded-xl border bg-white p-8 shadow-sm">
                <div className="flex flex-col items-center gap-3 mb-6">
                    <img
                        src={logoDogliotti}
                        alt="Dogliotti"
                        className="h-14 w-14 object-contain"
                    />
                    <div className="text-center">
                        <div className="text-lg font-semibold">Dogliotti</div>
                        <div className="text-xs text-slate-500">Gestão de Estoque - Vascular</div>
                    </div>
                </div>

                <h1 className="mb-1 text-xl font-semibold">Entrar</h1>
                <p className="mb-5 text-sm text-slate-500">
                    Acesso restrito a funcionários autorizados.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Usuário</Label>
                        <Input
                            id="username"
                            type="text"
                            autoComplete="username"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="seu.usuario"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Aguarde..." : "Entrar"}
                    </Button>
                </form>

                <p className="mt-4 text-center text-xs text-slate-500">
                    Novos acessos são criados apenas pelo administrador.
                </p>
            </div>
        </div>
    );
}
