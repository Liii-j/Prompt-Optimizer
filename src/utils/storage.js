import { supabase } from '../lib/supabase';

const MAX_SESSIONS = 10;
const ANON_STORAGE_KEY = 'prompt-optimizer-anonymous-sessions';

// --- localStorage helpers ---

function loadAnonymousSessions() {
  try {
    const raw = localStorage.getItem(ANON_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAnonymousSessions(sessions) {
  localStorage.setItem(ANON_STORAGE_KEY, JSON.stringify(sessions));
}

function clearAnonymousSessions() {
  localStorage.removeItem(ANON_STORAGE_KEY);
}

// --- 核心 API（按 user 决定存储位置） ---

export async function loadSessions(user) {
  if (!user) {
    return loadAnonymousSessions();
  }

  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
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

export async function upsertSession(session, user) {
  if (!user) {
    const sessions = loadAnonymousSessions();
    const idx = sessions.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      sessions[idx] = session;
    } else {
      sessions.unshift(session);
    }
    saveAnonymousSessions(sessions.slice(0, MAX_SESSIONS));
    return;
  }

  try {
    const { error } = await supabase
      .from('sessions')
      .upsert({
        id: session.id,
        title: session.title,
        messages: session.messages,
        created_at: new Date(session.createdAt).toISOString(),
        user_id: user.id,
      });

    if (error) throw error;
  } catch {
    // 静默失败
  }
}

export async function deleteSession(sessionId, user) {
  if (!user) {
    const sessions = loadAnonymousSessions();
    saveAnonymousSessions(sessions.filter((s) => s.id !== sessionId));
    return;
  }

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

// --- 迁移：匿名 → 账号 ---

export async function migrateToUser(user) {
  if (!user) return;

  // 1. 把 localStorage 匿名会话迁移到 Supabase
  const anonSessions = loadAnonymousSessions();
  if (anonSessions.length > 0) {
    for (const s of anonSessions) {
      await supabase
        .from('sessions')
        .upsert({
          id: s.id,
          title: s.title,
          messages: s.messages,
          created_at: new Date(s.createdAt).toISOString(),
          user_id: user.id,
        }, { onConflict: 'id', ignoreDuplicates: true });
    }
    clearAnonymousSessions();
  }

  // 2. 把 Supabase 中 user_id IS NULL 的旧记录迁移到当前用户
  try {
    await supabase
      .rpc('claim_anonymous_sessions', { target_user_id: user.id });
  } catch {
    // rpc 不存在时静默（不影响主流程）
  }
}
