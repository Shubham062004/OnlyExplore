"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/chat/Sidebar";
import Header from "@/components/chat/Header";
import MessageBubble from "@/components/chat/MessageBubble";
import InputBar from "@/components/chat/InputBar";
import RightPanel from "@/components/chat/RightPanel";
import { Message, DetailItem } from "@/components/chat/types";

function ChatContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query");
  const hasInitialized = useRef(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedItem, setSelectedItem] = useState<DetailItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialQuery && !hasInitialized.current) {
      hasInitialized.current = true;
      handleSend(initialQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const handleSend = async (text: string) => {
    const newUserMsg: Message = { role: "user", text };
    setMessages((prev) => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) throw new Error("API failed");
      
      const data = await res.json();
      
      const newAssistantMsg: Message = {
        role: "assistant",
        text: data.text,
        places: data.places,
        hotel: data.hotel
      };

      setMessages((prev) => [...prev, newAssistantMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        role: "assistant",
        text: "Sorry, I am having trouble connecting right now. Please try again."
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background text-foreground overflow-hidden font-sans flex h-screen">
      <Sidebar />
      
      <div className="ml-20 lg:ml-64 flex flex-1 h-screen relative w-full">
        <main className="flex flex-col flex-1 relative min-w-0">
          <Header />
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 pt-8 pb-32 hide-scrollbar scroll-smooth">
            <div className="max-w-3xl mx-auto space-y-8">
              
              {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 mt-20">
                  <span className="material-symbols-outlined text-4xl mb-4" data-icon="explore">explore</span>
                  <p>Start planning your trip with AI</p>
                </div>
              )}

              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} onItemClick={setSelectedItem} />
              ))}

              {isLoading && (
                <div className="flex gap-4 items-start">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                    <span className="material-symbols-outlined text-primary text-lg animate-pulse" data-icon="smart_toy">smart_toy</span>
                  </div>
                  <div className="bg-white border border-slate-100 text-slate-500 px-6 py-3.5 rounded-3xl rounded-tl-lg shadow-sm">
                    <p className="text-[15px] animate-pulse">Thinking...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <InputBar onSend={handleSend} />
        </main>

        <RightPanel item={selectedItem} onClose={() => setSelectedItem(null)} />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background text-foreground">Loading chat...</div>}>
      <ChatContent />
    </Suspense>
  );
}
