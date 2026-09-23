import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { mockUsers } from "./src/lib/repositories/mockDb";
import { authRepository } from "./src/lib/repositories/authRepository";

/**
 * Konfigurasi Utama NextAuth v5 yang berjalan KHUSUS di lingkungan Server.
 * Di sini kita aman menggunakan CredentialsProvider karena tidak diimpor oleh Edge/Klien.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "Arunika Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "budi@arunika.edu",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null;
        }
        const user = await authRepository.loginUser(
          credentials.email.toString(),
          credentials.password?.toString() || "",
        );

        if (user) {
          return {
            id: String(user.id),
            name: user.name,
            email: user.email,
            role: user.role,
            sekolah_id: user.sekolah_id,
            isRetired: user.isRetired
          };
        }

        return null;
      },
    }),
  ],
});
