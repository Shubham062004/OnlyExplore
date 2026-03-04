import OnlyExplore from '@/components/OnlyExplore';

export default function ChatPage({ params }: { params: { chatId: string } }) {
    return (
        <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
            <OnlyExplore initialChatId={params.chatId} />
        </main>
    );
}
