"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        logger.error("Global Error Boundary caught an error", {
            message: error.message,
            stack: error.stack,
        });
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-6 text-center">
            <div className="space-y-6 max-w-md">
                <h2 className="text-3xl font-bold text-red-500">Something went wrong!</h2>
                <p className="text-zinc-400">
                    An unexpected error occurred in the application. We've logged the issue and are looking into it.
                </p>
                <div className="flex justify-center gap-4">
                    <Button onClick={() => reset()} variant="default">
                        Try again
                    </Button>
                    <Button onClick={() => window.location.href = "/"} variant="outline" className="text-black">
                        Return Home
                    </Button>
                </div>
            </div>
        </div>
    );
}
