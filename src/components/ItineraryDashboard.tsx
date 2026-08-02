"use client";

import { useState } from "react";
import {
  Thermometer, CloudRain, Wind, Droplets, CheckSquare, ShieldQuestion,
  Tent, CircleDollarSign, CalendarDays, Camera, MapPin, Download,
  Share2, Plane, Bed, Utensils, Info, Navigation, Activity, Plus,
  Trash2, ArrowUp, ArrowDown, Sparkles, RefreshCw, Save, Check
} from "lucide-react";
import dynamic from "next/dynamic";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatCurrencyDisplay } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const TravelMap = dynamic(() => import("@/components/TravelMap").then(mod => mod.TravelMap), {
  ssr: false,
  loading: () => (
    <div className="h-[380px] w-full rounded-2xl bg-muted/30 border border-border animate-pulse flex items-center justify-center text-xs text-muted-foreground">
      Loading interactive map pins...
    </div>
  )
});

interface ActivityItem {
  id?: string;
  time?: string;
  name: string;
  description?: string;
}

interface DayPlan {
  day: number;
  theme?: string;
  title?: string;
  activities: ActivityItem[];
  vibe?: string;
  cost?: string;
}

export function ItineraryDashboard({
  itinerary: initialItinerary,
  onRequestEdit,
}: {
  itinerary: any;
  onRequestEdit?: (req: string) => void;
}) {
  const [itinerary, setItinerary] = useState<any>(initialItinerary);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [newActivityText, setNewActivityText] = useState<Record<number, string>>({});
  const { toast } = useToast();

  const toggleCheck = (item: string) => {
    setCheckedItems((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const handleDownloadPdf = async () => {
    try {
      const res = await fetch("/api/export-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itinerary }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `OnlyExplore_${itinerary.destination || "Trip"}_Itinerary.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        window.print();
      }
    } catch (err) {
      window.print();
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Trip to ${itinerary.destination}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link Copied", description: "Shareable trip URL copied to clipboard!" });
    }
  };

  const handlePresetRequest = (presetName: string) => {
    const prompt = `Adapt this itinerary for a ${presetName} style trip to ${itinerary.destination}.`;
    onRequestEdit?.(prompt);
    toast({
      title: `${presetName} Style Triggered`,
      description: `Updating AI itinerary with ${presetName.toLowerCase()} recommendations...`,
    });
  };

  const moveActivity = (dayIndex: number, actIndex: number, direction: "up" | "down") => {
    const updatedDays = [...(itinerary.days || itinerary.itinerary || [])];
    const day = updatedDays[dayIndex];
    if (!day || !day.activities) return;

    const targetIndex = direction === "up" ? actIndex - 1 : actIndex + 1;
    if (targetIndex < 0 || targetIndex >= day.activities.length) return;

    const temp = day.activities[actIndex];
    day.activities[actIndex] = day.activities[targetIndex];
    day.activities[targetIndex] = temp;

    setItinerary({ ...itinerary, days: updatedDays, itinerary: updatedDays });
  };

  const deleteActivity = (dayIndex: number, actIndex: number) => {
    const updatedDays = [...(itinerary.days || itinerary.itinerary || [])];
    const day = updatedDays[dayIndex];
    if (!day || !day.activities) return;

    day.activities.splice(actIndex, 1);
    setItinerary({ ...itinerary, days: updatedDays, itinerary: updatedDays });
    toast({ title: "Activity Removed", description: "Updated day schedule." });
  };

  const addActivity = (dayIndex: number) => {
    const text = newActivityText[dayIndex]?.trim();
    if (!text) return;

    const updatedDays = [...(itinerary.days || itinerary.itinerary || [])];
    const day = updatedDays[dayIndex];
    if (!day) return;

    if (!day.activities) day.activities = [];
    day.activities.push({
      time: "Flex",
      name: text,
      description: "Custom activity added by user",
    });

    setItinerary({ ...itinerary, days: updatedDays, itinerary: updatedDays });
    setNewActivityText((prev) => ({ ...prev, [dayIndex]: "" }));
    toast({ title: "Activity Added", description: `Added "${text}" to Day ${day.day || dayIndex + 1}.` });
  };

  const handleSaveItinerary = async () => {
    setIsSaving(true);
    try {
      await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: itinerary.destination,
          title: `Trip to ${itinerary.destination}`,
          status: "Planning",
          itinerary: itinerary.days || itinerary.itinerary,
        }),
      });
      setSavedSuccess(true);
      toast({ title: "Trip Saved!", description: "Access your updated itinerary anytime from My Trips." });
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      toast({ variant: "destructive", title: "Save Failed", description: "Could not persist itinerary." });
    } finally {
      setIsSaving(false);
    }
  };

  const [rainMode, setRainMode] = useState(false);
  const daysList: DayPlan[] = itinerary.days || itinerary.itinerary || [];

  const toggleRainMode = () => {
    const nextState = !rainMode;
    setRainMode(nextState);
    if (nextState) {
      toast({
        title: "Rain Backup Mode Activated",
        description: "Swapping outdoor activities for indoor museums, cafes, and covered market alternatives.",
      });
    } else {
      toast({
        title: "Standard Outdoor Itinerary",
        description: "Restored full outdoor sightseeing and adventure schedule.",
      });
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 bg-card p-4 sm:p-6 rounded-[2.5rem] border border-border/60 shadow-2xl">
      
      {/* Hero Header Section */}
      <div className="relative w-full h-64 md:h-80 rounded-[2rem] overflow-hidden shadow-lg border border-border/50">
        <img
          src={itinerary.heroImage || itinerary.images?.hero || `https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&q=80&w=1200`}
          alt={itinerary.destination}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 text-white space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider text-white">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Interactive AI Travel Planner
          </div>
          <h1 className="text-3xl md:text-5xl font-headline font-black uppercase tracking-tight drop-shadow-md">
            {itinerary.destination}
          </h1>
          <div className="flex flex-wrap gap-3 text-xs md:text-sm font-bold opacity-90">
            <span className="flex items-center gap-1"><CalendarDays className="w-4 h-4 text-primary" /> {itinerary.duration || daysList.length || 3} Days</span>
            {itinerary.budget && <span className="flex items-center gap-1"><CircleDollarSign className="w-4 h-4 text-emerald-400" /> {formatCurrencyDisplay(itinerary.budget)} Estimated Budget</span>}
          </div>
        </div>
      </div>

      {/* Preset Action Buttons & Top Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-muted/30 rounded-2xl border border-border/40">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-1 shrink-0">
            Style Presets:
          </span>
          {["Luxury", "Budget", "Family", "Adventure", "Relaxed"].map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetRequest(preset)}
              className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-background border border-border/50 hover:border-primary/50 hover:text-primary transition-all shrink-0"
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant={rainMode ? "default" : "outline"}
            onClick={toggleRainMode}
            className={`rounded-xl text-[10px] font-black uppercase transition-all ${
              rainMode ? "bg-sky-600 text-white shadow-lg shadow-sky-500/20" : "text-sky-600 border-sky-300 hover:bg-sky-50"
            }`}
          >
            <CloudRain className="w-3.5 h-3.5 mr-1" /> {rainMode ? "Rain Mode Active" : "Rain Backup Plan"}
          </Button>
          <Button size="sm" variant="outline" onClick={handleSaveItinerary} disabled={isSaving} className="rounded-xl text-[10px] font-black uppercase">
            {savedSuccess ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> : <Save className="w-3.5 h-3.5 mr-1" />}
            {savedSuccess ? "Saved" : "Save Itinerary"}
          </Button>
          <Button size="sm" variant="outline" onClick={handleShare} className="rounded-xl text-[10px] font-black uppercase">
            <Share2 className="w-3.5 h-3.5 mr-1" /> Share
          </Button>
          <Button size="sm" variant="default" onClick={handleDownloadPdf} className="rounded-xl text-[10px] font-black uppercase">
            <Download className="w-3.5 h-3.5 mr-1" /> PDF Export
          </Button>
        </div>
      </div>

      {/* Rain Advisory Banner */}
      {rainMode && (
        <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0">
              <CloudRain className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-sky-950 dark:text-sky-200 uppercase">Rain Weather Backup Active</h5>
              <p className="text-[11px] text-sky-700 dark:text-sky-300">
                AI has adjusted outdoor sightseeing to indoor artisanal cafes, covered heritage bazaars, and museums.
              </p>
            </div>
          </div>
          <button
            onClick={() => setRainMode(false)}
            className="text-[10px] font-black uppercase text-sky-600 hover:underline shrink-0"
          >
            Reset
          </button>
        </div>
      )}

      {/* Collapsible Sections Accordion */}
      <Accordion type="multiple" defaultValue={["overview", "day-0", "day-1", "day-2", "budget", "tips"]} className="w-full space-y-4">
        
        {/* Overview Section */}
        <AccordionItem value="overview" className="border border-border/50 rounded-2xl bg-card overflow-hidden px-4">
          <AccordionTrigger className="hover:no-underline font-headline font-black uppercase text-base tracking-tight">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" /> Trip Overview & Vibe
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 text-xs text-muted-foreground font-medium pt-2">
            <p className="leading-relaxed text-foreground">
              {itinerary.summary || itinerary.overview || `An immersive ${itinerary.duration || 3}-day journey exploring the scenic highlights, local dining, and culture of ${itinerary.destination}.`}
            </p>
            {itinerary.tripOverview && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/30 p-4 rounded-xl border border-border/30 text-foreground">
                <div>
                  <span className="text-[9px] font-black text-muted-foreground uppercase block">Best Season</span>
                  <span className="font-bold">{itinerary.tripOverview.bestTime || "Oct - Mar"}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-muted-foreground uppercase block">Currency</span>
                  <span className="font-bold">{itinerary.tripOverview.currency || "INR (₹)"}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-muted-foreground uppercase block">Language</span>
                  <span className="font-bold">{itinerary.tripOverview.language || "Hindi, English"}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black text-muted-foreground uppercase block">Ideal Trip Length</span>
                  <span className="font-bold">{itinerary.duration || 3} Days</span>
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Day-Wise Itinerary Accordion Items */}
        {daysList.map((dayObj, dayIdx) => (
          <AccordionItem key={dayIdx} value={`day-${dayIdx}`} className="border border-border/50 rounded-2xl bg-card overflow-hidden px-4">
            <AccordionTrigger className="hover:no-underline font-headline font-black uppercase text-base tracking-tight">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" /> Day {dayObj.day || dayIdx + 1}: {dayObj.theme || dayObj.title || "Sightseeing & Exploration"}
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="space-y-3">
                {dayObj.activities?.map((act, actIdx) => (
                  <div key={actIdx} className="p-3.5 bg-muted/40 rounded-xl border border-border/40 flex items-center justify-between gap-3 group">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {act.time && <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-black">{act.time}</span>}
                        <h5 className="font-bold text-xs text-foreground truncate">{act.name}</h5>
                      </div>
                      {act.description && <p className="text-[11px] text-muted-foreground line-clamp-1">{act.description}</p>}
                    </div>

                    {/* Timeline Controls: Move Up, Move Down, Delete */}
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => moveActivity(dayIdx, actIdx, "up")}
                        disabled={actIdx === 0}
                        className="w-7 h-7 rounded-lg bg-background border border-border/40 hover:bg-muted flex items-center justify-center text-muted-foreground disabled:opacity-30"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveActivity(dayIdx, actIdx, "down")}
                        disabled={actIdx === dayObj.activities.length - 1}
                        className="w-7 h-7 rounded-lg bg-background border border-border/40 hover:bg-muted flex items-center justify-center text-muted-foreground disabled:opacity-30"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteActivity(dayIdx, actIdx)}
                        className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center"
                        title="Delete Activity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Activity Bar */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  placeholder={`Add new activity to Day ${dayObj.day || dayIdx + 1}...`}
                  value={newActivityText[dayIdx] || ""}
                  onChange={(e) => setNewActivityText({ ...newActivityText, [dayIdx]: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") addActivity(dayIdx); }}
                  className="flex-1 bg-muted/30 border border-border/40 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-primary"
                />
                <Button size="sm" onClick={() => addActivity(dayIdx)} className="rounded-xl text-[10px] font-black uppercase px-3 h-8">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}

        {/* Budget Breakdown Accordion */}
        <AccordionItem value="budget" className="border border-border/50 rounded-2xl bg-card overflow-hidden px-4">
          <AccordionTrigger className="hover:no-underline font-headline font-black uppercase text-base tracking-tight">
            <div className="flex items-center gap-2">
              <CircleDollarSign className="w-5 h-5 text-emerald-500" /> Budget Breakdown
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-muted/40 rounded-xl border border-border/30">
                <span className="text-[9px] font-black text-muted-foreground uppercase">Hotels / Stay</span>
                <p className="font-bold text-sm text-foreground">₹9,000</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl border border-border/30">
                <span className="text-[9px] font-black text-muted-foreground uppercase">Food & Dining</span>
                <p className="font-bold text-sm text-foreground">₹4,500</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl border border-border/30">
                <span className="text-[9px] font-black text-muted-foreground uppercase">Activities</span>
                <p className="font-bold text-sm text-foreground">₹3,500</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl border border-border/30">
                <span className="text-[9px] font-black text-muted-foreground uppercase">Local Transit</span>
                <p className="font-bold text-sm text-foreground">₹2,500</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Tips & Packing Accordion */}
        <AccordionItem value="tips" className="border border-border/50 rounded-2xl bg-card overflow-hidden px-4">
          <AccordionTrigger className="hover:no-underline font-headline font-black uppercase text-base tracking-tight">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-500" /> Packing & Travel Tips
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <div className="space-y-2">
              {["Valid Photo ID / Passport & E-Tickets", "Weather appropriate clothing & comfortable walking shoes", "Universal travel adapter & power bank", "Personal medicines & essential first aid kit"].map((item, i) => (
                <div key={i} onClick={() => toggleCheck(item)} className="flex items-center gap-2 p-2 bg-muted/30 rounded-xl border border-border/30 cursor-pointer">
                  <input type="checkbox" checked={!!checkedItems[item]} onChange={() => {}} className="rounded text-primary focus:ring-primary" />
                  <span className={`text-xs font-medium ${checkedItems[item] ? "line-through text-muted-foreground" : "text-foreground"}`}>{item}</span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>

      {/* Map Explorer Integration */}
      <div className="pt-4 border-t border-border/50">
        <TravelMap destination={itinerary.destination} />
      </div>
    </div>
  );
}
