import OnlyExplore from '@/components/OnlyExplore';

export default async function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
    const { chatId } = await params;
    return (
        <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
            <OnlyExplore initialChatId={chatId} />
        </main>
    );
}
