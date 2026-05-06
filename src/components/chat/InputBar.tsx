"use client";

import { useState } from "react";

interface InputBarProps {
  onSend: (message: string) => void;
}

export default function InputBar({ onSend }: InputBarProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  return (
    <footer className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-background via-background to-transparent pb-8 px-4 md:px-8 pt-12 pointer-events-none">
      <form 
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto flex items-center gap-3 bg-white rounded-2xl p-2.5 shadow-xl shadow-slate-200/50 border border-slate-100 pointer-events-auto ring-4 ring-blue-50/10 focus-within:ring-primary/10 transition-all"
      >
        <button type="button" className="p-2.5 text-slate-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined" data-icon="attach_file">attach_file</span>
        </button>
        <input 
          className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] px-2 placeholder:text-slate-400 outline-none" 
          placeholder="Ask about activities, stays, or hidden gems..." 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button 
          type="submit"
          disabled={!input.trim()}
          className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          <span className="material-symbols-outlined text-xl" data-icon="send">send</span>
        </button>
      </form>
    </footer>
  );
}
