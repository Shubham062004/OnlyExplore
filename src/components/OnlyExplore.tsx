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

const ActivitySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

const ItineraryDaySchema = z.object({
  day: z.number(),
  activities: z.array(ActivitySchema),
  cost: z.number().optional(),
});

const ItinerarySchema = z.object({
  destination: z.string(),
  duration: z.number(),
  budget: z.number(),
  interests: z.array(z.string()),
  days: z.array(ItineraryDaySchema),
  totalCost: z.number().optional(),
  notes: z.string().optional(),
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

const ItineraryContent = ({ itinerary }: { itinerary: Itinerary }) => {
  return (
    <Accordion type="single" collapsible className="w-full" defaultValue="day-1">
      {itinerary.days.map((day: ItineraryDay) => (
        <AccordionItem value={`day-${day.day}`} key={`day-${day.day}`}>
          <AccordionTrigger className="font-headline text-lg hover:no-underline text-foreground">
            Day {day.day}
          </AccordionTrigger>
          <AccordionContent className="pt-2 text-base">
            <ul className="space-y-2">
              {day.activities.map((activity, index) => (
                <li key={index} className="ml-6 list-disc text-muted-foreground marker:text-accent">
                  <strong>{activity.name}</strong>
                  {activity.description && `: ${activity.description}`}
                </li>
              ))}
            </ul>
            {day.cost && (
              <p className="mt-3 font-semibold text-card-foreground">
                Estimated Cost: ₹{day.cost.toLocaleString('en-IN')}
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
  
  // Helper function to extract numbers from strings and convert to rupees
  const extractNumberFromString = (value: any): number | undefined => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return undefined;
    
    // Remove currency symbols and extract numbers
    const cleanValue = value.replace(/[₹$€£,]/g, '');
    const match = cleanValue.match(/\d+/);
    if (!match) return undefined;
    
    const numericValue = parseInt(match[0], 10);
    
    // The data is already in rupees based on your log, so no conversion needed
    return numericValue;
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
    } catch(e) {
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

  async function onPlannerSubmit(values: z.infer<typeof plannerFormSchema>) {
    setIsLoading(true);
    setChatHistory([]);
    try {
      console.log('Sending request with values:', values); // Debug log
      
      const result = await generateTravelItinerary(values);
      console.log('Raw AI result:', result); // Debug log
      
      const itineraryString = result.itinerary;
      if (itineraryString) {
        parseAndSetItinerary(itineraryString, 'initial');
      } else {
        throw new Error("Received empty itinerary from AI.");
      }
    } catch (error) {
      console.error('Error generating itinerary:', error);
      toast({
        variant: 'destructive',
        title: 'Oh no! Something went wrong.',
        description: error instanceof Error ? error.message : 'We couldn\'t generate your itinerary. Please try again.',
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
      const { itinerary } = getLatestItinerary();
      if (!itinerary) return;

      let formattedText = `Your Trip to ${itinerary.destination}\n\n`;
      itinerary.days.forEach((day: ItineraryDay) => {
          formattedText += `Day ${day.day}\n`;
          day.activities.forEach(activity => {
              formattedText += `- ${activity.name}`;
              if (activity.description) {
                  formattedText += `: ${activity.description}`;
              }
              formattedText += `\n`;
          });
          if (day.cost) {
              formattedText += `Estimated Cost: ₹${day.cost.toLocaleString()}\n`;
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
        day.activities.forEach(activity => {
            formattedText += `- ${activity.name}${activity.description ? `: ${activity.description}` : ''}\n`;
        });
        if (day.cost) {
            formattedText += `Estimated Cost: ₹${day.cost.toLocaleString()}\n`;
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
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const contentWidth = pageWidth - margin * 2;
      let yPos = 22;

      doc.setFontSize(18);
      doc.text(`Your Trip to ${itinerary.destination}`, margin, yPos);
      yPos += 12;
      
      itinerary.days.forEach((day: ItineraryDay) => {
        if (yPos > 270) { 
            doc.addPage();
            yPos = 20;
        }
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`Day ${day.day}`, margin, yPos);
        yPos += 7;
        doc.setFont(undefined, 'normal');

        doc.setFontSize(11);
        doc.setTextColor(50);
        day.activities.forEach(activity => {
            if (yPos > 280) {
                doc.addPage();
                yPos = 20;
            }
            const activityText = `${activity.name}${activity.description ? `: ${activity.description}` : ''}`;
            const splitText = doc.splitTextToSize(`- ${activityText}`, contentWidth - 4);
            doc.text(splitText, margin + 4, yPos);
            yPos += (splitText.length * 5);
        });
        
        if (day.cost) {
            yPos += 2;
            doc.setFont(undefined, 'bold');
            doc.text(`Estimated Cost: ₹${day.cost.toLocaleString()}`, margin + 4, yPos);
            doc.setFont(undefined, 'normal');
            yPos += 5;
        }

        yPos += 5;
      });

      if (itinerary.notes) {
         if (yPos > 260) {
            doc.addPage();
            yPos = 20;
        }
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.setFont(undefined, 'bold');
        doc.text('Notes from your Planner', margin, yPos);
        yPos += 7;
        doc.setFont(undefined, 'normal');
        doc.setTextColor(80);
        const notesText = doc.splitTextToSize(itinerary.notes, contentWidth);
        doc.text(notesText, margin, yPos);
      }
      
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
  );
}
