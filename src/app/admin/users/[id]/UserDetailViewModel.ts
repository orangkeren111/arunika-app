"use client";

import { adminRepository } from "@/src/lib/repositories/adminRepository";
import { useEffect, useState } from "react";


export function useUserDetailViewModel(
    userId: number,
) {
    const [data, setData] =
        useState<any>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                setError(null);

                const result =
                    await adminRepository.getUserDetail(
                        userId,
                    );

                if (!cancelled) {
                    setData(result);
                }
            } catch (err: any) {
                if (!cancelled) {
                    setError(
                        err?.message ||
                        "Gagal mengambil detail pengguna.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [userId]);

    return {
        data,
        loading,
        error,
    };
}