'use client';

// ─────────────────────────────────────────────────────────────────────────────
// TEMPORARY DEV/TEST PAGE — Instagram Graph API Capability Tester
// ─────────────────────────────────────────────────────────────────────────────
// Navigate to /test/insta to use this page.
// Remove this file once testing is complete and Social Pulse is implemented.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

type TestStatus = 'idle' | 'testing' | 'success' | 'failed';

interface TestResult {
  success: boolean;
  test?: string;
  ok?: boolean;
  status?: number;
  endpoint?: string;
  durationMs?: number;
  data?: unknown;
  error?: string;
  likelyCause?: string;
  returnedFields?: string[];
  mediaCount?: number;
  mediaTypes?: string[];
  hasReels?: boolean;
  hasLocation?: boolean;
  hasEngagement?: boolean;
  hashtagId?: string | null;
  hashtagIdLookup?: {
    ok: boolean;
    status: number;
    durationMs: number;
    hashtagId: string;
  };
  step?: string;
  setup?: {
    required: string[];
    steps: string[];
  };
}

interface CapabilityReport {
  authentication: 'untested' | 'working' | 'failed';
  accountAccess: 'untested' | 'working' | 'failed';
  hashtagDiscovery: 'untested' | 'available' | 'not_available';
  publicMediaDiscovery: 'untested' | 'available' | 'not_available';
  reelsDiscovery: 'untested' | 'available' | 'not_available';
  locationSearch: 'untested' | 'available' | 'not_available';
  engagementMetrics: 'untested' | 'available' | 'not_available';
  mediaDetails: 'untested' | 'available' | 'not_available';
}

// ── Component ────────────────────────────────────────────────────────────────

export default function InstagramTestPage() {
  const [searchQuery, setSearchQuery] = useState('Amritsar');
  const [mediaIdInput, setMediaIdInput] = useState('');

  const [authStatus, setAuthStatus] = useState<TestStatus>('idle');
  const [hashtagStatus, setHashtagStatus] = useState<TestStatus>('idle');
  const [mediaStatus, setMediaStatus] = useState<TestStatus>('idle');

  const [authResult, setAuthResult] = useState<TestResult | null>(null);
  const [hashtagResult, setHashtagResult] = useState<TestResult | null>(null);
  const [mediaResult, setMediaResult] = useState<TestResult | null>(null);

  const [capabilities, setCapabilities] = useState<CapabilityReport>({
    authentication: 'untested',
    accountAccess: 'untested',
    hashtagDiscovery: 'untested',
    publicMediaDiscovery: 'untested',
    reelsDiscovery: 'untested',
    locationSearch: 'untested',
    engagementMetrics: 'untested',
    mediaDetails: 'untested',
  });

  // ── API Call Helper ──────────────────────────────────────────────────────

  const callTestApi = useCallback(
    async (params: Record<string, string>): Promise<TestResult> => {
      const qs = new URLSearchParams(params).toString();
      const res = await fetch(`/api/test/instagram?${qs}`);
      return res.json();
    },
    []
  );

  // ── Test: Authentication ─────────────────────────────────────────────────

  const runAuthTest = useCallback(async () => {
    setAuthStatus('testing');
    setAuthResult(null);

    try {
      // Test auth
      const authRes = await callTestApi({ action: 'auth' });
      setAuthResult(authRes);

      // Also test account media
      const accountRes = await callTestApi({ action: 'account' });

      const authWorked = authRes.ok === true;
      const accountWorked = accountRes.ok === true;

      setCapabilities((prev) => ({
        ...prev,
        authentication: authWorked ? 'working' : 'failed',
        accountAccess: accountWorked ? 'working' : 'failed',
        reelsDiscovery:
          accountRes.hasReels === true ? 'available' : prev.reelsDiscovery,
        engagementMetrics:
          accountRes.hasEngagement === true
            ? 'available'
            : prev.engagementMetrics,
      }));

      // If account media returned items, auto-fill the first media ID
      if (accountWorked && accountRes.data) {
        const items = (accountRes.data as any)?.data;
        if (Array.isArray(items) && items.length > 0 && items[0].id) {
          setMediaIdInput(items[0].id);
        }
      }

      // Merge account data into auth result for display
      setAuthResult({
        ...authRes,
        // @ts-expect-error — extending for display
        accountTest: accountRes,
      });

      setAuthStatus(authWorked ? 'success' : 'failed');
    } catch (err) {
      setAuthResult({
        success: false,
        error: err instanceof Error ? err.message : 'Network error',
        likelyCause: 'Could not reach the test API route. Is the dev server running?',
        durationMs: 0,
      });
      setAuthStatus('failed');
      setCapabilities((prev) => ({
        ...prev,
        authentication: 'failed',
        accountAccess: 'failed',
      }));
    }
  }, [callTestApi]);

  // ── Test: Hashtag ────────────────────────────────────────────────────────

  const runHashtagTest = useCallback(async () => {
    setHashtagStatus('testing');
    setHashtagResult(null);

    try {
      const result = await callTestApi({
        action: 'hashtag',
        q: searchQuery.replace(/^#/, ''),
      });
      setHashtagResult(result);

      const worked = result.ok === true;

      setCapabilities((prev) => ({
        ...prev,
        hashtagDiscovery: worked ? 'available' : 'not_available',
        publicMediaDiscovery: worked ? 'available' : 'not_available',
        reelsDiscovery:
          result.hasReels === true
            ? 'available'
            : prev.reelsDiscovery === 'available'
              ? 'available'
              : worked
                ? 'not_available'
                : prev.reelsDiscovery,
        locationSearch:
          result.hasLocation === true ? 'available' : 'not_available',
        engagementMetrics:
          result.hasEngagement === true
            ? 'available'
            : prev.engagementMetrics === 'available'
              ? 'available'
              : worked
                ? 'not_available'
                : prev.engagementMetrics,
      }));

      setHashtagStatus(worked ? 'success' : 'failed');
    } catch (err) {
      setHashtagResult({
        success: false,
        error: err instanceof Error ? err.message : 'Network error',
        likelyCause: 'Could not reach the test API route.',
        durationMs: 0,
      });
      setHashtagStatus('failed');
    }
  }, [callTestApi, searchQuery]);

  // ── Test: Media Details ──────────────────────────────────────────────────

  const runMediaTest = useCallback(async () => {
    if (!mediaIdInput.trim()) return;

    setMediaStatus('testing');
    setMediaResult(null);

    try {
      const result = await callTestApi({
        action: 'media',
        mediaId: mediaIdInput.trim(),
      });
      setMediaResult(result);

      const worked = result.ok === true;

      setCapabilities((prev) => ({
        ...prev,
        mediaDetails: worked ? 'available' : 'not_available',
        engagementMetrics:
          result.hasEngagement === true
            ? 'available'
            : prev.engagementMetrics,
      }));

      setMediaStatus(worked ? 'success' : 'failed');
    } catch (err) {
      setMediaResult({
        success: false,
        error: err instanceof Error ? err.message : 'Network error',
        likelyCause: 'Could not reach the test API route.',
        durationMs: 0,
      });
      setMediaStatus('failed');
    }
  }, [callTestApi, mediaIdInput]);

  // ── Status Badge Component ───────────────────────────────────────────────

  const StatusBadge = ({ status }: { status: TestStatus }) => {
    const styles: Record<TestStatus, string> = {
      idle: 'bg-gray-100 text-gray-600 border-gray-200',
      testing: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse',
      success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      failed: 'bg-red-50 text-red-700 border-red-200',
    };
    const labels: Record<TestStatus, string> = {
      idle: '⏸ Not tested',
      testing: '⏳ Testing...',
      success: '✅ Success',
      failed: '❌ Failed',
    };
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  // ── Capability Icon ──────────────────────────────────────────────────────

  const CapIcon = ({
    state,
  }: {
    state: 'untested' | 'working' | 'failed' | 'available' | 'not_available';
  }) => {
    switch (state) {
      case 'working':
      case 'available':
        return <span className="text-emerald-600 font-bold">✅</span>;
      case 'failed':
      case 'not_available':
        return <span className="text-red-500 font-bold">❌</span>;
      default:
        return <span className="text-gray-400">⬜</span>;
    }
  };

  const capLabel = (
    state: 'untested' | 'working' | 'failed' | 'available' | 'not_available'
  ) => {
    switch (state) {
      case 'working':
        return 'Working';
      case 'available':
        return 'Available';
      case 'failed':
        return 'Failed';
      case 'not_available':
        return 'Not Available';
      default:
        return 'Not Tested';
    }
  };

  // ── Result Panel ─────────────────────────────────────────────────────────

  const ResultPanel = ({
    result,
    title,
  }: {
    result: TestResult | null;
    title: string;
  }) => {
    if (!result) return null;

    return (
      <div className="mt-4 rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="font-semibold text-gray-800">{title}</h4>
        </div>
        <div className="p-5 space-y-3 text-sm">
          {/* Setup instructions (missing credentials) */}
          {result.setup && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
              <p className="font-semibold text-amber-800 mb-2">
                ⚠️ Credentials Not Configured
              </p>
              <p className="text-amber-700 mb-3">{result.error}</p>
              <div className="mb-3">
                <p className="font-medium text-amber-800 mb-1">Required:</p>
                <ul className="list-disc list-inside text-amber-700 space-y-1">
                  {result.setup.required.map((r, i) => (
                    <li key={i}>
                      <code className="text-xs bg-amber-100 px-1 py-0.5 rounded">
                        {r}
                      </code>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium text-amber-800 mb-1">Setup Steps:</p>
                <ol className="list-decimal list-inside text-amber-700 space-y-1">
                  {result.setup.steps.map((s, i) => (
                    <li key={i} className="text-xs">
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {/* Error display */}
          {result.error && !result.setup && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="font-semibold text-red-800 mb-1">
                ❌ {result.test ? `${result.test} — ` : ''}Error
              </p>
              <p className="text-red-700 font-mono text-xs break-all">
                {result.error}
              </p>
              {result.likelyCause && (
                <p className="mt-2 text-red-600 text-xs">
                  <strong>Likely cause:</strong> {result.likelyCause}
                </p>
              )}
            </div>
          )}

          {/* Success metrics */}
          {result.ok && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {result.endpoint && (
                <div className="p-3 rounded-lg bg-violet-50 border border-violet-100">
                  <p className="text-xs text-violet-500 mb-1">Endpoint</p>
                  <p className="font-mono text-xs text-violet-800 break-all">
                    {result.endpoint}
                  </p>
                </div>
              )}
              {result.status !== undefined && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <p className="text-xs text-emerald-500 mb-1">HTTP Status</p>
                  <p className="font-bold text-emerald-800">{result.status}</p>
                </div>
              )}
              {result.durationMs !== undefined && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="text-xs text-blue-500 mb-1">Response Time</p>
                  <p className="font-bold text-blue-800">
                    {result.durationMs} ms
                  </p>
                </div>
              )}
              {result.mediaCount !== undefined && (
                <div className="p-3 rounded-lg bg-orange-50 border border-orange-100">
                  <p className="text-xs text-orange-500 mb-1">Results</p>
                  <p className="font-bold text-orange-800">
                    {result.mediaCount} items
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Returned fields */}
          {result.returnedFields && result.returnedFields.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">
                Fields returned ({result.returnedFields.length}):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.returnedFields.map((f) => (
                  <span
                    key={f}
                    className="px-2 py-0.5 text-xs rounded-md bg-violet-100 text-violet-700 font-mono"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Media types */}
          {result.mediaTypes && result.mediaTypes.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Media types found:</p>
              <div className="flex flex-wrap gap-1.5">
                {result.mediaTypes.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 text-xs rounded-md bg-blue-100 text-blue-700 font-mono"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Hashtag lookup info */}
          {result.hashtagIdLookup && (
            <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
              <p className="text-xs text-indigo-500 mb-1">Hashtag ID Lookup</p>
              <p className="text-xs text-indigo-700">
                ID: <code className="font-mono">{result.hashtagIdLookup.hashtagId}</code>
                {' | '}Lookup: {result.hashtagIdLookup.durationMs}ms
                {' | '}Status: {result.hashtagIdLookup.status}
              </p>
            </div>
          )}

          {/* Sanitized response */}
          {result.data && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                View sanitized API response
              </summary>
              <pre className="mt-2 p-4 rounded-lg bg-gray-900 text-green-400 text-xs overflow-x-auto max-h-96 overflow-y-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </details>
          )}

          {/* Account test sub-result */}
          {(result as any)?.accountTest && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                View account media test result
              </summary>
              <pre className="mt-2 p-4 rounded-lg bg-gray-900 text-green-400 text-xs overflow-x-auto max-h-96 overflow-y-auto">
                {JSON.stringify((result as any).accountTest, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  };

  // ── Build Recommendations ────────────────────────────────────────────────

  const anyTested =
    capabilities.authentication !== 'untested' ||
    capabilities.hashtagDiscovery !== 'untested';

  const canBuild: string[] = [];
  const cannotBuild: string[] = [];

  if (anyTested) {
    if (
      capabilities.authentication === 'working' &&
      capabilities.accountAccess === 'working'
    ) {
      canBuild.push('Own-account media management and display');
    } else {
      cannotBuild.push(
        'Own-account media management (authentication failed or not configured)'
      );
    }

    if (capabilities.hashtagDiscovery === 'available') {
      canBuild.push(
        'Hashtag-based content discovery for destinations (limited to 30 unique hashtags per 7-day rolling window)'
      );
    } else if (capabilities.hashtagDiscovery === 'not_available') {
      cannotBuild.push(
        'Hashtag-based content discovery (requires App Review approval + Instagram Public Content Access feature)'
      );
    }

    if (capabilities.publicMediaDiscovery === 'available') {
      canBuild.push('Public media browsing via hashtag top/recent media');
    } else if (capabilities.publicMediaDiscovery === 'not_available') {
      cannotBuild.push(
        'Public media discovery (not available with current permissions)'
      );
    }

    if (capabilities.reelsDiscovery === 'available') {
      canBuild.push('Reels discovery and display');
    } else if (capabilities.reelsDiscovery === 'not_available') {
      cannotBuild.push('Reels discovery (no Reel-type media returned)');
    }

    if (capabilities.engagementMetrics === 'available') {
      canBuild.push('Engagement metrics display (likes, comments)');
    } else if (capabilities.engagementMetrics === 'not_available') {
      cannotBuild.push(
        'Engagement metrics (like_count / comments_count not returned)'
      );
    }

    if (capabilities.locationSearch === 'available') {
      canBuild.push('Location-tagged content filtering');
    } else if (capabilities.locationSearch === 'not_available') {
      cannotBuild.push(
        'Location-based search (no location data in API response)'
      );
    }

    if (capabilities.mediaDetails === 'available') {
      canBuild.push('Detailed media view with full metadata');
    } else if (capabilities.mediaDetails === 'not_available') {
      cannotBuild.push('Detailed media view (media details endpoint failed)');
    }

    // Always note known platform limitations
    cannotBuild.push(
      'Cross-account public feed browsing (not supported by Instagram Graph API)',
      'Location-based search endpoint (does not exist in Instagram Graph API)',
      'Stories access (not available via hashtag endpoints)',
      'Arbitrary public profile browsing (only own-account data available)'
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-fuchsia-50">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/test"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-purple-700 bg-white hover:bg-purple-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Test Center
          </Link>
          <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100 uppercase tracking-wide">
            Social Media
          </span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xl">
              📸
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Instagram API Test
              </h1>
              <p className="text-sm text-gray-500">
                Developer tool — Official Meta Graph API capability verification
              </p>
            </div>
          </div>
          <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-xs text-amber-700">
              ⚠️ <strong>Temporary test page.</strong> This page tests the
              official Instagram Graph API only. No data is cached, stored, or
              scraped. Remove after testing.
            </p>
          </div>
        </div>

        {/* Overall Status */}
        <div className="mb-6 p-4 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">
                Status:
              </span>
              <StatusBadge
                status={
                  authStatus === 'testing' || hashtagStatus === 'testing' || mediaStatus === 'testing'
                    ? 'testing'
                    : authStatus === 'success' || hashtagStatus === 'success'
                      ? 'success'
                      : authStatus === 'failed' || hashtagStatus === 'failed'
                        ? 'failed'
                        : 'idle'
                }
              />
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="mb-6 p-5 rounded-xl border border-gray-200 bg-white">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search / Hashtag
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="e.g. Amritsar, GoldenTemple, AmritsarFood"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-colors"
          />
          <p className="mt-1.5 text-xs text-gray-400">
            Used for hashtag search tests. Try: Amritsar, GoldenTemple,
            AmritsarFood, WagahBorder
          </p>
        </div>

        {/* Test Buttons */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={runAuthTest}
            disabled={authStatus === 'testing'}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 text-white font-medium text-sm hover:from-violet-700 hover:to-violet-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            {authStatus === 'testing' ? '⏳ Testing...' : '🔐 Test Instagram API'}
          </button>

          <button
            onClick={runHashtagTest}
            disabled={hashtagStatus === 'testing'}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-fuchsia-700 text-white font-medium text-sm hover:from-fuchsia-700 hover:to-fuchsia-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            {hashtagStatus === 'testing' ? '⏳ Testing...' : '#️⃣ Test Hashtag'}
          </button>

          <button
            onClick={runMediaTest}
            disabled={mediaStatus === 'testing' || !mediaIdInput.trim()}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium text-sm hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            {mediaStatus === 'testing'
              ? '⏳ Testing...'
              : '🖼️ Test Media Details'}
          </button>
        </div>

        {/* Media ID Input (for media details test) */}
        <div className="mb-8 p-5 rounded-xl border border-gray-200 bg-white">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Media ID (for media details test)
          </label>
          <input
            type="text"
            value={mediaIdInput}
            onChange={(e) => setMediaIdInput(e.target.value)}
            placeholder="Auto-filled after auth test, or paste a media ID"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors font-mono"
          />
          <p className="mt-1.5 text-xs text-gray-400">
            Run &quot;Test Instagram API&quot; first — a media ID will be auto-filled if
            your account has media.
          </p>
        </div>

        {/* Results */}
        <div className="space-y-4 mb-10">
          <ResultPanel result={authResult} title="Authentication & Account Test" />
          <ResultPanel result={hashtagResult} title="Hashtag Search Test" />
          <ResultPanel result={mediaResult} title="Media Details Test" />
        </div>

        {/* ── Capability Report ──────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-8">
          <div className="px-5 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600">
            <h2 className="text-lg font-bold text-white">
              📊 Instagram API Capability Report
            </h2>
            <p className="text-violet-100 text-xs mt-0.5">
              Based on actual API responses only — nothing is assumed
            </p>
          </div>

          <div className="p-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">
                    Capability
                  </th>
                  <th className="text-left py-2 text-gray-500 font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  ['Authentication', capabilities.authentication],
                  ['Professional Account Access', capabilities.accountAccess],
                  ['Hashtag Discovery', capabilities.hashtagDiscovery],
                  ['Public Media Discovery', capabilities.publicMediaDiscovery],
                  ['Reels Discovery', capabilities.reelsDiscovery],
                  ['Location Search', capabilities.locationSearch],
                  ['Engagement Metrics', capabilities.engagementMetrics],
                  ['Media Details', capabilities.mediaDetails],
                ].map(([name, state]) => (
                  <tr key={name as string}>
                    <td className="py-2.5 text-gray-800 font-medium">
                      {name}
                    </td>
                    <td className="py-2.5">
                      <span className="inline-flex items-center gap-2">
                        <CapIcon state={state as any} />
                        <span className="text-gray-600">{capLabel(state as any)}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── What we can/cannot build ───────────────────────────────────── */}
        {anyTested && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* CAN build */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <h3 className="font-bold text-emerald-800 mb-3">
                ✅ What We Can Build With This API
              </h3>
              {canBuild.length > 0 ? (
                <ul className="space-y-2">
                  {canBuild.map((item, i) => (
                    <li
                      key={i}
                      className="text-sm text-emerald-700 flex items-start gap-2"
                    >
                      <span className="mt-0.5 text-emerald-500">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-emerald-600">
                  No capabilities confirmed yet.
                </p>
              )}
            </div>

            {/* CANNOT build */}
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <h3 className="font-bold text-red-800 mb-3">
                ❌ What We Cannot Build With This API
              </h3>
              {cannotBuild.length > 0 ? (
                <ul className="space-y-2">
                  {cannotBuild.map((item, i) => (
                    <li
                      key={i}
                      className="text-sm text-red-700 flex items-start gap-2"
                    >
                      <span className="mt-0.5 text-red-500">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-red-600">All tests passed!</p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 py-4">
          OnlyExplore — Instagram API Test Tool — Development Use Only
        </div>
      </div>
    </div>
  );
}
