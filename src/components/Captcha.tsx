"use client";

import { Turnstile } from '@marsidev/react-turnstile';

interface CaptchaProps {
    onVerify: (token: string) => void;
}

export function Captcha({ onVerify }: CaptchaProps) {
    // Use testing key as fallback if not provided
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

    return (
        <div className="flex justify-center w-full my-4">
            <Turnstile
                siteKey={siteKey}
                onSuccess={(token) => onVerify(token)}
            />
        </div>
    );
}
