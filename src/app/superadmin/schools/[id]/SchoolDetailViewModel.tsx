"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { superadminRepository } from "@/src/lib/repositories/superadminRepository";

export function useSchoolDetailViewModel(sekolahId: string) {
  const { data: session, status } = useSession();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters for member roster
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  const fetchDetail = async () => {
    if (status !== "authenticated" || session?.user?.role !== "SUPERADMIN") return;
    setLoading(true);
    try {
      const res = await superadminRepository.getSchoolDetailStats(sekolahId);
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Gagal mengambil detail sekolah.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [sekolahId, session, status]);

  const handleToggleStatus = async () => {
    if (!data?.school) return;
    const currentIsRetired = data.school.isRetired;
    const actionText = currentIsRetired ? "mengaktifkan" : "menonaktifkan";

    if (window.confirm(`Apakah Anda yakin ingin ${actionText} sekolah ini?`)) {
      if (currentIsRetired) {
        await superadminRepository.activateSchool(sekolahId);
      } else {
        await superadminRepository.deleteSchool(sekolahId);
      }
      fetchDetail();
    }
  };

  const filteredMembers = useMemo(() => {
    if (!data?.members) return [];
    return data.members.filter((m: any) => {
      const matchesRole = roleFilter === "ALL" || m.role === roleFilter;
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [data?.members, roleFilter, searchQuery]);

  return {
    data,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    filteredMembers,
    handleToggleStatus,
    refresh: fetchDetail,
  };
}
