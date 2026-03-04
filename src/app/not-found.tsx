"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-6 text-center">
            <div className="space-y-6 max-w-md">
                <h2 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">404</h2>
                <h3 className="text-2xl font-semibold">Page Not Found</h3>
                <p className="text-zinc-400">
                    We couldn't find the page you were looking for. It might have been moved or doesn't exist.
                </p>
                <Link href="/">
                    <Button className="mt-4" variant="default">
                        Return Home
                    </Button>
                </Link>
            </div>
        </div>
    );
}
