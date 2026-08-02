"use client";

/**
 * AuthIntentProvider — Global authentication intent manager for OnlyExplore.
 * 
 * Stores pending user actions (e.g. "plan a trip to Shimla") before authentication,
 * and automatically resumes them after successful login (Credentials or Google OAuth).
 * 
 * Usage:
 *   const { requireAuth } = useAuthIntent();
 *   requireAuth({ route: '/chat', query: '...', destination: 'Shimla' });
 *   // If logged in → navigates immediately
 *   // If not → opens AuthModal, then resumes after login
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useSession, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AuthModal } from "@/components/auth/AuthModal";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PendingAction {
  /** Target route to navigate to after auth */
  route: string;
  /** Destination name (e.g. "Shimla") */
  destination?: string;
  /** Search query / prompt text */
  query?: string;
  /** Additional prompt context */
  prompt?: string;
  /** Action type for analytics / debugging */
  type?: "plan_trip" | "save_trip" | "bookmark" | "chat" | "profile" | "generic";
  /** Timestamp for expiry (5 min TTL) */
  timestamp: number;
}

interface AuthIntentContextType {
  /** Call this to perform an action that requires auth. 
   *  If user is authenticated, executes immediately.
   *  If not, stores the action and opens the auth modal. */
  requireAuth: (action: Omit<PendingAction, "timestamp">) => void;
  /** The currently stored pending action (null if none) */
  pendingAction: PendingAction | null;
  /** Manually clear the pending action */
  clearPendingAction: () => void;
  /** Execute the pending action immediately */
  executePendingAction: (actionToExecute?: PendingAction | null) => void;
  /** Whether the auth modal is currently open */
  isAuthModalOpen: boolean;
  /** Open the auth modal without a pending action */
  openAuthModal: () => void;
  /** Close the auth modal */
  closeAuthModal: () => void;
}

const AuthIntentContext = createContext<AuthIntentContextType | null>(null);

const PENDING_ACTION_TTL_MS = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = "onlyexplore_pending_action";

/**
 * Builds a complete target URL with all query parameters from a PendingAction.
 */
export function buildActionUrl(action: { route: string; destination?: string; query?: string; prompt?: string }): string {
  const baseRoute = action.route.split("?")[0];
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const url = new URL(baseRoute, origin);
  
  // Preserve existing search params if route already contained query parameters
  if (action.route.includes("?")) {
    const existingParams = new URLSearchParams(action.route.split("?")[1]);
    existingParams.forEach((val, key) => url.searchParams.set(key, val));
  }
  
  if (action.destination) url.searchParams.set("destination", action.destination);
  if (action.query) url.searchParams.set("query", action.query);
  if (action.prompt) url.searchParams.set("prompt", action.prompt);
  
  return url.pathname + url.search;
}

function getStoredAction(): PendingAction | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as PendingAction;
    if (Date.now() - parsed.timestamp < PENDING_ACTION_TTL_MS) {
      return parsed;
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
  } catch {
    return null;
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthIntentProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const hasResumedRef = useRef(false);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const savePendingAction = useCallback((action: PendingAction) => {
    setPendingAction(action);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(action));
    } catch {}
  }, []);

  const clearPendingAction = useCallback(() => {
    setPendingAction(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  const executePendingAction = useCallback(
    (actionToExecute?: PendingAction | null) => {
      const targetAction = actionToExecute || pendingAction || getStoredAction();
      if (!targetAction) return;

      // Check TTL
      if (Date.now() - targetAction.timestamp > PENDING_ACTION_TTL_MS) {
        clearPendingAction();
        return;
      }

      const targetUrl = buildActionUrl(targetAction);

      // Clear action and close modal before navigating
      clearPendingAction();
      setIsAuthModalOpen(false);

      // Navigate directly using Next.js App Router
      router.push(targetUrl);
    },
    [pendingAction, clearPendingAction, router]
  );

  // ── Restore from sessionStorage on mount (for Google OAuth & page reloads) ────

  useEffect(() => {
    const stored = getStoredAction();
    if (stored) {
      setPendingAction(stored);
    }
  }, []);

  // ── Auto-resume pending action when user becomes authenticated ─────────────────

  useEffect(() => {
    if (status === "authenticated" && !hasResumedRef.current) {
      const activeAction = pendingAction || getStoredAction();
      if (activeAction) {
        hasResumedRef.current = true;
        setIsAuthModalOpen(false);
        executePendingAction(activeAction);
      }
    }

    if (status === "unauthenticated") {
      hasResumedRef.current = false;
    }
  }, [status, pendingAction, executePendingAction]);

  // ── Handle Successful Login (Credentials / Email) ─────────────────────────────

  const handleAuthSuccess = useCallback(async () => {
    // Force NextAuth to update session token immediately
    try {
      await getSession();
    } catch {}

    const activeAction = pendingAction || getStoredAction();
    setIsAuthModalOpen(false);

    if (activeAction) {
      hasResumedRef.current = true;
      executePendingAction(activeAction);
    }
  }, [pendingAction, executePendingAction]);

  // ── Public API ──────────────────────────────────────────────────────────

  const requireAuth = useCallback(
    (action: Omit<PendingAction, "timestamp">) => {
      const fullAction: PendingAction = { ...action, timestamp: Date.now() };

      if (status === "authenticated") {
        // Already logged in — execute immediately
        executePendingAction(fullAction);
        return;
      }

      // Not logged in — store intent and open modal
      savePendingAction(fullAction);
      setIsAuthModalOpen(true);
    },
    [status, executePendingAction, savePendingAction]
  );

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  // Compute full callback URL for OAuth / forms
  const activeAction = pendingAction || getStoredAction();
  const modalCallbackUrl = activeAction ? buildActionUrl(activeAction) : "/";

  return (
    <AuthIntentContext.Provider
      value={{
        requireAuth,
        pendingAction,
        clearPendingAction,
        executePendingAction,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}

      {/* Global Auth Modal — rendered at root, overlays any page */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onOpenChange={(open) => {
          if (!open) closeAuthModal();
          else openAuthModal();
        }}
        onSuccess={handleAuthSuccess}
        callbackUrl={modalCallbackUrl}
      />
    </AuthIntentContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuthIntent() {
  const context = useContext(AuthIntentContext);
  if (!context) {
    throw new Error("useAuthIntent must be used within <AuthIntentProvider>");
  }
  return context;
}
