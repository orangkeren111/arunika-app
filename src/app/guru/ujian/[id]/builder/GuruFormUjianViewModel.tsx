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

  const [activeBabs, setActiveBabs] = useState<string[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Soal[]>([]);

  const [babList, setBabList] = useState<Bab[]>([]);
  const [bukuList, setBukuList] = useState<Buku[]>([]);

  // Note: In your real app context, keep the useSession hook here:
  const { data: session, status } = useSession();
  // const session = { user: { id: 1 } }; // Mocked here so the preview doesn't break

  useEffect(() => {
    // 1. Handle Initialization: Create vs Update
    if (id === "new") {
      setTemplate({
        id: "new",
        title: "",
        questionCount: 0,
        durasiMenit: 0,
        reqC1: 10,
        reqC2: 10,
        reqC3: 10,
        reqC4: 10,
      });
      setSelectedQuestions([]);
      setActiveBabs([]);
      // Loading will be set to false after bukuList is fetched below
    } else {
      guruRepository.getTemplateById(Number(id)).then((res) => {
        if (!res) {
          setLoading(false);
          return;
        }

        setTemplate({
          id: res.id ?? "",
          title: res.title ?? "",
          questionCount: res.questionCount ?? 0,
          durasiMenit: res.durasiMenit ?? 0,
          reqC1: res.reqC1 ?? 10,
          reqC2: res.reqC2 ?? 10,
          reqC3: res.reqC3 ?? 10,
          reqC4: res.reqC4 ?? 10,
        });
        const allQuestions =
          res.babs?.flatMap((bab) => {
            const questionsDiBabIni = bab.questions || [];

            return questionsDiBabIni.map((q) => ({
              ...q,
              babId: bab.id,
            }));
          }) || [];

        setSelectedQuestions(allQuestions);

        const existingBabs = Array.from(
          new Set(allQuestions.map((q) => q.babId)),
        );

        setActiveBabs(existingBabs);
      });
    }

    // 2. Fetch Buku List (Required for both Create and Update)
    guruRepository.getBukuList(Number(session?.user?.id ?? 0)).then((res) => {
      setBukuList(res);
      setLoading(false);
    });
  }, [id]); // Added 'id' as a dependency

  useEffect(() => {
    if (selectedBuku) {
      guruRepository.getBabByBuku(selectedBuku).then((res) => setBabList(res));
    } else {
      setBabList([]);
    }
  }, [selectedBuku]);

  const handleToggleBab = async (babId: string) => {
    const isSelected = activeBabs.includes(babId);

    if (isSelected) {
      setActiveBabs((prev) => prev.filter((id) => id !== babId));
      setSelectedQuestions((prev) => prev.filter((q) => q.babId !== babId));
    } else {
      setActiveBabs((prev) => [...prev, babId]);

      try {
        const soalDariBank = await guruRepository.getSoalByBab(babId);

        const newTemplateQuestions: SoalTemplate[] = soalDariBank.map(
          (soal) => ({
            id: `draft-${soal.id}`,
            soalAsliId: soal.id,
            babId: soal.babId,
            text: soal.text,
            options: soal.options,
            correctAnswer: soal.correctAnswer,
            type: soal.type,
            difficulty: soal.difficulty,
            bloomLevel: soal.bloomLevel,
          }),
        );

        setSelectedQuestions((prev) => {
          const existingIds = new Set(prev.map((q) => q.id));
          const filteredNew = newTemplateQuestions.filter(
            (q) => !existingIds.has(q.soalAsliId),
          );
          return [...prev, ...filteredNew];
        });
      } catch (error) {
        console.error("Gagal mengambil soal:", error);
        setActiveBabs((prev) => prev.filter((id) => id !== babId));
      }
    }
  };

  const handleRemoveQuestion = (soalIdAtauAsliId: string) => {
    setSelectedQuestions((prev) =>
      prev.filter((q) => q.id !== soalIdAtauAsliId),
    );
  };

  const handleSaveTemplate = async () => {
    if (
      (template?.reqC1 ?? 0) <= 10 ||
      (template?.reqC2 ?? 0) <= 10 ||
      (template?.reqC3 ?? 0) <= 10 ||
      (template?.reqC4 ?? 0) <= 10
    ) {
      alert("DDA Error: Kriteria jumlah soal untuk setiap tingkat taksonomi Bloom (C1, C2, C3, C4) harus lebih dari 10 soal agar mesin ujian adaptif (DDA) dapat bekerja!");
      return;
    }

    try {
      const babIds = activeBabs.map((q) =>
        Number(q.toString().replace(/\D/g, "") || "0"),
      );

      if (id === "new") {
        // CREATE MODE
        // Assuming your repository has a create method that takes a payload.
        // Adjust the payload structure based on your actual API/DB requirements.
        if (template) {
          await guruRepository.createTemplate(
            template,
            Number(session?.user.id ?? 0),
            babIds,
          );
        }
      } else {
        // UPDATE MODE
        if (template) {
          await guruRepository.updateTemplateQuestions(
            Number(template?.id ?? 0),
            template,
            Number(session?.user.id ?? 0),
            babIds,
          );
        }
      }
    } catch (error: any) {
      console.error("Gagal menyimpan template:", error);
    }
  };

  return {
    template,
    setTemplate, // EXPOSED: So the UI can update the template title in Create Mode
    loading,
    babList,
    bukuList,
    activeBabs,
    selectedBuku,
    setSelectedBuku,
    selectedQuestions,
    handleToggleBab,
    handleRemoveQuestion,
    handleSaveTemplate,
  };
}
