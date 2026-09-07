'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Activity,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  Clock,
  ShieldCheck,
  Server,
  KeyRound,
  FileCode2,
  ExternalLink,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { INTEGRATION_SERVICES } from '@/lib/testCenter/registry';
import { NormalizedTestResult } from '@/lib/testCenter/types';
import { TestCenterCard } from '@/components/testCenter/TestCenterCard';

export default function ApiTestCenterDashboard() {
  const [results, setResults] = useState<Record<string, NormalizedTestResult>>({});
  const [runningTests, setRunningTests] = useState<Record<string, boolean>>({});
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchDuration, setBatchDuration] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [envName, setEnvName] = useState<'Development' | 'Production'>('Development');

  // Detect environment
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      setEnvName(isDev ? 'Development' : 'Production');
    }
  }, []);

  // Run single test
  const handleRunSingleTest = useCallback(async (serviceId: string) => {
    const service = INTEGRATION_SERVICES.find((s) => s.id === serviceId);
    if (!service) return;

    setRunningTests((prev) => ({ ...prev, [serviceId]: true }));
    try {
      const res = await fetch(service.testEndpoint);
      const data: NormalizedTestResult = await res.json();
      setResults((prev) => ({ ...prev, [serviceId]: data }));
    } catch (err: any) {
      setResults((prev) => ({
        ...prev,
        [serviceId]: {
          success: false,
          service: service.name,
          category: service.category,
          configured: false,
          authenticated: false,
          reachable: false,
          httpStatus: 500,
          responseTimeMs: 0,
          testedAt: new Date().toISOString(),
          resultSummary: `Fetch error: ${err.message}`,
          envStatus: [],
          error: {
            code: 'FETCH_ERROR',
            message: err.message,
            category: 'NETWORK',
          },
        },
      }));
    } finally {
      setRunningTests((prev) => ({ ...prev, [serviceId]: false }));
    }
  }, []);

  // Run all safe tests in parallel via /api/test/all
  const handleRunAllTests = useCallback(async () => {
    setIsBatchRunning(true);
    const start = performance.now();

    try {
      const res = await fetch('/api/test/all');
      const data = await res.json();
      if (data.results) {
        setResults(data.results);
      }
      setBatchDuration(data.totalDurationMs || Math.round(performance.now() - start));
    } catch (err) {
      console.error('Failed to run batch tests:', err);
    } finally {
      setIsBatchRunning(false);
    }
  }, []);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(INTEGRATION_SERVICES.map((s) => s.category));
    return ['All', ...Array.from(cats)];
  }, []);

  // Filtered services
  const filteredServices = useMemo(() => {
    return INTEGRATION_SERVICES.filter((service) => {
      const matchesCategory =
        selectedCategory === 'All' || service.category === selectedCategory;
      const matchesSearch =
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.envVars.some((v) => v.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Health Metrics
  const totalCount = INTEGRATION_SERVICES.length;
  const testedCount = Object.keys(results).length;
  const passedCount = Object.values(results).filter((r) => r.success).length;
  const failedCount = Object.values(results).filter((r) => !r.success).length;

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-24">
      {/* Top Navigation / Branding Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-purple-500/20">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    OnlyExplore Test Center
                  </h1>
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      envName === 'Development'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}
                  >
                    {envName}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Integration Diagnostics & Health Verification Suite
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-xs font-semibold text-slate-600 hover:text-purple-700 bg-slate-100 hover:bg-purple-50 px-3 py-2 rounded-xl border border-slate-200 transition-colors"
              >
                Back to Site
              </Link>
              <button
                onClick={handleRunAllTests}
                disabled={isBatchRunning}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-purple-500/20"
              >
                {isBatchRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running All Safe Tests...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Run All Safe Tests
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Health Stats Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Detected Integrations
            </div>
            <div className="text-2xl font-black text-slate-900">{totalCount}</div>
            <p className="text-[11px] text-slate-500 mt-1">Found across OnlyExplore codebase</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Passing / Verified
            </div>
            <div className="text-2xl font-black text-emerald-600">
              {passedCount} <span className="text-sm font-semibold text-slate-400">/ {totalCount}</span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-1">Live safe probes passed</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Action Required
            </div>
            <div className="text-2xl font-black text-rose-600">
              {failedCount}{' '}
              <span className="text-sm font-semibold text-slate-400">
                unconfigured/failed
              </span>
            </div>
            <p className="text-[11px] text-rose-700 mt-1">Requires API key or permission</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Batch Latency
            </div>
            <div className="flex items-center gap-1.5 text-2xl font-black text-purple-700 font-mono">
              <Clock className="w-5 h-5 text-purple-500" />
              {batchDuration ? `${batchDuration}ms` : '—'}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {batchDuration ? 'Parallel safe probe execution' : 'Click "Run All Safe Tests"'}
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search service, API, or env var..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white text-slate-900 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Integration Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <TestCenterCard
              key={service.id}
              service={service}
              result={results[service.id]}
              isRunning={runningTests[service.id] || isBatchRunning}
              onRunTest={handleRunSingleTest}
            />
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
            <p className="text-sm text-slate-500 font-medium">
              No integrations match your search criteria.
            </p>
          </div>
        )}

        {/* Knowledge & Documentation Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <ShieldCheck className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                OnlyExplore Integration Health Center — Developer Guide
              </h2>
              <p className="text-xs text-slate-500">
                Essential knowledge for configuring, diagnosing, and deploying project APIs
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-purple-600" />
                Configured vs. API Verified
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                An environment variable existing in <code className="font-mono text-purple-700 bg-purple-50 px-1 py-0.5 rounded">.env</code>{' '}
                does NOT mean the API is working. A service is only marked as <strong>Verified</strong> after an actual safe HTTP request succeeds with status 200. This avoids false positives caused by expired or restricted keys.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-purple-600" />
                Local vs. Render / Vercel
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                During local development, variables are read from <code className="font-mono text-purple-700 bg-purple-50 px-1 py-0.5 rounded">.env</code> or <code className="font-mono text-purple-700 bg-purple-50 px-1 py-0.5 rounded">.env.local</code>. When deploying to production on Render or Vercel, you must manually add the exact same variable names in their Environment Variables dashboard settings.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <FileCode2 className="w-4 h-4 text-purple-600" />
                Server-Side Security
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                All secret keys (Stripe, Twilio, Resend, MongoDB, Gemini) are executed strictly on Next.js server routes. They are NEVER sent to the browser, NEVER logged, and NEVER prefixed with <code className="font-mono text-purple-700 bg-purple-50 px-1 py-0.5 rounded">NEXT_PUBLIC_</code>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
