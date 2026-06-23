import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import InputArea from './components/InputArea';
import ApiSettingsModal from './components/ApiSettingsModal';
import AuthModal from './components/AuthModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { loadApiConfig, saveApiConfig, optimizePrompt, deepOptimize } from './utils/promptOptimizer';
import { loadSessions, upsertSession, deleteSession, migrateToUser } from './utils/storage';

function generateId() {
  return crypto.randomUUID();
}

function generateTitle(content) {
  const trimmed = content.trim();
  return trimmed.length > 20 ? trimmed.slice(0, 20) + '...' : trimmed;
}

// 读 localStorage 匿名配置（未登录时的 fallback）
function loadAnonConfig() {
  try {
    const raw = localStorage.getItem('prompt-optimizer-api-config');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function AppInner() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiConfig, setApiConfig] = useState(() => loadAnonConfig());
  const [showSettings, setShowSettings] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [mode, setMode] = useState('quick');
  const [migrated, setMigrated] = useState(false);
  const saveTimer = useRef(null);
  const sessionsRef = useRef(sessions);

  useEffect(() => {
    sessionsRef.current = sessions;
  });

  // 加载会话
  useEffect(() => {
    loadSessions(user).then((data) => {
      setSessions(data);
      if (data.length > 0) setActiveSessionId(data[0].id);
      setLoading(false);
    });
  }, [user]);

  // 用户登录后：加载 DB 配置 + 迁移数据
  useEffect(() => {
    if (!user || migrated) return;
    (async () => {
      const dbConfig = await loadApiConfig(user);
      if (dbConfig.apiKey) {
        setApiConfig(dbConfig);
      }
      await migrateToUser(user);
      setMigrated(true);
      // 迁移后重新加载会话
      const data = await loadSessions(user);
      setSessions(data);
      if (data.length > 0) setActiveSessionId(data[0].id);
    })();
  }, [user, migrated]);

  // 防抖保存
  const scheduleSave = useCallback((sessionsToSave) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      sessionsToSave.forEach((s) => upsertSession(s, user));
    }, 500);
  }, [user]);

  const handleNewSession = useCallback(() => {
    const newSession = {
      id: generateId(),
      title: '新会话',
      createdAt: Date.now(),
      messages: [],
    };
    setSessions((prev) => {
      const updated = [newSession, ...prev];
      scheduleSave(updated);
      return updated;
    });
    setActiveSessionId(newSession.id);
    setSidebarCollapsed(false);
  }, [scheduleSave]);

  // Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handleNewSession();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleNewSession]);

  const handleSelectSession = useCallback((id) => {
    setActiveSessionId(id);
  }, []);

  const handleDeleteSession = useCallback((id) => {
    deleteSession(id, user);
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (activeSessionId === id) {
        setActiveSessionId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  }, [activeSessionId, user]);

  const handleSend = useCallback(async (text) => {
    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const newSession = {
        id: generateId(),
        title: generateTitle(text),
        createdAt: Date.now(),
        messages: [],
      };
      setSessions((prev) => {
        const updated = [newSession, ...prev];
        scheduleSave(updated);
        return updated;
      });
      currentSessionId = newSession.id;
      setActiveSessionId(newSession.id);
    }

    const userMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setSessions((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== currentSessionId) return s;
        const newMessages = [...s.messages, userMessage];
        const title = s.messages.length === 0 ? generateTitle(text) : s.title;
        return { ...s, messages: newMessages, title };
      });
      scheduleSave(updated);
      return updated;
    });
    setIsLoading(true);

    try {
      let result;
      if (mode === 'deep') {
        const currentSession = sessionsRef.current.find((s) => s.id === currentSessionId);
        const existingMessages = currentSession?.messages || [];
        const apiMessages = existingMessages.map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        }));
        apiMessages.push({ role: 'user', content: text });
        result = await deepOptimize(apiMessages, apiConfig);
      } else {
        result = await optimizePrompt(text, apiConfig);
      }
      const assistantMessage = {
        id: generateId(),
        role: 'assistant',
        content: result.content,
        isFallback: result.isFallback || false,
        timestamp: Date.now(),
      };
      setSessions((prev) => {
        const updated = prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, messages: [...s.messages, assistantMessage] }
            : s
        );
        scheduleSave(updated);
        return updated;
      });
    } catch {
      const errorMessage = {
        id: generateId(),
        role: 'assistant',
        content: '优化过程中出现错误，请重试。',
        timestamp: Date.now(),
      };
      setSessions((prev) => {
        const updated = prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, messages: [...s.messages, errorMessage] }
            : s
        );
        scheduleSave(updated);
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeSessionId, scheduleSave, apiConfig, mode]);

  const handleSaveApiConfig = useCallback((config) => {
    setApiConfig(config);
    if (user) {
      saveApiConfig(user, config);
    } else {
      localStorage.setItem('prompt-optimizer-api-config', JSON.stringify(config));
    }
  }, [user]);

  const handleLogout = useCallback(async () => {
    await signOut();
    setSessions([]);
    setActiveSessionId(null);
    setApiConfig({});
    setMigrated(false);
  }, [signOut]);

  if (loading || authLoading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-surface">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-violet-400 loading-dot" />
          <div className="w-2 h-2 rounded-full bg-violet-400 loading-dot" />
          <div className="w-2 h-2 rounded-full bg-violet-400 loading-dot" />
        </div>
      </div>
    );
  }

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;
  const messages = activeSession?.messages || [];
  const hasMessages = messages.length > 0;

  return (
    <div className="h-[100dvh] flex overflow-hidden relative bg-surface">
      <div className="glow-orb-purple" />
      <div className="glow-orb-emerald" />
      <div className="noise-overlay" />

      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
        onLogin={() => setShowAuth(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        {hasMessages ? (
          <>
            <ChatWindow messages={messages} isLoading={isLoading} isEmpty={false} />
            <InputArea onSend={handleSend} isLoading={isLoading} isEmpty={false} onOpenSettings={() => setShowSettings(true)} mode={mode} onModeChange={setMode} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="mb-6">
              <p className="font-display text-xl md:text-2xl font-semibold text-text-primary tracking-tight mb-2 text-center">
                将想法转化为精密 Prompt
              </p>
              <p className="text-sm text-text-tertiary max-w-xs text-center leading-relaxed">
                输入你的原始想法，我会将其优化为结构清晰、逻辑严密的 Prompt
              </p>
            </div>
            <InputArea onSend={handleSend} isLoading={isLoading} isEmpty={true} onOpenSettings={() => setShowSettings(true)} mode={mode} onModeChange={setMode} />
          </div>
        )}
      </main>

      <ApiSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        config={apiConfig}
        onSave={handleSaveApiConfig}
      />

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
