"use client";

/**
 * Reusable React Error Boundary for OnlyExplore.
 * 
 * When a section throws, shows a graceful fallback UI instead of 
 * crashing the entire page. Each section operates independently.
 */

import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Display name for the section (shown in error UI) */
  sectionName?: string;
  /** Custom fallback to render on error */
  fallback?: ReactNode;
  /** Whether to show a retry button */
  showRetry?: boolean;
  /** Callback when an error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ErrorBoundary] ${this.props.sectionName || 'Section'} error:`, error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full py-12 px-6 flex flex-col items-center justify-center text-center space-y-4 bg-muted/20 rounded-[2rem] border border-dashed border-border/50 my-8">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black font-headline uppercase tracking-tighter">
              {this.props.sectionName ? `${this.props.sectionName} unavailable` : 'Section unavailable'}
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm">
              This section couldn&apos;t load. The rest of the page is unaffected.
            </p>
          </div>
          {(this.props.showRetry !== false) && (
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border border-border hover:border-primary hover:text-primary transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              Try Again
            </button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
