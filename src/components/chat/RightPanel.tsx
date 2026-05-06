"use client";

import { DetailItem } from "./types";

interface RightPanelProps {
  item: DetailItem | null;
  onClose: () => void;
}

export default function RightPanel({ item, onClose }: RightPanelProps) {
  if (!item) return null;

  return (
    <div className="w-[380px] h-screen border-l border-slate-100 bg-white flex flex-col shrink-0 animate-in slide-in-from-right-full duration-300 shadow-2xl lg:shadow-none fixed right-0 top-0 lg:static z-50">
      <div className="relative h-64 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md flex items-center justify-center text-white transition-colors"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-2 mb-2">
            {item.tag && (
              <span className="px-2 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded">
                {item.tag}
              </span>
            )}
            {item.rating && (
              <div className="flex items-center gap-1 text-yellow-400">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span className="text-xs font-bold">{item.rating}</span>
              </div>
            )}
          </div>
          <h3 className="text-2xl font-bold text-white mb-1 leading-tight">{item.name}</h3>
          {item.location && (
            <p className="text-white/80 text-xs font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              {item.location}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar custom-scrollbar">
        <section>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">About</h4>
          <p className="text-slate-600 leading-relaxed text-sm">
            {item.description || "Experience luxury and comfort at its finest."}
          </p>
        </section>

        {(item.bestTime || item.weather) && (
          <div className="grid grid-cols-2 gap-3">
            {item.bestTime && (
              <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-100/50">
                <span className="material-symbols-outlined text-primary mb-1 text-lg">calendar_today</span>
                <p className="text-[9px] uppercase font-bold text-slate-400">Best Time</p>
                <p className="text-sm font-bold text-slate-900">{item.bestTime}</p>
              </div>
            )}
            {item.weather && (
              <div className="p-3 rounded-2xl bg-orange-50/50 border border-orange-100/50">
                <span className="material-symbols-outlined text-orange-500 mb-1 text-lg">sunny</span>
                <p className="text-[9px] uppercase font-bold text-slate-400">Weather</p>
                <p className="text-sm font-bold text-slate-900">{item.weather}</p>
              </div>
            )}
          </div>
        )}

        {item.activities && item.activities.length > 0 && (
          <section>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Highlights</h4>
            <div className="flex flex-wrap gap-2">
              {item.activities.map((act, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-100">
                  {act}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="p-6 border-t border-slate-100 bg-white">
        <button className="w-full py-3.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-95 transition-opacity text-sm flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Add to Itinerary
        </button>
      </div>
    </div>
  );
}
