"use client";

import { useState } from "react";
import { 
  Thermometer, CloudRain, Wind, Droplets, CheckSquare, ShieldQuestion, 
  Tent, CircleDollarSign, CalendarDays, Camera, MapPin, Download, 
  Share2, Plane, Bed, Utensils, Info, Navigation, Activity
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TravelMap } from "@/components/TravelMap";
import { formatCurrencyDisplay } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { RefreshCw, Edit3 } from "lucide-react";

export function ItineraryDashboard({ itinerary, onRequestEdit }: { itinerary: any, onRequestEdit?: (req: string) => void }) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleCheck = (item: string) => {
    setCheckedItems(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Trip to ${itinerary.destination}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 bg-zinc-50 dark:bg-zinc-950 p-2 sm:p-4 rounded-xl">
      {/* 1. Hero Section */}
      <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden shadow-lg border border-border">
        {/* Placeholder for Unsplash Image based on destination */}
        <img 
          src={`https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&q=80&w=1200`} 
          onError={(e) => { e.currentTarget.src = 'https://placehold.co/1200x600/png?text=' + itinerary.destination }}
          alt={itinerary.destination} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 text-white">
          <h1 className="text-3xl md:text-5xl font-headline font-bold drop-shadow-md mb-2">
            {itinerary.destination}
          </h1>
          <div className="flex flex-wrap gap-3 text-sm md:text-base font-medium opacity-90">
            <span className="flex items-center gap-1"><CalendarDays className="w-4 h-4"/> {itinerary.duration} Days</span>
            {itinerary.budget && <span className="flex items-center gap-1"><CircleDollarSign className="w-4 h-4"/> {formatCurrencyDisplay(itinerary.budget)} Budget</span>}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={handleShare}>
          <Share2 className="w-4 h-4 mr-2" /> Share
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
          <Download className="w-4 h-4 mr-2" /> Export PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Trip Overview Card */}
          {itinerary.tripOverview && (
            <div className="p-5 border rounded-2xl bg-card shadow-sm">
              <h3 className="text-xl font-headline font-semibold flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-accent" /> Trip Overview
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {itinerary.tripOverview.bestTime && (
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider">Best Time</span>
                    <span className="font-medium">{itinerary.tripOverview.bestTime}</span>
                  </div>
                )}
                {itinerary.tripOverview.currency && (
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider">Currency</span>
                    <span className="font-medium">{itinerary.tripOverview.currency}</span>
                  </div>
                )}
                {itinerary.tripOverview.visa && (
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider">Visa</span>
                    <span className="font-medium">{itinerary.tripOverview.visa}</span>
                  </div>
                )}
                {itinerary.tripOverview.language && (
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider">Language</span>
                    <span className="font-medium">{itinerary.tripOverview.language}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Daily Itinerary Accordion */}
          <div className="p-5 border rounded-2xl bg-card shadow-sm">
            <h3 className="text-xl font-headline font-semibold flex items-center gap-2 mb-4">
              <CalendarDays className="w-5 h-5 text-accent" /> Daily Itinerary
            </h3>
            <Accordion type="single" collapsible className="w-full" defaultValue="day-1">
              {itinerary.days?.map((day: any) => (
                <AccordionItem value={`day-${day.day}`} key={`day-${day.day}`} className="border-b-0 mb-2 border rounded-xl overflow-hidden shadow-sm">
                  <AccordionTrigger className="px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors hover:no-underline font-semibold text-lg">
                    <div className="flex items-center justify-between w-full pr-4">
                      <span className="flex items-center gap-2">
                        Day {day.day} {day.theme && <span className="text-muted-foreground text-sm font-normal">— {day.theme}</span>}
                      </span>
                      {onRequestEdit && (
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="h-7 px-2 text-xs text-muted-foreground hover:text-accent z-10"
                           onClick={(e) => { e.stopPropagation(); onRequestEdit(`Regenerate Day ${day.day}`); }}
                         >
                           <RefreshCw className="w-3 h-3 mr-1" /> Regenerate
                         </Button>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 bg-card text-base space-y-4">
                    
                    {/* New structured schema (Morning, Afternoon, Evening) */}
                    {day.morning && day.morning.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-orange-500 uppercase tracking-wider mb-2">Morning</h4>
                        <ul className="space-y-2 border-l-2 border-orange-500/20 pl-4 ml-2">
                          {day.morning.map((act: any, i: number) => (
                            <li key={i} className="list-disc marker:text-orange-500">
                              <span className="font-medium text-foreground">{act.name}</span>
                              {act.description && <p className="text-sm text-muted-foreground">{act.description}</p>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {day.afternoon && day.afternoon.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-2">Afternoon</h4>
                        <ul className="space-y-2 border-l-2 border-amber-500/20 pl-4 ml-2">
                          {day.afternoon.map((act: any, i: number) => (
                            <li key={i} className="list-disc marker:text-amber-500">
                              <span className="font-medium text-foreground">{act.name}</span>
                              {act.description && <p className="text-sm text-muted-foreground">{act.description}</p>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {day.evening && day.evening.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-indigo-500 uppercase tracking-wider mb-2">Evening</h4>
                        <ul className="space-y-2 border-l-2 border-indigo-500/20 pl-4 ml-2">
                          {day.evening.map((act: any, i: number) => (
                            <li key={i} className="list-disc marker:text-indigo-500">
                              <span className="font-medium text-foreground">{act.name}</span>
                              {act.description && <p className="text-sm text-muted-foreground">{act.description}</p>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Fallback for old schema */}
                    {!day.morning && !day.afternoon && !day.evening && day.activities && (
                      <ul className="space-y-2 border-l-2 border-accent/20 pl-4 ml-2">
                        {day.activities.map((act: any, idx: number) => (
                          <li key={idx} className="list-disc marker:text-accent">
                            <span className="font-medium text-foreground">{act.name}</span>
                            {act.description && <p className="text-sm text-muted-foreground">{act.description}</p>}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border/50 bg-muted/20 -mx-4 -mb-4 px-4 py-3">
                      {day.cost && (
                        <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                           <CircleDollarSign className="w-4 h-4" /> Day Estimate: {formatCurrencyDisplay(day.cost)}
                        </div>
                      )}
                      {day.travelTips && (
                        <div className="flex gap-2 text-sm text-muted-foreground bg-primary/5 p-2 rounded-lg w-full mt-2">
                          <span className="font-bold text-primary shrink-0">Tip:</span> 
                          <span>{day.travelTips}</span>
                        </div>
                      )}
                    </div>

                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Hotels & Restaurants (Premium) */}
          {(itinerary.hotels?.length > 0 || itinerary.restaurants?.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {itinerary.hotels && itinerary.hotels.length > 0 && (
                <div className="p-5 border rounded-2xl bg-card shadow-sm">
                  <h3 className="text-lg font-headline font-semibold flex items-center gap-2 mb-4">
                    <Bed className="w-5 h-5 text-accent" /> Hotel Suggestions
                  </h3>
                  <div className="space-y-4">
                    {itinerary.hotels.map((hotel: any, idx: number) => (
                      <div key={idx} className="flex flex-col gap-1 pb-3 border-b last:border-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <span className="font-semibold">{hotel.name}</span>
                          {hotel.type && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">{hotel.type}</span>}
                        </div>
                        {hotel.rating && <span className="text-xs font-medium text-amber-500">★ {hotel.rating}</span>}
                        {hotel.location && <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3"/> {hotel.location}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {itinerary.restaurants && itinerary.restaurants.length > 0 && (
                <div className="p-5 border rounded-2xl bg-card shadow-sm">
                  <h3 className="text-lg font-headline font-semibold flex items-center gap-2 mb-4">
                    <Utensils className="w-5 h-5 text-orange-500" /> Food & Restaurants
                  </h3>
                  <div className="space-y-3">
                    {itinerary.restaurants.map((rest: any, idx: number) => (
                      <div key={idx} className="flex flex-col gap-0.5 pb-2 border-b last:border-0 last:pb-0">
                        <span className="font-semibold text-sm">{rest.name}</span>
                        {rest.cuisine && <span className="text-xs text-muted-foreground">{rest.cuisine}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Map Components */}
          {itinerary.mapNavigation && (
            <TravelMap 
                destination={itinerary.destination} 
                distance={itinerary.mapNavigation.distance} 
                travelTime={itinerary.mapNavigation.travelTime}
                offlineMapLink={itinerary.offlineMapLink}
              />
          )}

        </div>

        {/* Right Column (Sidebar metrics) */}
        <div className="space-y-6">

          {/* Budget Breakdown */}
          {itinerary.budgetBreakdown && (
            <div className="p-5 border rounded-2xl bg-card shadow-sm relative group">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-headline font-semibold flex items-center gap-2">
                  <CircleDollarSign className="w-5 h-5 text-emerald-500" /> Budget Breakdown
                </h3>
                {onRequestEdit && (
                   <Button variant="ghost" size="sm" className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onRequestEdit("Regenerate budget with cheaper alternatives")}>
                     <RefreshCw className="w-3 h-3 mr-1" /> Regenerate
                   </Button>
                )}
              </div>
              <div className="space-y-3 text-sm">
                {itinerary.budgetBreakdown.flights && (
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground flex items-center gap-2"><Plane className="w-4 h-4"/> Flights</span>
                    <span className="font-medium">{formatCurrencyDisplay(itinerary.budgetBreakdown.flights)}</span>
                  </div>
                )}
                {itinerary.budgetBreakdown.hotels && (
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground flex items-center gap-2"><Bed className="w-4 h-4"/> Hotels</span>
                    <span className="font-medium">{formatCurrencyDisplay(itinerary.budgetBreakdown.hotels)}</span>
                  </div>
                )}
                {itinerary.budgetBreakdown.food && (
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground flex items-center gap-2"><Utensils className="w-4 h-4"/> Food</span>
                    <span className="font-medium">{formatCurrencyDisplay(itinerary.budgetBreakdown.food)}</span>
                  </div>
                )}
                {itinerary.budgetBreakdown.activities && (
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground flex items-center gap-2"><Activity className="w-4 h-4"/> Activities</span>
                    <span className="font-medium">{formatCurrencyDisplay(itinerary.budgetBreakdown.activities)}</span>
                  </div>
                )}
                {itinerary.budgetBreakdown.transport && (
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground flex items-center gap-2"><Navigation className="w-4 h-4"/> Transport</span>
                    <span className="font-medium">{formatCurrencyDisplay(itinerary.budgetBreakdown.transport)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="font-bold text-emerald-600 text-lg">
                    {formatCurrencyDisplay(itinerary.budgetBreakdown.total || itinerary.totalCost || itinerary.budget || 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Weather Outlook */}
          {itinerary.weatherForecast && (
            <div className="p-5 border rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 shadow-sm">
              <h3 className="text-lg font-headline font-semibold flex items-center gap-2 mb-4">
                <Thermometer className="w-5 h-5 text-accent" /> Weather Outlook
              </h3>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center">
                    <Thermometer className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{itinerary.weatherForecast.temperature}°C</div>
                    <div className="text-xs text-muted-foreground">Current Temp</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-background/80 rounded-lg p-2 text-center shadow-sm">
                  <Droplets className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <div className="text-xs font-bold">{itinerary.weatherForecast.humidity}%</div>
                </div>
                <div className="bg-background/80 rounded-lg p-2 text-center shadow-sm">
                  <Wind className="w-4 h-4 text-teal-500 mx-auto mb-1" />
                  <div className="text-xs font-bold">{itinerary.weatherForecast.windSpeed} km/h</div>
                </div>
                <div className="bg-background/80 rounded-lg p-2 text-center shadow-sm">
                  <CloudRain className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
                  <div className="text-xs font-bold">{itinerary.weatherForecast.rainProbability || 0}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Packing Checklist */}
          {itinerary.packingChecklist && itinerary.packingChecklist.length > 0 && (
            <div className="p-5 border rounded-2xl bg-card shadow-sm">
              <h3 className="text-lg font-headline font-semibold flex items-center gap-2 mb-4">
                <CheckSquare className="w-5 h-5 text-accent" /> Packing List
              </h3>
              <div className="space-y-2">
                {itinerary.packingChecklist.map((item: string, idx: number) => {
                  const id = `pack-${idx}`;
                  const isChecked = checkedItems[id] || false;
                  return (
                    <div 
                      key={idx} 
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => toggleCheck(id)}
                    >
                      <div className={`mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded border ${isChecked ? 'bg-primary border-primary' : 'border-input bg-background'}`}>
                        {isChecked && <CheckSquare className="w-3.5 h-3.5 text-primary-foreground" />}
                      </div>
                      <span className={`text-sm ${isChecked ? 'text-muted-foreground line-through' : 'text-foreground font-medium'}`}>
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Emergency Info */}
          {itinerary.emergencyInfo && (
            <div className="p-5 border rounded-2xl bg-red-500/5 shadow-sm border-red-500/20">
              <h3 className="text-lg font-headline font-semibold flex items-center gap-2 mb-4 text-red-500">
                <ShieldQuestion className="w-5 h-5" /> Emergency Info
              </h3>
              <div className="space-y-3 text-sm">
                {itinerary.emergencyInfo.emergencyNumber && (
                  <div>
                    <span className="text-muted-foreground block text-xs tracking-wider">Dial</span>
                    <span className="font-bold text-red-500 text-lg">{itinerary.emergencyInfo.emergencyNumber}</span>
                  </div>
                )}
                {itinerary.emergencyInfo.hospital && (
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider">Hospital</span>
                    <span className="font-medium text-foreground">{itinerary.emergencyInfo.hospital}</span>
                  </div>
                )}
                {itinerary.emergencyInfo.embassy && (
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider">Embassy</span>
                    <span className="font-medium text-foreground">{itinerary.emergencyInfo.embassy}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
