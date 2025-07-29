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

const ItineraryDaySchema = z.object({
  day: z.number(),
  activities: z.array(z.string()),
  cost: z.number().optional(),
});

const ItinerarySchema = z.object({
  destination: z.string(),
  duration: z.number(),
  budget: z.number(),
  interests: z.string(),
  days: z.array(ItineraryDaySchema),
  totalCost: z.number().optional(),
  notes: z.string().optional(),
});
type Itinerary = z.infer<typeof ItinerarySchema>;

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

const ItineraryContent = ({ itinerary }: { itinerary: Itinerary }) => {
  return (
    <Accordion type="single" collapsible className="w-full" defaultValue="day-1">
      {itinerary.days.map((day) => (
        <AccordionItem value={`day-${day.day}`} key={`day-${day.day}`}>
          <AccordionTrigger className="font-headline text-lg hover:no-underline text-foreground">
            Day {day.day}
          </AccordionTrigger>
          <AccordionContent className="pt-2 text-base">
            <ul className="space-y-2">
              {day.activities.map((activity, index) => (
                <li key={index} className="ml-6 list-disc text-muted-foreground marker:text-accent">
                  {activity}
                </li>
              ))}
            </ul>
            {day.cost && (
              <p className="mt-3 font-semibold text-card-foreground">
                Estimated Cost: ${day.cost.toLocaleString()}
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
       {itinerary.notes && (
        <div className="mt-4 rounded-lg border border-accent/50 bg-accent/10 p-4">
            <h4 className="font-bold text-accent-foreground mb-2">Notes from your Planner</h4>
            <p className="text-sm text-accent-foreground/80">{itinerary.notes}</p>
        </div>
      )}
    </Accordion>
  );
};

export default function OnlyExplore() {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

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
  
  const parseAndSetItinerary = (text: string, source: 'initial' | 'edit') => {
    try {
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        
        if (jsonStart === -1 || jsonEnd === -1) {
          throw new Error("No JSON object found in the response.");
        }

        const jsonString = text.substring(jsonStart, jsonEnd + 1);
        const parsedData = JSON.parse(jsonString);
        const validationResult = ItinerarySchema.safeParse(parsedData);

        if (validationResult.success) {
            const newBotMessage: ChatMessage = {
                type: 'bot',
                content: validationResult.data,
                rawItinerary: jsonString,
            };
            if (source === 'initial') {
              setChatHistory([newBotMessage]);
            } else {
              setChatHistory(prev => [...prev, newBotMessage]);
            }
        } else {
            console.error('Itinerary validation error:', validationResult.error);
            toast({
              variant: 'destructive',
              title: 'Could not understand the itinerary.',
              description: 'The AI returned a plan in an unexpected format. Please try again.',
            });
        }
    } catch(e) {
        console.error('Failed to parse itinerary JSON:', e);
         toast({
            variant: 'destructive',
            title: 'Could not read the itinerary.',
            description: 'The AI response was not in a readable format. Please try again.',
        });
    }
  }

  async function onPlannerSubmit(values: z.infer<typeof plannerFormSchema>) {
    setIsLoading(true);
    setChatHistory([]);
    try {
      const result = await generateTravelItinerary(values);
      if (result.itinerary) {
        parseAndSetItinerary(result.itinerary, 'initial');
      } else {
        throw new Error("Received empty itinerary from AI.");
      }
    } catch (error) {
      console.error('Error generating itinerary:', error);
      toast({
        variant: 'destructive',
        title: 'Oh no! Something went wrong.',
        description: 'We couldn\'t generate your itinerary. Please try again.',
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
       setChatHistory(prev => prev.slice(0, prev.length -1));
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
      const { rawItinerary } = getLatestItinerary();
      if (!rawItinerary) return;
      try {
        await navigator.clipboard.writeText(rawItinerary);
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
    const { itinerary, rawItinerary } = getLatestItinerary();
    if (!itinerary || !rawItinerary) return;
    
    const shareData = {
      title: `My Travel Itinerary for ${itinerary.destination}`,
      text: `Check out my trip to ${itinerary.destination}! Here is the plan:\n\n${rawItinerary}`,
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
            toast({ title: 'Itinerary shared successfully!' });
        } catch (error) {
            console.error('Error sharing itinerary:', error);
            toast({
                title: 'Sharing failed, copied to clipboard instead.',
            });
            handleCopyToClipboard();
        }
    } else {
        handleCopyToClipboard();
    }
  };


  const handleDownloadPdf = async () => {
    const { itinerary, rawItinerary } = getLatestItinerary();
    if (!itinerary || !rawItinerary) return;
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      doc.text(`Your Trip to ${itinerary.destination}`, 10, 10);
      const textLines = doc.splitTextToSize(rawItinerary, 180);
      doc.text(textLines, 10, 20);
      doc.save(`OnlyExplore-Itinerary-${itinerary.destination.replace(/\s/g, '_')}.pdf`);
      toast({ title: 'PDF Downloaded!', description: 'Your itinerary has been saved.' });
    } catch(e) {
        console.error('Error downloading PDF', e);
        toast({
            variant: 'destructive',
            title: 'Could not download PDF.',
            description: 'An unexpected error occurred.',
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

  if (isLoading) {
    return <ItineraryLoader />;
  }

  if (chatHistory.length > 0) {
    const { itinerary } = getLatestItinerary();
    return (
      <Card className="w-full max-w-4xl shadow-2xl shadow-primary/10 flex flex-col h-[90vh]">
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
                          {typeof message.content === 'string' ? <p>{message.content}</p> : <ItineraryContent itinerary={message.content} />}
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
    );
  }

  return (
    <Card className="w-full max-w-2xl shadow-2xl shadow-primary/10">
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
                            <Input placeholder="e.g., $2000" className="pl-10" {...field} />
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
  );
}
