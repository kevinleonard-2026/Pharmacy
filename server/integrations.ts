import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { MongoClient } from "mongodb";

let supabase: SupabaseClient | null = null;
let mongo: MongoClient | null = null;

export function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!supabase) supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return supabase;
}

export function getMongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  if (!mongo) mongo = new MongoClient(uri, { appName: "medgrid-pharmacy-checklist" });
  return mongo;
}

export function getIntegrationStatus() {
  return { supabaseConfigured: Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)), mongoConfigured: Boolean(process.env.MONGODB_URI) };
}
