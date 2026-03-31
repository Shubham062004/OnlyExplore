import { Suspense } from 'react';
import OnlyExplore from '@/components/OnlyExplore';
import { Loader2 } from 'lucide-react';

export default async function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
    const { chatId } = await params;
    return (
        <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
            <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
                <OnlyExplore initialChatId={chatId} />
            </Suspense>
        </main>
    );
}
