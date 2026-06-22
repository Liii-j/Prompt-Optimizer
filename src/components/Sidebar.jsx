import { useState } from 'react';

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  collapsed,
  onToggle,
}) {
  return (
    <div className="relative flex h-full shrink-0">
      <aside
        className={`h-full transition-all duration-500 ease-out-expo overflow-hidden ${collapsed ? 'w-0' : 'w-[260px]'
          }`}
      >
        <div className="w-[260px] h-full bg-[#0d0d10] border-r border-border-hairline flex flex-col">
          {/* 顶部：收起导航按钮 */}
          <div className="flex items-center justify-end px-3 pt-3 pb-1">
            <button
              onClick={onToggle}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-text-tertiary hover:text-text-primary hover:bg-white/[0.06] transition-all duration-300 ease-out-expo cursor-pointer group"
              title="收起导航"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-[#1a1a1e] px-2.5 py-1 text-xs text-text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none border border-border-hairline">
                收起导航
              </span>
            </button>
          </div>

          {/* 新建会话按钮 */}
          <div className="px-3 pb-2">
            <button
              onClick={onNewSession}
              className="w-full flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm text-text-secondary hover:bg-white/[0.06] hover:text-text-primary transition-all duration-300 ease-out-expo cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>新建会话</span>
              <span className="ml-auto text-[10px] text-text-tertiary/50 font-mono">Ctrl K</span>
            </button>
          </div>

          {/* 历史会话列表 */}
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {sessions.length > 0 && (
              <div className="mb-2 px-3">
                <span className="text-[10px] uppercase tracking-[0.15em] text-text-tertiary/40 font-medium">历史会话</span>
              </div>
            )}
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={isActive}
                  onSelect={() => onSelectSession(session.id)}
                  onDelete={() => onDeleteSession(session.id)}
                />
              );
            })}
          </div>

        </div>
      </aside>

      {/* 展开按钮 - 收起时显示在左边缘 */}
      {collapsed && (
        <button
          onClick={onToggle}
          className="absolute top-3 left-2 z-30 flex items-center rounded-lg px-1.5 py-1.5 text-text-tertiary hover:text-text-primary hover:bg-white/[0.06] transition-all duration-300 ease-out-expo cursor-pointer group"
          title="展开导航"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-[#1a1a1e] px-2.5 py-1 text-xs text-text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none border border-border-hairline">
            展开导航
          </span>
        </button>
      )}
    </div>
  );
}

function SessionItem({ session, isActive, onSelect, onDelete }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`group flex items-center rounded-lg px-3 py-2 mb-0.5 cursor-pointer transition-all duration-300 ease-out-expo ${isActive
        ? 'bg-white/[0.06]'
        : 'hover:bg-white/[0.04]'
        }`}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 mr-2.5 ${isActive ? 'text-text-primary' : 'text-text-tertiary'}`}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      <span className={`text-[13px] truncate flex-1 ${isActive ? 'text-text-primary' : 'text-text-secondary'}`}>
        {session.title}
      </span>
      {hovered && !isActive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="shrink-0 ml-1 w-5 h-5 rounded flex items-center justify-center text-text-tertiary hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
