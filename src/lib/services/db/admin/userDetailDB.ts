"use server"
import prisma from "../prisma";

export async function getUserDetail(
    userId: number,
) {
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            sekolahId: true,

            keanggotaan: {
                include: {
                    kelas: true,
                },
            },
        },
    });

    if (!user) {
        throw new Error(
            "Pengguna tidak ditemukan.",
        );
    }

    const books =
        user.role === "GURU"
            ? await prisma.buku.findMany({
                where: {
                    guruId: user.id,
                },
                orderBy: {
                    id: "desc",
                },
            })
            : [];

    const exams =
        user.role === "SISWA"
            ? await prisma.sesiUjianSiswa.findMany({
                where: {
                    siswaId: user.id,
                },
                include: {
                    jadwalUjian: true,
                },
                orderBy: {
                    waktuSelesai: "desc",
                },
            })
            : [];

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            sekolahId: user.sekolahId,
        },

        classes: user.keanggotaan.map(
            (membership) => ({
                id: membership.kelas.id,
                namaKelas:
                    membership.kelas.namaKelas,
            }),
        ),

        books: books.map((book) => ({
            id: book.id,
            judul: book.judul,
        })),

        exams: exams.map((exam) => ({
            id: exam.id,
            ujianId: exam.jadwalUjianId,
            judul:
                exam.jadwalUjian.judulJadwal,

            waktuSelesai:
                exam.waktuSelesai?.toISOString() ??
                null,

            nilaiAkhir:
                exam.nilaiAkhir,
        })),

        agenticQuizzes: [],
    };
}