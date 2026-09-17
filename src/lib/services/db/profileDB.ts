"use server"
import prisma from "./prisma";

export async function findUserProfile(userId: number) {
    return prisma.user.findUnique({
        where: {
            id: userId,
        },
        include: {
            sekolah: {
                select: {
                    namaSekolah: true,
                },
            },
        },
    });
}

export async function findUserRole(userId: number) {
    return prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            role: true,
        },
    });
}

export async function findStudentExamAttempts(userId: number) {
    return prisma.sesiUjianSiswa.findMany({
        where: {
            siswaId: userId,
        },
        select: {
            waktuSelesai: true,
            nilaiAkhir: true,
        },
    });
}

export async function countTeacherBooks(userId: number) {
    return prisma.buku.count({
        where: {
            guruId: userId,
        },
    });
}

export async function countTeacherExams(userId: number) {
    return prisma.ujian.count({
        where: {
            guruId: userId,
        },
    });
}

export async function findUserPassword(userId: number) {
    return prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            password: true,
        },
    });
}

export async function updateUserPassword(
    userId: number,
    hashedPassword: string,
) {
    return prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            password: hashedPassword,
        },
    });
}