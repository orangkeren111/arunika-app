"use client";

import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ showLabel = true }: { showLabel?: boolean }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme");
    if (
      savedTheme === "dark" ||
      (!savedTheme && document.documentElement.classList.contains("dark"))
    ) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return next;
    });
  };

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--muted)]" />
    );
  }

  return (
    <button
      onClick={toggleDarkMode}
      type="button"
      className="p-2 rounded-xl border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] hover:opacity-80 transition flex items-center gap-2 text-xs font-semibold"
      title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDarkMode ? (
        <>
          <Sun size={18} className="text-amber-400 shrink-0" />
          {showLabel && <span className="hidden sm:inline">Light Mode</span>}
        </>
      ) : (
        <>
          <Moon size={18} className="text-slate-600 dark:text-slate-300 shrink-0" />
          {showLabel && <span className="hidden sm:inline">Dark Mode</span>}
        </>
      )}
    </button>
  );
}
