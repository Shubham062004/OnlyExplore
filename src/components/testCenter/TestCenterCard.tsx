'use client';

import React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  ArrowUpRight,
  Clock,
  KeyRound,
  Loader2,
} from 'lucide-react';
import { ServiceDefinition, NormalizedTestResult } from '@/lib/testCenter/types';

interface TestCenterCardProps {
  service: ServiceDefinition;
  result?: NormalizedTestResult | null;
  isRunning?: boolean;
  onRunTest: (serviceId: string) => void;
}

export const TestCenterCard: React.FC<TestCenterCardProps> = ({
  service,
  result,
  isRunning = false,
  onRunTest,
}) => {
  // Determine status badge
  let statusBadge = (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200">
      <span className="w-2 h-2 rounded-full bg-slate-400" />
      Untested
    </span>
  );

  if (result) {
    if (result.success) {
      statusBadge = (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Verified
        </span>
      );
    } else if (result.configured && !result.authenticated) {
      statusBadge = (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          Auth Failed
        </span>
      );
    } else if (!result.configured) {
      statusBadge = (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Missing Keys
        </span>
      );
    } else {
      statusBadge = (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Error
        </span>
      );
    }
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group hover:border-purple-200">
      <div>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span className="inline-block px-2.5 py-0.5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-purple-700 bg-purple-50 rounded-full border border-purple-100">
              {service.category}
            </span>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-900 transition-colors">
              {service.name}
            </h3>
          </div>
          {statusBadge}
        </div>

        <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">
          {service.description}
        </p>

        {/* Required environment variables */}
        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 mb-4 space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <KeyRound className="w-3 h-3 text-slate-400" />
            Environment Variables
          </div>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {service.envVars.length > 0 ? (
              service.envVars.map((env) => {
                const matched = result?.envStatus.find((e) => e.name === env);
                const isConfigured = matched?.configured ?? false;
                return (
                  <span
                    key={env}
                    className={`inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-md border ${
                      isConfigured
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                    title={matched?.maskedValue || env}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isConfigured ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    />
                    {env}
                  </span>
                );
              })
            ) : (
              <span className="text-xs text-slate-400 italic">No external keys required</span>
            )}
          </div>
        </div>

        {/* Test Result summary if tested */}
        {result && (
          <div className="mb-4 pt-1">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium text-slate-700">Latest Probe</span>
              {result.responseTimeMs > 0 && (
                <span className="flex items-center gap-1 font-mono text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                  <Clock className="w-3 h-3 text-purple-500" />
                  {result.responseTimeMs}ms
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono line-clamp-2">
              {result.resultSummary}
            </p>
          </div>
        )}
      </div>

      {/* Action buttons footer */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <button
          onClick={() => onRunTest(service.id)}
          disabled={isRunning}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              Run Test
            </>
          )}
        </button>

        <Link
          href={service.detailRoute}
          className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-3 py-2 rounded-xl transition-colors"
        >
          Details
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
