'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Clock,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Server,
  HelpCircle,
  Code2,
  Terminal,
  Loader2,
} from 'lucide-react';
import { NormalizedTestResult } from '@/lib/testCenter/types';

interface TestDetailPageProps {
  title: string;
  category: string;
  description: string;
  apiEndpoint: string;
  requiredEnvVars: {
    name: string;
    description: string;
    serverOnly: boolean;
  }[];
  howItWorks: string;
  fixGuide: {
    portalName: string;
    portalUrl: string;
    steps: string[];
  };
  customActionSlot?: React.ReactNode;
}

export const TestDetailPage: React.FC<TestDetailPageProps> = ({
  title,
  category,
  description,
  apiEndpoint,
  requiredEnvVars,
  howItWorks,
  fixGuide,
  customActionSlot,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NormalizedTestResult | null>(null);

  const runTest = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiEndpoint);
      const data: NormalizedTestResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({
        success: false,
        service: title,
        category,
        configured: false,
        authenticated: false,
        reachable: false,
        httpStatus: 500,
        responseTimeMs: 0,
        testedAt: new Date().toISOString(),
        resultSummary: `Client fetch failed: ${err.message}`,
        envStatus: [],
        error: {
          code: 'CLIENT_FETCH_ERROR',
          message: err.message,
          category: 'NETWORK',
          likelyCause: 'Unable to reach local API route',
        },
      });
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, title, category]);

  // Run on mount
  useEffect(() => {
    runTest();
  }, [runTest]);

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 pb-24">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/test"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-purple-700 bg-slate-100 hover:bg-purple-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Test Center
              </Link>
              <div className="h-4 w-px bg-slate-200" />
              <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100 uppercase tracking-wide">
                {category}
              </span>
            </div>

            <button
              onClick={runTest}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 rounded-xl shadow-xs transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Re-test API
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Title Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-base text-slate-600 mt-1 max-w-3xl leading-relaxed">
            {description}
          </p>
        </div>

        {/* Live Status Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
              Configuration
            </div>
            <div className="flex items-center gap-2">
              {result?.configured ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-slate-900">Configured</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-500" />
                  <span className="font-bold text-slate-900">Missing Keys</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
              Authentication
            </div>
            <div className="flex items-center gap-2">
              {result?.authenticated ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-slate-900">Valid</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-amber-500" />
                  <span className="font-bold text-slate-900">Unverified</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
              Reachable
            </div>
            <div className="flex items-center gap-2">
              {result?.reachable ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-slate-900">Online</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-500" />
                  <span className="font-bold text-slate-900">Unreachable</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
              Latency
            </div>
            <div className="flex items-center gap-1.5 font-mono text-lg font-bold text-slate-900">
              <Clock className="w-4 h-4 text-purple-500" />
              {result ? `${result.responseTimeMs} ms` : '—'}
            </div>
          </div>
        </div>

        {/* Custom Actions (e.g. Manual Send Email/SMS) if provided */}
        {customActionSlot}

        {/* Environment Variables Inspection Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-purple-600" />
              Required Environment Variables
            </h2>
            <span className="text-xs text-slate-500">
              Server-side secrets are masked for safety
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {requiredEnvVars.map((v) => {
              const matched = result?.envStatus.find((e) => e.name === v.name);
              const isConfigured = matched?.configured ?? false;
              return (
                <div key={v.name} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-slate-900">
                        {v.name}
                      </span>
                      {v.serverOnly && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                          Server Secret
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{v.description}</p>
                  </div>

                  <div className="text-right">
                    {isConfigured ? (
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {matched?.maskedValue || 'Configured'}
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" />
                        Not Set
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Diagnostics & Fix Recommendations (if failed or error returned) */}
        {result?.error && (
          <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-3 w-full">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                    Category: {result.error.category}
                  </span>
                  <h3 className="text-base font-bold text-rose-900 mt-1">
                    {result.error.message}
                  </h3>
                </div>

                {result.error.likelyCause && (
                  <div>
                    <div className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-0.5">
                      Likely Cause:
                    </div>
                    <p className="text-sm text-rose-700">{result.error.likelyCause}</p>
                  </div>
                )}

                {result.error.fixSteps && result.error.fixSteps.length > 0 && (
                  <div className="bg-white/80 rounded-xl p-4 border border-rose-200/80">
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                      Suggested Fix Steps:
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-xs text-slate-700">
                      {result.error.fixSteps.map((step, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* API Response Data Viewer */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-purple-600" />
              Sanitized API Response
            </h2>
            {result?.testedAt && (
              <span className="text-xs text-slate-400 font-mono">
                Tested: {new Date(result.testedAt).toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="bg-slate-950 rounded-xl p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-96 shadow-inner border border-slate-800">
            {loading ? (
              <div className="flex items-center gap-2 text-slate-400 py-6 justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                Executing safe integration probe...
              </div>
            ) : result ? (
              <pre>{JSON.stringify(result, null, 2)}</pre>
            ) : (
              <span className="text-slate-500 italic">No probe executed yet.</span>
            )}
          </div>
        </div>

        {/* Documentation & Security Guide */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-600" />
              How OnlyExplore Uses This Service
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">{howItWorks}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-600" />
              Setup & Credential Guide
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Obtain keys from{' '}
              <a
                href={fixGuide.portalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-purple-600 font-semibold hover:underline"
              >
                {fixGuide.portalName}
              </a>
              :
            </p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600">
              {fixGuide.steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
