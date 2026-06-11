import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
    try {
        return await next();
    } catch (error) {
        if (error != null && typeof error === "object" && "statusCode" in error) {
            throw error;
        }
        console.error(error);
        return new Response(renderErrorPage(), {
            status: 500,
            headers: { "content-type": "text/html; charset=utf-8" },
        });
    }
});

// Inline equivalent of `attachSupabaseAuth`, but importing the supabase
// client lazily inside the .client() callback so SSR never evaluates
// `localStorage` at module scope.
const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
    async ({ next }) => {
        if (typeof window === "undefined") return next();
        const { supabase } = await import("@/integrations/supabase/client");
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        return next({
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
    },
);

export const startInstance = createStart(() => ({
    functionMiddleware: [attachSupabaseAuth],
    requestMiddleware: [errorMiddleware],
}));
