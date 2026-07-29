"use client";

import React, { useState, useEffect } from "react";
import {
  Sun, CloudRain, Wind, Droplets, Eye, Thermometer, Sunrise, Sunset,
  AlertTriangle, ShieldAlert, Sparkles, CheckCircle2, RefreshCw, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface WeatherCardProps {
  destination: string;
  lat?: number;
  lng?: number;
}

export function WeatherCard({ destination, lat, lng }: WeatherCardProps) {
  const [weatherData, setWeatherData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWeather = async () => {
    setLoading(true);
    try {
      const url = `/api/weather?destination=${encodeURIComponent(destination)}${lat && lng ? `&lat=${lat}&lng=${lng}` : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setWeatherData(json.data);
        }
      }
    } catch (err) {
      console.warn("⚠️ Weather fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [destination, lat, lng]);

  if (loading) {
    return (
      <div className="w-full h-64 bg-card border border-border/50 rounded-[2.5rem] p-8 animate-pulse space-y-6">
        <div className="h-6 w-48 bg-muted rounded-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-20 bg-muted rounded-2xl" />
          <div className="h-20 bg-muted rounded-2xl" />
          <div className="h-20 bg-muted rounded-2xl" />
          <div className="h-20 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!weatherData) return null;

  const { current, forecast, intelligence } = weatherData;

  return (
    <div className="w-full bg-card border border-border/60 rounded-[2.5rem] p-8 shadow-2xl shadow-black/5 space-y-8 my-8">
      {/* Current Header & Weather Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/50 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
            <Sun className="w-3.5 h-3.5" /> Dynamic Weather Intelligence
          </div>
          <h3 className="text-3xl md:text-4xl font-black font-headline uppercase tracking-tight">
            {destination} <span className="text-primary">{current.temp}°C</span>
          </h3>
          <p className="text-xs text-muted-foreground font-medium">
            {current.condition} — Feels like {current.feelsLike}°C
          </p>
        </div>

        {/* Current Weather Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-muted/40 rounded-2xl border border-border/30 text-center">
            <span className="text-[9px] font-black text-muted-foreground uppercase block">Humidity</span>
            <span className="text-sm font-bold text-foreground flex items-center justify-center gap-1 mt-0.5">
              <Droplets className="w-3.5 h-3.5 text-blue-500" /> {current.humidity}%
            </span>
          </div>
          <div className="p-3 bg-muted/40 rounded-2xl border border-border/30 text-center">
            <span className="text-[9px] font-black text-muted-foreground uppercase block">Wind</span>
            <span className="text-sm font-bold text-foreground flex items-center justify-center gap-1 mt-0.5">
              <Wind className="w-3.5 h-3.5 text-teal-500" /> {current.wind} km/h
            </span>
          </div>
          <div className="p-3 bg-muted/40 rounded-2xl border border-border/30 text-center">
            <span className="text-[9px] font-black text-muted-foreground uppercase block">Visibility</span>
            <span className="text-sm font-bold text-foreground flex items-center justify-center gap-1 mt-0.5">
              <Eye className="w-3.5 h-3.5 text-purple-500" /> {current.visibility} km
            </span>
          </div>
          <div className="p-3 bg-muted/40 rounded-2xl border border-border/30 text-center">
            <span className="text-[9px] font-black text-muted-foreground uppercase block">UV Index</span>
            <span className="text-sm font-bold text-foreground flex items-center justify-center gap-1 mt-0.5">
              <Sun className="w-3.5 h-3.5 text-amber-500" /> {current.uvIndex} (Moderate)
            </span>
          </div>
        </div>
      </div>

      {/* AI Intelligence & Risk Warnings */}
      {intelligence && (
        <div className="space-y-4 bg-primary/5 border border-primary/20 p-6 rounded-3xl">
          <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-wider">
            <Sparkles className="w-4 h-4" /> AI Travel Intelligence Insight
          </div>
          <p className="text-xs text-foreground font-medium leading-relaxed">
            {intelligence.insight}
          </p>

          {/* Warnings */}
          {intelligence.warnings && intelligence.warnings.length > 0 && (
            <div className="space-y-2 pt-2">
              {intelligence.warnings.map((w: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>{w.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Packing Suggestions */}
          {intelligence.packingSuggestions && (
            <div className="pt-2">
              <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                Weather Packing Recommendations
              </div>
              <div className="flex flex-wrap gap-2">
                {intelligence.packingSuggestions.map((item: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-background border border-border/50 rounded-full text-[9px] font-bold text-foreground flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7-Day Forecast Grid */}
      {forecast && (
        <div className="space-y-4">
          <div className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-primary" /> 7-Day Weather Forecast
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {forecast.map((day: any, idx: number) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border flex flex-col items-center justify-between text-center space-y-2 transition-all ${
                  idx === 0 ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-muted/30 border-border/40 hover:bg-muted/60"
                }`}
              >
                <div className="text-[10px] font-black uppercase tracking-wider">{day.day}</div>
                <div className="text-xl font-bold">{day.tempMax}°</div>
                <div className="text-[9px] font-medium opacity-80">{day.condition}</div>
                {day.pop > 20 && (
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${idx === 0 ? "bg-white/20 text-white" : "bg-blue-500/10 text-blue-500"}`}>
                    ☔ {day.pop}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
