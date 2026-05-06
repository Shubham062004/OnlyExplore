"use client";

import { DetailItem } from "./types";

interface PlaceCardProps {
  place: DetailItem;
  onClick: (item: DetailItem) => void;
}

export default function PlaceCard({ place, onClick }: PlaceCardProps) {
  return (
    <button 
      className="group text-left flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-2xl hover:border-primary/30 hover:shadow-md transition-all"
      onClick={() => onClick(place)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="w-24 h-24 rounded-xl object-cover shrink-0" src={place.image} alt={place.name} />
      <div className="flex-1 min-w-0 pr-4">
        <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{place.name}</h4>
        <p className="text-xs text-slate-500 line-clamp-2 mt-1">{place.description}</p>
        <div className="mt-2 flex items-center gap-3">
          {place.tag && (
            <span className="text-[10px] font-bold text-primary uppercase bg-blue-50 px-2 py-0.5 rounded">
              {place.tag}
            </span>
          )}
          {place.rating && (
            <span className="flex items-center gap-0.5 text-xs font-semibold text-slate-600">
              <span className="material-symbols-outlined text-[14px] text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> 
              {place.rating}
            </span>
          )}
        </div>
      </div>
      <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors pr-2" data-icon="chevron_right">chevron_right</span>
    </button>
  );
}
