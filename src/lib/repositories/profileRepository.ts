import bcrypt from "bcryptjs";

import { ProfileData, ProfileStatistics } from "@/src/app/types/profile";
import * as profileDB from "../services/db/profileDB";

export const profileRepository = {
    async getProfile(
        userId: number,
    ): Promise<ProfileData | null> {
        const user = await profileDB.findUserProfile(userId);
        if (!user) {
            return null;
        }

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            schoolName: user.sekolah?.namaSekolah ?? null,
        };
    },

    async getProfileStatistics(
        userId: number,
    ): Promise<ProfileStatistics> {
        const user = await profileDB.findUserRole(userId);

        if (!user) {
            throw new Error("User tidak ditemukan");
        }

        if (user.role === "SISWA") {
            const attempts = await profileDB.findStudentExamAttempts(userId);

            const completedExams = attempts.filter(
                (attempt) => attempt.waktuSelesai !== null,
            );

            const gradedExams = completedExams.filter(
                (attempt) => attempt.nilaiAkhir !== null,
            );

            const averageScore =
                gradedExams.length > 0
                    ? gradedExams.reduce(
                        (sum, attempt) => sum + (attempt.nilaiAkhir ?? 0),
                        0,
                    ) / gradedExams.length
                    : 0;

            return {
                totalExams: attempts.length,
                completedExams: completedExams.length,
                gradedExams: gradedExams.length,
                averageScore: Number(averageScore.toFixed(1)),
            };
        }

        if (user.role === "GURU") {
            const [books, exams] = await Promise.all([
                profileDB.countTeacherBooks(userId),
                profileDB.countTeacherExams(userId),
            ]);

            return {
                totalExams: exams,
                completedExams: books,
                gradedExams: 0,
                averageScore: 0,
            };
        }

        return {
            totalExams: 0,
            completedExams: 0,
            gradedExams: 0,
            averageScore: 0,
        };
    },

    async changePassword(
        userId: number,
        currentPassword: string,
        newPassword: string,
    ): Promise<void> {
        const user = await profileDB.findUserPassword(userId);

        if (!user) {
            throw new Error("User tidak ditemukan");
        }

        const passwordMatches = await bcrypt.compare(
            currentPassword,
            user.password,
        );

        if (!passwordMatches) {
            throw new Error("Password saat ini salah");
        }

        const samePassword = await bcrypt.compare(
            newPassword,
            user.password,
        );

        if (samePassword) {
            throw new Error(
                "Password baru harus berbeda dari password saat ini",
            );
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await profileDB.updateUserPassword(userId, hashedPassword);
    }
}