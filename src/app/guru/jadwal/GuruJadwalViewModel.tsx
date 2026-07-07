import { guruRepository } from "@/src/lib/repositories/guruRepository";
import { JadwalUjian, TipeUjian, UjianTemplate } from "@/src/app/types/guru";
import { useEffect, useState } from "react";
import { Kelas } from "../../types/admin";
import { useSession } from "next-auth/react";

export function useJadwalViewModel() {
  // --- Existing List States ---
  const [jadwalList, setJadwalList] = useState<JadwalUjian[]>([]);
  const [loading, setLoading] = useState(true);

  // --- New Form States ---
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("");
  const [selectedTipe, setSelectedTipe] = useState("");
  const [waktuPelaksanaan, setWaktuPelaksanaan] = useState("");
  const [templateList, setTemplateList] = useState<UjianTemplate[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [tipeList, setTipeList] = useState<TipeUjian[]>([]);
  const { data: session, status } = useSession();

  const fetchJadwal = () => {
    setLoading(true);
    guruRepository.getJadwal(Number(session?.user.id ?? 0)).then((res) => {
      setJadwalList(res);
      setLoading(false);
    });
    guruRepository.getTemplates(Number(session?.user.id ?? 0)).then((res) => {
      setTemplateList(res);
      setLoading(false);
    });
    guruRepository
      .getKelas(
        Number(session?.user.sekolah_id ?? 0),
        Number(session?.user.id ?? 0),
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
  }, []);

  // Updated to consume the internal form states directly instead of taking parameters
  const handleCreateJadwal = async () => {
    // TODO: Add form validation (e.g., check if all states are filled) before submitting

    await guruRepository.createJadwal({
      templateId: selectedTemplate,
      kelasId: selectedKelas,
      startTime: waktuPelaksanaan,
      tipeUjianId: selectedTipe,
    });

    // TODO: Handle success state (e.g., redirect to '/guru/jadwal' or show success toast)
    // TODO: Clear form states here if the user remains on the same page

    fetchJadwal();
  };

  return {
    jadwalList,
    loading,
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
