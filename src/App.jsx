import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import InputArea from './components/InputArea';
import { optimizePrompt } from './utils/promptOptimizer';
import { loadHistory, saveHistory, clearHistory } from './utils/storage';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function App() {
  const [messages, setMessages] = useState(() => loadHistory());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  const handleSend = useCallback(async (text) => {
    const userMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const optimized = await optimizePrompt(text);
      const assistantMessage = {
        id: generateId(),
        role: 'assistant',
        content: optimized,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage = {
        id: generateId(),
        role: 'assistant',
        content: '优化过程中出现错误，请重试。',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleClear = useCallback(() => {
    setMessages([]);
    clearHistory();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header onClear={handleClear} />
      <ChatWindow messages={messages} />
      <InputArea onSend={handleSend} isLoading={isLoading} />
    </div>
  );
}

export default App;
