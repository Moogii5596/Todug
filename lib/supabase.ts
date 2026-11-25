import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Supabase-ийн түлхүүр тохируулагдсан эсэх (.env.local) */
export const configured = Boolean(url && key);

let client: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient {
  if (!client) client = createClient(url || "https://placeholder.supabase.co", key || "placeholder");
  return client;
}
