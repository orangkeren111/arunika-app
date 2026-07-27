"use client";

import React, { use, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { useRouter } from "next/navigation";
import { ReportTemplate } from "@/src/components/ReportTemplate";
import { useStudentReportViewModel } from "./StudentReportViewModel";

export default function StudentReportPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const componentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const resolvedParams = use(params);
  const { reportData } = useStudentReportViewModel(resolvedParams.attemptId);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `${reportData?.studentName}_Quiz_Report`,
  });

  return (
    <div className="min-h-screen bg-[#39434D] p-8 font-sans">
      {/* Action Bar - Hidden during printing */}
      <div className="max-w-4xl mx-auto flex justify-between mb-6 print:hidden">
        <button
          onClick={() => router.back()}
          className="bg-[#FAF8F3] hover:bg-gray-200 text-[#39434D] font-bold py-2 px-6 rounded shadow transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handlePrint}
          className="bg-[#7FA88F] hover:bg-[#6c8f7a] text-white font-bold py-2 px-6 rounded shadow transition-colors"
        >
          Download PDF
        </button>
      </div>

      {/* The Printable Area */}
      <div ref={componentRef} className="print:p-0">
        {reportData && <ReportTemplate {...reportData} />}
      </div>
    </div>
  );
}
