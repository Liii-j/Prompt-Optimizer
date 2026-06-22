import { supabase } from '../lib/supabase';

const MAX_SESSIONS = 10;

export async function loadSessions() {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(MAX_SESSIONS);

    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      createdAt: new Date(row.created_at).getTime(),
      messages: row.messages || [],
    }));
  } catch {
    return [];
  }
}

export async function upsertSession(session) {
  try {
    const { error } = await supabase
      .from('sessions')
      .upsert({
        id: session.id,
        title: session.title,
        messages: session.messages,
        created_at: new Date(session.createdAt).toISOString(),
      });

    if (error) throw error;
  } catch {
    // 静默失败
  }
}

export async function deleteSession(sessionId) {
  try {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;
  } catch {
    // 静默失败
  }
}
