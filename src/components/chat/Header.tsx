"use client";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex justify-between items-center">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Travel Assistant</h2>
        <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          AI Guide
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
          <span className="material-symbols-outlined text-xl" data-icon="share">share</span>
        </button>
        <button className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
          <span className="material-symbols-outlined text-xl" data-icon="notifications">notifications</span>
        </button>
      </div>
    </header>
  );
}
