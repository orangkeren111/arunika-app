import { guruRepository } from "@/src/lib/repositories/guruRepository";
import { JadwalUjian, TipeUjian, UjianTemplate } from "@/src/app/types/guru";
import { useEffect, useState } from "react";
import { Kelas } from "../../types/admin";
import { useSession } from "next-auth/react";

import { useRouter } from "next/navigation";

export function useJadwalViewModel() {
  const router = useRouter();
  // --- Existing List States ---
  const [jadwalList, setJadwalList] = useState<JadwalUjian[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Form States ---
  const [judulJadwal, setJudulJadwal] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedTipe, setSelectedTipe] = useState("");
  const [waktuPelaksanaan, setWaktuPelaksanaan] = useState("");
  const [templateList, setTemplateList] = useState<UjianTemplate[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [tipeList, setTipeList] = useState<TipeUjian[]>([]);
  const { data: session } = useSession();

  const fetchJadwal = () => {
    const guruId = Number(session?.user?.id ?? 1);
    setLoading(true);
    guruRepository.getJadwal(guruId).then((res) => {
      setJadwalList(res);
      setLoading(false);
    });
    guruRepository.getTemplates(guruId).then((res) => {
      setTemplateList(res);
      setLoading(false);
    });
    guruRepository
      .getKelas(
        Number(session?.user?.sekolah_id ?? 1),
        guruId,
      )
      .then((res) => {
        setKelasList(res);
        setLoading(false);
      });
    guruRepository.getTipeUjian().then((res) => {
      setTipeList(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchJadwal();
  }, [session?.user?.id]);

  const handleCreateJadwal = async () => {
    if (!selectedTemplate || !selectedKelas) {
      alert("Harap pilih Template Ujian dan Kelas.");
      return;
    }

    const templateObj = templateList.find((t) => t.id === selectedTemplate);
    const tipeObj = tipeList.find((t) => t.id.toString() === selectedTipe);
    const fallbackTitle = `${tipeObj ? tipeObj.namaTipeUjian : "Ujian"} - ${templateObj ? templateObj.title : "Materi"}`;
    const finalTitle = judulJadwal.trim() || fallbackTitle;

    await guruRepository.createJadwal({
      title: finalTitle,
      templateId: selectedTemplate,
      kelasId: selectedKelas,
      startTime: waktuPelaksanaan,
      tipeUjianId: selectedTipe || "1",
    });

    fetchJadwal();
    router.push("/guru/jadwal");
  };

  return {
    jadwalList,
    loading,
    judulJadwal,
    setJudulJadwal,
    selectedTemplate,
    setSelectedTemplate,
    selectedKelas,
    setSelectedKelas,
    selectedTipe,
    setSelectedTipe,
    waktuPelaksanaan,
    setWaktuPelaksanaan,
    handleCreateJadwal,
    templateList,
    kelasList,
    tipeList,
  };
}
