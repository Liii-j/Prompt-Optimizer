import ReactMarkdown from 'react-markdown';
import CopyButton from './CopyButton';

export default function MessageBubble({ message, index }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-5 animate-fade-up`}
      style={{ animationDelay: `${Math.min(index * 50, 200)}ms` }}
    >
      <div className={`max-w-[85%] md:max-w-[75%] ${isUser ? '' : 'w-full'}`}>
        {isUser ? (
          /* User Message — Double-Bezel */
          <div className="rounded-[1.5rem] p-[1px] bg-gradient-to-br from-violet-500/40 to-violet-600/20">
            <div className="rounded-[calc(1.5rem-1px)] bg-gradient-to-br from-violet-600/90 to-violet-700/90 px-5 py-3.5">
              <p className="text-sm leading-relaxed text-white/95 whitespace-pre-wrap">
                {message.content}
              </p>
            </div>
          </div>
        ) : (
          /* AI Message — Double-Bezel with inner highlight */
          <div className="rounded-[1.5rem] p-[1px] bg-white/[0.06] shadow-[0_1px_24px_rgba(139,92,246,0.04)]">
            <div
              className="rounded-[calc(1.5rem-1px)] bg-surface-card px-5 py-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]"
            >
              {message.isFallback && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-amber-400">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span className="text-[11px] text-amber-300/90 leading-snug">
                    未连接 API，当前结果由本地规则生成。配置 API 后可获得更精准的优化效果。
                  </span>
                </div>
              )}
              <div className="prose-dark text-sm text-text-secondary">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
              <div className="mt-3 flex justify-end">
                <CopyButton text={message.content} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
