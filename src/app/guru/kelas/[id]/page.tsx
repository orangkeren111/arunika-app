"use client";

import React, { use, useState } from "react";
import { useKelasDetailViewModel } from "./GuruKelasDetailViewModel";
import { useOwnerGuard } from "@/src/lib/hooks/useOwnerGuard";
import { KelasHeader } from "./components/KelasHeader";
import { KelasNavigationTabs, TabType } from "./components/KelasNavigationTabs";
import { DashboardTab } from "./components/DashboardTab";
import { ExamsTab } from "./components/ExamsTab";
import { StudentsTab } from "./components/StudentsTab";
import { ReportTab } from "./components/ReportTab";
import { ScheduleModal } from "./components/ScheduleModal";
import { StudentHistoryModal } from "./components/StudentHistoryModal";
import { ShareQRModal } from "./components/ShareQRModal";

export default function GuruKelasDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const {
    classDetail,
    loadingClass,
    classDashboard,
    loadingDashboard,
    exams,
    loadingExams,
    gradesReport,
    loadingGrades,
    templateList,
    tipeList,
    judulJadwal,
    setJudulJadwal,
    selectedTemplate,
    setSelectedTemplate,
    selectedTipe,
    setSelectedTipe,
    waktuMulai,
    setWaktuMulai,
    waktuSelesai,
    setWaktuSelesai,
    handleCreateJadwal,
    handleStartExam,
    handleStopExam,
    // Student History Modal states
    selectedStudent,
    setSelectedStudent,
    studentHistory,
    loadingHistory,
    viewStudentHistory,
  } = useKelasDetailViewModel(resolvedParams.id);

  useOwnerGuard({
    ownerId: classDetail?.teacherId,
    allowedRole: "GURU",
    fallbackUrl: "/guru/kelas",
    isLoadingResource: loadingClass || !classDetail,
  });

  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  if (loadingClass || !classDetail) {
    return (
      <div className="p-8 text-center text-[var(--muted-foreground)]">
        Memuat detail kelas...
      </div>
    );
  }

  return (
    <div className="space-y-6 relative px-4 md:px-0 font-sans">
      {/* Header & Navigation */}
      <KelasHeader
        classDetail={classDetail}
        onOpenQRModal={() => setShowQRModal(true)}
        onOpenScheduleModal={() => setShowScheduleModal(true)}
      />

      <KelasNavigationTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Tab Views */}
      {activeTab === "dashboard" && (
        <DashboardTab
          loadingDashboard={loadingDashboard}
          classDashboard={classDashboard}
        />
      )}

      {activeTab === "exams" && (
        <ExamsTab
          loadingExams={loadingExams}
          exams={exams}
          classId={resolvedParams.id}
          handleStartExam={handleStartExam}
          handleStopExam={handleStopExam}
        />
      )}


      {activeTab === "students" && (
        <StudentsTab
          students={classDetail.students}
          onViewStudentHistory={viewStudentHistory}
        />
      )}

      {activeTab === "report" && (
        <ReportTab
          loadingGrades={loadingGrades}
          gradesReport={gradesReport}
          students={classDetail.students}
        />
      )}

      {/* Modals */}
      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        judulJadwal={judulJadwal}
        setJudulJadwal={setJudulJadwal}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        selectedTipe={selectedTipe}
        setSelectedTipe={setSelectedTipe}
        waktuMulai={waktuMulai}
        setWaktuMulai={setWaktuMulai}
        waktuSelesai={waktuSelesai}
        setWaktuSelesai={setWaktuSelesai}
        templateList={templateList}
        tipeList={tipeList}
        onSaveJadwal={handleCreateJadwal}
      />

      <StudentHistoryModal
        selectedStudent={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        loadingHistory={loadingHistory}
        studentHistory={studentHistory}
      />

      <ShareQRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        classNameTitle={classDetail.name}
        classCode={classDetail.classCode}
        origin={origin}
      />
    </div>
  );
}
