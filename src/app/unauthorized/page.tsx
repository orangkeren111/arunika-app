"use client";

import Link from "next/link";
import { ArrowLeft, LockKeyhole, Sparkles } from "lucide-react";
import { signOut } from "next-auth/react";

export default function UnauthorizedPage() {
    const handleLogout = async () => {
        await signOut({ callbackUrl: "/login" });
    };
    return (
        <main className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
            {/* Surreal background */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {/* Large drifting glow */}
                <div className="absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--primary)] opacity-[0.08] blur-[120px] animate-[float_12s_ease-in-out_infinite]" />

                {/* Warm secondary glow */}
                <div className="absolute -right-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-[var(--accent)] opacity-[0.12] blur-[100px] animate-[drift_16s_ease-in-out_infinite]" />

                {/* Cold distant glow */}
                <div className="absolute -bottom-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-[var(--secondary)] opacity-[0.10] blur-[100px] animate-[driftReverse_18s_ease-in-out_infinite]" />

                {/* Surreal rings */}
                <div className="absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--primary)] opacity-20 animate-[orbit_20s_linear_infinite]" />

                <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--accent)] opacity-10 animate-[orbitReverse_28s_linear_infinite]" />

                <div className="absolute left-1/2 top-1/2 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--secondary)] opacity-[0.07] animate-[orbit_35s_linear_infinite]" />

                {/* Floating particles */}
                <span className="absolute left-[15%] top-[25%] h-2 w-2 rounded-full bg-[var(--primary)] opacity-40 animate-[particle_7s_ease-in-out_infinite]" />
                <span className="absolute left-[75%] top-[20%] h-3 w-3 rounded-full bg-[var(--accent)] opacity-30 animate-[particle_9s_ease-in-out_infinite_1s]" />
                <span className="absolute left-[80%] top-[70%] h-2 w-2 rounded-full bg-[var(--secondary)] opacity-40 animate-[particle_8s_ease-in-out_infinite_2s]" />
                <span className="absolute left-[20%] top-[75%] h-3 w-3 rounded-full bg-[var(--primary)] opacity-20 animate-[particle_11s_ease-in-out_infinite_3s]" />

                {/* Moving grid */}
                <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(var(--foreground)_1px,transparent_1px),linear-gradient(90deg,var(--foreground)_1px,transparent_1px)] [background-size:48px_48px] animate-[gridMove_20s_linear_infinite]" />
            </div>

            {/* Main content */}
            <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
                <section className="w-full max-w-xl text-center">
                    {/* Floating lock */}
                    <div className="relative mx-auto mb-10 h-32 w-32">
                        <div className="absolute inset-0 rounded-full bg-[var(--primary)] opacity-10 blur-2xl animate-pulse" />

                        <div className="absolute inset-3 rounded-full border border-[var(--primary)] opacity-30 animate-[spin_18s_linear_infinite]" />

                        <div className="absolute inset-6 flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] shadow-xl animate-[float_5s_ease-in-out_infinite]">
                            <LockKeyhole className="h-9 w-9 text-[var(--primary)]" />
                        </div>

                        <Sparkles className="absolute -right-1 top-4 h-5 w-5 text-[var(--accent)] animate-pulse" />
                    </div>

                    {/* Eyebrow */}
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)] shadow-sm">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--primary)]" />
                        Access Restricted
                    </div>

                    {/* Heading */}
                    <h1 className="text-5xl font-black tracking-tight leading-[1.05] sm:text-6xl">
                        Anda tidak memiliki akses
                        <br />
                        <span className="text-[var(--primary)] animate-[textFloat_5s_ease-in-out_infinite]">
                            ke halaman ini.
                        </span>
                    </h1>

                    {/* Description */}
                    <p className="mx-auto mt-7 max-w-md text-base leading-relaxed text-[var(--muted-foreground)] sm:text-lg">
                        Kontak admin sekolah anda untuk bantuan lebih lanjut.
                    </p>

                    {/* Strange portal */}
                    <div className="mx-auto mt-10 flex h-16 max-w-md items-center justify-center">
                        <div className="relative h-px w-full overflow-hidden bg-[var(--border)]">
                            <div className="absolute inset-y-0 left-0 w-1/3 bg-[var(--primary)] opacity-60 blur-[1px] animate-[scan_4s_ease-in-out_infinite]" />
                        </div>
                    </div>

                    {/* Action */}
                    <button
                        onClick={handleLogout}
                        className="group mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3.5 font-semibold text-[var(--primary-foreground)] shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                    >
                        <ArrowLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" />
                        Kembali Login
                    </button>

                    {/* Brand */}
                    <div className="mt-12 text-xs tracking-wide text-[var(--muted-foreground)]">
                        Arunika LMS
                        <span className="mx-2 opacity-40">•</span>
                        Adaptive Learning at the Break of Dawn
                    </div>
                </section>
            </div>

            {/* Animations + responsive behavior */}
            <style jsx>{`
    @keyframes float {
      0%,
      100% {
        transform: translate(-50%, -50%) scale(1);
      }
      50% {
        transform: translate(-47%, -53%) scale(1.08);
      }
    }

    @keyframes drift {
      0%,
      100% {
        transform: translate(0, 0) scale(1);
      }
      50% {
        transform: translate(-80px, 60px) scale(1.15);
      }
    }

    @keyframes driftReverse {
      0%,
      100% {
        transform: translate(0, 0) scale(1);
      }
      50% {
        transform: translate(90px, -50px) scale(1.12);
      }
    }

    @keyframes orbit {
      from {
        transform: translate(-50%, -50%) rotate(0deg);
      }
      to {
        transform: translate(-50%, -50%) rotate(360deg);
      }
    }

    @keyframes orbitReverse {
      from {
        transform: translate(-50%, -50%) rotate(360deg);
      }
      to {
        transform: translate(-50%, -50%) rotate(0deg);
      }
    }

    @keyframes particle {
      0%,
      100% {
        transform: translate(0, 0);
      }
      25% {
        transform: translate(20px, -30px);
      }
      50% {
        transform: translate(-15px, -55px);
      }
      75% {
        transform: translate(30px, -20px);
      }
    }

    @keyframes gridMove {
      from {
        transform: translate(0, 0);
      }
      to {
        transform: translate(48px, 48px);
      }
    }

    @keyframes textFloat {
      0%,
      100% {
        display: inline-block;
        transform: translateY(0);
      }
      50% {
        transform: translateY(-3px);
      }
    }

    @keyframes scan {
      0% {
        transform: translateX(-100%);
      }
      50%,
      100% {
        transform: translateX(400%);
      }
    }

    @media (max-width: 640px) {
      @keyframes drift {
        0%,
        100% {
          transform: translate(0, 0) scale(1);
        }
        50% {
          transform: translate(-35px, 30px) scale(1.08);
        }
      }

      @keyframes driftReverse {
        0%,
        100% {
          transform: translate(0, 0) scale(1);
        }
        50% {
          transform: translate(35px, -25px) scale(1.06);
        }
      }
    }

    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
      }
    }
  `}</style>
        </main>
    );
}
