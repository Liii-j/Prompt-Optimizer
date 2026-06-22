import { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ messages, isLoading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 relative z-10">
      <div className="max-w-3xl mx-auto pt-10 pb-10">
        {messages.map((msg, i) => (
          <MessageBubble key={msg.id} message={msg} index={i} />
        ))}

        {isLoading && (
          <div className="flex justify-start mb-4 animate-fade-up">
            <div className="rounded-[1.5rem] p-[1px] bg-white/[0.06]">
              <div className="rounded-[calc(1.5rem-1px)] bg-surface-card px-5 py-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-violet-400 loading-dot" />
                  <div className="w-2 h-2 rounded-full bg-violet-400 loading-dot" />
                  <div className="w-2 h-2 rounded-full bg-violet-400 loading-dot" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
