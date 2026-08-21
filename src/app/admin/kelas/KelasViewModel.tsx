import { adminRepository } from "@/src/lib/repositories/adminRepository";
import { Kelas, User } from "@/src/app/types/admin";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function useKelasViewModel() {
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const sekolahId = session?.user?.sekolah_id ?? 0;

  const fetchKelas = () => {
    setLoading(true);
    adminRepository.getKelas(sekolahId).then((res) => {
      setKelas(res);
      setLoading(false);
    });
    adminRepository.getTeachers(sekolahId).then((res) => {
      setTeachers(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchKelas();
  }, []);

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus kelas ini?")) {
      const success = await adminRepository.deleteKelas(id);
      if (success) fetchKelas();
    }
  };

  const handleAdd = async (namaKelas: string, teacherId: number) => {
    await adminRepository.addKelas({ name: namaKelas, teacherId }, sekolahId);
    fetchKelas();
  };

  const handleEdit = async (id: number, data: Partial<Kelas>) => {
    await adminRepository.updateKelas(id, data);
    fetchKelas();
  }, handleRetire = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menonaktifkan/tutup kelas ini?")) {
      await adminRepository.retireKelas(id);
      fetchKelas();
    }
  };

  return { kelas, teachers, loading, handleDelete, handleAdd, handleEdit, handleRetire };
}
