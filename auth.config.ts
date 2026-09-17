import type { NextAuthConfig } from "next-auth";

/**
 * Konfigurasi minimal yang 100% aman untuk Edge Runtime (Middleware).
 * Berkas ini dilarang keras mengimpor CredentialsProvider, database,
 * bcrypt, atau library server-side Node.js lainnya.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/unauthorized",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.sekolah_id = user.sekolah_id;
        token.name = user.name;
        token.isRetired = user.isRetired;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.sekolah_id = token.sekolah_id as number;
        session.user.name = token.name as string;
        session.user.isRetired = token.isRetired as boolean;
      }
      return session;
    },
  },
  providers: [], // Dibiarkan kosong; diisi hanya di auth.ts server-side
} satisfies NextAuthConfig;
