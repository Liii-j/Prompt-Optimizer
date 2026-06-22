import { useState } from 'react';

export default function InputArea({ onSend, isLoading, isEmpty }) {
  const [input, setInput] = useState('');

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
              <span className="text-[10px] text-text-tertiary/40 tracking-wide hidden sm:inline">
                Enter 发送 · Shift+Enter 换行
              </span>
            </div>
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
  );
}
