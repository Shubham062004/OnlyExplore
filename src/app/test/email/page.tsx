'use client';

import React, { useState } from 'react';
import { TestDetailPage } from '@/components/testCenter/TestDetailPage';
import { Mail, Send, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export default function EmailTestPage() {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; msg: string } | null>(null);

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !recipientEmail.includes('@')) return;

    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch('/api/test/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setSendResult({
          success: true,
          msg: `Test email dispatched successfully! (ID: ${data.data?.id || 'Dispatched'})`,
        });
      } else {
        setSendResult({
          success: false,
          msg: data.error || 'Failed to dispatch email.',
        });
      }
    } catch (err: any) {
      setSendResult({
        success: false,
        msg: `Network error: ${err.message}`,
      });
    } finally {
      setSending(false);
    }
  };

  const actionSlot = (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex items-center gap-2">
        <Mail className="w-5 h-5 text-purple-600" />
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Manual Test Email Dispatch
          </h3>
          <p className="text-xs text-slate-500">
            Safe verification mode: Emails are never sent automatically. Click below only when you wish to test actual inbox delivery.
          </p>
        </div>
      </div>

      <form onSubmit={handleSendTestEmail} className="flex flex-col sm:flex-row gap-3 max-w-xl">
        <input
          type="email"
          placeholder="Enter recipient email address (e.g. you@domain.com)"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white text-slate-900 placeholder:text-slate-400"
          required
        />
        <button
          type="submit"
          disabled={sending || !recipientEmail}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 rounded-xl shadow-xs transition-all"
        >
          {sending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              Send Test Email
            </>
          )}
        </button>
      </form>

      {sendResult && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            sendResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {sendResult.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{sendResult.msg}</span>
        </div>
      )}
    </div>
  );

  return (
    <TestDetailPage
      title="Resend Email Service"
      category="Communications"
      description="Transactional email infrastructure powering email verification codes, password resets, and booking alerts."
      apiEndpoint="/api/test/email"
      requiredEnvVars={[
        {
          name: 'RESEND_API_KEY',
          description: 'Resend API key starting with re_.',
          serverOnly: true,
        },
      ]}
      howItWorks="Dispatches HTML emails with authenticated sender identity. If RESEND_API_KEY is not configured, the service logs output safely to local console without throwing errors."
      fixGuide={{
        portalName: 'Resend Dashboard',
        portalUrl: 'https://resend.com/api-keys',
        steps: [
          'Create a free account at resend.com.',
          'Under "API Keys", click "Create API Key".',
          'Give it Full Access or Sending access.',
          'Add RESEND_API_KEY=re_... in .env.',
          'Verify a domain if sending to arbitrary public email addresses in production.',
        ],
      }}
      customActionSlot={actionSlot}
    />
  );
}
