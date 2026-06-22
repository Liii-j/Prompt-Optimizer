import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import InputArea from './components/InputArea';
import ApiSettingsModal from './components/ApiSettingsModal';
import { optimizePrompt } from './utils/promptOptimizer';
import { loadSessions, saveSessions } from './utils/storage';
import { loadConfig } from './components/ApiSettingsModal';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function generateTitle(content) {
  const trimmed = content.trim();
  // 取前 20 个字符作为标题
  return trimmed.length > 20 ? trimmed.slice(0, 20) + '...' : trimmed;
}

function App() {
  const [sessions, setSessions] = useState(() => loadSessions());
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [apiConfig, setApiConfig] = useState(() => loadConfig());
  const [showSettings, setShowSettings] = useState(false);

  // 获取当前活跃会话
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;
  const messages = activeSession?.messages || [];

  // 持久化
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  // Ctrl+K 新建会话
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        handleNewSession();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [sessions]);

  const handleNewSession = useCallback(() => {
    const newSession = {
      id: generateId(),
      title: '新会话',
      createdAt: Date.now(),
      messages: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setSidebarCollapsed(false);
  }, []);

  const handleSelectSession = useCallback((id) => {
    setActiveSessionId(id);
  }, []);

  const handleDeleteSession = useCallback((id) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (activeSessionId === id) {
        setActiveSessionId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  }, [activeSessionId]);

  const handleSend = useCallback(async (text) => {
    // 如果没有活跃会话，自动创建
    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      const newSession = {
        id: generateId(),
        title: generateTitle(text),
        createdAt: Date.now(),
        messages: [],
      };
      setSessions((prev) => [newSession, ...prev]);
      currentSessionId = newSession.id;
      setActiveSessionId(newSession.id);
    }

    const userMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== currentSessionId) return s;
        const newMessages = [...s.messages, userMessage];
        // 如果是第一条消息，更新标题
        const title = s.messages.length === 0 ? generateTitle(text) : s.title;
        return { ...s, messages: newMessages, title };
      })
    );
    setIsLoading(true);

    try {
      const result = await optimizePrompt(text, apiConfig);
      const assistantMessage = {
        id: generateId(),
        role: 'assistant',
        content: result.content,
        isFallback: result.isFallback || false,
        timestamp: Date.now(),
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, messages: [...s.messages, assistantMessage] }
            : s
        )
      );
    } catch {
      const errorMessage = {
        id: generateId(),
        role: 'assistant',
        content: '优化过程中出现错误，请重试。',
        timestamp: Date.now(),
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, messages: [...s.messages, errorMessage] }
            : s
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeSessionId]);

  const hasMessages = messages.length > 0;

  return (
    <div className="h-[100dvh] flex overflow-hidden relative bg-surface">
      {/* Ambient Glow Orbs */}
      <div className="glow-orb-purple" />
      <div className="glow-orb-emerald" />
      {/* Noise Texture */}
      <div className="noise-overlay" />

      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        {hasMessages ? (
          <>
            <ChatWindow messages={messages} isLoading={isLoading} isEmpty={false} />
            <InputArea onSend={handleSend} isLoading={isLoading} isEmpty={false} onOpenSettings={() => setShowSettings(true)} />
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
            <InputArea onSend={handleSend} isLoading={isLoading} isEmpty={true} onOpenSettings={() => setShowSettings(true)} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
