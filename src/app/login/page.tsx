"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Mail,
  Lock,
  Sun,
  ArrowRight,
  AlertCircle,
  ShieldAlert,
  GraduationCap,
  UserCog,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import ThemeToggle from "@/src/components/ThemeToggle";

/* STREAMING_CHUNK: Creating the Inner Login Form with Suspense context for searchParams */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Menangkap error redirect dari callback NextAuth (misal kredensial salah)
  useEffect(() => {
    const errorType = searchParams.get("error");
    if (errorType === "CredentialsSignin") {
      setError("Email atau kata sandi salah. Silakan periksa kembali.");
    } else if (errorType) {
      setError("Terjadi kesalahan sistem saat mencoba masuk.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Harap isi semua kolom login.");
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      // Memanggil fungsi signIn bawaan next-auth/react (Aman untuk Klien/Browser)
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false, // Kita handle redirect secara manual agar UX lebih mulus
      });

      if (result?.error) {
        setError("Email atau kata sandi salah. Silakan coba lagi.");
        setLoading(false);
      } else {
        // Tentukan rute dashboard tujuan berdasarkan email pengujian
        let targetDashboard = "/login";

        setSuccessMsg(`Login berhasil! Mengarahkan Anda ke Dasbor...`);
        setLoading(false);

        // Beri jeda transisi visual agar user tidak bingung
        setTimeout(() => {
          router.push(targetDashboard);
          router.refresh();
        }, 1200);
      }
    } catch (err) {
      setError("Gagal tersambung ke server autentikasi.");
      setLoading(false);
    }
  };

  // Mengisi form secara instan untuk kemudahan debugging/pengujian peran
  const handleQuickFill = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("123"); // Sandi default mock data kita
    setError(null);
    setSuccessMsg(null);
  };

  return (
    <div className="w-full max-w-md space-y-8 bg-[var(--card)] p-8 rounded-2xl border border-[var(--border)] shadow-md transition-colors duration-200">
      <div className="text-center md:text-left space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
          Selamat Datang
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Silakan masuk untuk mengakses dasbor akademik Anda.
        </p>
      </div>

      {/* Box Notifikasi Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-[var(--foreground)] p-4 rounded-xl text-sm transition-all duration-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Box Notifikasi Sukses */}
      {successMsg && (
        <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/30 text-[var(--foreground)] p-4 rounded-xl text-sm transition-all duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />
          <p className="font-medium">{successMsg}</p>
        </div>
      )}

      {/* Form Utama */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-5 h-5 text-[var(--muted-foreground)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@arunika.edu"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-medium text-[var(--foreground)]">
                Kata Sandi
              </label>
              <span className="text-xs text-[var(--secondary)] hover:underline cursor-pointer">
                Lupa Sandi?
              </span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-5 h-5 text-[var(--muted-foreground)]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent outline-none transition"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] py-3 rounded-xl font-semibold hover:opacity-95 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Memverifikasi...
            </>
          ) : (
            <>
              Masuk Kelas
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}


/* STREAMING_CHUNK: Main LoginPage layout wrapper containing theme toggle */
export default function LoginPage() {
  return (
    <div
      className={`min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[var(--background)] transition-colors duration-200 relative`}
    >
      {/* Bagian Kiri: Filosofi Desain Morning Serenity (Hanya terlihat di Desktop) */}
      <div className="hidden lg:flex lg:col-span-7 bg-[var(--muted)] p-12 flex-col justify-between relative overflow-hidden">
        {/* Dekorasi efek cahaya fajar */}
        <div className="absolute right-0 top-1/4 w-[500px] h-[500px] rounded-full bg-[var(--accent)] bg-opacity-10 filter blur-[100px] -mr-48 pointer-events-none" />
        <div className="absolute left-10 bottom-10 w-[300px] h-[300px] rounded-full bg-[var(--primary)] bg-opacity-10 filter blur-[80px] -ml-24 pointer-events-none" />

        {/* Logo Branding */}
        <div className="flex items-center gap-2.5 text-[var(--primary)] relative z-10">
          <Sun className="w-9 h-9 text-[var(--accent)]" />
          <span className="text-2xl font-black tracking-wider text-[var(--foreground)]">
            Arunika
          </span>
        </div>

        {/* Teks Filosofi */}
        <div className="space-y-6 max-w-xl my-auto relative z-10">
          <span className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider bg-[var(--card)] text-[var(--primary)] border border-[var(--border)] uppercase shadow-sm">
            Philosophy of Morning Serenity
          </span>
          <h1 className="text-5xl font-black tracking-tight text-[var(--foreground)] leading-[1.1]">
            Ujian Tenang, <br />
            Fokus Maksimal.
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] leading-relaxed">
            Menghadirkan suasana fajar yang hangat dan bebas distraksi.
            Antarmuka pelindung mata kami dirancang khusus agar Anda tetap
            nyaman selama sesi evaluasi panjang.
          </p>
        </div>

        {/* Kaki Halaman (Branding) */}
        <div className="text-xs text-[var(--muted-foreground)] relative z-10">
          © 2026 Arunika LMS. Adaptive Learning at the Break of Dawn.
        </div>
      </div>

      {/* Bagian Kanan: Formulir Login */}
      <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-6 right-6 z-20">
          <ThemeToggle />
        </div>
        {/* Suspense Wrapper untuk penanganan query string searchParams */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
