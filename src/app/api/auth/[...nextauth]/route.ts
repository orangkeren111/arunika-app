import { handlers } from "../../../../../auth";

/**
 * Pintu masuk utama (API Route) untuk interaksi login/logout internal NextAuth.
 * Next.js akan membaca fungsi GET dan POST ini di tingkat API server-side.
 */
export const { GET, POST } = handlers;