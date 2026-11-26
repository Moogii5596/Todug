import { createClient } from "@supabase/supabase-js";

/** Todug-ийн хүснэгт, функцүүд байрлах Postgres schema (Data API-д зөвхөн үүнийг нээнэ) */
export const SCHEMA = "todug";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Supabase-ийн түлхүүр тохируулагдсан эсэх (.env.local) */
export const configured = Boolean(url && key);

const make = () => createClient(url || "https://placeholder.supabase.co", key || "placeholder", { db: { schema: SCHEMA } });
type Client = ReturnType<typeof make>;

let client: Client | null = null;
export function getSupabase(): Client {
  if (!client) client = make();
  return client;
}
