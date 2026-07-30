import { superadminRepository } from "@/src/lib/repositories/superadminRepository";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function useSuperadminDashboardViewModel() {
  const { data: session, status } = useSession();
  
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // School detail roster modal
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const fetchSchools = async () => {
    if (status !== "authenticated" || session?.user?.role !== "SUPERADMIN") return;
    setLoading(true);
    const data = await superadminRepository.getSchoolsWithStats();
    setSchools(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSchools();
  }, [session, status]);

  const handleCreateSchool = async (name: string, address: string) => {
    await superadminRepository.createSchool(name, address);
    fetchSchools();
  };

  const handleUpdateSchool = async (id: string, name: string, address: string) => {
    await superadminRepository.updateSchool(id, name, address);
    fetchSchools();
  };

  const handleDeleteSchool = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus sekolah ini? Semua data terkait (siswa, guru, kelas) akan ikut terhapus.")) {
      await superadminRepository.deleteSchool(id);
      fetchSchools();
    }
  };

  const viewSchoolMembers = async (school: any) => {
    setSelectedSchool(school);
    setLoadingMembers(true);
    const list = await superadminRepository.getSchoolMembers(school.id.toString());
    setMembers(list);
    setLoadingMembers(false);
  };

  return {
    schools,
    loading,
    selectedSchool,
    setSelectedSchool,
    members,
    loadingMembers,
    viewSchoolMembers,
    handleCreateSchool,
    handleUpdateSchool,
    handleDeleteSchool,
    refresh: fetchSchools,
  };
}
