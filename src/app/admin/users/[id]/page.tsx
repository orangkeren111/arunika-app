"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useParams } from "next/navigation";

import { useUserDetailViewModel } from "./UserDetailViewModel";

export default function UserDetailPage() {
    const params = useParams();

    const userId = Number(params.id);

    const {
        data,
        loading,
        error,
    } = useUserDetailViewModel(userId);

    if (loading) {
        return (
            <div className="rounded-xl border bg-white p-12 text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black" />

                <p className="text-gray-500">
                    Memuat detail pengguna...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <Link
                    href="/admin/users"
                    className="inline-flex items-center gap-2 text-sm text-gray-600"
                >
                    <ArrowLeft size={16} />
                    Kembali
                </Link>

                <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
                    {error}
                </div>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    const {
        user,
        classes,
        books,
        exams,
        agenticQuizzes,
    } = data;

    return (
        <div className="space-y-6">
            <Link
                href="/admin/users"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black"
            >
                <ArrowLeft size={16} />
                Kembali ke pengguna
            </Link>

            {/* USER HEADER */}

            <div className="rounded-xl border bg-white p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">
                            {user.name}
                        </h1>

                        <p className="mt-1 text-gray-500">
                            {user.email}
                        </p>
                    </div>

                    <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium">
                        {user.role}
                    </span>
                </div>
            </div>

            {/* CLASSES */}

            <section className="rounded-xl border bg-white">
                <div className="border-b p-5">
                    <h2 className="font-semibold">
                        Kelas
                    </h2>

                    <p className="text-sm text-gray-500">
                        Kelas yang diikuti pengguna.
                    </p>
                </div>

                {classes.length === 0 ? (
                    <div className="p-6 text-sm text-gray-500">
                        Belum ada kelas.
                    </div>
                ) : (
                    <div className="divide-y">
                        {classes.map((kelas: any) => (
                            <div
                                key={kelas.id}
                                className="p-5"
                            >
                                {kelas.namaKelas}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* BOOK HISTORY */}

            {user.role === "GURU" && (
                <section className="rounded-xl border bg-white">
                    <div className="border-b p-5">
                        <h2 className="font-semibold">
                            Riwayat Pembuatan Buku
                        </h2>

                        <p className="text-sm text-gray-500">
                            Buku yang dibuat oleh guru ini.
                        </p>
                    </div>

                    {books.length === 0 ? (
                        <div className="p-6 text-sm text-gray-500">
                            Belum ada buku.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {books.map((book: any) => (
                                <div
                                    key={book.id}
                                    className="flex items-center justify-between p-5"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {book.judul}
                                        </p>

                                        {book.createdAt && (
                                            <p className="text-sm text-gray-500">
                                                {new Date(
                                                    book.createdAt,
                                                ).toLocaleString(
                                                    "id-ID",
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* EXAM HISTORY */}

            {user.role === "SISWA" && (
                <section className="rounded-xl border bg-white">
                    <div className="border-b p-5">
                        <h2 className="font-semibold">
                            Riwayat Ujian
                        </h2>

                        <p className="text-sm text-gray-500">
                            Ujian yang telah dikerjakan siswa.
                        </p>
                    </div>

                    {exams.length === 0 ? (
                        <div className="p-6 text-sm text-gray-500">
                            Belum ada ujian.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {exams.map((exam: any) => (
                                <div
                                    key={exam.id}
                                    className="flex items-center justify-between p-5"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {exam.judul}
                                        </p>

                                        {exam.waktuSelesai && (
                                            <p className="text-sm text-gray-500">
                                                Selesai:{" "}
                                                {new Date(
                                                    exam.waktuSelesai,
                                                ).toLocaleString(
                                                    "id-ID",
                                                )}
                                            </p>
                                        )}
                                    </div>

                                    <div className="text-right">
                                        <p className="text-lg font-semibold">
                                            {exam.nilaiAkhir ??
                                                "-"}
                                        </p>

                                        <p className="text-xs text-gray-500">
                                            Nilai
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* AGENTIC QUIZ */}

            {user.role === "SISWA" && (
                <section className="rounded-xl border bg-white">
                    <div className="border-b p-5">
                        <h2 className="font-semibold">
                            Riwayat Agentic Quiz
                        </h2>

                        <p className="text-sm text-gray-500">
                            Riwayat quiz agentic yang dikerjakan
                            siswa.
                        </p>
                    </div>

                    {agenticQuizzes.length === 0 ? (
                        <div className="p-6 text-sm text-gray-500">
                            Belum ada riwayat agentic quiz.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {agenticQuizzes.map(
                                (quiz: any) => (
                                    <div
                                        key={quiz.id}
                                        className="p-5"
                                    >
                                        {quiz.title}
                                    </div>
                                ),
                            )}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}