import { DestinationSkeleton } from "@/components/destination/DestinationComponents";
import { DestinationSidebar } from "./DestinationSidebar";

export default function Loading() {
  return (
    <div className="flex w-full min-h-screen bg-background text-foreground overflow-hidden">
      <DestinationSidebar />
      <div className="flex-1 flex flex-col relative h-screen overflow-y-auto w-full">
        <DestinationSkeleton />
      </div>
    </div>
  );
}
