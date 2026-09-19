"use client";

import React, { use } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import QuizPlayClient from "./QuizPlayClient";
import { useOwnerGuard } from "@/src/lib/hooks/useOwnerGuard";
import { siswaRepository } from "@/src/lib/repositories/siswaRepository";

export default function QuizPlayPage({
  params,
}: {
  params: Promise<{ jadwal_id: string }>;
}) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const sessionId = searchParams.get("sessionId");
  const competencyId = searchParams.get("competencyId") || searchParams.get("competency_id");

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

  if (!sessionId) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#FAF8F3] text-[#39434D] p-4 text-center">
        <p className="text-red-500 font-bold">Parameter sesi permainan tidak ditemukan.</p>
        <p className="text-xs text-gray-500 mt-2">Silakan hubungi admin atau kembali ke lobby.</p>
      </div>
    );
  }

  return (
    <QuizPlayClient
      sessionId={Number(sessionId)}
      jadwalId={resolvedParams.jadwal_id}
      competencyId={competencyId ? Number(competencyId) : null}
    />
  );
}
