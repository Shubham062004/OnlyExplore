"use client";

import { Sidebar } from "@/components/Sidebar";
import { useRouter } from "next/navigation";

export function DestinationSidebar() {
  const router = useRouter();
  
  return (
    <Sidebar 
      onSelectChat={(id) => { router.push(`/chat/${id}`); }} 
      onNewChat={() => { router.push('/chat'); }} 
    />
  );
}
