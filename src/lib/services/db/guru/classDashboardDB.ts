"use server";
import { Prisma, StatusUjian, TipeSoal } from "@prisma/client";
import prisma from "../prisma";
import { StudentPerformance } from "@/src/app/types/guru";
export async function getClassDashboard(kelasId: number) {
    try {
        /*
         * ============================================================
         * 1. CLASS HEADER
         * ============================================================
         */
        const classData = await prisma.kelas.findUnique({
            where: {
                id: kelasId,
            },
            include: {
                teacher: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                members: {
                    where: {
                        user: {
                            role: "SISWA",
                        },
                    },
                    select: {
                        userId: true,
                    },
                },
            },
        });

        if (!classData) {
            throw new Error("Kelas tidak ditemukan.");
        }

        const studentIds = classData.members.map(
            (member) => member.userId
        );

        const studentCount = studentIds.length;


        /*
         * ============================================================
         * 2. EXAM / EVALUATION DATA
         * ============================================================
         */
        const exams = await prisma.jadwalUjian.findMany({
            where: {
                kelasId,
            },
            orderBy: {
                waktuMulaiAktif: "desc",
            },
            take: 10,
            include: {
                ujian: {
                    select: {
                        id: true,
                        judulUjian: true,
                    },
                },
                tipeUjian: {
                    select: {
                        namaTipeUjian: true,
                    },
                },
                sesiSiswa: {
                    where: {
                        siswaId: {
                            in: studentIds,
                        },
                    },
                    select: {
                        id: true,
                        siswaId: true,
                        nilaiAkhir: true,
                        waktuMulai: true,
                        waktuSelesai: true,
                    },
                },
            },
        });


        /*
         * ============================================================
         * 3. COMPLETED ATTEMPTS
         *
         * Used for:
         * - average score
         * - participation
         * - performance trend
         * - evaluation history
         * ============================================================
         */
        const completedAttempts =
            await prisma.sesiUjianSiswa.findMany({
                where: {
                    siswaId: {
                        in: studentIds,
                    },
                    jadwalUjian: {
                        kelasId,
                    },
                    nilaiAkhir: {
                        not: null,
                    },
                },
                select: {
                    id: true,
                    siswaId: true,
                    nilaiAkhir: true,
                    waktuMulai: true,
                    waktuSelesai: true,
                    jadwalUjianId: true,
                    jadwalUjian: {
                        select: {
                            id: true,
                            judulJadwal: true,
                            waktuMulaiAktif: true,
                            waktuSelesaiAktif: true,
                            status: true,
                            ujian: {
                                select: {
                                    id: true,
                                    judulUjian: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    waktuMulai: "asc",
                },
            });


        /*
         * ============================================================
         * 4. OVERVIEW
         * ============================================================
         */
        const scores = completedAttempts
            .map((attempt) => attempt.nilaiAkhir)
            .filter(
                (score): score is number =>
                    score !== null && score !== undefined
            );

        const averageScore =
            scores.length > 0
                ? Number(
                    (
                        scores.reduce(
                            (sum, score) => sum + score,
                            0
                        ) / scores.length
                    ).toFixed(1)
                )
                : 0;


        /*
         * Participation:
         * completed attempts / possible student-exam attempts
         */
        const completedExamIds = [
            ...new Set(
                completedAttempts.map(
                    (attempt) => attempt.jadwalUjianId
                )
            ),
        ];

        const participationPossible =
            completedExamIds.length * studentCount;

        const participation =
            participationPossible > 0
                ? Number(
                    (
                        (completedAttempts.length /
                            participationPossible) *
                        100
                    ).toFixed(1)
                )
                : 0;


        /*
         * ============================================================
         * 5. EVALUATION PERFORMANCE
         * ============================================================
         */
        const evaluationMap = new Map<
            number,
            {
                id: number;
                title: string;
                scores: number[];
                participantIds: Set<number>;
                date: Date | null;
            }
        >();

        for (const attempt of completedAttempts) {
            if (attempt.nilaiAkhir === null) continue;

            const existing = evaluationMap.get(
                attempt.jadwalUjianId
            );

            if (existing) {
                existing.scores.push(attempt.nilaiAkhir);
                existing.participantIds.add(attempt.siswaId);
            } else {
                evaluationMap.set(attempt.jadwalUjianId, {
                    id: attempt.jadwalUjianId,
                    title:
                        attempt.jadwalUjian.judulJadwal ||
                        attempt.jadwalUjian.ujian.judulUjian,
                    scores: [attempt.nilaiAkhir],
                    participantIds: new Set([attempt.siswaId]),
                    date:
                        attempt.jadwalUjian.waktuMulaiAktif,
                });
            }
        }

        const evaluations = Array.from(
            evaluationMap.values()
        )
            .map((evaluation) => ({
                id: evaluation.id,
                title: evaluation.title,
                averageScore:
                    evaluation.scores.length > 0
                        ? Number(
                            (
                                evaluation.scores.reduce(
                                    (sum, score) => sum + score,
                                    0
                                ) / evaluation.scores.length
                            ).toFixed(1)
                        )
                        : 0,
                participantCount:
                    evaluation.participantIds.size,
                totalStudents: studentCount,
                date: evaluation.date,
            }))
            .sort((a, b) => {
                const dateA = a.date
                    ? new Date(a.date).getTime()
                    : 0;

                const dateB = b.date
                    ? new Date(b.date).getTime()
                    : 0;

                return dateA - dateB;
            });


        /*
         * Latest / previous evaluation
         */
        const latestEvaluation =
            evaluations.length > 0
                ? evaluations[evaluations.length - 1]
                    .averageScore
                : 0;

        const previousEvaluation =
            evaluations.length > 1
                ? evaluations[evaluations.length - 2]
                    .averageScore
                : 0;

        const trend =
            evaluations.length > 1
                ? Number(
                    (
                        latestEvaluation -
                        previousEvaluation
                    ).toFixed(1)
                )
                : 0;


        /*
         * ============================================================
         * 6. PERFORMANCE TREND
         * ============================================================
         */
        const performanceTrend = evaluations
            .slice(-6)
            .map((evaluation, index) => ({
                label:
                    `E${evaluations.length - Math.min(6, evaluations.length) + index + 1}`,
                averageScore: evaluation.averageScore,
                evaluationId: evaluation.id,
            }));


        /*
         * ============================================================
         * 7. RECENT EVALUATIONS
         * ============================================================
         */
        const recentEvaluations = [...evaluations]
            .reverse()
            .slice(0, 5);


        /*
         * ============================================================
         * 8. ANSWER DATA
         *
         * Used for:
         * - Bloom performance
         * - topic performance
         * - student performance
         * ============================================================
         */
        const answers = await prisma.jawabanSiswa.findMany({
            where: {
                attempt: {
                    siswaId: {
                        in: studentIds,
                    },
                    jadwalUjian: {
                        kelasId,
                    },
                },
                isCorrect: {
                    not: null,
                },
            },
            select: {
                id: true,
                attemptId: true,
                isCorrect: true,
                nilaiPoin: true,
                bloomLevel: true,
                soalAsliId: true,
                attempt: {
                    select: {
                        siswaId: true,
                    },
                },
                soalAsli: {
                    select: {
                        id: true,
                        babId: true,
                        bloomLevel: true,
                        bab: {
                            select: {
                                id: true,
                                judulBab: true,
                                buku: {
                                    select: {
                                        id: true,
                                        judul: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });


        /*
         * ============================================================
         * 9. BLOOM PERFORMANCE
         * ============================================================
         */
        const bloomMap = new Map<
            string,
            {
                correct: number;
                total: number;
            }
        >();

        for (const answer of answers) {
            const level =
                answer.bloomLevel ||
                answer.soalAsli?.bloomLevel;

            if (!level) continue;

            const existing = bloomMap.get(level) || {
                correct: 0,
                total: 0,
            };

            existing.total++;

            if (answer.isCorrect === true) {
                existing.correct++;
            }

            bloomMap.set(level, existing);
        }

        const bloomPerformance = ["C1", "C2", "C3", "C4", "C5", "C6"]
            .filter((level) => bloomMap.has(level))
            .map((level) => {
                const data = bloomMap.get(level)!;

                return {
                    level,
                    averageScore:
                        data.total > 0
                            ? Number(
                                (
                                    (data.correct / data.total) *
                                    100
                                ).toFixed(1)
                            )
                            : 0,
                    correct: data.correct,
                    total: data.total,
                };
            });


        /*
         * ============================================================
         * 10. WEAK TOPICS / BAB
         * ============================================================
         */
        const topicMap = new Map<
            number,
            {
                id: number;
                bukuId: number;
                name: string;
                correct: number;
                total: number;
            }
        >();

        for (const answer of answers) {
            const bab = answer.soalAsli?.bab;

            if (!bab) continue;

            const existing = topicMap.get(bab.id) || {
                id: bab.id,
                bukuId: bab.buku.id,
                name: bab.judulBab,
                correct: 0,
                total: 0,
            };

            existing.total++;

            if (answer.isCorrect === true) {
                existing.correct++;
            }

            topicMap.set(bab.id, existing);
        }

        const weakTopics = Array.from(topicMap.values())
            .map((topic) => ({
                id: topic.id,
                name: topic.name,
                bukuId: topic.bukuId,
                accuracy:
                    topic.total > 0
                        ? Number(
                            (
                                (topic.correct / topic.total) *
                                100
                            ).toFixed(1)
                        )
                        : 0,
                correct: topic.correct,
                total: topic.total,
            }))
            .sort((a, b) => a.accuracy - b.accuracy)
            .slice(0, 5);


        /*
         * ============================================================
         * 11. STUDENTS REQUIRING ATTENTION
         * ============================================================
         */
        const studentMap = new Map<number, StudentPerformance>();


        for (const attempt of completedAttempts) {
            if (attempt.nilaiAkhir == null) continue;

            let existing = studentMap.get(attempt.siswaId);

            if (!existing) {
                existing = {
                    scores: [],
                    bloom: new Map(),
                };

                studentMap.set(attempt.siswaId, existing);
            }

            existing.scores.push(attempt.nilaiAkhir);
        }

        /*
         * Add Bloom data to each student.
         */
        for (const answer of answers) {
            const level =
                answer.bloomLevel ||
                answer.soalAsli?.bloomLevel;

            if (!level) continue;

            const studentId = answer.attempt.siswaId;

            const existing =
                studentMap.get(studentId) || {
                    scores: [],
                    bloom: new Map(),
                };

            const bloomData =
                existing.bloom.get(level) || {
                    correct: 0,
                    total: 0,
                };

            bloomData.total++;

            if (answer.isCorrect === true) {
                bloomData.correct++;
            }

            existing.bloom.set(level, bloomData);

            studentMap.set(studentId, existing);
        }

        const students = await prisma.user.findMany({
            where: {
                id: {
                    in: studentIds,
                },
            },
            select: {
                id: true,
                name: true,
            },
        });

        const studentsRequiringAttention = students
            .map((student) => {
                const data = studentMap.get(student.id);

                if (!data || data.scores.length === 0) {
                    return null;
                }

                const averageScore =
                    data.scores.reduce(
                        (sum, score) => sum + score,
                        0
                    ) / data.scores.length;

                /*
                 * Find student's weakest Bloom level.
                 */
                let weakestBloom:
                    | {
                        level: string;
                        accuracy: number;
                    }
                    | null = null;

                for (const [level, bloom] of data.bloom) {
                    if (bloom.total === 0) continue;

                    const accuracy =
                        (bloom.correct / bloom.total) * 100;

                    if (
                        !weakestBloom ||
                        accuracy < weakestBloom.accuracy
                    ) {
                        weakestBloom = {
                            level,
                            accuracy,
                        };
                    }
                }

                let issue = "Perlu perhatian";

                if (averageScore < 60) {
                    issue = "Rata-rata nilai rendah";
                } else if (
                    weakestBloom &&
                    weakestBloom.accuracy < 60
                ) {
                    issue = `Lemah pada ${weakestBloom.level}`;
                }

                return {
                    id: student.id,
                    name: student.name,
                    averageScore: Number(
                        averageScore.toFixed(1)
                    ),
                    trend: 0,
                    issue,
                };
            })
            .filter(
                (
                    student
                ): student is NonNullable<typeof student> =>
                    student !== null
            )
            .filter(
                (student) =>
                    student.averageScore < 70 ||
                    student.issue !== "Perlu perhatian"
            )
            .sort(
                (a, b) =>
                    a.averageScore - b.averageScore
            )
            .slice(0, 5);


        /*
         * ============================================================
         * 12. CURRENT / UPCOMING EXAMS
         * ============================================================
         */
        const now = new Date();

        const currentAndUpcomingExams = exams
            .filter((exam) => {
                if (!exam.waktuMulaiAktif) {
                    return false;
                }

                if (
                    exam.status === "ONGOING"
                ) {
                    return true;
                }

                return (
                    exam.waktuMulaiAktif >= now &&
                    exam.status !== "COMPLETED"
                );
            })
            .slice(0, 5)
            .map((exam) => ({
                id: exam.id,
                title:
                    exam.judulJadwal ||
                    exam.ujian.judulUjian,
                status: exam.status,
                startTime: exam.waktuMulaiAktif,
                endTime: exam.waktuSelesaiAktif,
                participantCount:
                    exam.sesiSiswa.length,
                totalStudents: studentCount,
                type:
                    exam.tipeUjian?.namaTipeUjian ||
                    null,
            }));


        /*
         * ============================================================
         * 13. RECENT ACTIVITY
         * ============================================================
         *
         * There is currently no dedicated Activity table.
         * Therefore activity is derived from JadwalUjian and
         * SesiUjianSiswa.
         * ============================================================
         */
        const recentActivity: {
            id: string;
            description: string;
            createdAt: Date;
        }[] = [];

        for (const exam of exams.slice(0, 10)) {
            if (exam.waktuMulaiAktif) {
                recentActivity.push({
                    id: `exam-${exam.id}`,
                    description:
                        exam.status === "ONGOING"
                            ? `${exam.judulJadwal || exam.ujian.judulUjian} dimulai`
                            : `Evaluasi ${exam.judulJadwal ||
                            exam.ujian.judulUjian
                            } dijadwalkan`,
                    createdAt: exam.waktuMulaiAktif,
                });
            }

            for (const session of exam.sesiSiswa.slice(0, 3)) {
                if (session.waktuSelesai) {
                    recentActivity.push({
                        id: `session-${session.id}`,
                        description:
                            `${exam.judulJadwal || exam.ujian.judulUjian} dikerjakan siswa`,
                        createdAt: session.waktuSelesai,
                    });
                }
            }
        }

        recentActivity.sort(
            (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
        );


        /*
         * ============================================================
         * 14. LAST ACTIVITY
         * ============================================================
         */
        const lastActivity =
            recentActivity.length > 0
                ? recentActivity[0].createdAt
                : null;


        /*
         * ============================================================
         * 15. RECOMMENDED ACTION
         * ============================================================
         */
        let recommendedAction = null;

        if (weakTopics.length > 0) {
            const weakestTopic = weakTopics[0];

            if (weakestTopic.accuracy < 50) {
                recommendedAction = {
                    title: `Review ${weakestTopic.name}`,
                    description:
                        `Siswa mengalami kesulitan pada topik ${weakestTopic.name}.`,
                    metric: `${weakestTopic.accuracy}% akurasi`,
                    topicId: weakestTopic.id,
                };
            }
        }

        if (!recommendedAction) {
            const weakestBloom = [...bloomPerformance]
                .sort(
                    (a, b) =>
                        a.averageScore - b.averageScore
                )[0];

            if (
                weakestBloom &&
                weakestBloom.averageScore < 60
            ) {
                recommendedAction = {
                    title: `Perkuat kemampuan ${weakestBloom.level}`,
                    description:
                        `Performa kelas pada level kognitif ${weakestBloom.level} masih rendah.`,
                    metric: `${weakestBloom.averageScore}% akurasi`,
                    topicId: null,
                };
            }
        }


        /*
         * ============================================================
         * 16. FINAL RESULT
         * ============================================================
         */
        return {
            class: {
                id: classData.id,
                name: classData.namaKelas,
                teacherName: classData.teacher.name,
                studentCount,
                lastActivity,
            },

            overview: {
                averageScore,
                participation,
                latestEvaluation,
                previousEvaluation,
                trend,
            },

            exams: currentAndUpcomingExams,

            recentEvaluations,

            performanceTrend,

            bloomPerformance,

            weakTopics,

            studentsRequiringAttention,

            recentActivity: recentActivity.slice(0, 10),

            recommendedAction,
        };
    } catch (error) {
        console.error(
            "Error fetching class dashboard:",
            error
        );

        throw new Error(
            "Gagal mengambil data dashboard kelas."
        );
    }
}