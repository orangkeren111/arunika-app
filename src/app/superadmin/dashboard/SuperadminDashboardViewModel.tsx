import { superadminRepository } from "@/src/lib/repositories/superadminRepository";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Tingkat } from "../../types/admin";
type SubscriptionTier = "FREE" | "BOOK_ONLY" | "PREMIUM";

export function useSuperadminDashboardViewModel() {
  const { data: session, status } = useSession();

  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | "ACTIVE" | "PAST_DUE">("ALL");

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

  const filteredSchools = schools.filter((school) => {
    if (paymentFilter === "ALL") return true;
    return school.paymentStatus === paymentFilter;
  });

  const handleCreateSchool = async (
    name: string,
    address: string,
    tingkat: string,
    tier: string,
    adminData?: { name: string; email: string; password?: string },
    paymentPlan?: { jumlahBulan: number; nominal?: number }
  ) => {
    const tingkatEnum = tingkat as Tingkat;
    const tierEnum = tier as SubscriptionTier;
    await superadminRepository.createSchool(name, address, tingkatEnum, tierEnum, adminData, paymentPlan);
    fetchSchools();
  };

  const handleUpdateSchool = async (
    id: string,
    name: string,
    address: string,
    tier: string,
    adminData?: { name?: string; email?: string; password?: string },
    paymentPlan?: { addMonths?: number; nominal?: number; aktifSampai?: string }
  ) => {
    const tierEnum = tier as SubscriptionTier;
    await superadminRepository.updateSchool(id, name, address, tierEnum, adminData, paymentPlan);
    fetchSchools();
  };

  const handleToggleSchoolStatus = async (id: string, currentIsRetired: boolean) => {
    const actionText = currentIsRetired ? "mengaktifkan" : "menonaktifkan";
    if (window.confirm(`Apakah Anda yakin ingin ${actionText} sekolah ini?`)) {
      if (currentIsRetired) {
        await superadminRepository.activateSchool(id);
      } else {
        await superadminRepository.deleteSchool(id);
      }
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
    schools: filteredSchools,
    rawSchools: schools,
    loading,
    paymentFilter,
    setPaymentFilter,
    selectedSchool,
    setSelectedSchool,
    members,
    loadingMembers,
    viewSchoolMembers,
    handleCreateSchool,
    handleUpdateSchool,
    handleToggleSchoolStatus,
    refresh: fetchSchools,
  };
}
