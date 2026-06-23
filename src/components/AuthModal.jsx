import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        setError('注册成功，请检查邮箱确认');
      } else {
        await signIn(email, password);
        onClose();
      }
    } catch (err) {
      setError(err.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm mx-4 rounded-2xl p-[1px] bg-white/[0.08]">
        <div className="rounded-[calc(1.25rem-1px)] bg-[#0e0e10] shadow-2xl">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="font-display text-base font-semibold text-text-primary tracking-tight">
              {isSignUp ? '创建账号' : '登录'}
            </h2>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.12em] text-text-tertiary/60 font-medium mb-1.5">邮箱</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-lg bg-white/[0.04] border border-border-hairline px-3 py-2 text-sm text-text-primary placeholder-text-tertiary/40 focus:outline-none focus:border-violet-500/40 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.12em] text-text-tertiary/60 font-medium mb-1.5">密码</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少6位"
                className="w-full rounded-lg bg-white/[0.04] border border-border-hairline px-3 py-2 text-sm text-text-primary placeholder-text-tertiary/40 focus:outline-none focus:border-violet-500/40 transition-colors"
              />
            </div>

            {error && (
              <p className={`text-xs ${error.includes('成功') ? 'text-emerald-400' : 'text-red-400'}`}>
                {error}
              </p>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? '处理中...' : isSignUp ? '注册' : '登录'}
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                className="w-full text-xs text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer py-1"
              >
                {isSignUp ? '已有账号？去登录' : '没有账号？去注册'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
