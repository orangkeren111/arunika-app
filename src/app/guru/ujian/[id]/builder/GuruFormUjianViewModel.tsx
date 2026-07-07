import { guruRepository } from "@/src/lib/repositories/guruRepository";
import {
  Bab,
  Buku,
  Soal,
  SoalTemplate,
  UjianTemplate,
} from "@/src/app/types/guru";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function useFormUjianViewModel(id: string) {
  // --- Existing Template List States ---
  const [template, setTemplate] = useState<UjianTemplate>();
  const [loading, setLoading] = useState(true);

  // --- New Exam Builder States ---
  const [selectedBuku, setSelectedBuku] = useState<string>("");
  const [selectedBab, setSelectedBab] = useState<string>("");
  const [selectedQuestions, setSelectedQuestions] = useState<SoalTemplate[]>(
    [],
  );

  // TODO: Create proper states and fetch logic for these lists
  const [babList, setBabList] = useState<Bab[]>([]);
  const [bukuList, setBukuList] = useState<Buku[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<Soal[]>([]);
  const { data: session, status } = useSession();

  useEffect(() => {
    guruRepository.getTemplateById(Number(id)).then((res) => {
      setTemplate({
        id: res?.id ?? "",
        title: res?.title ?? "",
        questionCount: res?.questionCount ?? 0,
      });
      setSelectedQuestions(res?.questions ?? []);
      setLoading(false);
    });
    guruRepository.getBukuList(Number(session?.user.id ?? 0)).then((res) => {
      setBukuList(res);
      setLoading(false);
    });
  }, []);

  // TODO: Add an effect to fetch 'availableQuestions' whenever 'selectedBab' changes
  useEffect(() => {
    if (selectedBab) {
      guruRepository
        .getSoalByBab(selectedBab)
        .then((res) => setAvailableQuestions(res));
    }
  }, [selectedBab]);

  useEffect(() => {
    if (selectedBuku) {
      guruRepository.getBabByBuku(selectedBuku).then((res) => setBabList(res));
    }
  }, [selectedBuku]);

  const isQuestionSelected = (bankSoalId: string) => {
    return selectedQuestions.some((selected) => {
      const originalId = selected.soalAsliId
        ? selected.soalAsliId
        : selected.id;
      return originalId === bankSoalId;
    });
  };
  const handleAddQuestion = (soalDariBank: Soal) => {
    if (!isQuestionSelected(soalDariBank.id)) {
      // Convert tipe Soal menjadi SoalTemplate
      const newTemplateQuestion: SoalTemplate = {
        // Bikin ID sementara untuk React key mapping (biar nggak bentrok dengan ID DB kalau ada)
        id: `draft-${soalDariBank.id}`,

        // MAPPING UTAMA: ID dari BankSoal pindah ke soalAsliId
        soalAsliId: soalDariBank.id,
        babId: soalDariBank.babId,

        // Copy sisa datanya
        text: soalDariBank.text,
        options: soalDariBank.options,
        correctAnswer: soalDariBank.correctAnswer,
        type: soalDariBank.type,
      };

      setSelectedQuestions((prev) => [...prev, newTemplateQuestion]);
    }
  };

  const handleRemoveQuestion = (soalIdAtauAsliId: string) => {
    setSelectedQuestions((prev) =>
      prev.filter(
        (q) => q.id !== soalIdAtauAsliId && q.soalAsliId !== soalIdAtauAsliId,
      ),
    );
  };

  const handleSaveTemplate = async () => {
    try {
      const soalIds = selectedQuestions.map((q) => Number(q.id));

      // Panggil service
      await guruRepository.updateTemplateQuestions(
        Number(template?.id ?? 0),
        soalIds,
      );
    } catch (error: any) {
      console.error("Gagal update template:", error);
    }
  };

  return {
    template,
    loading,
    babList,
    bukuList,
    selectedBab,
    setSelectedBab,
    selectedBuku,
    setSelectedBuku,
    availableQuestions,
    selectedQuestions,
    handleAddQuestion,
    handleRemoveQuestion,
    handleSaveTemplate,
    isQuestionSelected,
  };
}
