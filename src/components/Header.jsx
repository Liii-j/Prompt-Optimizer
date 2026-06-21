export default function Header({ onClear }) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
      <h1 className="text-lg font-semibold text-gray-800">
        Prompt Optimizer
      </h1>
      <button
        onClick={onClear}
        className="text-sm text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
      >
        清空对话
      </button>
    </header>
  );
}
