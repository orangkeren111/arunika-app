"use client";

import { useEffect, useState, useCallback } from "react";
import { guruRepository } from "@/src/lib/repositories/guruRepository";

export interface StudentProgress {
  studentId: number;
  studentName: string;
  studentEmail: string;
  attemptId: number | null;
  waktuMulai: string | null;
  waktuSelesai: string | null;
  answeredCount: number;
  cheatCount: number;
  nilaiAkhir: number | null;
  isAIResponded: boolean;
  status: "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED";
}

export interface LiveExamData {
  jadwalId: number;
  title: string;
  type: string;
  status: string;
  waktuMulaiAktif: string | null;
  waktuSelesaiAktif: string | null;
  kelasId: number;
  kelasName: string;
  totalQuestions: number;
  studentsProgress: StudentProgress[];
}

export function useExamMonitoringViewModel(jadwalId: string) {
  const [examData, setExamData] = useState<LiveExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  const fetchProgress = useCallback(async () => {
    if (!jadwalId) return;
    try {
      const data = await guruRepository.getLiveExamProgress(jadwalId);
      if (data) {
        setExamData({
          jadwalId: data?.jadwalId ? Number(data.jadwalId) : 0,
          title: data?.title ?? "",
          type: data?.type ?? "",
          status: data?.status ?? "",
          waktuMulaiAktif: data?.waktuMulaiAktif?.toString() ?? null,
          waktuSelesaiAktif: data?.waktuSelesaiAktif?.toString() ?? null,
          kelasId: data?.kelasId ?? 0,
          kelasName: data?.kelasName ?? "",
          totalQuestions: data?.totalQuestions ?? 0,
          studentsProgress: data?.studentsProgress ?? [],
        });
      }
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error("Failed to fetch live exam progress:", err);
    } finally {
      setLoading(false);
    }
  }, [jadwalId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Auto-refresh interval every 7 seconds if active and autoRefresh is enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchProgress();
    }, 7000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchProgress]);

  const handleStartExam = async () => {
    if (!examData) return;
    setLoading(true);
    try {
      await guruRepository.updateJadwalStatus(examData.jadwalId.toString(), "ONGOING")
      await fetchProgress();
    } finally {
      setLoading(false);
    }
  };

  const handleStopExam = async () => {
    if (!examData) return;
    setLoading(true);
    try {
      await guruRepository.updateJadwalStatus(examData.jadwalId.toString(), "COMPLETED")
      await fetchProgress();
    } finally {
      setLoading(false);
    }
  };

  return {
    examData,
    loading,
    autoRefresh,
    setAutoRefresh,
    lastRefreshedAt,
    fetchProgress,
    handleStartExam,
    handleStopExam,
  };
}
