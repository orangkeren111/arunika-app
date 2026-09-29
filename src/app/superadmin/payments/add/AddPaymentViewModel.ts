"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { superadminRepository } from "@/src/lib/repositories/superadminRepository";

export function useAddPaymentViewModel() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [jumlahBulan, setJumlahBulan] = useState<number>(12);
  const [nominal, setNominal] = useState<number>(1000000);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "SUPERADMIN") {
      superadminRepository.getSchoolsWithStats().then((data) => {
        setSchools(data);
        if (data.length > 0) {
          setSelectedSchoolId(data[0].id.toString());
        }
        setLoading(false);
      });
    }
  }, [session, status]);

  const selectedSchool = schools.find((s) => s.id.toString() === selectedSchoolId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolId) {
      setError("Pilih sekolah terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await superadminRepository.addSchoolPayment(selectedSchoolId, jumlahBulan, nominal);
      setSuccessMsg("Pembayaran berhasil dicatat!");
      setTimeout(() => {
        router.push(`/superadmin/schools/${selectedSchoolId}`);
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Gagal mencatat pembayaran.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    schools,
    selectedSchoolId,
    setSelectedSchoolId,
    selectedSchool,
    jumlahBulan,
    setJumlahBulan,
    nominal,
    setNominal,
    loading,
    submitting,
    error,
    successMsg,
    handleSubmit,
  };
}
