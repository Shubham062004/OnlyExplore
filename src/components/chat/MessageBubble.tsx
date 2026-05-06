"use client";

import { Message, DetailItem } from "./types";
import PlaceCard from "./PlaceCard";

interface MessageBubbleProps {
  message: Message;
  onItemClick: (item: DetailItem) => void;
}

export default function MessageBubble({ message, onItemClick }: MessageBubbleProps) {
  if (message.role === "user") {
    return (
      <div className="flex flex-col items-end gap-2">
        <div className="bg-primary text-white px-6 py-3.5 rounded-3xl rounded-tr-lg shadow-sm max-w-[80%]">
          <p className="text-[15px] leading-relaxed">{message.text}</p>
        </div>
        <span className="text-[10px] text-slate-400 font-medium px-2 uppercase tracking-wide">Sent</span>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex flex-col gap-4">
      {message.text && (
        <div className="flex gap-4 items-start">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
            <span className="material-symbols-outlined text-primary text-lg" data-icon="smart_toy">smart_toy</span>
          </div>
          <div className="bg-white border border-slate-100 text-slate-800 px-6 py-3.5 rounded-3xl rounded-tl-lg shadow-sm max-w-[85%]">
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.text}</p>
          </div>
        </div>
      )}

      {message.places && message.places.length > 0 && (
        <div className="ml-[52px] grid grid-cols-1 gap-3">
          {message.places.map((place, idx) => (
            <PlaceCard key={idx} place={place} onClick={onItemClick} />
          ))}
        </div>
      )}

      {message.hotel && (
        <div className="ml-[52px]">
          <button 
            className="group text-left flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-2xl hover:border-primary/30 hover:shadow-md transition-all w-full"
            onClick={() => onItemClick(message.hotel!)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="w-24 h-24 rounded-xl object-cover shrink-0" src={message.hotel.image} alt={message.hotel.name} />
            <div className="flex-1 min-w-0 pr-4">
              <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{message.hotel.name}</h4>
              <p className="text-xs text-slate-500 line-clamp-2 mt-1">{message.hotel.description}</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-[10px] font-bold text-green-600 uppercase bg-green-50 px-2 py-0.5 rounded">Luxury Stay</span>
                <span className="text-xs font-bold text-slate-900">{message.hotel.price}</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors pr-2" data-icon="chevron_right">chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
}
