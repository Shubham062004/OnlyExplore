import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Chat from "@/models/Chat";
import OnlyExplore from '@/components/OnlyExplore';
import { redirect } from "next/navigation";

export default async function DestinationChatPage({ params }: { params: Promise<{ chatId: string }> }) {
    const { chatId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect("/login");
    }

    await connectDB();
    
    try {
        const chat = await Chat.findById(chatId);

        if (!chat || chat.userId.toString() !== (session.user as any).id) {
            return (
                <div className="flex h-screen items-center justify-center p-8 bg-background">
                    <div className="text-center p-8 bg-card border rounded-2xl shadow-lg max-w-md w-full">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-4">
                            Private Chat
                        </h1>
                        <p className="text-muted-foreground">
                            You don't have permission to view this personalized itinerary.
                        </p>
                    </div>
                </div>
            );
        }
    } catch (e) {
        // Invalid Object ID or DB Error
        return (
            <div className="flex h-screen items-center justify-center p-8 bg-background">
                <div className="text-center p-8 bg-card border rounded-2xl shadow-lg max-w-md w-full">
                    <h1 className="text-2xl font-bold text-red-500 mb-4">Not Found</h1>
                    <p className="text-muted-foreground">Chat generation failed or does not exist.</p>
                </div>
            </div>
        );
    }

    return (
        <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
            <OnlyExplore initialChatId={chatId} />
        </main>
    );
}
