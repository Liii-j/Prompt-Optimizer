import { useState } from 'react';
import { PRESET_MODELS } from '../utils/promptOptimizer';

export default function ApiSettingsModal({ isOpen, onClose, config, onSave }) {
  if (!isOpen) return null;

  return <ApiSettingsModalInner key={isOpen ? 'open' : 'closed'} onClose={onClose} config={config} onSave={onSave} />;
}

function ApiSettingsModalInner({ onClose, config, onSave }) {
  const [form, setForm] = useState({
    apiKey: config.apiKey || '',
    baseUrl: config.baseUrl || '',
    model: config.model || '',
    temperature: config.temperature ?? 0.7,
  });

  const handlePresetChange = (e) => {
    const preset = PRESET_MODELS.find((m) => m.model === e.target.value);
    if (preset) {
      setForm((prev) => ({ ...prev, model: preset.model, baseUrl: preset.baseUrl }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  const handleClear = () => {
    const empty = { apiKey: '', baseUrl: '', model: '', temperature: 0.7 };
    setForm(empty);
    onSave(empty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md mx-4 rounded-2xl p-[1px] bg-white/[0.08]">
        <div className="rounded-[calc(1.25rem-1px)] bg-[#0e0e10] shadow-2xl">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="font-display text-base font-semibold text-text-primary tracking-tight">API 设置</h2>
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
              <label className="block text-[11px] uppercase tracking-[0.12em] text-text-tertiary/60 font-medium mb-1.5">预设模型</label>
              <select
                value={form.model}
                onChange={handlePresetChange}
                className="w-full rounded-lg bg-white/[0.04] border border-border-hairline px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-violet-500/40 transition-colors appearance-none cursor-pointer"
              >
                <option value="">自定义</option>
                {PRESET_MODELS.map((m) => (
                  <option key={m.model} value={m.model} className="bg-[#0e0e10]">{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.12em] text-text-tertiary/60 font-medium mb-1.5">API Key</label>
              <input
                type="password"
                value={form.apiKey}
                onChange={(e) => setForm((prev) => ({ ...prev, apiKey: e.target.value }))}
                placeholder="sk-..."
                className="w-full rounded-lg bg-white/[0.04] border border-border-hairline px-3 py-2 text-sm text-text-primary placeholder-text-tertiary/40 focus:outline-none focus:border-violet-500/40 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.12em] text-text-tertiary/60 font-medium mb-1.5">Base URL</label>
              <input
                type="text"
                value={form.baseUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, baseUrl: e.target.value }))}
                placeholder="https://api.openai.com/v1"
                className="w-full rounded-lg bg-white/[0.04] border border-border-hairline px-3 py-2 text-sm text-text-primary placeholder-text-tertiary/40 focus:outline-none focus:border-violet-500/40 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.12em] text-text-tertiary/60 font-medium mb-1.5">模型名称</label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm((prev) => ({ ...prev, model: e.target.value }))}
                placeholder="gpt-4o"
                className="w-full rounded-lg bg-white/[0.04] border border-border-hairline px-3 py-2 text-sm text-text-primary placeholder-text-tertiary/40 focus:outline-none focus:border-violet-500/40 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.12em] text-text-tertiary/60 font-medium mb-1.5">
                Temperature: {form.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={form.temperature}
                onChange={(e) => setForm((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                className="w-full accent-violet-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-text-tertiary hover:text-red-400 transition-colors cursor-pointer"
              >
                清除配置
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-3.5 py-2 text-xs text-text-secondary hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 px-4 py-2 text-xs font-medium text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all cursor-pointer"
                >
                  保存
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
