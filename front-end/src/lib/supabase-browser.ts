export async function getSupabase() {
  if (typeof window === "undefined") {
    throw new Error("O cliente do banco só pode ser carregado no navegador.");
  }

  const { supabase } = await import("@/integrations/supabase/client");
  return supabase;
}
