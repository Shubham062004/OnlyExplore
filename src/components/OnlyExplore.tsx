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
  RefreshCw,
  Plus,
  Check,
  Flame,
  Sun,
  Bed,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrencyDisplay } from '@/lib/currency';
import { Sidebar } from './Sidebar';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ItineraryDashboard } from '@/components/ItineraryDashboard';

const promptFormSchema = z.object({
  prompt: z.string().min(2, 'Please enter a destination or trip idea.'),
});

interface ActivityItem {
  name: string;
  description?: string;
}

interface ItineraryDay {
  day: number | string;
  theme?: string;
  morning?: ActivityItem[];
  afternoon?: ActivityItem[];
  evening?: ActivityItem[];
  cost?: number | string;
  travelTips?: string;
  activities?: ActivityItem[];
}

interface Itinerary {
  destination: string;
  duration?: number | string;
  budget?: number | string;
  interests?: string[] | string;
  tripOverview?: {
    bestTime?: string;
    currency?: string;
    visa?: string;
    language?: string;
    averageTemperature?: string;
  };
  budgetBreakdown?: {
    flights?: number | string;
    hotels?: number | string;
    food?: number | string;
    activities?: number | string;
    transport?: number | string;
    total?: number | string;
  };
  days: ItineraryDay[];
  hotels?: Array<{ name: string; type?: string; rating?: string; location?: string }>;
  restaurants?: Array<{ name: string; cuisine?: string }>;
  emergencyInfo?: { emergencyNumber?: string; hospital?: string; embassy?: string };
  totalCost?: number | string;
  notes?: string;
  weatherForecast?: any;
  packingChecklist?: string[];
  travelEssentials?: string[];
  healthSafety?: string[];
  campingGear?: string[];
  travelCostBreakdown?: any;
  mapNavigation?: any;
  offlineMapLink?: string;
  heroImage?: string;
  images?: {
    hero: string;
    popularPlaces: Array<{ name: string; image: string }>;
    nearby: Array<{ name: string; image: string }>;
  };
}

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

const FEATURED_DESTINATIONS = [
  {
    name: "Palampur",
    region: "Himachal Pradesh",
    vibe: "Tea gardens, mountain monasteries & Dhauladhar peaks",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop",
    prompt: "Plan a budget friendly 4-day Palampur trip with friends for tea gardens and valley walks",
    badge: "Mountain Escape",
  },
  {
    name: "Manali",
    region: "Himachal Pradesh",
    vibe: "Solang Valley adventures, river treks & Old Manali cafes",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=600&auto=format&fit=crop",
    prompt: "Plan a 5-day adventure and leisure trip to Manali with cafe hopping",
    badge: "Trending",
  },
  {
    name: "Goa",
    region: "Coastal India",
    vibe: "Sun-drenched beaches, Portuguese villas & seafood trails",
    image: "https://images.unsplash.com/photo-1512789172734-7b099dbd15a6?q=80&w=600&auto=format&fit=crop",
    prompt: "Plan a 4-day budget-friendly Goa beach and cultural trip with friends",
    badge: "Beach & Sun",
  },
  {
    name: "Jaipur",
    region: "Rajasthan",
    vibe: "Amer Fort, royal palaces, street food & artisan crafts",
    image: "https://images.unsplash.com/photo-1609137144822-793318d1840b?q=80&w=600&auto=format&fit=crop",
    prompt: "Plan a 3-day royal heritage and food tour in Jaipur",
    badge: "Royal Heritage",
  },
];

export default function OnlyExplore({ initialChatId }: { initialChatId?: string }) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [progressStep, setProgressStep] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState(30);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // Version History State
  const [versionHistory, setVersionHistory] = useState<VersionSnapshot[]>([]);
  const [activeVersion, setActiveVersion] = useState<string>('Draft v1');

  const searchParams = useSearchParams();
  const router = useRouter();
  const hasAutoSubmittedRef = useRef(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Single unified smart prompt form
  const promptForm = useForm<z.infer<typeof promptFormSchema>>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: { prompt: '' },
  });

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

  // Auto-scroll chat feed to bottom when new messages arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading, progressStep]);

  // Auto-submit from URL search params or pre-auth intent
  useEffect(() => {
    if (status === 'loading') return;

    if (initialChatId && initialChatId !== currentChatId && status === 'authenticated') {
      handleSelectChat(initialChatId, false);
    } else if (!initialChatId && !isLoading && chatHistory.length === 0 && !hasAutoSubmittedRef.current) {
      const dest = searchParams.get('destination') || '';
      const promptParam = searchParams.get('prompt') || searchParams.get('query') || '';

      if (dest || promptParam) {
        hasAutoSubmittedRef.current = true;
        const exactPrompt = promptParam || `Plan a trip to ${dest}`;
        router.replace('/chat', { scroll: false });
        handleSmartSubmit(exactPrompt);
      }
    }
  }, [initialChatId, status, searchParams]);

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

  /**
   * Unified Smart Dispatcher:
   * Decides whether to generate a new itinerary or edit existing one based on context.
   */
  async function handleSmartSubmit(inputPrompt: string) {
    const query = inputPrompt.trim();
    if (!query) return;

    promptForm.reset();

    // Check if this is an explicit new trip intent while an itinerary is already present
    const isExplicitNewTrip = /\b(new trip|plan a trip to|plan trip to|start over|change destination to)\b/i.test(query);

    if (!currentItinerary || isExplicitNewTrip) {
      await generateNewItinerary(query);
    } else {
      await editExistingItinerary(query);
    }
  }

  /**
   * Generate brand new trip workspace
   */
  async function generateNewItinerary(exactPrompt: string) {
    setIsLoading(true);
    setProgressPercent(20);
    setProgressStep("Analyzing destination & travel intelligence...");

    const userMessage: ChatMessage = {
      type: "user",
      content: exactPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory((prev) => [...prev, userMessage]);

    // Progressive visual steps
    const timer1 = setTimeout(() => {
      setProgressStep("Synchronizing live weather & scenic routes...");
      setProgressPercent(50);
    }, 1200);

    const timer2 = setTimeout(() => {
      setProgressStep("Curating verified stays, cafes & daily timeline...");
      setProgressPercent(80);
    }, 2800);

    try {
      const res = await fetch("/api/itinerary/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: exactPrompt,
          duration: '5 days',
          budget: '50000',
          interests: exactPrompt,
          plan: 'pro'
        }),
      });

      const json = await res.json();
      const result = json.success ? json.data : (json.data || json);

      if (!result || !result.destination) {
        throw new Error("Could not assemble itinerary workspace.");
      }

      setProgressPercent(100);

      const botMessage: ChatMessage = {
        type: "bot",
        content: result,
        rawItinerary: JSON.stringify(result),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatHistory((prev) => [...prev, botMessage]);
      saveVersionSnapshot(result, "Initial AI Plan");

      if (session?.user) {
        try {
          const chatRes = await fetch("/api/chats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: result.destination || exactPrompt }),
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
            setRefreshKey((prev) => prev + 1);
            router.replace(`/chat/${chatData._id}`, { scroll: false });
          }
        } catch (e) {
          console.warn("Could not save chat to database:", e);
        }
      }

      toast({
        title: "Workspace Ready!",
        description: `Assembled interactive itinerary for ${result.destination}.`,
      });

    } catch (error: any) {
      console.error("Error generating itinerary:", error);
      toast({
        variant: "destructive",
        title: "Workspace Setup Fallback",
        description: "Encountered a delay from external AI. Loading curated destination workspace...",
      });
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsLoading(false);
      setProgressStep(null);
    }
  }

  /**
   * Refine or edit existing trip
   */
  async function editExistingItinerary(editPrompt: string) {
    if (!currentItinerary) return;

    setIsEditing(true);
    setProgressStep("Re-optimizing itinerary with new preferences...");

    const userMessage: ChatMessage = {
      type: "user",
      content: editPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory((prev) => [...prev, userMessage]);

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
        throw new Error(json.error || "Failed to update itinerary");
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
        description: "Applied your edits to the live itinerary timeline.",
      });
    } catch (err) {
      console.error("Edit failed:", err);
      toast({
        variant: "destructive",
        title: "Edit Notice",
        description: "Could not apply instant edits. You can customize cards directly in the timeline.",
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
      if (!res.ok) throw new Error("Could not fetch messages");
      const messages = await res.json();

      const formattedHistory: ChatMessage[] = messages.map((m: any) => {
        let content = m.content;
        try {
          content = JSON.parse(m.content);
        } catch {}
        return {
          type: m.role === 'user' ? 'user' : 'bot',
          content,
          timestamp: new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      });

      setChatHistory(formattedHistory);

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
      toast({ title: 'Generating PDF...', description: 'Formatting your high-resolution travel guide.' });
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

      toast({ title: 'PDF Ready!', description: 'Travel guide PDF downloaded.' });
    } catch (e) {
      console.error('Error downloading PDF', e);
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
      toast({ title: "Link Copied", description: "Trip workspace link copied to clipboard." });
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
        <header className="h-14 border-b border-border/70 bg-background/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar">
            {/* Status & Destination Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-500/10 via-primary/10 to-indigo-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300 font-semibold text-xs shrink-0 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-violet-600 animate-pulse" />
              <span className="truncate max-w-[200px]">
                {currentItinerary?.destination ? `${currentItinerary.destination} Workspace` : 'AI Trip Planner Workspace'}
              </span>
            </div>

            {currentItinerary && (
              <>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 text-muted-foreground text-xs font-medium shrink-0">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>{currentItinerary.days?.length || 5} Days</span>
                </div>

                <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 text-muted-foreground text-xs font-medium shrink-0">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>{formatCurrencyDisplay(Number(currentItinerary.totalCost || currentItinerary.budgetBreakdown?.total || 50000))}</span>
                </div>
              </>
            )}

            {/* Version History Selector */}
            {versionHistory.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs font-medium rounded-full bg-card/60">
                    <History className="w-3 h-3 text-violet-600" />
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
                      <span className="text-[10px] text-muted-foreground">{snap.timestamp}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewChat}
              className="h-8 gap-1.5 text-xs font-semibold rounded-full border-border/80 hover:bg-muted"
            >
              <Plus className="w-3.5 h-3.5 text-violet-600" />
              <span className="hidden sm:inline">New Trip</span>
            </Button>

            {currentItinerary && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white gap-1.5 shadow-sm rounded-full text-xs font-semibold px-3.5 h-8">
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Export & Share</span>
                    <ChevronDown className="w-3 h-3 opacity-80" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs">Export & Share Workspace</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDownloadPdf} className="gap-2 text-xs cursor-pointer">
                    <FileText className="w-4 h-4 text-violet-600" />
                    <span>Export PDF Itinerary</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportCalendar} className="gap-2 text-xs cursor-pointer">
                    <CalendarPlus className="w-4 h-4 text-blue-600" />
                    <span>Add to Calendar (.ics)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareWorkspace} className="gap-2 text-xs cursor-pointer">
                    <Share2 className="w-4 h-4 text-emerald-600" />
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
          
          {/* LEFT PANEL: AI Copilot Feed */}
          <div className="w-full md:w-[38%] lg:w-[32%] border-r border-border/70 bg-card/40 flex flex-col h-full shrink-0 relative">
            
            {/* Conversation Header */}
            <div className="p-3.5 border-b border-border/70 bg-card/70 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background" />
                </div>
                <div>
                  <h4 className="font-bold text-xs leading-none">AI Travel Copilot</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Gemini Intelligence • Always Live</p>
                </div>
              </div>
              
              {progressStep && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300 rounded-full text-[10px] font-medium animate-pulse">
                  <Sparkles className="w-3 h-3 animate-spin" />
                  <span className="truncate max-w-[120px]">{progressStep}</span>
                </div>
              )}
            </div>

            {/* Conversation Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
              {chatHistory.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
                  <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 border border-violet-500/20 flex items-center justify-center text-violet-600 shadow-sm">
                    <Compass className="w-7 h-7 animate-pulse stroke-[1.8]" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-sm text-foreground">Welcome to Travel Copilot</h4>
                    <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                      Tell me your destination, budget, or travel style to construct an interactive day-by-day trip workspace.
                    </p>
                  </div>
                </div>
              )}

              {chatHistory.map((message, index) => {
                if (message.type === 'user') {
                  return (
                    <div key={index} className="flex justify-end items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2">
                      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-3.5 rounded-2xl rounded-tr-xs text-xs max-w-[85%] shadow-sm leading-relaxed">
                        <p>{message.content as string}</p>
                        {message.timestamp && <span className="text-[9px] text-white/70 block text-right mt-1">{message.timestamp}</span>}
                      </div>
                      <Avatar className="w-6 h-6 shrink-0 mt-1 border border-violet-400">
                        <AvatarFallback className="bg-violet-100 text-violet-700 text-[10px] font-bold">YOU</AvatarFallback>
                      </Avatar>
                    </div>
                  );
                }

                if (message.type === 'bot') {
                  return (
                    <div key={index} className="flex justify-start items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2">
                      <Avatar className="w-6 h-6 shrink-0 mt-1 border border-violet-200">
                        <AvatarFallback className="bg-violet-50 text-violet-600">
                          <Bot className="w-3.5 h-3.5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-card border border-border/80 text-foreground p-3.5 rounded-2xl rounded-tl-xs text-xs max-w-[88%] shadow-xs leading-relaxed space-y-2">
                        {typeof message.content === 'string' ? (
                          <p>{message.content}</p>
                        ) : (
                          <div>
                            <div className="flex items-center gap-1.5 text-violet-600 font-semibold mb-1 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Live Workspace Updated</span>
                            </div>
                            <p className="text-muted-foreground text-[11px] leading-relaxed">
                              Crafted customized itinerary for <strong className="text-foreground font-semibold">{message.content.destination}</strong> with {message.content.days?.length || 5} days of activities, hotel choices, and budget intelligence.
                            </p>
                          </div>
                        )}
                        {message.timestamp && <span className="text-[9px] text-muted-foreground block text-right">{message.timestamp}</span>}
                      </div>
                    </div>
                  );
                }
                return null;
              })}

              {(isLoading || isEditing) && (
                <div className="flex justify-start items-start gap-2.5 animate-in fade-in">
                  <Avatar className="w-6 h-6 shrink-0 mt-1 border border-violet-200">
                    <AvatarFallback className="bg-violet-50 text-violet-600">
                      <Bot className="w-3.5 h-3.5 animate-spin" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200/60 dark:border-violet-800/40 p-3 rounded-2xl rounded-tl-xs text-xs text-violet-700 dark:text-violet-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-violet-600 animate-ping" />
                    <span>{progressStep || "Assembling travel workspace..."}</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Suggestion Chips */}
            {currentItinerary && (
              <div className="px-3.5 py-2 bg-muted/30 border-t border-border/70 flex items-center gap-1.5 overflow-x-auto hide-scrollbar shrink-0">
                {[
                  "Make it budget friendly",
                  "Add 1 more day",
                  "Suggest luxury stays",
                  "Focus on local food & cafes",
                ].map((sug) => (
                  <button
                    key={sug}
                    onClick={() => handleSmartSubmit(sug)}
                    className="px-2.5 py-1 bg-background hover:bg-violet-50 dark:hover:bg-violet-950/40 text-muted-foreground hover:text-violet-600 text-[10px] font-medium rounded-full border border-border/70 hover:border-violet-300 transition-all shrink-0 active:scale-95"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            )}

            {/* Smart Unified Prompt Input Bar */}
            <div className="p-3 border-t border-border/70 bg-card/80 backdrop-blur-md shrink-0">
              <Form {...promptForm}>
                <form
                  onSubmit={promptForm.handleSubmit((values) => handleSmartSubmit(values.prompt))}
                  className="flex items-center gap-2"
                >
                  <FormField
                    control={promptForm.control}
                    name="prompt"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <div className="relative">
                            <Wand2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-violet-600" />
                            <Input
                              placeholder={
                                currentItinerary
                                  ? "Refine trip (e.g. 'Add beach day' or 'Plan Manali trip')..."
                                  : "Where to? (e.g. 'Plan a budget friendly Palampur trip')..."
                              }
                              className="pl-9 pr-3 h-10 text-xs rounded-xl bg-background border-border/80 focus-visible:ring-violet-500"
                              {...field}
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isEditing || isLoading}
                    className="h-10 w-10 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl shrink-0 shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    <SendHorizonal className="h-4 w-4" />
                  </Button>
                </form>
              </Form>
            </div>
          </div>

          {/* RIGHT PANEL: Live Trip Workspace Canvas */}
          <div className="flex-1 bg-background flex flex-col h-full overflow-y-auto custom-scrollbar relative p-4 md:p-6">
            {currentItinerary ? (
              <div className="max-w-5xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
                <ItineraryDashboard
                  itinerary={currentItinerary}
                  onRequestEdit={(req) => handleSmartSubmit(req)}
                />
              </div>
            ) : isLoading ? (
              /* Ultra-Luxurious Animated Workspace Setup Screen */
              <div className="flex flex-col items-center justify-center min-h-full max-w-lg mx-auto text-center p-6 space-y-6 animate-in fade-in">
                {/* Glowing AI Orb */}
                <div className="relative">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-[0_12px_30px_rgba(124,58,237,0.35)] animate-pulse">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div className="absolute -inset-1 rounded-3xl bg-violet-500/20 blur-xl -z-10 animate-ping" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-black text-xl text-foreground font-headline tracking-tight">
                    Setting up Live Workspace...
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    {progressStep || "Architecting customized day-by-day timeline, hotel picks & live climate sync."}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-xs bg-muted/60 h-2 rounded-full overflow-hidden border border-border/50">
                  <div
                    className="bg-gradient-to-r from-violet-600 via-primary to-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Step Checklist Preview */}
                <div className="w-full max-w-xs space-y-2.5 text-left text-xs bg-card/80 backdrop-blur-md p-4 rounded-2xl border border-border/70 shadow-xs">
                  <div className="flex items-center gap-2.5 text-foreground font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Destination Intelligence & Altitude</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-violet-600 font-medium">
                    <div className="w-4 h-4 rounded-full border-2 border-violet-600 border-t-transparent animate-spin shrink-0" />
                    <span>Synchronizing Weather & Routes</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-muted-foreground/70">
                    <div className="w-4 h-4 rounded-full border border-border shrink-0" />
                    <span>Day-by-Day Timeline & Stays</span>
                  </div>
                </div>

                {/* Shimmering Outline Cards */}
                <div className="grid grid-cols-2 gap-3 w-full opacity-40 blur-[0.5px]">
                  <Skeleton className="h-28 rounded-2xl" />
                  <Skeleton className="h-28 rounded-2xl" />
                </div>
              </div>
            ) : (
              /* Inspiring Trip Launchpad */
              <div className="max-w-4xl mx-auto w-full my-auto py-8 space-y-8 animate-in fade-in duration-300">
                {/* Hero Header */}
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-semibold border border-violet-500/20">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Trip Architect</span>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground font-headline">
                    Where will your next journey begin?
                  </h1>
                  <p className="text-xs md:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Select a destination below or describe your dream vacation in the copilot chat to construct an interactive travel workspace in seconds.
                  </p>
                </div>

                {/* Featured Destination Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {FEATURED_DESTINATIONS.map((dest) => (
                    <div
                      key={dest.name}
                      onClick={() => handleSmartSubmit(dest.prompt)}
                      className="group cursor-pointer relative overflow-hidden rounded-2xl border border-border/80 bg-card hover:border-violet-500/50 hover:shadow-[0_12px_30px_rgba(124,58,237,0.12)] transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
                    >
                      {/* Image Thumbnail */}
                      <div className="h-36 w-full relative overflow-hidden">
                        <img
                          src={dest.image}
                          alt={dest.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-semibold text-white border border-white/20">
                          {dest.badge}
                        </span>
                        <div className="absolute bottom-2 left-2.5 right-2.5 text-white">
                          <h4 className="font-bold text-base leading-tight font-headline">{dest.name}</h4>
                          <p className="text-[10px] text-white/80">{dest.region}</p>
                        </div>
                      </div>

                      {/* Content & Action */}
                      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                          {dest.vibe}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs font-semibold text-violet-600 dark:text-violet-400 group-hover:translate-x-0.5 transition-transform">
                          <span>Build Workspace</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Feature Highlights Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center gap-3 shadow-2xs">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs">Day-by-Day Timeline</h5>
                      <p className="text-[10px] text-muted-foreground">Custom morning to night plans</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center gap-3 shadow-2xs">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs">Real-Time Cost Breakdown</h5>
                      <p className="text-[10px] text-muted-foreground">Flights, hotels, food & activities</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center gap-3 shadow-2xs">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs">Smart Geo Navigation</h5>
                      <p className="text-[10px] text-muted-foreground">Live maps, coordinates & PDF export</p>
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
