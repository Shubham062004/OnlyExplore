"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  showLabels?: boolean;
}

export function ThemeToggle({ className = "", showLabels = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-full bg-muted/40 animate-pulse ${className}`} />
    );
  }

  const toggleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-2 p-2 rounded-full bg-card border border-border/60 hover:border-primary/40 text-foreground transition-all duration-300 shadow-sm ${className}`}
      title={`Current Theme: ${theme || "system"}. Click to toggle.`}
    >
      {theme === "dark" ? (
        <Moon className="w-4 h-4 text-indigo-400" />
      ) : theme === "light" ? (
        <Sun className="w-4 h-4 text-amber-500" />
      ) : (
        <Laptop className="w-4 h-4 text-primary" />
      )}
      {showLabels && (
        <span className="text-[10px] font-black uppercase tracking-wider pr-1">
          {theme || "System"}
        </span>
      )}
    </button>
  );
}
