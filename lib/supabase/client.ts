import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/persistence/database.types";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase URL and publishable key must be configured.");
  client ??= createBrowserClient<Database>(url, key);
  return client;
}
