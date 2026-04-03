"use client";

import { useState } from 'react';
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
  Thermometer,
  CloudRain,
  Wind,
  Droplets,
  CheckSquare,
  ShieldQuestion,
  Tent,
  CircleDollarSign,
} from 'lucide-react';

import { generateTravelItinerary } from '@/ai/flows/generate-travel-itinerary';
import { editItinerary } from '@/ai/flows/edit-travel-itinerary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { formatCurrencyDisplay, parseCurrencyValue } from '@/lib/currency';
import { Sidebar } from './Sidebar';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { TravelMap } from '@/components/TravelMap';
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

  // Fallback
  activities: z.array(ActivitySchema).optional(),
});

const ItinerarySchema = z.object({
  destination: z.string(),
  duration: z.number(),
  budget: z.number(),
  interests: z.array(z.string()),
  
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
type ItineraryDay = z.infer<typeof ItineraryDaySchema>;

type ChatMessage = {
  type: 'user' | 'bot';
  content: string | Itinerary;
  rawItinerary?: string;
};

const plannerFormSchema = z.object({
  destination: z.string().min(3, 'Please enter a destination.'),
  duration: z.string().min(3, 'Please enter a trip duration.'),
  budget: z.string().min(2, 'Please enter a budget.'),
  interests: z.string().min(3, 'Please list some interests.'),
});

const editFormSchema = z.object({
  editRequest: z.string().min(5, 'Please enter a more detailed request.'),
});

const ItineraryContent = ({ itinerary, onRequestEdit }: { itinerary: Itinerary, onRequestEdit?: (req: string) => void }) => {
  return <ItineraryDashboard itinerary={itinerary} onRequestEdit={onRequestEdit} />;
};

export default function OnlyExplore({ initialChatId }: { initialChatId?: string }) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      toast({ title: 'Success', description: 'Email verified successfully. You can now log in.' });
      router.replace('/');
    }
  }, [searchParams, router, toast]);

  // Load initial chat if it exists
  useEffect(() => {
    if (status === 'loading') return;

    if (initialChatId && initialChatId !== currentChatId && status === 'authenticated') {
      handleSelectChat(initialChatId, false);
    } else if (!initialChatId && searchParams.has('destination') && !isLoading && chatHistory.length === 0) {
      const dest = searchParams.get('destination') || '';
      plannerForm.setValue('destination', dest);
      
      // Auto submit with dummy data if not filled, or let user fill the rest? 
      // The requirement: "The chat page should initially create a new chat and start planning."
      // Let's just set the destination. The user can click 'Start Planning'. Wait, requirement says:
      // "The chat page should automatically create a new chat and start planning."
      // I will simulate form submit if we have destination but need other fields? We can just use defaults.
      onPlannerSubmit({
        destination: dest,
        duration: '5 days',
        budget: '50000',
        interests: 'sightseeing, food'
      });
      // Remove the query param to prevent endless re-triggering
      router.replace('/chat');
    }
  }, [initialChatId, status, searchParams]);

  const plannerForm = useForm<z.infer<typeof plannerFormSchema>>({
    resolver: zodResolver(plannerFormSchema),
    defaultValues: {
      destination: '',
      duration: '',
      budget: '',
      interests: '',
    },
  });

  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: { editRequest: '' },
  });

  // Helper function to extract numbers from strings and convert to rupees
  const extractNumberFromString = (value: any): number | undefined => {
    return parseCurrencyValue(value);
  };

  // Enhanced JSON cleaning function
  const cleanJsonString = (jsonStr: string): string => {
    let cleaned = jsonStr;

    // Remove any trailing commas before closing braces/brackets
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

    // Remove any control characters that might break JSON
    cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '');

    // Fix any potential double quotes issues in descriptions
    cleaned = cleaned.replace(/([^\\])\\"/g, '$1"');

    // Remove any trailing characters after the last closing brace
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1) {
      cleaned = cleaned.substring(0, lastBrace + 1);
    }

    return cleaned;
  };

  // Alternative extraction method using regex
  const tryAlternativeJsonExtraction = (text: string, source: 'initial' | 'edit'): boolean => {
    try {
      // Use regex to find JSON object more precisely
      const jsonMatch = text.match(/\{(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*\}/);

      if (jsonMatch && jsonMatch[0]) {
        const cleanedJson = cleanJsonString(jsonMatch[0]);
        const parsedData = JSON.parse(cleanedJson);

        // Process the successfully parsed data
        processValidItinerary(parsedData, source);
        return true;
      }

      // If that fails, try to extract key sections manually
      return tryManualExtraction(text, source);

    } catch (error) {
      console.error('Alternative extraction failed:', error);
      return false;
    }
  };

  // Manual extraction as last resort
  const tryManualExtraction = (text: string, source: 'initial' | 'edit'): boolean => {
    try {
      const extracted: any = { days: [] };

      // Extract destination
      const destMatch = text.match(/"destination":\s*"([^"]+)"/);
      if (destMatch) extracted.destination = destMatch[1];

      // Extract duration
      const durationMatch = text.match(/"duration":\s*(\d+)/);
      if (durationMatch) extracted.duration = parseInt(durationMatch[1]);

      // Extract budget
      const budgetMatch = text.match(/"budget":\s*(\d+)/);
      if (budgetMatch) extracted.budget = parseInt(budgetMatch[1]);

      // Extract interests
      const interestsMatch = text.match(/"interests":\s*\[([^\]]+)\]/);
      if (interestsMatch) {
        extracted.interests = interestsMatch[1].split(',').map((s: string) => s.replace(/"/g, '').trim());
      }

      // Create basic structure if we have essential data
      if (extracted.destination) {
        if (extracted.days.length === 0) {
          extracted.days = [{
            day: 1,
            activities: [
              { name: "Explore " + extracted.destination, description: "Start your adventure" }
            ]
          }];
        }

        processValidItinerary(extracted, source);
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  };

  // Helper to process valid itinerary data
  const processValidItinerary = (data: any, source: 'initial' | 'edit') => {
    let finalData = data;

    if (data.itinerary) {
      finalData = typeof data.itinerary === 'string' ? JSON.parse(data.itinerary) : data.itinerary;
    } else if (data.updatedItinerary) {
      finalData = typeof data.updatedItinerary === 'string' ? JSON.parse(data.updatedItinerary) : data.updatedItinerary;
    }

    const transformedData = {
      destination: finalData.destination || "Unknown Destination",
      duration: typeof finalData.duration === 'number' ? finalData.duration : (extractNumberFromString(finalData.duration) || 7),
      budget: typeof finalData.budget === 'number' ? finalData.budget : (extractNumberFromString(finalData.budget) || 50000),
      interests: Array.isArray(finalData.interests)
        ? finalData.interests
        : (typeof finalData.interests === 'string'
          ? finalData.interests.split(',').map((s: string) => s.trim())
          : []),
      days: Array.isArray(finalData.days)
        ? finalData.days.map((day: any) => ({
          day: typeof day.day === 'number' ? day.day : parseInt(day.day) || 1,
          activities: Array.isArray(day.activities) ? day.activities : [],
          cost: day.cost ? (typeof day.cost === 'number' ? day.cost : extractNumberFromString(day.cost)) : undefined
        }))
        : [],
      totalCost: finalData.totalCost
        ? (typeof finalData.totalCost === 'number' ? finalData.totalCost : extractNumberFromString(finalData.totalCost))
        : undefined,
      notes: finalData.notes || undefined
    };

    const validationResult = ItinerarySchema.safeParse(transformedData);

    if (validationResult.success) {
      const newBotMessage: ChatMessage = {
        type: 'bot',
        content: validationResult.data,
        rawItinerary: JSON.stringify(validationResult.data),
      };
      if (source === 'initial') {
        setChatHistory([newBotMessage]);
      } else {
        setChatHistory(prev => [...prev, newBotMessage]);
      }

      toast({
        title: 'Success!',
        description: `Your ${finalData.destination} trip is ready!`,
      });
    }
  };

  const parseAndSetItinerary = (text: string, source: 'initial' | 'edit') => {
    try {
      console.log('Raw response text length:', text.length);
      console.log('Raw response text:', text.substring(0, 100) + '...' + text.substring(text.length - 100)); // Show first and last 100 chars

      let parsedData: any;
      let jsonString = text.trim();

      // Method 1: Find the JSON object boundaries more precisely
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        // Extract only the JSON part, ignoring any trailing content
        jsonString = jsonString.substring(firstBrace, lastBrace + 1);

        // Clean up any potential issues
        jsonString = cleanJsonString(jsonString);

        console.log('Extracted JSON string length:', jsonString.length);
        console.log('First 200 chars of JSON:', jsonString.substring(0, 200));
        console.log('Last 200 chars of JSON:', jsonString.substring(jsonString.length - 200));

        parsedData = JSON.parse(jsonString);
      } else {
        throw new Error("Could not find valid JSON boundaries in the response.");
      }

      let finalData: any;

      // The AI can nest the itinerary object, so we need to find it
      if (parsedData.itinerary) {
        finalData = typeof parsedData.itinerary === 'string' ? JSON.parse(parsedData.itinerary) : parsedData.itinerary;
      } else if (parsedData.updatedItinerary) {
        finalData = typeof parsedData.updatedItinerary === 'string' ? JSON.parse(parsedData.updatedItinerary) : parsedData.updatedItinerary;
      } else {
        // The data is already at the root level
        finalData = parsedData;
      }

      // Transform the data to match the expected schema
      const transformedData = {
        destination: finalData.destination || "Unknown Destination",
        duration: typeof finalData.duration === 'number' ? finalData.duration : (extractNumberFromString(finalData.duration) || 7),
        budget: typeof finalData.budget === 'number' ? finalData.budget : (extractNumberFromString(finalData.budget) || 50000),
        interests: Array.isArray(finalData.interests)
          ? finalData.interests
          : (typeof finalData.interests === 'string'
            ? finalData.interests.split(',').map((s: string) => s.trim())
            : []),
        days: Array.isArray(finalData.days)
          ? finalData.days.map((day: any) => ({
            day: typeof day.day === 'number' ? day.day : parseInt(day.day) || 1,
            activities: Array.isArray(day.activities) ? day.activities : [],
            cost: day.cost ? (typeof day.cost === 'number' ? day.cost : extractNumberFromString(day.cost)) : undefined
          }))
          : [],
        totalCost: finalData.totalCost
          ? (typeof finalData.totalCost === 'number' ? finalData.totalCost : extractNumberFromString(finalData.totalCost))
          : undefined,
        notes: finalData.notes || undefined
      };

      console.log('Transformed data:', transformedData);

      const validationResult = ItinerarySchema.safeParse(transformedData);

      if (validationResult.success) {
        const newBotMessage: ChatMessage = {
          type: 'bot',
          content: validationResult.data,
          rawItinerary: JSON.stringify(validationResult.data),
        };
        if (source === 'initial') {
          setChatHistory([newBotMessage]);
        } else {
          setChatHistory(prev => [...prev, newBotMessage]);
        }

        toast({
          title: 'Itinerary Updated!',
          description: `Your ${finalData.destination} trip has been updated!`,
        });
      } else {
        console.error('Itinerary validation error:', validationResult.error);
        toast({
          variant: 'destructive',
          title: 'Could not understand the itinerary.',
          description: 'The AI returned a plan in an unexpected format. Please try again.',
        });
      }
    } catch (e) {
      console.error('Failed to parse itinerary JSON:', e);
      console.error('Error details:', e instanceof Error ? e.message : 'Unknown error');

      // Try alternative parsing methods as backup
      if (tryAlternativeJsonExtraction(text, source)) {
        return; // Success with alternative method
      }

      toast({
        variant: 'destructive',
        title: 'Could not read the itinerary.',
        description: 'The AI response was not in a readable format. Please try again.',
      });
    }
  }

  async function onPlannerSubmit(values: any) {
    setIsLoading(true);
    setChatHistory([]);

    try {
      const plan = (session?.user as any)?.plan || 'free';
      console.log("Sending request with values:", { ...values, plan });

      const result = await generateTravelItinerary({ ...values, plan });

      console.log("AI Generated Travel Data:", result);

      if (!result) {
        throw new Error("AI returned empty result.");
      }

      const newBotMessage: ChatMessage = {
        type: "bot",
        content: result, // <-- DIRECT OBJECT
        rawItinerary: JSON.stringify(result),
      };

      setChatHistory([newBotMessage]);

      if (session?.user) {
        try {
          // Save the chat to db
          const chatRes = await fetch("/api/chats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: `Trip to ${result.destination || "Unknown"}` }),
          });
          const chatData = await chatRes.json();
          if (chatData._id) {
            setCurrentChatId(chatData._id);
            // Save prompt as message
            await fetch("/api/messages", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chatId: chatData._id, role: "user", content: `Plan a trip to ${values.destination}` })
            });
            // Save itinerary as message
            await fetch("/api/messages", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chatId: chatData._id, role: "assistant", content: JSON.stringify(result) })
            });
            setRefreshKey(prev => prev + 1);
            router.push(`/chat/${chatData._id}`);
          }
        } catch (e) { console.error("Could not save to db", e); }
      }

      toast({
        title: "Success!",
        description: result?.destination ? `Your ${result.destination} trip is ready!` : "Your trip is ready!",
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
    }
  }

  async function onEditSubmit(values: z.infer<typeof editFormSchema>) {
    const lastMessage = chatHistory[chatHistory.length - 1];
    if (!lastMessage || lastMessage.type !== 'bot' || !lastMessage.rawItinerary) return;

    setIsEditing(true);
    const userMessage: ChatMessage = { type: 'user', content: values.editRequest };
    setChatHistory(prev => [...prev, userMessage]);

    try {
      const result = await editItinerary({ itinerary: lastMessage.rawItinerary, editRequest: values.editRequest });
      if (result.updatedItinerary) {
        parseAndSetItinerary(result.updatedItinerary, 'edit');

        // Save edit to db if we have a current chat
        if (session?.user && currentChatId) {
          try {
            await fetch("/api/messages", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chatId: currentChatId, role: "user", content: values.editRequest })
            });
            await fetch("/api/messages", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chatId: currentChatId, role: "assistant", content: result.updatedItinerary })
            });
            setRefreshKey(prev => prev + 1);
          } catch (e) { console.error("Could not save edit to db", e); }
        }

      } else {
        throw new Error("Received empty updated itinerary from AI.");
      }
      editForm.reset();
    } catch (error) {
      console.error('Error editing itinerary:', error);
      toast({
        variant: 'destructive',
        title: 'Oops! Couldn\'t make that change.',
        description: 'There was an issue updating your itinerary. Please rephrase your request.',
      });
      // remove the user message if edit fails
      setChatHistory(prev => prev.slice(0, prev.length - 1));
    } finally {
      setIsEditing(false);
    }
  }

  const getLatestItinerary = (): { itinerary: Itinerary | null, rawItinerary: string | null } => {
    const lastBotMessage = [...chatHistory].reverse().find(m => m.type === 'bot');
    if (lastBotMessage && typeof lastBotMessage.content !== 'string') {
      return { itinerary: lastBotMessage.content, rawItinerary: lastBotMessage.rawItinerary || null };
    }
    return { itinerary: null, rawItinerary: null };
  };

  const handleCopyToClipboard = async () => {
    const { itinerary } = getLatestItinerary();
    if (!itinerary) return;

    let formattedText = `Your Trip to ${itinerary.destination}\n\n`;
    itinerary.days.forEach((day: ItineraryDay) => {
      formattedText += `Day ${day.day}\n`;
      const allActs = [
        ...(day.morning || []),
        ...(day.afternoon || []),
        ...(day.evening || []),
        ...(day.activities || [])
      ];
      allActs.forEach(activity => {
        formattedText += `- ${activity.name}`;
        if (activity.description) {
          formattedText += `: ${activity.description}`;
        }
        formattedText += `\n`;
      });
      if (day.cost) {
        formattedText += `Estimated Cost: ${formatCurrencyDisplay(day.cost)}\n`;
      }
      formattedText += `\n`;
    });

    if (itinerary.notes) {
      formattedText += `Notes:\n${itinerary.notes}\n`;
    }

    try {
      await navigator.clipboard.writeText(formattedText);
      toast({ title: 'Itinerary copied to clipboard!' });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Could not copy itinerary.',
        description: 'Your browser may not support this feature or an error occurred.',
      });
    }
  };

  const handleShare = async () => {
    const { itinerary } = getLatestItinerary();
    if (!itinerary) return;

    let formattedText = `Check out my trip to ${itinerary.destination}!\n\n`;
    itinerary.days.forEach(day => {
      formattedText += `Day ${day.day}\n`;
      const allActs = [
        ...(day.morning || []),
        ...(day.afternoon || []),
        ...(day.evening || []),
        ...(day.activities || [])
      ];
      allActs.forEach(activity => {
        formattedText += `- ${activity.name}${activity.description ? `: ${activity.description}` : ''}\n`;
      });
      if (day.cost) {
        formattedText += `Estimated Cost: ${formatCurrencyDisplay(day.cost)}\n`;
      }
      formattedText += `\n`;
    });
    if (itinerary.notes) {
      formattedText += `Notes:\n${itinerary.notes}\n`;
    }

    const shareData = {
      title: `My Travel Itinerary for ${itinerary.destination}`,
      text: formattedText,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({ title: 'Itinerary shared successfully!' });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        console.error('Error sharing itinerary:', error);
        toast({
          variant: "destructive",
          title: 'Sharing failed.',
          description: 'Could not share itinerary. Please try again.',
        });
      }
    } else {
      handleCopyToClipboard();
    }
  };


  const handleDownloadPdf = async () => {
    const { itinerary } = getLatestItinerary();
    if (!itinerary) return;
    try {
      toast({ title: 'Generating PDF...', description: 'Please wait while we format your itinerary.' });
      const res = await fetch('/api/export-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itinerary })
      });

      if (!res.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OnlyExplore-Itinerary-${itinerary.destination.replace(/\s/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({ title: 'PDF Downloaded!', description: 'Your high-quality pdf itinerary has been saved.' });
    } catch (e) {
      console.error('Error downloading PDF', e);
      toast({
        variant: 'destructive',
        title: 'Could not download PDF.',
        description: 'An unexpected error occurred during generation.',
      });
    }
  };

  const ItineraryLoader = () => (
    <Card className="w-full max-w-4xl animate-pulse">
      <CardHeader>
        <Skeleton className="h-8 w-3/5 rounded-md" />
        <Skeleton className="h-5 w-2/5 rounded-md" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-1/4 rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-5/6 rounded-md" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-1/4 rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-4/6 rounded-md" />
          <Skeleton className="h-4 w-5/6 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );

  const handleSelectChat = async (chatId: string, navigate = true) => {
    setIsLoading(true);
    setCurrentChatId(chatId);
    if (navigate) {
      router.push(`/chat/${chatId}`);
    }
    try {
      const res = await fetch(`/api/messages?chatId=${chatId}`);
      if (res.status === 404) {
        toast({ variant: "destructive", title: "This is a private chat." });
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
            const parsed = JSON.parse(m.content);
            content = parsed;
            rawItinerary = m.content;
          } catch (e) {
            // Handle raw string
          }
        }
        return {
          type: m.role === 'user' ? 'user' : 'bot',
          content,
          rawItinerary
        };
      });
      setChatHistory(formattedHistory);
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Could not load trip" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setChatHistory([]);
    setCurrentChatId(null);
    router.push('/chat');
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="fullscreen-content relative w-full h-full">
          <div className="fullscreen-bg absolute inset-0" style={{ backgroundImage: 'url(/bg_image2.png)' }} />
          <div className="fullscreen-overlay absolute inset-0 bg-black/40 flex items-center justify-center">
            <ItineraryLoader />
          </div>
        </div>
      );
    }

    if (chatHistory.length > 0) {
      const { itinerary } = getLatestItinerary();
      return (
        <div className="fullscreen-content relative w-full h-full">
          <div className="fullscreen-bg absolute inset-0" style={{ backgroundImage: 'url(/bg_image2.png)' }} />
          <div className="fullscreen-overlay absolute inset-0 bg-black/40 flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl shadow-2xl shadow-primary/10 flex flex-col h-[90vh] bg-white/95 overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="font-headline text-3xl text-foreground">Your Trip to {itinerary?.destination || '...'}</CardTitle>
                    <CardDescription>Here is your personalized AI-generated travel plan. Have fun!</CardDescription>
                  </div>
                  <TooltipProvider>
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={handleShare}>
                            <Share2 className="h-5 w-5 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Share</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={handleCopyToClipboard}>
                            <Copy className="h-5 w-5 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Copy</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={handleDownloadPdf}>
                            <Download className="h-5 w-5 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Download PDF</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <CalendarPlus className="h-5 w-5 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Add to Calendar</p></TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </div>
              </CardHeader>
              <CardContent className="flex-grow overflow-y-auto custom-scrollbar p-6 pt-0">
                <div className="space-y-4">
                  {chatHistory.map((message, index) => {
                    if (message.type === 'bot') {
                      return (
                        <div key={index} className="flex items-start gap-4">
                          <Avatar className="border-2 border-accent">
                            <AvatarFallback className="bg-accent text-accent-foreground">
                              <Bot className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-muted rounded-lg p-4 w-full">
                            {typeof message.content === 'string' ? <p>{message.content}</p> : <ItineraryContent itinerary={message.content} onRequestEdit={(req) => { editForm.setValue('editRequest', req); onEditSubmit(editForm.getValues()); }} />}
                          </div>
                        </div>
                      )
                    }
                    if (message.type === 'user') {
                      return (
                        <div key={index} className="flex items-start gap-4 justify-end">
                          <div className="bg-primary/20 rounded-lg p-4 max-w-[80%]">
                            <p className="text-primary-foreground">{message.content as string}</p>
                          </div>
                          <Avatar>
                            <AvatarFallback className="bg-secondary">
                              <User className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      )
                    }
                    return null;
                  })}

                  {isEditing && (
                    <div className="flex items-center gap-4">
                      <Avatar className="border-2 border-accent">
                        <AvatarFallback className="bg-accent text-accent-foreground">
                          <Bot className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center space-x-2 bg-muted p-3 rounded-lg">
                        <Skeleton className="h-4 w-4 rounded-full bg-accent" />
                        <Skeleton className="h-4 w-4 rounded-full bg-accent" />
                        <Skeleton className="h-4 w-4 rounded-full bg-accent" />
                        <p className="text-sm text-muted-foreground">Rethinking your adventure...</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Form {...editForm}>
                  <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="w-full flex items-center gap-2">
                    <FormField
                      control={editForm.control}
                      name="editRequest"
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormControl>
                            <div className="relative">
                              <Wand2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input placeholder="Need a change? Tell me what to edit..." className="pl-10" {...field} />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" size="icon" disabled={isEditing}>
                      <SendHorizonal className="h-5 w-5" />
                    </Button>
                  </form>
                </Form>
              </CardFooter>
            </Card>
          </div>
        </div>
      );
    }

    return (
      <div className="fullscreen-content relative w-full h-full">
        <div className="fullscreen-bg absolute inset-0" style={{ backgroundImage: 'url(/bg_image2.png)' }} />
        <div className="fullscreen-overlay absolute inset-0 bg-black/40 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl shadow-2xl shadow-primary/10 bg-white/95">
            <CardHeader className="text-center">
              <div className="mx-auto bg-primary/20 p-3 rounded-full w-fit mb-4">
                <Plane className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="font-headline text-3xl">Welcome to Only Explore</CardTitle>
              <CardDescription>Your AI-powered travel planner. Let's dream up your next adventure together.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...plannerForm}>
                <form onSubmit={plannerForm.handleSubmit(onPlannerSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={plannerForm.control}
                      name="destination"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Where to?</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input placeholder="e.g., Paris, France" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={plannerForm.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How long?</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input placeholder="e.g., 7 days" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={plannerForm.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input placeholder="e.g., ₹50000" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={plannerForm.control}
                      name="interests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What are you into?</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              <Input placeholder="e.g., food, history, hiking" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg font-bold" disabled={isLoading}>
                    {isLoading ? 'Planning...' : 'Plan My Trip!'}
                    {!isLoading && <Plane className="ml-2 h-5 w-5" />}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="flex w-full h-screen overflow-hidden bg-background">
      <Sidebar onSelectChat={handleSelectChat} onNewChat={handleNewChat} refreshKey={refreshKey} />
      <div className="flex-1 relative overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
}
