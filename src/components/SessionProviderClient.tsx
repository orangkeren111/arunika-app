"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";

interface SessionProviderProps {
  children: React.ReactNode;
}

/**
 * Menggunakan direktif "use client" agar SessionProvider (yang mengandalkan React Context)
 * dapat digunakan dengan aman di dalam Next.js App Router tanpa menyebabkan error context server.
 */
export function SessionProviderClient({ children }: SessionProviderProps) {
  return <SessionProvider>{children}</SessionProvider>;
}