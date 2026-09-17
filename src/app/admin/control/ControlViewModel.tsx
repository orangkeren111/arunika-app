"use client";

import { adminRepository } from "@/src/lib/repositories/adminRepository";
import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GenerationJobItem {
  id: number;
  status: string;
  fileName: string;
  attempts: number;
  errorMessage: string | null;
  bukuJudul: string;
  guruName: string;
  createdAt: string;
  updatedAt: string;
  tokensSpent: number;
}

export interface TaskQueueItem {
  id: number;
  type: string;
  status: string;
  provider: string | null;
  attempts: number;
  errorLog: string | null;
  createdAt: string;
  updatedAt: string;
  tokensSpent: number;
}

interface ControlData {
  generationJobs: GenerationJobItem[];
  taskQueueItems: TaskQueueItem[];
}

// ─── ViewModel ────────────────────────────────────────────────────────────────

export function useControlViewModel() {
  const [data, setData] = useState<ControlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());

  const { data: session } = useSession();
  const sekolah_id = session?.user?.sekolah_id as number;

  const fetchData = useCallback(async () => {
    try {
      const res = await adminRepository.getControlData(sekolah_id);
      setData(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const retryJob = useCallback(
    async (id: number) => {
      const key = `generation_job-${id}`;
      setRetryingIds((prev) => new Set(prev).add(key));
      try {
        await adminRepository.retryGenerationJob(id);
        await fetchData();
      } finally {
        setRetryingIds((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [fetchData],
  );

  const retryTask = useCallback(
    async (id: number) => {
      const key = `task_queue-${id}`;
      setRetryingIds((prev) => new Set(prev).add(key));
      try {
        await adminRepository.retryTaskQueueItem(id);
        await fetchData();
      } finally {
        setRetryingIds((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [fetchData],
  );

  const isRetrying = (type: string, id: number) =>
    retryingIds.has(`${type}-${id}`);

  return {
    data,
    loading,
    error,
    retryJob,
    retryTask,
    isRetrying,
    refresh: fetchData,
  };
}
