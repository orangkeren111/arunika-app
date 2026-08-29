"use client";

import React, { use, useRef } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useRouter } from "next/navigation";
import { ReportTemplate } from "@/src/components/ReportTemplate";
import { useStudentReportViewModel } from "./SiswaHistoryDetailViewModel";

export default function StudentReportPage({
  params,
}: {
  params: Promise<{ attempt_id: string }>;
}) {
  const componentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const resolvedParams = use(params);
  const { reportData } = useStudentReportViewModel(resolvedParams.attempt_id);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `${reportData?.studentName}_Quiz_Report`,
  });

  return (
    <div className="min-h-screen bg-[#39434D] p-8 font-sans">
      {/* Action Bar - Hidden during printing */}
      <div className="max-w-4xl mx-auto flex items-center justify-between mb-6 print:hidden">
        <button
          onClick={() => router.back()}
          className="bg-[#FAF8F3] hover:bg-gray-200 text-[#39434D] font-bold py-2 px-6 rounded shadow transition-colors"
        >
          ← Back
        </button>
        <div className="flex items-center gap-3">
          {reportData?.jadwalId && (
            <Link
              href={`/siswa/ujian/${reportData.jadwalId}/quiz/lobby`}
              className="bg-[#7FA88F] hover:bg-[#6c8f7a] text-white font-bold py-2 px-5 rounded shadow transition-colors flex items-center gap-2 text-sm"
            >
              <Play size={16} /> Lobby Quiz
            </Link>
          )}
          <button
            onClick={handlePrint}
            className="bg-[#FAF8F3] hover:bg-gray-200 text-[#39434D] font-bold py-2 px-6 rounded shadow transition-colors text-sm"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* The Printable Area */}
      <div ref={componentRef} className="print:p-0">
        {reportData && <ReportTemplate {...reportData} />}
      </div>
    </div>
  );
}
