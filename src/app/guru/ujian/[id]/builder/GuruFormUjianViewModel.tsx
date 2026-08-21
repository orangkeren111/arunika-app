import { guruRepository } from "@/src/lib/repositories/guruRepository";
import {
  Bab,
  Buku,
  Soal,
  UjianTemplate,
} from "@/src/app/types/guru";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface TemplateKompetensiItem {
  id?: number;
  kompetensiBabId: number;
  nomerKompetensi: string;
  isiKompetensi: string;
  jumlahSoal: number;
  totalPoint: number;
  isEnabled: boolean;
}

export function useFormUjianViewModel(id: string) {
  const [template, setTemplate] = useState<UjianTemplate>();
  const [loading, setLoading] = useState(true);
  const [selectedBuku, setSelectedBuku] = useState<string>("");
  const [activeBabs, setActiveBabs] = useState<string[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Soal[]>([]);
  const [babList, setBabList] = useState<Bab[]>([]);
  const [bukuList, setBukuList] = useState<Buku[]>([]);

  // New competency builder states
  const [templateKompetensi, setTemplateKompetensi] = useState<TemplateKompetensiItem[]>([]);
  const [availableSoalCounts, setAvailableSoalCounts] = useState<{ kompetensiBabId: number | null; count: number }[]>([]);

  const { data: session } = useSession();

  // Initial Load
  useEffect(() => {
    if (id === "new") {
      setTemplate({
        id: "new",
        title: "",
        questionCount: 0,
        durasiMenit: 90,
        isAdaptive: true,
      });
      setSelectedQuestions([]);
      setActiveBabs([]);
      setTemplateKompetensi([]);
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
          isAdaptive: res.isAdaptive ?? true,
        });

        if (res.templateKompetensi) {
          setTemplateKompetensi(
            res.templateKompetensi.map((tk: any) => ({
              id: tk.id,
              kompetensiBabId: tk.kompetensiBabId,
              nomerKompetensi: tk.nomerKompetensi || "",
              isiKompetensi: tk.isiKompetensi || "",
              jumlahSoal: tk.jumlahSoal || 0,
              totalPoint: tk.totalPoint || 0,
              isEnabled: tk.isEnabled,
            }))
          );
        }

        const allQuestions =
          res.babs?.flatMap((bab) => {
            const questionsDiBabIni = bab.questions || [];
            return questionsDiBabIni.map((q) => ({
              ...q,
              babId: bab.id,
            }));
          }) || [];

        setSelectedQuestions(allQuestions);
        const existingBabs = Array.from(new Set(allQuestions.map((q) => q.babId)));
        setActiveBabs(existingBabs);
      });
    }

    guruRepository.getBukuList(Number(session?.user?.id ?? 0)).then((res) => {
      setBukuList(res);
      setLoading(false);
    });
  }, [id]);

  // Load Bab List for selected book
  useEffect(() => {
    if (selectedBuku) {
      guruRepository.getBabByBuku(selectedBuku).then((res) => setBabList(res));
    } else {
      setBabList([]);
    }
  }, [selectedBuku]);

  // Load and merge competencies when active chapters change
  useEffect(() => {
    const babIds = activeBabs.map((b) => Number(b));
    if (babIds.length > 0) {
      guruRepository.getKompetensiForBabs(babIds).then((list) => {
        setTemplateKompetensi((prev) => {
          return list.map((c) => {
            const existing = prev.find((x) => x.kompetensiBabId === c.id);
            if (existing) {
              return {
                ...existing,
                nomerKompetensi: c.nomerKompetensi,
                isiKompetensi: c.isiKompetensi,
              };
            }
            return {
              kompetensiBabId: c.id,
              nomerKompetensi: c.nomerKompetensi,
              isiKompetensi: c.isiKompetensi,
              jumlahSoal: 2, // Default
              totalPoint: 10, // Default
              isEnabled: true,
            };
          });
        });
      });

      guruRepository.getAvailableSoalCounts(babIds).then((counts) => {
        setAvailableSoalCounts(counts);
      });
    } else {
      setTemplateKompetensi([]);
      setAvailableSoalCounts([]);
    }
  }, [activeBabs]);

  const handleToggleBab = async (babId: string) => {
    const isSelected = activeBabs.includes(babId);
    if (isSelected) {
      setActiveBabs((prev) => prev.filter((id) => id !== babId));
      setSelectedQuestions((prev) => prev.filter((q) => q.babId !== babId));
    } else {
      setActiveBabs((prev) => [...prev, babId]);
      try {
        const soalDariBank = await guruRepository.getSoalByBab(babId);
        const newTemplateQuestions: any[] = soalDariBank.map((soal) => ({
          id: `draft-${soal.id}`,
          soalAsliId: soal.id,
          babId: soal.babId,
          text: soal.text,
          options: soal.options,
          correctAnswer: soal.correctAnswer,
          type: soal.type,
          difficulty: soal.difficulty,
          bloomLevel: soal.bloomLevel,
        }));

        setSelectedQuestions((prev) => {
          const existingIds = new Set(prev.map((q) => q.id));
          const filteredNew = newTemplateQuestions.filter((q) => !existingIds.has(q.soalAsliId));
          return [...prev, ...filteredNew];
        });
      } catch (error) {
        console.error("Gagal mengambil soal:", error);
        setActiveBabs((prev) => prev.filter((id) => id !== babId));
      }
    }
  };

  const handleRemoveQuestion = (soalIdAtauAsliId: string) => {
    setSelectedQuestions((prev) => prev.filter((q) => q.id !== soalIdAtauAsliId));
  };

  const handleSaveTemplate = async () => {
    if (!template?.title) {
      alert("Judul ujian harus diisi.");
      return;
    }

    const isAdaptiveMode = template?.isAdaptive ?? true;

    // Validation: Check if there are enough questions in the bank for each enabled competency
    for (const tk of templateKompetensi) {
      if (tk.isEnabled) {
        const available = availableSoalCounts.find((x) => x.kompetensiBabId === tk.kompetensiBabId)?.count ?? 0;
        const required = isAdaptiveMode ? tk.jumlahSoal + 5 : tk.jumlahSoal;

        if (available < required) {
          alert(
            isAdaptiveMode
              ? `Bank soal tidak mencukupi! Untuk mode Adaptif (membutuhkan minimal ${tk.jumlahSoal} + 5 cadangan = ${required} soal per kompetensi), Kompetensi "${tk.nomerKompetensi}" hanya memiliki ${available} soal di bank.`
              : `Bank soal tidak mencukupi! Untuk Kompetensi "${tk.nomerKompetensi}", Anda membutuhkan ${tk.jumlahSoal} soal tetapi bank soal hanya memiliki ${available} soal.`
          );
          return;
        }
      }
    }

    // Derived total question count from enabled competencies
    const totalSoal = templateKompetensi.reduce((sum, tk) => sum + (tk.isEnabled ? tk.jumlahSoal : 0), 0);

    const payload = {
      ...template,
      questionCount: totalSoal,
      templateKompetensi: templateKompetensi.map((tk) => ({
        kompetensiBabId: tk.kompetensiBabId,
        jumlahSoal: tk.jumlahSoal,
        totalPoint: tk.totalPoint,
        isEnabled: tk.isEnabled,
      })),
    };

    try {
      const babIds = activeBabs.map((q) => Number(q));
      if (id === "new") {
        await guruRepository.createTemplate(payload, Number(session?.user.id ?? 0), babIds);
      } else {
        await guruRepository.updateTemplateQuestions(Number(id), payload, Number(session?.user.id ?? 0), babIds);
      }
      alert("Template ujian berhasil disimpan!");
      window.location.href = "/guru/ujian";
    } catch (error: any) {
      console.error("Gagal menyimpan template:", error);
      alert("Gagal menyimpan template ujian.");
    }
  };

  return {
    template,
    setTemplate,
    loading,
    babList,
    bukuList,
    activeBabs,
    selectedBuku,
    setSelectedBuku,
    selectedQuestions,
    templateKompetensi,
    setTemplateKompetensi,
    availableSoalCounts,
    handleToggleBab,
    handleRemoveQuestion,
    handleSaveTemplate,
  };
}
