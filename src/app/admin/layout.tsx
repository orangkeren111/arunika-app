"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const menuItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Pengguna", icon: Users },
    { href: "/admin/kelas", label: "Kelas", icon: BookOpen },
  ];

  const isMenuSelected = (href: string) => pathname?.startsWith(href);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="min-h-screen flex bg-[var(--background)] transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--card)] border-r border-[var(--border)] flex flex-col fixed h-full z-10 transition-colors duration-200">
        <div className="p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 text-[var(--primary)]">
            <Sun size={28} className="text-[var(--accent)]" />
            <span className="text-xl font-bold tracking-wide text-[var(--foreground)]">
              Arunika
            </span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-1 ml-9">
            Morning Serenity LMS
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const active = isMenuSelected(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium
                  ${
                    active
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
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-16 bg-[var(--card)] border-b border-[var(--border)] flex items-center justify-between px-8 sticky top-0 z-10 transition-colors duration-200">
          <h2 className="font-medium text-[var(--foreground)]">
            Administrator Panel
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 border-l border-[var(--border)] pl-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  Admin Utama
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {session?.user?.name}
                </p>
              </div>
              <div className="w-10 h-10 bg-[var(--accent)] text-[var(--accent-foreground)] rounded-full flex items-center justify-center font-bold">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
