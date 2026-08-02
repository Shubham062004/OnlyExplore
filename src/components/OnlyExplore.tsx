"use client";

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Bot,
  CalendarDays,
  CalendarPlus,
  Copy,
  Download,
  MapPin,
  Plane,
  SendHorizonal,
  Share2,
  Sparkles,
  User,
  Wallet,
  Wand2,
  Users,
  CheckCircle2,
  History,
  ChevronDown,
  ExternalLink,
  FileText,
  Clock,
  Compass,
  ArrowRight,
  ShieldAlert,
  Map as MapIcon,
  Luggage,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrencyDisplay, parseCurrencyValue } from '@/lib/currency';
import { Sidebar } from './Sidebar';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ItineraryDashboard } from '@/components/ItineraryDashboard';

const ActivitySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

const TripOverviewSchema = z.object({
  bestTime: z.string().optional(),
  currency: z.string().optional(),
  visa: z.string().optional(),
  language: z.string().optional(),
  averageTemperature: z.string().optional(),
});

const HotelSchema = z.object({
  name: z.string(),
  type: z.enum(['Budget', 'Mid-range', 'Luxury']).optional(),
  rating: z.string().optional(),
  location: z.string().optional(),
});

const RestaurantSchema = z.object({
  name: z.string(),
  cuisine: z.string().optional(),
});

const EmergencySchema = z.object({
  emergencyNumber: z.string().optional(),
  hospital: z.string().optional(),
  embassy: z.string().optional(),
});

const BudgetSchema = z.object({
  flights: z.number().optional(),
  hotels: z.number().optional(),
  food: z.number().optional(),
  activities: z.number().optional(),
  transport: z.number().optional(),
  total: z.number().optional()
});

const ItineraryDaySchema = z.object({
  day: z.number(),
  theme: z.string().optional(),
  morning: z.array(ActivitySchema).optional(),
  afternoon: z.array(ActivitySchema).optional(),
  evening: z.array(ActivitySchema).optional(),
  cost: z.number().optional(),
  travelTips: z.string().optional(),
  activities: z.array(ActivitySchema).optional(),
});

const ItinerarySchema = z.object({
  destination: z.string(),
  tripOverview: TripOverviewSchema.optional(),
  budgetBreakdown: BudgetSchema.optional(),
  days: z.array(ItineraryDaySchema),
  hotels: z.array(HotelSchema).optional(),
  restaurants: z.array(RestaurantSchema).optional(),
  emergencyInfo: EmergencySchema.optional(),
  totalCost: z.number().optional(),
  notes: z.string().optional(),
  weatherForecast: z.any().optional(),
  packingChecklist: z.array(z.string()).optional(),
  travelEssentials: z.array(z.string()).optional(),
  healthSafety: z.array(z.string()).optional(),
  campingGear: z.array(z.string()).optional(),
  travelCostBreakdown: z.any().optional(),
  mapNavigation: z.any().optional(),
  offlineMapLink: z.string().optional(),
  heroImage: z.string().optional(),
  images: z.object({
    hero: z.string(),
    popularPlaces: z.array(z.object({ name: z.string(), image: z.string() })),
    nearby: z.array(z.object({ name: z.string(), image: z.string() }))
  }).optional(),
});

type Itinerary = z.infer<typeof ItinerarySchema>;

type ChatMessage = {
  type: 'user' | 'bot';
  content: string | Itinerary;
  rawItinerary?: string;
  timestamp?: string;
};

interface VersionSnapshot {
  version: string;
  title: string;
  timestamp: string;
  itinerary: Itinerary;
}

const plannerFormSchema = z.object({
  destination: z.string().min(2, 'Please enter a destination.'),
  duration: z.string().min(2, 'Please enter a duration.'),
  budget: z.string().min(2, 'Please enter a budget.'),
  interests: z.string().min(3, 'Please list some interests.'),
});

const editFormSchema = z.object({
  editRequest: z.string().min(3, 'Please enter an edit request.'),
});

export default function OnlyExplore({ initialChatId }: { initialChatId?: string }) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [progressStep, setProgressStep] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // Version History State
  const [versionHistory, setVersionHistory] = useState<VersionSnapshot[]>([]);
  const [activeVersion, setActiveVersion] = useState<string>('Draft v1');

  const searchParams = useSearchParams();
  const router = useRouter();

  const hasAutoSubmittedRef = useRef(false);

  // Parse current active itinerary object
  const getLatestItinerary = (): { itinerary: Itinerary | null; lastMessageIndex: number } => {
    for (let i = chatHistory.length - 1; i >= 0; i--) {
      if (chatHistory[i].type === 'bot' && typeof chatHistory[i].content === 'object') {
        return { itinerary: chatHistory[i].content as Itinerary, lastMessageIndex: i };
      }
    }
    return { itinerary: null, lastMessageIndex: -1 };
  };

  const currentItinerary = getLatestItinerary().itinerary;

  // Auto-submit from URL search params or pre-auth intent
  useEffect(() => {
    if (status === 'loading') return;

    if (initialChatId && initialChatId !== currentChatId && status === 'authenticated') {
      handleSelectChat(initialChatId, false);
    } else if (!initialChatId && status === 'authenticated' && !isLoading && chatHistory.length === 0 && !hasAutoSubmittedRef.current) {
      const dest = searchParams.get('destination') || '';
      const prompt = searchParams.get('prompt') || searchParams.get('query') || '';

      if (dest || prompt) {
        hasAutoSubmittedRef.current = true;
        const destination = dest || 'India';
        const exactPrompt = prompt || `Plan a trip to ${destination}`;

        plannerForm.setValue('destination', destination);
        plannerForm.setValue('interests', exactPrompt);

        // Immediate user message rendering (<100ms)
        const userMsg: ChatMessage = {
          type: "user",
          content: exactPrompt,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setChatHistory([userMsg]);

        router.replace('/chat', { scroll: false });

        onPlannerSubmit({
          destination,
          duration: '5 days',
          budget: '50000',
          interests: exactPrompt,
          exactPrompt,
        });
      }
    }
  }, [initialChatId, status, searchParams]);

  const plannerForm = useForm<z.infer<typeof plannerFormSchema>>({
    resolver: zodResolver(plannerFormSchema),
    defaultValues: {
      destination: '',
      duration: '5 days',
      budget: '50000',
      interests: 'Sightseeing, Food & Local Culture',
    },
  });

  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: { editRequest: '' },
  });

  const saveVersionSnapshot = (itinerary: Itinerary, label?: string) => {
    const nextVerNum = versionHistory.length + 1;
    const versionTag = `Draft v${nextVerNum}`;
    const newSnapshot: VersionSnapshot = {
      version: versionTag,
      title: label || `Snapshot ${nextVerNum} - ${itinerary.destination}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      itinerary,
    };

    setVersionHistory((prev) => [newSnapshot, ...prev]);
    setActiveVersion(versionTag);
  };

  const handleRestoreVersion = (snapshot: VersionSnapshot) => {
    setActiveVersion(snapshot.version);
    const botMessage: ChatMessage = {
      type: "bot",
      content: snapshot.itinerary,
      rawItinerary: JSON.stringify(snapshot.itinerary),
      timestamp: snapshot.timestamp,
    };
    setChatHistory((prev) => [...prev, botMessage]);
    toast({
      title: `Restored ${snapshot.version}`,
      description: `Reverted workspace state to ${snapshot.title}`,
    });
  };

  async function onPlannerSubmit(values: any) {
    setIsLoading(true);
    setProgressStep("Analyzing destination & interests...");
    const exactPrompt = values.exactPrompt || values.interests || (values.destination ? `Plan a trip to ${values.destination}` : "Plan a trip");

    const userMessage: ChatMessage = {
      type: "user",
      content: exactPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory((prev) => {
      if (prev.length === 0 || prev[0].content !== exactPrompt) {
        return [userMessage];
      }
      return prev;
    });

    try {
      const plan = 'pro';
      
      // Simulate progressive status updates
      setTimeout(() => setProgressStep("Finding top hotels & experiences..."), 1200);
      setTimeout(() => setProgressStep("Calculating budget & daily timeline..."), 2500);

      const res = await fetch("/api/itinerary/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, plan, interests: exactPrompt }),
      });

      if (!res.ok) throw new Error("Failed to generate itinerary");
      
      const json = await res.json();
      const result = json.success ? json.data : (json.data || json);

      if (!result) throw new Error("AI returned empty result.");

      const botMessage: ChatMessage = {
        type: "bot",
        content: result,
        rawItinerary: JSON.stringify(result),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatHistory([userMessage, botMessage]);
      saveVersionSnapshot(result, "Initial AI Plan");

      if (session?.user) {
        try {
          const chatRes = await fetch("/api/chats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: exactPrompt }),
          });
          const chatData = await chatRes.json();
          if (chatData._id) {
            setCurrentChatId(chatData._id);
            await Promise.all([
              fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chatId: chatData._id, role: "user", content: exactPrompt })
              }),
              fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chatId: chatData._id, role: "assistant", content: JSON.stringify(result) })
              })
            ]);
            setRefreshKey(prev => prev + 1);
            router.replace(`/chat/${chatData._id}`, { scroll: false });
          }
        } catch (e) { console.error("Could not save to db", e); }
      }

      toast({
        title: "Workspace Updated!",
        description: `${result.destination || 'Trip'} itinerary is ready to customize.`,
      });

    } catch (error) {
      console.error("Error generating itinerary:", error);
      toast({
        variant: "destructive",
        title: "Something went wrong.",
        description: "Could not generate itinerary.",
      });
    } finally {
      setIsLoading(false);
      setProgressStep(null);
    }
  }

  async function onEditSubmit(values: z.infer<typeof editFormSchema>) {
    const editPrompt = values.editRequest;
    if (!editPrompt || !currentItinerary) return;

    setIsEditing(true);
    setProgressStep("Re-optimizing itinerary with new preferences...");

    const userMessage: ChatMessage = {
      type: "user",
      content: editPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory((prev) => [...prev, userMessage]);
    editForm.reset();

    try {
      const res = await fetch("/api/itinerary/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itinerary: currentItinerary,
          currentItinerary,
          editRequest: editPrompt,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        const errorDetail = json.error ? `[${json.stage || 'API Error'}]: ${json.error}` : "Failed to update itinerary";
        throw new Error(errorDetail);
      }
      
      const updatedResult = json.data;

      const botMessage: ChatMessage = {
        type: "bot",
        content: updatedResult,
        rawItinerary: JSON.stringify(updatedResult),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatHistory((prev) => [...prev, botMessage]);
      saveVersionSnapshot(updatedResult, editPrompt);

      if (currentChatId && session?.user) {
        await Promise.all([
          fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatId: currentChatId, role: "user", content: editPrompt })
          }),
          fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatId: currentChatId, role: "assistant", content: JSON.stringify(updatedResult) })
          })
        ]);
      }

      toast({
        title: "Workspace Updated",
        description: "Applied your edits to the live itinerary workspace.",
      });
    } catch (err) {
      console.error("Edit failed", err);
      toast({
        variant: "destructive",
        title: "Edit Failed",
        description: "Could not apply edits right now. Please try again.",
      });
    } finally {
      setIsEditing(false);
      setProgressStep(null);
    }
  }

  const handleSelectChat = async (chatId: string, navigate = true) => {
    setIsLoading(true);
    setCurrentChatId(chatId);
    if (navigate) {
      router.push(`/chat/${chatId}`);
    }
    try {
      const res = await fetch(`/api/messages?chatId=${chatId}`);
      if (res.status === 404) {
        toast({ variant: "destructive", title: "Chat not found" });
        router.push('/');
        setIsLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const messages = await res.json();

      const formattedHistory: ChatMessage[] = messages.map((m: any) => {
        let content = m.content;
        let rawItinerary = undefined;
        if (m.role === 'assistant') {
          try {
            content = JSON.parse(m.content);
            rawItinerary = m.content;
          } catch (e) {
            // Keep raw string fallback
          }
        }
        return {
          type: m.role === 'user' ? 'user' : 'bot',
          content,
          rawItinerary,
          timestamp: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        };
      });

      setChatHistory(formattedHistory);

      // Save initial snapshot from history if present
      const latestBot = formattedHistory.slice().reverse().find(m => m.type === 'bot' && typeof m.content === 'object');
      if (latestBot && typeof latestBot.content === 'object') {
        saveVersionSnapshot(latestBot.content as Itinerary, "Loaded Saved Trip");
      }

    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Could not load trip history" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setChatHistory([]);
    setCurrentChatId(null);
    setVersionHistory([]);
    setActiveVersion('Draft v1');
    router.push('/chat');
  };

  const handleDownloadPdf = async () => {
    if (!currentItinerary) return;
    try {
      toast({ title: 'Generating PDF...', description: 'Please wait while we format your PDF.' });
      const res = await fetch('/api/export-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itinerary: currentItinerary })
      });

      if (!res.ok) throw new Error('Failed to generate PDF');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OnlyExplore-Itinerary-${currentItinerary.destination.replace(/\s/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({ title: 'PDF Exported!', description: 'Your PDF travel guide is ready.' });
    } catch (e) {
      console.error('Error downloading PDF', e);
      toast({
        variant: 'destructive',
        title: 'PDF Export Failed',
        description: 'Could not generate PDF. Opening browser print fallback.',
      });
      window.print();
    }
  };

  const handleExportCalendar = () => {
    if (!currentItinerary) return;
    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//OnlyExplore//Trip Workspace//EN\nBEGIN:VEVENT\nSUMMARY:Trip to ${currentItinerary.destination}\nDESCRIPTION:Generated by OnlyExplore AI Workspace\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentItinerary.destination.replace(/\s/g, '_')}_Trip.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast({ title: "Calendar Exported", description: ".ics calendar file saved to downloads." });
  };

  const handleShareWorkspace = () => {
    if (!currentItinerary) return;
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `Trip to ${currentItinerary.destination}`, url: shareUrl });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link Copied", description: "Trip workspace URL copied to clipboard." });
    }
  };

  const handleOpenGoogleMaps = () => {
    if (!currentItinerary) return;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentItinerary.destination)}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      {/* Persistent Left App Navigation Drawer */}
      <Sidebar onSelectChat={(id) => handleSelectChat(id, true)} onNewChat={handleNewChat} refreshKey={refreshKey} />

      {/* Main Workspace Frame */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden relative">
        
        {/* WORKSPACE HEADER BAR */}
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-4 overflow-x-auto hide-scrollbar">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 font-semibold text-xs border border-purple-200 shrink-0">
              <MapPin className="w-3.5 h-3.5" />
              <span>{currentItinerary?.destination || 'New Trip Workspace'}</span>
            </div>

            {currentItinerary && (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium shrink-0">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
                  <span>{currentItinerary.days?.length || 5} Days</span>
                </div>

                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium shrink-0">
                  <Wallet className="w-3.5 h-3.5 text-slate-500" />
                  <span>{formatCurrencyDisplay(currentItinerary.totalCost || currentItinerary.budgetBreakdown?.total || 50000)}</span>
                </div>

                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium shrink-0">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>2 Travelers</span>
                </div>
              </>
            )}

            {/* Version History Selector */}
            {versionHistory.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium rounded-full">
                    <History className="w-3.5 h-3.5 text-purple-600" />
                    <span>{activeVersion}</span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel className="text-xs">Version Snapshots</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {versionHistory.map((snap) => (
                    <DropdownMenuItem
                      key={snap.version}
                      onClick={() => handleRestoreVersion(snap)}
                      className="flex items-center justify-between text-xs cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold">{snap.version}</span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">{snap.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{snap.timestamp}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {currentItinerary && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2 shadow-sm rounded-full text-xs font-semibold px-4 h-9">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Finalize Trip</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs">Export & Share Workspace</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDownloadPdf} className="gap-2 text-xs cursor-pointer">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>Export PDF Itinerary</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportCalendar} className="gap-2 text-xs cursor-pointer">
                    <CalendarPlus className="w-4 h-4 text-blue-600" />
                    <span>Add to Calendar (.ics)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareWorkspace} className="gap-2 text-xs cursor-pointer">
                    <Share2 className="w-4 h-4 text-green-600" />
                    <span>Share Workspace Link</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleOpenGoogleMaps} className="gap-2 text-xs cursor-pointer">
                    <MapIcon className="w-4 h-4 text-amber-600" />
                    <span>Open Google Maps Route</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* WORKSPACE SPLIT LAYOUT (35% Left Chat Feed / 65% Right Live Workspace) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* LEFT PANEL (35% Width): AI Conversation & Input Bar */}
          <div className="w-full md:w-[35%] lg:w-[32%] border-r border-border bg-card flex flex-col h-full shrink-0 relative">
            
            {/* Conversation Header */}
            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm">AI Copilot</span>
              </div>
              {progressStep && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-full text-[11px] font-medium animate-pulse">
                  <Sparkles className="w-3 h-3 animate-spin" />
                  <span className="truncate max-w-[130px]">{progressStep}</span>
                </div>
              )}
            </div>

            {/* Conversation Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
              {chatHistory.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shadow-sm">
                    <Compass className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">Plan Your Next Trip</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      Type your destination, travel budget, or interests below to build your live workspace.
                    </p>
                  </div>
                </div>
              )}

              {chatHistory.map((message, index) => {
                if (message.type === 'user') {
                  return (
                    <div key={index} className="flex justify-end items-start gap-2.5">
                      <div className="bg-purple-600 text-white p-3 rounded-2xl rounded-tr-sm text-xs max-w-[85%] shadow-sm leading-relaxed">
                        <p>{message.content as string}</p>
                        {message.timestamp && <span className="text-[9px] text-purple-200 block text-right mt-1">{message.timestamp}</span>}
                      </div>
                      <Avatar className="w-6 h-6 shrink-0 mt-1">
                        <AvatarFallback className="bg-purple-100 text-purple-700 text-[10px] font-bold">YOU</AvatarFallback>
                      </Avatar>
                    </div>
                  );
                }

                if (message.type === 'bot') {
                  return (
                    <div key={index} className="flex justify-start items-start gap-2.5">
                      <Avatar className="w-6 h-6 shrink-0 mt-1 border border-purple-200">
                        <AvatarFallback className="bg-purple-50 text-purple-600">
                          <Bot className="w-3.5 h-3.5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted/70 text-slate-800 p-3 rounded-2xl rounded-tl-sm text-xs max-w-[88%] border border-border leading-relaxed space-y-2">
                        {typeof message.content === 'string' ? (
                          <p>{message.content}</p>
                        ) : (
                          <div>
                            <div className="flex items-center gap-1.5 text-purple-700 font-semibold mb-1 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                              <span>Updated Live Itinerary Workspace</span>
                            </div>
                            <p className="text-[11px] text-slate-600">
                              Generated personalized itinerary for <strong className="text-slate-900">{message.content.destination}</strong> with {message.content.days?.length || 5} days of activities, hotel options, and weather details.
                            </p>
                          </div>
                        )}
                        {message.timestamp && <span className="text-[9px] text-slate-400 block text-right">{message.timestamp}</span>}
                      </div>
                    </div>
                  );
                }
                return null;
              })}

              {(isLoading || isEditing) && (
                <div className="flex justify-start items-start gap-2.5">
                  <Avatar className="w-6 h-6 shrink-0 mt-1 border border-purple-200">
                    <AvatarFallback className="bg-purple-50 text-purple-600">
                      <Bot className="w-3.5 h-3.5 animate-spin" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-purple-50/70 border border-purple-100 p-3.5 rounded-2xl rounded-tl-sm text-xs text-purple-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
                    <span>{progressStep || "Crafting your travel workspace..."}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggestion Pills */}
            {currentItinerary && (
              <div className="px-4 py-2 bg-muted/20 border-t border-border flex items-center gap-1.5 overflow-x-auto hide-scrollbar shrink-0">
                {[
                  "Make it budget friendly",
                  "Add 1 more day",
                  "Suggest luxury stays",
                  "Focus on local food"
                ].map((sug) => (
                  <button
                    key={sug}
                    onClick={() => {
                      editForm.setValue('editRequest', sug);
                      onEditSubmit({ editRequest: sug });
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-purple-50 text-slate-600 hover:text-purple-700 text-[10px] font-medium rounded-full border border-slate-200 transition shrink-0"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            )}

            {/* Prompt Input Bar */}
            <div className="p-3 border-t border-border bg-card shrink-0">
              {chatHistory.length === 0 ? (
                <Form {...plannerForm}>
                  <form onSubmit={plannerForm.handleSubmit(onPlannerSubmit)} className="space-y-2">
                    <div className="flex gap-2">
                      <FormField
                        control={plannerForm.control}
                        name="destination"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input placeholder="Destination (e.g. Shimla)" className="pl-8 h-9 text-xs" {...field} />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button type="submit" size="sm" className="h-9 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold">
                        Plan <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <Form {...editForm}>
                  <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="flex items-center gap-2">
                    <FormField
                      control={editForm.control}
                      name="editRequest"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <div className="relative">
                              <Wand2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-purple-600" />
                              <Input
                                placeholder="Refine trip (e.g. 'Add beach day' or 'Lower budget')"
                                className="pl-9 pr-3 h-9 text-xs rounded-xl bg-background"
                                {...field}
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" size="icon" disabled={isEditing || isLoading} className="h-9 w-9 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shrink-0">
                      <SendHorizonal className="h-4 w-4" />
                    </Button>
                  </form>
                </Form>
              )}
            </div>
          </div>

          {/* RIGHT PANEL (65% Width): Live Trip Workspace */}
          <div className="flex-1 bg-background flex flex-col h-full overflow-y-auto custom-scrollbar relative p-4 md:p-6">
            {currentItinerary ? (
              <div className="max-w-5xl mx-auto w-full space-y-6">
                <ItineraryDashboard
                  itinerary={currentItinerary}
                  onRequestEdit={(req) => {
                    editForm.setValue('editRequest', req);
                    onEditSubmit({ editRequest: req });
                  }}
                />
              </div>
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4 p-8 max-w-md mx-auto text-center">
                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center animate-bounce">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">Setting up Live Workspace...</h3>
                <p className="text-xs text-slate-500">Generating interactive itinerary timeline, hotel choices, and live weather forecast.</p>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full w-2/3 animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center p-8 space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shadow-sm">
                  <Compass className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-headline">Live AI Trip Workspace</h2>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                    Enter a destination in the left copilot panel to start building your live itinerary workspace with maps, budget breakdown, and hotel recommendations.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full text-left">
                  <div className="p-3 bg-card border border-border rounded-xl flex items-center gap-2.5">
                    <CalendarDays className="w-4 h-4 text-purple-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold">Timeline Builder</h4>
                      <p className="text-[10px] text-muted-foreground">Day-by-day activities</p>
                    </div>
                  </div>

                  <div className="p-3 bg-card border border-border rounded-xl flex items-center gap-2.5">
                    <Wallet className="w-4 h-4 text-green-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold">Budget Breakdown</h4>
                      <p className="text-[10px] text-muted-foreground">Flights, stays & food</p>
                    </div>
                  </div>

                  <div className="p-3 bg-card border border-border rounded-xl flex items-center gap-2.5">
                    <MapIcon className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold">Smart Map</h4>
                      <p className="text-[10px] text-muted-foreground">Interactive route pins</p>
                    </div>
                  </div>

                  <div className="p-3 bg-card border border-border rounded-xl flex items-center gap-2.5">
                    <Luggage className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold">Packing & Weather</h4>
                      <p className="text-[10px] text-muted-foreground">Checklists & forecasts</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
