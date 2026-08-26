"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Users, ArrowLeft, CheckCircle2, AlertTriangle, Loader2, Camera, CameraOff } from "lucide-react";
import Link from "next/link";
import { siswaRepository } from "@/src/lib/repositories/siswaRepository";
import { Html5Qrcode } from "html5-qrcode";

function JoinKelasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  const [classCode, setClassCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");

  // Automatically read code from query parameters (e.g., from QR Code)
  useEffect(() => {
    const codeParam = searchParams.get("code");
    if (codeParam) {
      setClassCode(codeParam.toUpperCase());
    }
  }, [searchParams]);

  // Handle QR Scanner Activation and Processing
  useEffect(() => {
    if (!isScanning) return;
    setCameraError("");

    const html5QrCode = new Html5Qrcode("qr-reader-container");
    
    html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 220, height: 220 },
      },
      (decodedText) => {
        try {
          const url = new URL(decodedText);
          const code = url.searchParams.get("code") || decodedText;
          setClassCode(code.toUpperCase());
        } catch (e) {
          setClassCode(decodedText.toUpperCase());
        }
        setIsScanning(false);
      },
      () => {
        // silent error handler for frame-by-frame scanner updates
      }
    ).catch((err) => {
      console.error("Camera start error:", err);
      setCameraError("Gagal mengakses kamera. Pastikan izin kamera telah diberikan.");
      setIsScanning(false);
    });

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch((err) => console.error("Failed to stop scanner", err));
      }
    };
  }, [isScanning]);

  const handleJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!classCode.trim()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    if (!session?.user?.id) {
      setError("Sesi aktif tidak ditemukan. Silakan login kembali.");
      setLoading(false);
      return;
    }

    try {
      const result = await siswaRepository.joinKelasByCode(
        Number(session.user.id),
        classCode.trim()
      );

      if (result.success) {
        setSuccess(`Berhasil bergabung dengan kelas: ${result.className}`);
        setClassCode("");
        // Redirect to classes page after 2 seconds
        setTimeout(() => {
          router.push("/siswa/kelas");
        }, 2000);
      } else {
        setError(result.error || "Gagal bergabung ke kelas.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Terjadi kesalahan pada server. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 px-4 md:px-0 py-8 font-sans">
      {/* Back to dashboard */}
      <Link
        href="/siswa/dashboard"
        className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition mb-2"
      >
        <ArrowLeft size={16} /> Kembali ke Dashboard
      </Link>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 md:p-8 shadow-lg space-y-6 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full flex items-center justify-center mx-auto">
            <Users size={24} />
          </div>
          <h1 className="text-2xl font-black text-[var(--foreground)] tracking-tight">Gabung Kelas Baru</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Masukkan 8 karakter kode kelas yang diberikan oleh guru Anda atau scan QR Code.
          </p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">{success}</p>
              <p className="text-xs opacity-90 mt-1">Mengalihkan ke halaman Kelas Anda...</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Gagal Gabung Kelas</p>
              <p className="text-xs opacity-90 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Camera Access Error Alert */}
        {cameraError && (
          <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 p-4 rounded-xl animate-in fade-in">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold">{cameraError}</p>
          </div>
        )}

        {/* Scanning Camera Viewport */}
        {isScanning && (
          <div className="space-y-4">
            <div className="relative w-full max-w-[280px] mx-auto rounded-2xl overflow-hidden border-2 border-[var(--primary)] shadow-lg aspect-square bg-black flex items-center justify-center">
              <div id="qr-reader-container" className="w-full h-full" />
              {/* Blinking scanning target line */}
              <div className="absolute left-0 right-0 h-0.5 bg-[var(--primary)] opacity-80 shadow-[0_0_8px_var(--primary)] animate-pulse top-1/2" />
            </div>
            <button
              onClick={() => setIsScanning(false)}
              className="w-full flex items-center justify-center gap-2 border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/50 text-[var(--foreground)] py-2.5 px-4 rounded-xl text-sm font-bold shadow transition cursor-pointer"
            >
              <CameraOff size={18} />
              Matikan Kamera
            </button>
          </div>
        )}

        {/* Scan Button Trigger */}
        {!isScanning && (
          <button
            onClick={() => setIsScanning(true)}
            className="w-full flex items-center justify-center gap-2 border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/50 text-[var(--foreground)] py-2.5 px-4 rounded-xl text-sm font-bold shadow transition cursor-pointer"
          >
            <Camera size={18} />
            Buka Scanner Kamera (Scan QR)
          </button>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="code" className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider block">
              Kode Kelas
            </label>
            <input
              id="code"
              type="text"
              placeholder="CONTOH12"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value.toUpperCase())}
              disabled={loading || !!success}
              maxLength={8}
              required
              className="w-full text-center text-xl font-black tracking-widest uppercase bg-[var(--muted)]/20 border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] rounded-xl py-3 px-4 outline-none transition duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !classCode.trim() || !!success}
            className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] font-bold py-3 px-4 rounded-xl shadow-md hover:opacity-95 disabled:opacity-50 transition duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Memproses...
              </>
            ) : (
              "Gabung Kelas"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function JoinKelasPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      }
    >
      <JoinKelasContent />
    </Suspense>
  );
}
