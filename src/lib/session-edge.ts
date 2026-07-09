const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function getHeaders() {
  return {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
  };
}

export async function verifySessionEdge(token: string) {
  if (!supabaseUrl || !supabaseKey) return null;

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/sessions?select=id,expires_at,users!inner(id,email,full_name,is_active)&token=eq.${token}&limit=1`,
      { headers: getHeaders() }
    );

    if (!res.ok) return null;

    const sessions = await res.json();
    const session = sessions?.[0];

    if (!session) return null;

    if (new Date(session.expires_at) < new Date()) {
      await fetch(`${supabaseUrl}/rest/v1/sessions?id=eq.${session.id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return null;
    }

    if (!session.users?.is_active) {
      await fetch(`${supabaseUrl}/rest/v1/sessions?id=eq.${session.id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return null;
    }

    return {
      user: {
        id: session.users.id,
        email: session.users.email,
        full_name: session.users.full_name,
        is_active: session.users.is_active,
      },
    };
  } catch {
    return null;
  }
}
