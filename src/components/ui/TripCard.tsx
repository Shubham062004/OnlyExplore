"use client";

import React, { useState } from "react";
import {
  CalendarDays, CircleDollarSign, Share2, Download, MoreVertical,
  Edit3, Copy, Trash2, Archive, Calendar, Check, ExternalLink, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareTripModal } from "./ShareTripModal";

export interface TripData {
  _id: string;
  destination: string;
  title: string;
  status: "Draft" | "Planning" | "Upcoming" | "Completed" | "Cancelled";
  startDate?: string;
  endDate?: string;
  budget?: { total?: number; currency?: string };
  itinerary?: any[];
  hotels?: any[];
  shareKey?: string;
  updatedAt?: string;
}

interface TripCardProps {
  trip: TripData;
  onEdit?: (trip: TripData) => void;
  onDelete?: (trip: TripData) => void;
  onDuplicate?: (trip: TripData) => void;
}

export function TripCard({ trip, onEdit, onDelete, onDuplicate }: TripCardProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Upcoming": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "Completed": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "Planning": return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
      case "Cancelled": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-amber-500/10 text-amber-600 border-amber-500/20"; // Draft
    }
  };

  const handleExportPdf = () => {
    window.print();
  };

  const handleExportICS = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//OnlyExplore//Trip Calendar//EN
BEGIN:VEVENT
SUMMARY:Trip to ${trip.destination}
DESCRIPTION:OnlyExplore trip itinerary for ${trip.destination}
STATUS:${trip.status.toUpperCase()}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `trip-${trip.destination.toLowerCase()}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportGoogleCalendar = () => {
    const title = encodeURIComponent(`Trip to ${trip.destination}`);
    const details = encodeURIComponent(`Organized via OnlyExplore`);
    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
    window.open(googleCalUrl, "_blank");
  };

  return (
    <div className="group relative bg-card border border-border/60 rounded-[2.5rem] p-6 shadow-xl hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1 min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusBadge(trip.status)}`}>
              {trip.status}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium truncate">
              Updated {new Date(trip.updatedAt || Date.now()).toLocaleDateString()}
            </span>
          </div>
          <h4 className="text-2xl font-black font-headline uppercase tracking-tight text-foreground group-hover:text-primary transition-colors truncate">
            {trip.title || trip.destination}
          </h4>
        </div>

        {/* Action Dropdown Menu Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-9 h-9 rounded-full bg-muted/40 hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-11 z-30 w-48 bg-card border border-border/60 rounded-2xl shadow-2xl p-2 space-y-1 animate-in fade-in duration-200">
              <button
                onClick={() => { setShowMenu(false); onEdit?.(trip); }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-muted flex items-center gap-2"
              >
                <Edit3 className="w-3.5 h-3.5 text-primary" /> Edit Trip
              </button>
              <button
                onClick={() => { setShowMenu(false); onDuplicate?.(trip); }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-muted flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5 text-blue-500" /> Duplicate
              </button>
              <button
                onClick={handleExportGoogleCalendar}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-muted flex items-center gap-2"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-500" /> Google Calendar
              </button>
              <button
                onClick={handleExportICS}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-muted flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-purple-500" /> Export ICS
              </button>
              <div className="border-t border-border/40 my-1" />
              <button
                onClick={() => { setShowMenu(false); onDelete?.(trip); }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-500/10 text-red-500 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Trip Meta details */}
      <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 rounded-2xl border border-border/30 text-xs">
        <div className="space-y-0.5">
          <span className="text-[9px] font-black uppercase text-muted-foreground">Destination</span>
          <p className="font-bold flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-primary" /> {trip.destination}</p>
        </div>
        <div className="space-y-0.5">
          <span className="text-[9px] font-black uppercase text-muted-foreground">Budget</span>
          <p className="font-bold flex items-center gap-1">
            <CircleDollarSign className="w-3.5 h-3.5 text-emerald-500" />
            {trip.budget?.total ? `₹${trip.budget.total.toLocaleString()}` : "Flexible"}
          </p>
        </div>
      </div>

      {/* Main Buttons: Edit, Share, PDF Export */}
      <div className="flex items-center gap-2 pt-2">
        <Button
          size="sm"
          className="flex-1 rounded-2xl font-black uppercase tracking-widest text-[10px] h-10 shadow-md shadow-primary/20"
          onClick={() => onEdit?.(trip)}
        >
          <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Open Planner
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-10 px-4"
          onClick={() => setShowShareModal(true)}
        >
          <Share2 className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-10 px-4"
          onClick={handleExportPdf}
          title="Export PDF"
        >
          <Download className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Share Modal */}
      <ShareTripModal trip={trip} isOpen={showShareModal} onClose={() => setShowShareModal(false)} />
    </div>
  );
}
