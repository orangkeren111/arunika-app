"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Library,
  FileText,
  CalendarClock,
  PieChart,
  LogOut,
  Sun,
  Menu,
  X,
  Users,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import ThemeToggle from "@/src/components/ThemeToggle";

export default function GuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { href: "/guru/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/guru/kelas", label: "Ruang Kelas", icon: Users },
    { href: "/guru/buku", label: "Bank Soal (Buku)", icon: Library },
    { href: "/guru/ujian", label: "Template Ujian", icon: FileText },
    { href: "/guru/jadwal", label: "Jadwal Ujian", icon: CalendarClock },
    { href: "/guru/reports", label: "Penilaian & Rapor", icon: PieChart },
  ];

  const isMenuSelected = (href: string) => pathname?.startsWith(href);
  const { data: session } = useSession();
  const currentUser = session?.user;

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="min-h-screen flex bg-[var(--background)] transition-colors duration-200 relative">
      {/* Sidebar Mobile Overlay Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Guru */}
      <aside
        className={`w-64 bg-[var(--card)] border-r border-[var(--border)] flex flex-col fixed h-full z-30 transition-transform duration-300 ease-in-out md:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[var(--primary)]">
              <Sun size={28} className="text-[var(--accent)]" />
              <span className="text-xl font-bold tracking-wide text-[var(--foreground)]">
                Arunika
              </span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-1 ml-9">
              Panel Pengajar
            </p>
          </div>
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium
                  ${active
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--border)]">
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--error)] transition-all duration-200 text-sm font-medium"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen w-full overflow-hidden">
        <header className="h-16 bg-[var(--card)] border-b border-[var(--border)] flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 transition-colors duration-200">
          <div className="flex items-center gap-3">
            {/* Hamburger button */}
            <button
              className="md:hidden p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={24} />
            </button>
            <h2 className="font-semibold text-[var(--foreground)] text-sm md:text-base">
              Ruang Guru
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/profile" className="flex items-center gap-3 border-l border-[var(--border)] pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {currentUser?.name || ""}
                </p>
              </div>
              <div className="w-9 h-9 md:w-10 md:h-10 bg-[var(--info)] text-white rounded-full flex items-center justify-center font-bold">
                B
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
