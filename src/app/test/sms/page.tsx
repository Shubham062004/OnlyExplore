'use client';

import React, { useState } from 'react';
import { TestDetailPage } from '@/components/testCenter/TestDetailPage';
import { MessageSquare, Send, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export default function SmsTestPage() {
  const [recipientPhone, setRecipientPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; msg: string } | null>(null);

  const handleSendTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientPhone || recipientPhone.length < 8) return;

    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch('/api/test/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientPhone }),
      });
      const data = await res.json();
      if (data.success) {
        setSendResult({
          success: true,
          msg: `Test SMS dispatched successfully! (SID: ${data.data?.sid || 'Sent'})`,
        });
      } else {
        setSendResult({
          success: false,
          msg: data.error || 'Failed to dispatch SMS.',
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
        <MessageSquare className="w-5 h-5 text-purple-600" />
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Manual Test SMS Dispatch
          </h3>
          <p className="text-xs text-slate-500">
            Safe verification mode: SMS messages are never sent automatically on page load. Use this action to test phone delivery.
          </p>
        </div>
      </div>

      <form onSubmit={handleSendTestSms} className="flex flex-col sm:flex-row gap-3 max-w-xl">
        <input
          type="tel"
          placeholder="Enter phone with country code (e.g. +919876543210)"
          value={recipientPhone}
          onChange={(e) => setRecipientPhone(e.target.value)}
          className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white text-slate-900 placeholder:text-slate-400"
          required
        />
        <button
          type="submit"
          disabled={sending || !recipientPhone}
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
              Send Test SMS
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
      title="Twilio SMS Service"
      category="Communications"
      description="SMS delivery infrastructure powering one-time passcode (OTP) authentication and phone number verification."
      apiEndpoint="/api/test/sms"
      requiredEnvVars={[
        {
          name: 'TWILIO_ACCOUNT_SID',
          description: 'Twilio Account SID (starts with AC).',
          serverOnly: true,
        },
        {
          name: 'TWILIO_AUTH_TOKEN',
          description: 'Twilio Auth Token for REST API authorization.',
          serverOnly: true,
        },
        {
          name: 'TWILIO_PHONE_NUMBER',
          description: 'Twilio sender phone number formatted in E.164 (e.g. +1...).',
          serverOnly: true,
        },
      ]}
      howItWorks="Dispatches SMS messages via Twilio REST API. When unconfigured, it logs mock messages locally without throwing errors."
      fixGuide={{
        portalName: 'Twilio Console',
        portalUrl: 'https://console.twilio.com/',
        steps: [
          'Create a Twilio account or sign in to Twilio Console.',
          'Copy Account SID and Auth Token under Account Info.',
          'Provision a Twilio phone number under Phone Numbers > Manage > Active Numbers.',
          'Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to .env.',
        ],
      }}
      customActionSlot={actionSlot}
    />
  );
}
