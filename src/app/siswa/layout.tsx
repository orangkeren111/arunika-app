"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Clock,
  LogOut,
  Sun,
  Moon,
  GraduationCap,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export default function SiswaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check initial dark mode state from localStorage or document element
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || (!savedTheme && document.documentElement.classList.contains("dark"))) {
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

  const menuItems = [
    { href: "/siswa/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/siswa/kelas", label: "Ruang Kelas", icon: Users },
    { href: "/siswa/history", label: "Riwayat Ujian", icon: Clock },
  ];

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.href = "/login";
  };

  const isMenuSelected = (href: string) => pathname?.startsWith(href);
  const isExamMode = pathname?.includes("/attempt");

  if (isExamMode) {
    return (
      <div className="min-h-screen bg-[var(--background)] transition-colors duration-200">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[var(--background)] transition-colors duration-200 relative">
      {/* Sidebar Mobile Overlay Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-[var(--card)] border-r border-[var(--border)] flex flex-col fixed h-full z-30 transition-all duration-300 ease-in-out md:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${sidebarCollapsed ? "md:w-20" : "w-64"}`}
      >
        <div className={`p-6 border-b border-[var(--border)] flex items-center justify-between ${sidebarCollapsed ? "md:px-4 md:justify-center" : ""}`}>
          <div className={`flex items-center gap-2 text-[var(--primary)] ${sidebarCollapsed ? "md:hidden" : ""}`}>
            <Sun size={28} className="text-[var(--accent)] shrink-0" />
            <div>
              <span className="text-xl font-bold tracking-wide text-[var(--foreground)]">
                Arunika
              </span>
              <p className="text-xs text-[var(--muted-foreground)]">
                Portal Siswa
              </p>
            </div>
          </div>

          {sidebarCollapsed && (
            <div className="hidden md:flex flex-col items-center text-[var(--primary)]" title="Arunika Portal Siswa">
              <Sun size={28} className="text-[var(--accent)]" />
            </div>
          )}

          {/* Close button for mobile */}
          <button
            className="md:hidden p-1 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const active = isMenuSelected(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium
                  ${sidebarCollapsed ? "md:justify-center md:px-2" : ""}
                  ${active
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
              >
                <item.icon size={20} className="shrink-0" />
                <span className={sidebarCollapsed ? "md:hidden" : ""}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--border)]">
          <button
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--error)] transition-all duration-200 text-sm font-medium
              ${sidebarCollapsed ? "md:justify-center md:px-2" : ""}`}
            onClick={handleLogout}
            title={sidebarCollapsed ? "Keluar" : undefined}
          >
            <LogOut size={20} className="shrink-0" />
            <span className={sidebarCollapsed ? "md:hidden" : ""}>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen w-full overflow-hidden transition-all duration-300 ${sidebarCollapsed ? "md:ml-20" : "md:ml-64"}`}>
        <header className="h-16 bg-[var(--card)] border-b border-[var(--border)] flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 transition-colors duration-200">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger button */}
            <button
              className="md:hidden p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={24} />
            </button>

            {/* Desktop Hamburger / Collapse Toggle */}
            <button
              className="hidden md:flex items-center justify-center p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </button>

            <h2 className="font-semibold text-[var(--foreground)] text-sm md:text-base">
              Arunika Learning
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark Mode / Light Mode Toggle Button */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] hover:opacity-80 transition flex items-center gap-2 text-xs font-semibold"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? (
                <>
                  <Sun size={18} className="text-amber-400" />
                  <span className="hidden sm:inline">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon size={18} className="text-slate-600" />
                  <span className="hidden sm:inline">Dark Mode</span>
                </>
              )}
            </button>

            <Link href="/profile" className="flex items-center gap-3 border-l border-[var(--border)] pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {session?.user?.name ?? ""}
                </p>
              </div>
              <div className="w-9 h-9 md:w-10 md:h-10 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded-full flex items-center justify-center font-bold">
                <GraduationCap size={20} />
              </div>
            </Link>
          </div>
        </header>

        <main className="p-4 md:p-8 flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
