"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Bot,
  CalendarDays,
  CalendarPlus,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

const plannerFormSchema = z.object({
  destination: z.string().min(3, 'Please enter a destination.'),
  duration: z.string().min(3, 'Please enter a trip duration.'),
  budget: z.string().min(2, 'Please enter a budget.'),
  interests: z.string().min(3, 'Please list some interests.'),
});

const editFormSchema = z.object({
  editRequest: z.string().min(5, 'Please enter a more detailed request.'),
});

// Helper to render formatted text from AI
const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('###')) {
        return (
          <h3 key={index} className="text-xl font-headline font-bold mt-6 mb-3 text-foreground">
            {trimmedLine.replace('###', '').trim()}
          </h3>
        );
      }
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        return (
          <p key={index} className="font-bold text-card-foreground my-2">
            {trimmedLine.substring(2, trimmedLine.length - 2)}
          </p>
        );
      }
      if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
        return (
          <li key={index} className="ml-6 list-disc text-muted-foreground marker:text-accent">
            {trimmedLine.substring(2)}
          </li>
        );
      }
      if (trimmedLine === '') {
        return <div key={index} className="h-4" />;
      }
      return (
        <p key={index} className="text-muted-foreground leading-relaxed">
          {trimmedLine}
        </p>
      );
    });
};

export default function WanderChat() {
  const [itinerary, setItinerary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDestination, setCurrentDestination] = useState('');
  const [lastEditRequest, setLastEditRequest] = useState<string | null>(null);

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

  async function onPlannerSubmit(values: z.infer<typeof plannerFormSchema>) {
    setIsLoading(true);
    setItinerary(null);
    setCurrentDestination(values.destination);
    try {
      const result = await generateTravelItinerary(values);
      setItinerary(result.itinerary);
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
    if (!itinerary) return;
    setIsEditing(true);
    setLastEditRequest(values.editRequest);
    try {
      const result = await editItinerary({ itinerary, editRequest: values.editRequest });
      setItinerary(result.updatedItinerary);
      editForm.reset();
    } catch (error) {
      console.error('Error editing itinerary:', error);
      toast({
        variant: 'destructive',
        title: 'Oops! Couldn\'t make that change.',
        description: 'There was an issue updating your itinerary. Please rephrase your request.',
      });
    } finally {
      setIsEditing(false);
    }
  }

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

  if (itinerary) {
    const itineraryDays = itinerary.split(/###\s*Day\s*\d+/i).slice(1).map((dayContent, i) => {
        const dayTitle = itinerary.match(/###\s*(Day\s*\d+.*)/i)?.[i+1] || `Day ${i+1}`;
        return { title: dayTitle, content: dayContent.trim() };
    });

    return (
      <Card className="w-full max-w-4xl shadow-2xl shadow-primary/10">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-headline text-3xl text-foreground">Your Trip to {currentDestination}</CardTitle>
              <CardDescription>Here is your personalized AI-generated travel plan. Have fun!</CardDescription>
            </div>
            <TooltipProvider>
              <div className="flex items-center gap-2">
                {[
                  { icon: Share2, tooltip: 'Share' },
                  { icon: Download, tooltip: 'Download PDF' },
                  { icon: CalendarPlus, tooltip: 'Add to Calendar' },
                ].map((item, index) => (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <item.icon className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{item.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
                <Avatar className="border-2 border-accent">
                    <AvatarFallback className="bg-accent text-accent-foreground">
                        <Bot className="h-6 w-6" />
                    </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-4 w-full">
                    <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                    {itineraryDays.map((day, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                        <AccordionTrigger className="font-headline text-lg hover:no-underline text-foreground">{day.title.split(':')[0]}: {day.title.split(':').slice(1).join(':').trim()}</AccordionTrigger>
                        <AccordionContent className="pt-2 text-base">
                            <ul>{renderFormattedText(day.content)}</ul>
                        </AccordionContent>
                        </AccordionItem>
                    ))}
                    </Accordion>
                </div>
            </div>
            {lastEditRequest && (
                <div className="flex items-start gap-4 justify-end">
                    <div className="bg-primary/20 rounded-lg p-4 max-w-[80%]">
                        <p className="text-primary-foreground">{lastEditRequest}</p>
                    </div>
                     <Avatar>
                        <AvatarFallback className="bg-secondary">
                            <User className="h-6 w-6" />
                        </AvatarFallback>
                    </Avatar>
                </div>
            )}
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
        <CardTitle className="font-headline text-3xl">Welcome to WanderChat</CardTitle>
        <CardDescription>Your flirty, AI-powered travel planner. Let's dream up your next adventure together.</CardDescription>
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
            <Button type="submit" size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-lg font-bold">
              <Plane className="mr-2 h-5 w-5" />
              Plan My Trip!
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
