"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { profileRepository } from "@/src/lib/repositories/profileRepository";

export type ProfileData = {
    id: number;
    name: string;
    email: string;
    role: string;
    schoolName: string | null;
};

export type ProfileStatistics = {
    totalExams: number;
    completedExams: number;
    gradedExams: number;
    averageScore: number;
};

export type ProfileSection =
    | "profile"
    | "statistics"
    | "security";

export function useProfileViewModel() {
    const { data: session, status } = useSession();

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [statistics, setStatistics] =
        useState<ProfileStatistics | null>(null);

    const [activeSection, setActiveSection] =
        useState<ProfileSection>("profile");

    const [isLoading, setIsLoading] = useState(true);

    const [currentPassword, setCurrentPassword] =
        useState("");

    const [newPassword, setNewPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [isChangingPassword, setIsChangingPassword] =
        useState(false);

    const [passwordMessage, setPasswordMessage] =
        useState<string | null>(null);

    const [passwordError, setPasswordError] =
        useState<string | null>(null);

    const userId = session?.user?.id
        ? Number(session.user.id)
        : null;

    useEffect(() => {
        if (status === "loading") {
            return;
        }

        if (status !== "authenticated" || !userId) {
            setIsLoading(false);
            return;
        }

        const loadProfile = async () => {
            setIsLoading(true);

            try {
                const [profileData, statisticsData] =
                    await Promise.all([
                        profileRepository.getProfile(userId),
                        profileRepository.getProfileStatistics(userId),
                    ]);
                setProfile(profileData);
                setStatistics(statisticsData);
            } catch (error) {
                console.error(
                    "Failed to load profile:",
                    error,
                );
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
    }, [status, userId]);

    const changePassword = async () => {
        setPasswordMessage(null);
        setPasswordError(null);

        if (!userId) {
            setPasswordError(
                "User tidak ditemukan. Silakan login kembali.",
            );
            return;
        }

        if (
            !currentPassword ||
            !newPassword ||
            !confirmPassword
        ) {
            setPasswordError(
                "Semua field password wajib diisi.",
            );
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError(
                "Password baru harus memiliki minimal 8 karakter.",
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError(
                "Konfirmasi password tidak sesuai.",
            );
            return;
        }

        setIsChangingPassword(true);

        try {
            await profileRepository.changePassword(
                userId,
                currentPassword,
                newPassword,
            );

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            setPasswordMessage(
                "Password berhasil diubah.",
            );
        } catch (error) {
            setPasswordError(
                error instanceof Error
                    ? error.message
                    : "Terjadi kesalahan saat mengubah password.",
            );
        } finally {
            setIsChangingPassword(false);
        }
    };

    return {
        session,
        status,
        userId,

        profile,
        statistics,
        isLoading,

        activeSection,
        setActiveSection,

        currentPassword,
        setCurrentPassword,

        newPassword,
        setNewPassword,

        confirmPassword,
        setConfirmPassword,

        isChangingPassword,

        passwordMessage,
        passwordError,

        changePassword,
    };
}
