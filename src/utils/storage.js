const STORAGE_KEY = 'prompt-optimizer-history';

export function loadHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveHistory(messages) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // localStorage 满了或不可用，静默失败
  }
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}
