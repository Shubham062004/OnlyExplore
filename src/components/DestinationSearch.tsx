"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, History, Sparkles, TrendingUp, X, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

const POPULAR_SUGGESTIONS = [
  { name: "Manali", desc: "Alpine Valley & Snow Peaks", tag: "Trending" },
  { name: "Tokyo", desc: "Neon Metropolis & Culture", tag: "Popular" },
  { name: "Goa", desc: "Beaches & Coastal Nightlife", tag: "Beach" },
  { name: "Paris", desc: "Art, Romance & Architecture", tag: "Europe" },
  { name: "Jaipur", desc: "Royal Palaces & Bazaars", tag: "Heritage" },
  { name: "Bali", desc: "Tropical Retreat & Sanctuaries", tag: "Island" },
  { name: "Ladakh", desc: "High Altitude Monasteries", tag: "Adventure" },
];

export function DestinationSearch() {
  const [destination, setDestination] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("onlyexplore_recent_searches");
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch (err) {
      console.warn("⚠️ localStorage read error:", err);
    }
  }, []);

  const handleVoiceSearch = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice search is not supported by your browser. Please try typing your destination.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setDestination(transcript);
          handleSearch(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  const handleSearch = (targetDest?: string) => {
    const term = (targetDest || destination).trim();
    if (!term) return;

    try {
      const updated = [term, ...recentSearches.filter((s) => s.toLowerCase() !== term.toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem("onlyexplore_recent_searches", JSON.stringify(updated));
    } catch (err) {
      console.warn("⚠️ localStorage write error:", err);
    }

    router.push(`/destination/${encodeURIComponent(term)}`);
  };

  const removeRecentSearch = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== item);
    setRecentSearches(updated);
    try {
      localStorage.setItem("onlyexplore_recent_searches", JSON.stringify(updated));
    } catch (err) {}
  };

  const filteredSuggestions = POPULAR_SUGGESTIONS.filter((s) =>
    s.name.toLowerCase().includes(destination.toLowerCase().trim())
  );

  return (
    <div ref={searchRef} className="w-full max-w-3xl mx-auto px-4 relative z-30">
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20">
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen AI Travel Engine
        </div>
        <h1 className="text-4xl md:text-6xl font-headline font-black uppercase text-foreground tracking-tight leading-none">
          Where to <span className="text-primary">Next?</span>
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-md mx-auto">
          Instant travel guides, dynamic weather, real stays, and custom AI itineraries.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="flex items-center gap-2 p-2 bg-card border border-border/60 rounded-full shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-primary/40"
      >
        <div className="flex-1 flex items-center pl-4 bg-transparent">
          <MapPin className="w-5 h-5 text-primary mr-2 shrink-0" />
          <Input
            value={destination}
            onFocus={() => setIsFocused(true)}
            onChange={(e) => setDestination(e.target.value)}
            placeholder={isListening ? "Listening... Speak your destination" : "Search destination (e.g. Manali, Tokyo, Paris...)"}
            className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-10 text-sm md:text-base font-bold bg-transparent outline-none"
          />
        </div>

        {/* Voice Search Button */}
        <button
          type="button"
          onClick={handleVoiceSearch}
          className={`p-2.5 rounded-full transition-all shrink-0 ${
            isListening
              ? "bg-red-500 text-white animate-pulse"
              : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-primary"
          }`}
          title="Voice Search"
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <Button
          type="submit"
          className="rounded-full px-7 py-6 font-black uppercase tracking-widest text-xs bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
          <Search className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Explore</span>
        </Button>
      </form>

      {/* Autocomplete Dropdown & Recent Searches */}
      {isFocused && (
        <div className="absolute top-full left-4 right-4 mt-3 bg-card border border-border/60 rounded-[2.5rem] p-6 shadow-2xl backdrop-blur-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-primary" /> Recent Searches
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearch(item)}
                    className="px-3.5 py-1.5 rounded-full bg-muted/50 hover:bg-muted text-foreground text-xs font-bold flex items-center gap-2 border border-border/30 transition-all"
                  >
                    <span>{item}</span>
                    <X
                      className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500"
                      onClick={(e) => removeRecentSearch(e, item)}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular Autocomplete Suggestions */}
          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" /> Popular Destinations
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredSuggestions.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleSearch(item.name)}
                  className="p-3 rounded-2xl hover:bg-muted/50 border border-transparent hover:border-border/40 text-left flex items-center justify-between transition-all group"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-black uppercase tracking-tight text-foreground group-hover:text-primary transition-colors">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-medium truncate">{item.desc}</div>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                    {item.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Vibe Quick Explore Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
        {[
          { label: "Beach & Coastal", dest: "Goa" },
          { label: "Alpine & Snow", dest: "Manali" },
          { label: "Royal & Heritage", dest: "Jaipur" },
          { label: "High Altitude", dest: "Ladakh" },
          { label: "Global City", dest: "Tokyo" },
        ].map((vibe, idx) => (
          <button
            key={idx}
            onClick={() => handleSearch(vibe.dest)}
            className="px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-primary hover:text-primary text-[10px] font-black uppercase tracking-wider shadow-sm hover:shadow transition-all"
          >
            {vibe.label}
          </button>
        ))}
      </div>
    </div>
  );
}
