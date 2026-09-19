"use client";

import React, { use, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { quizRepository } from "@/src/lib/repositories/quizRepository";
import QuizLobbyClient from "./QuizLobbyClient";
import { useOwnerGuard } from "@/src/lib/hooks/useOwnerGuard";
import { siswaRepository } from "@/src/lib/repositories/siswaRepository";

export default function QuizLobbyPage({
  params,
}: {
  params: Promise<{ jadwal_id: string }>;
}) {
  const resolvedParams = use(params);
  const { data: session, status } = useSession();
  const [ujianId, setUjianId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useOwnerGuard({
    isAuthorized: () =>
      siswaRepository.checkStudentAuthorizedForJadwal(
        resolvedParams.jadwal_id,
        session?.user?.id ? Number(session.user.id) : undefined,
      ),
    allowedRole: "SISWA",
    fallbackUrl: "/siswa/dashboard",
    errorMessage: "Akses Ditolak: Anda tidak terdaftar untuk mengikuti quiz ini.",
    isLoadingResource: status === "loading" || !session?.user?.id,
  });

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      quizRepository.getUjianIdByJadwal(Number(resolvedParams.jadwal_id)).then((id) => {
        setUjianId(id);
        setLoading(false);
      });
    }
  }, [resolvedParams.jadwal_id, session, status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#FAF8F3] text-[#39434D]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7FA88F] mb-4"></div>
        <p className="font-semibold text-sm">Menyiapkan antrean...</p>
      </div>
    );
  }

  if (!session?.user?.id || !ujianId) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#FAF8F3] text-[#39434D] p-4 text-center">
        <p className="text-red-500 font-bold">Ujian atau Sesi Anda tidak valid.</p>
        <p className="text-xs text-gray-500 mt-2">Silakan kembali ke dashboard dan coba lagi.</p>
      </div>
    );
  }

  return (
    <QuizLobbyClient
      jadwalId={resolvedParams.jadwal_id}
      ujianId={ujianId}
      siswaId={Number(session.user.id)}
    />
  );
}
