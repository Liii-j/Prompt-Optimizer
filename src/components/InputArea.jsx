import { useState, useRef, useEffect } from 'react';

export default function InputArea({ onSend, isLoading, isEmpty, onOpenSettings, mode = 'quick', onModeChange }) {
  const [input, setInput] = useState('');
  const [showModeMenu, setShowModeMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowModeMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const modes = [
    { key: 'quick', label: '快速模式', desc: '输入即生成' },
    { key: 'deep', label: '深度模式', desc: '多轮追问后生成' },
  ];

  const currentMode = modes.find((m) => m.key === mode) || modes[0];

  return (
    <div className={`shrink-0 relative z-10 ${isEmpty ? 'w-full max-w-2xl mx-auto' : 'w-full max-w-3xl mx-auto px-4 pb-5 pt-2'}`}>
      <div className="rounded-[1.25rem] p-[1px] bg-white/[0.06] shadow-[0_4px_40px_rgba(139,92,246,0.06)]">
        <div className="rounded-[calc(1.25rem-1px)] bg-[#0e0e10]/95 backdrop-blur-xl px-4 py-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isEmpty ? '输入你的想法...' : '继续输入...'}
            rows={isEmpty ? 3 : 2}
            className="w-full resize-none bg-transparent text-sm text-text-primary placeholder-text-tertiary focus:outline-none leading-relaxed"
            disabled={isLoading}
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-hairline">
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] text-text-tertiary hover:text-text-primary hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="API 设置"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span>设置</span>
              </button>
              <span className="text-[10px] text-text-tertiary/40 tracking-wide hidden sm:inline">
                Enter 发送 · Shift+Enter 换行
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* 模式选择器 */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowModeMenu(!showModeMenu)}
                  className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-text-tertiary hover:text-text-primary hover:bg-white/[0.06] transition-colors cursor-pointer"
                  title="选择模式"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  <span>{currentMode.label}</span>
                </button>
                {showModeMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-44 rounded-xl bg-[#1a1a1e] border border-white/[0.08] shadow-xl overflow-hidden">
                    {modes.map((m) => (
                      <button
                        key={m.key}
                        onClick={() => { onModeChange?.(m.key); setShowModeMenu(false); }}
                        className={`w-full text-left px-3 py-2.5 text-xs transition-colors ${
                          m.key === mode
                            ? 'bg-violet-500/10 text-violet-400'
                            : 'text-text-tertiary hover:bg-white/[0.06] hover:text-text-primary'
                        }`}
                      >
                        <div className="font-medium">{m.label}</div>
                        <div className="text-[10px] opacity-60 mt-0.5">{m.desc}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* 发送/优化按钮 */}
              <button
                onClick={handleSubmit}
                disabled={isLoading || !input.trim()}
                className="group rounded-full bg-gradient-to-br from-violet-500 to-violet-600 px-4 py-2 text-xs font-medium text-white transition-all duration-500 ease-out-expo hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] active:scale-[0.97] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none cursor-pointer flex items-center gap-1.5"
              >
                <span>{isLoading ? '优化中' : '优化'}</span>
                <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-[1px]">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
