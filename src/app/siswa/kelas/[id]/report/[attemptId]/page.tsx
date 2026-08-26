"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StudentReportPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);

  useEffect(() => {
    router.replace(`/siswa/history/${resolvedParams.attemptId}`);
  }, [resolvedParams.attemptId, router]);

  return null;
}
