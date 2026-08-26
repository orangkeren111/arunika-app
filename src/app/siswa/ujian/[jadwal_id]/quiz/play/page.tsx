"use client";

import React, { use } from "react";
import { useSearchParams } from "next/navigation";
import QuizPlayClient from "./QuizPlayClient";

export default function QuizPlayPage({
  params,
}: {
  params: Promise<{ jadwal_id: string }>;
}) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const competencyId = searchParams.get("competencyId") || searchParams.get("competency_id");

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
