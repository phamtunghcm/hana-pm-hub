// Supabase Light REST Client (Native Fetch - 0 Dependencies)

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = () => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
};

export const fetchTable = async (tableName: string) => {
  if (!isSupabaseConfigured()) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*`, {
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error(`[Supabase Fetch Error ${tableName}]:`, err);
  }
  return null;
};

export const upsertItem = async (tableName: string, data: any) => {
  if (!isSupabaseConfigured()) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch (err) {
    console.error(`[Supabase Upsert Error ${tableName}]:`, err);
  }
  return false;
};
