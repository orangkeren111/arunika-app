import { useEffect, useState } from "react";
import { Kelas, Stats, User } from "../../../../types/admin";
import { adminRepository } from "@/src/lib/repositories/adminRepository";
import { useSession } from "next-auth/react";

export function useMembersViewModel(kelasId: string) {
  const [kelasDetail, setKelasDetail] = useState<Kelas | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [teacher, setTeacher] = useState<User | null>(null);
  const [availableStudents, setAvailableStudents] = useState<User[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchLoading, setBatchLoading] = useState(false);
  const { data: session, status } = useSession();
  const sekolahId = session?.user?.sekolah_id ?? 0;

  const refreshMembers = () =>
    adminRepository.getKelasMembers(Number(kelasId)).then((res) => {
      setKelasDetail(res.kelasDetail);
      setTeacher(res.teacher);
      setMembers(res.members);
    });

  useEffect(() => {
    setLoading(true);
    adminRepository.getKelasMembers(Number(kelasId)).then((res) => {
      setKelasDetail(res.kelasDetail);
      setTeacher(res.teacher);
      setMembers(res.members);
      setLoading(false);
    });
    adminRepository.getTeachers(sekolahId).then((res) => {
      setAvailableTeachers(res);
    });
    adminRepository
      .getPilihanSiswaKelas(sekolahId, Number(kelasId))
      .then((res) => {
        setAvailableStudents(res);
      });
  }, [kelasId]);

  const handleRemoveStudent = (id: number) => {
    if (confirm("Keluarkan siswa dari kelas?")) {
      adminRepository.removeSiswaFromKelas(Number(kelasId), id).then(() => {
        adminRepository.getKelasMembers(Number(kelasId)).then((res) => {
          setMembers(res.members);
        });
      });
    }
  };

  const handleAssignTeacher = (teacherId: number) => {
    adminRepository.updateKelas(Number(kelasId), { teacherId }).then(() => {
      // Re-fetch
      adminRepository.getKelasMembers(Number(kelasId)).then((res) => {
        setTeacher(res.teacher);
      });
    });
  };

  const handleAddStudent = (siswaId: number) => {
    adminRepository.addSiswaKeKelas(Number(kelasId), siswaId).then(() => {
      // Re-fetch
      adminRepository.getKelasMembers(Number(kelasId)).then((res) => {
        setMembers(res.members);
      });
    });
  };

  /**
   * Batch-add students to the class by username/email array (from Excel).
   * Returns the result summary ({ inserted, skipped, notFound }).
   */
  const handleBatchAddStudents = async (
    usernames: string[],
  ): Promise<{ inserted: number; skipped: number; notFound: string[] }> => {
    setBatchLoading(true);
    try {
      const result = await adminRepository.addSiswaBatchKeKelas(
        Number(kelasId),
        sekolahId,
        usernames,
      );
      await refreshMembers();
      return result;
    } finally {
      setBatchLoading(false);
    }
  };

  return {
    kelasDetail,
    teacher,
    members,
    loading,
    batchLoading,
    handleRemoveStudent,
    handleAssignTeacher,
    handleAddStudent,
    handleBatchAddStudents,
    availableStudents,
    availableTeachers,
  };
}
