import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";
import NextAuth from "next-auth";
import { authConfig } from "../auth.config";

// Ambil inisialisasi auth murni dari authConfig agar kompatibel dengan Edge Runtime
const { auth } = NextAuth(authConfig);

/**
 * Middleware ini berjalan di Edge Runtime untuk mencegat HTTP request
 * sebelum halaman dimuat oleh pengguna.
 */
export default auth(
  (req: NextRequest & { auth: Session | null }): NextResponse | void => {
    const isLoggedIn = !!req.auth;
    const role = req.auth?.user?.role;
    const { pathname } = req.nextUrl;

    // 1. Proteksi rute jika belum login
    if (
      !isLoggedIn &&
      (pathname.startsWith("/admin") ||
        pathname.startsWith("/guru") ||
        pathname.startsWith("/siswa") ||
        pathname.startsWith("/superadmin"))
    ) {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }

    // 2. Proteksi rute berdasarkan peran (Role-based Authorization)
    if (isLoggedIn) {
      if (pathname.startsWith("/superadmin") && role !== "SUPERADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.nextUrl));
      }

      if (pathname.startsWith("/admin") && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/unauthorized", req.nextUrl));
      }

      if (pathname.startsWith("/guru") && role !== "GURU") {
        return NextResponse.redirect(new URL("/unauthorized", req.nextUrl));
      }

      if (pathname.startsWith("/siswa") && role !== "SISWA") {
        return NextResponse.redirect(new URL("/unauthorized", req.nextUrl));
      }

      // Mencegah user yang sudah login mengakses halaman login kembali
      if (pathname === "/login") {
        if (role === "SUPERADMIN")
          return NextResponse.redirect(
            new URL("/superadmin/dashboard", req.nextUrl),
          );
        if (role === "ADMIN")
          return NextResponse.redirect(
            new URL("/admin/dashboard", req.nextUrl),
          );
        if (role === "GURU")
          return NextResponse.redirect(new URL("/guru/dashboard", req.nextUrl));
        if (role === "SISWA")
          return NextResponse.redirect(
            new URL("/siswa/dashboard", req.nextUrl),
          );
      }
    }

    return NextResponse.next();
  },
);

export const config = {
  matcher: ["/admin/:path*", "/guru/:path*", "/siswa/:path*", "/superadmin/:path*", "/login"],
};
