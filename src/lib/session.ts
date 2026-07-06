import { supabase } from "./supabaseClient";

export async function verifySession(token: string) {
  const { data: session, error } = await supabase
    .from("sessions")
    .select("*, users(id, email, full_name, is_active)")
    .eq("token", token)
    .maybeSingle();

  if (error || !session) {
    return null;
  }

  if (new Date(session.expires_at) < new Date()) {
    await supabase.from("sessions").delete().eq("id", session.id);
    return null;
  }

  if (!session.users.is_active) {
    await supabase.from("sessions").delete().eq("id", session.id);
    return null;
  }

  return {
    user: {
      id: session.users.id,
      email: session.users.email,
      full_name: session.users.full_name,
      is_active: session.users.is_active,
    },
    session,
  };
}

export async function logout(token: string) {
  await supabase.from("sessions").delete().eq("token", token);
}

export async function isAuthenticated(token: string | null) {
  if (!token) return false;
  const session = await verifySession(token);
  return session !== null;
}

export async function getCurrentUser(token: string) {
  const session = await verifySession(token);
  return session ? session.user : null;
}
