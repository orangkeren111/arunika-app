import { guruRepository } from "@/src/lib/repositories/guruRepository";
import { TipeUjian, UjianTemplate } from "@/src/app/types/guru";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { StatusUjian } from "@prisma/client";

export function useKelasDetailViewModel(kelasId: string) {
  const { data: session, status } = useSession();
  
  // --- Class Detail States ---
  const [classDetail, setClassDetail] = useState<any>(null);
  const [loadingClass, setLoadingClass] = useState(true);

  // --- Exams States ---
  const [exams, setExams] = useState<any[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);

  // --- Grades Report States ---
  const [gradesReport, setGradesReport] = useState<any[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(true);

  // --- Scheduling states (Form) ---
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedTipe, setSelectedTipe] = useState("");
  const [waktuMulai, setWaktuMulai] = useState("");
  const [waktuSelesai, setWaktuSelesai] = useState("");
  
  const [templateList, setTemplateList] = useState<UjianTemplate[]>([]);
  const [tipeList, setTipeList] = useState<TipeUjian[]>([]);

  // --- Student History Detail Modal States ---
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentHistory, setStudentHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchClassInfo = async () => {
    if (status !== "authenticated" || !kelasId) return;
    setLoadingClass(true);
    const detail = await guruRepository.getKelasDetail(kelasId);
    setClassDetail(detail);
    setLoadingClass(false);
  };

  const fetchExams = async () => {
    if (status !== "authenticated" || !kelasId) return;
    setLoadingExams(true);
    const list = await guruRepository.getExamsByKelas(kelasId);
    setExams(list);
    setLoadingExams(false);
  };

  const fetchGrades = async () => {
    if (status !== "authenticated" || !kelasId) return;
    setLoadingGrades(true);
    const report = await guruRepository.getClassGradesReport(kelasId);
    setGradesReport(report);
    setLoadingGrades(false);
  };

  const fetchFormMetadata = async () => {
    if (status !== "authenticated" || !session?.user?.id) return;
    const [templates, tipes] = await Promise.all([
      guruRepository.getTemplates(Number(session.user.id)),
      guruRepository.getTipeUjian(),
    ]);
    setTemplateList(templates);
    setTipeList(tipes);
  };

  useEffect(() => {
    fetchClassInfo();
    fetchExams();
    fetchGrades();
    fetchFormMetadata();
  }, [kelasId, session, status]);

  const handleCreateJadwal = async () => {
    if (!selectedTemplate || !selectedTipe || !waktuMulai) {
      alert("Harap lengkapi semua field form pembuatan ujian!");
      return;
    }
    const end = waktuSelesai ? waktuSelesai : new Date(new Date(waktuMulai).getTime() + 90 * 60000).toISOString();
    await guruRepository.createJadwal({
      templateId: selectedTemplate,
      kelasId: kelasId,
      startTime: waktuMulai,
      endTime: end,
      tipeUjianId: selectedTipe,
    });
    // Clear form states
    setSelectedTemplate("");
    setSelectedTipe("");
    setWaktuMulai("");
    setWaktuSelesai("");
    fetchExams();
    fetchGrades();
  };

  const handleStartExam = async (jadwalId: string) => {
    await guruRepository.updateJadwalStatus(jadwalId, StatusUjian.ONGOING);
    fetchExams();
  };

  const handleStopExam = async (jadwalId: string) => {
    await guruRepository.updateJadwalStatus(jadwalId, StatusUjian.COMPLETED);
    fetchExams();
  };

  const viewStudentHistory = async (student: any) => {
    setSelectedStudent(student);
    setLoadingHistory(true);
    const history = await guruRepository.getStudentHistoryInClass(student.id, kelasId);
    setStudentHistory(history);
    setLoadingHistory(false);
  };

  return {
    classDetail,
    loadingClass,
    exams,
    loadingExams,
    gradesReport,
    loadingGrades,
    templateList,
    tipeList,
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
    // Student history details
    selectedStudent,
    setSelectedStudent,
    studentHistory,
    loadingHistory,
    viewStudentHistory,
    refresh: () => {
      fetchClassInfo();
      fetchExams();
      fetchGrades();
    }
  };
}
