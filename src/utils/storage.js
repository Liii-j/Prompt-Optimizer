const STORAGE_KEY = 'prompt-optimizer-sessions';
const MAX_SESSIONS = 10;

export function loadSessions() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions) {
  try {
    // 限制最多 10 个会话，删除最旧的
    const trimmed = sessions.slice(0, MAX_SESSIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage 满了或不可用，静默失败
  }
}

export function clearAllSessions() {
  localStorage.removeItem(STORAGE_KEY);
}
