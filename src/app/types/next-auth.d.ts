import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
    role?: string;
    name?: string;
    sekolah_id?: number;
    isRetired?: boolean;
  }

  interface Session {
    user: {
      id?: string;
      role?: string;
      sekolah_id?: number;
      isRetired?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    id?: string;
    name?: string | null;
    sekolah_id?: number;
    isRetired?: boolean;
  }
}
