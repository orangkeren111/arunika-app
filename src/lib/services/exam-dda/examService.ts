"use server";

// lib/examService.ts
import prisma from "../db/prisma";
import * as siswaDB from "../db/siswa/siswaDB";
import { DDAHelper } from "./ddaHelper";
import { TipeSoal } from "@prisma/client"; /**
 * Called when the student first clicks "Start Exam".
 * Resumes an existing session if they disconnected, or creates a new one.
 */
export async function startExamSession(jadwalId: string, siswaId: number) {
  const jId = parseInt(jadwalId);

  // 1. Check for disconnects
  let session = await siswaDB.getActiveSession(jId, siswaId);
  let isResuming = true;

  // 2. Create new session if none exists
  if (!session) {
    session = await siswaDB.createSesiUjian(jId, siswaId);
    session.jawabanSiswa = [];
    isResuming = false;
  }

  // 3. Figure out the next question
  const examData = await siswaDB.getQuestionsForExam(jId);
  if (!examData?.ujian) throw new Error("Exam data not found");

  const allQuestions = examData.ujian.ujianBab.flatMap(
    (ub: any) => ub.bab.soal,
  );

  const answeredIds = session.jawabanSiswa.map((j) => j.soalAsliId);

  // 4. Find the best next question using ELO and Phase
  const nextQuestion = await _findNextQuestion(
    allQuestions,
    answeredIds,
    session.currentElo,
    session.jawabanSiswa.length,
    examData.ujian.criteria || undefined,
  );

  return {
    sessionId: session.id,
    currentElo: session.currentElo,
    answeredCount: session.jawabanSiswa.length,
    nextQuestion,
    isResuming,
  };
}

/**
 * Replaces your old batch submit.
 * Called every time the user clicks "Next" or submits a single answer.
 */
export async function submitSingleAnswer(
  sesiId: number,
  jadwalId: string,
  soalId: number,
  jawabanSiswaText: string,
) {
  const jId = parseInt(jadwalId);

  // 1. Get current state
  const session = await prisma.sesiUjianSiswa.findUnique({
    where: { id: sesiId },
    include: {
      jawabanSiswa: true,
      jadwalUjian: {
        include: {
          ujian: {
            include: {
              criteria: true,
            },
          },
        },
      },
    },
  });
  if (!session) throw new Error("Session not found");

  // 2. Find the original question to grade it
  const examData = await siswaDB.getQuestionsForExam(jId);
  const allQuestions =
    examData?.ujian.ujianBab.flatMap((ub: any) => ub.bab.soal) || [];
  const soal = allQuestions.find((q) => q.id === soalId);
  if (!soal) throw new Error("Question not found");

  // 3. Auto-grade
  const isCorrect =
    soal.type === TipeSoal.MCQ
      ? jawabanSiswaText === soal.jawabanBenarMcq
      : null;

  // 4. Calculate new ELO
  const eloBefore = session.currentElo;
  const eloAfter =
    isCorrect !== null
      ? DDAHelper.calculateNewElo(eloBefore, soal.difficulty, isCorrect)
      : eloBefore; // Don't change ELO for manual grading questions yet

  // 5. Snapshot the answer to DB
  const attemptNumber = session.jawabanSiswa.length + 1;
  await siswaDB.saveSingleAnswer({
    attemptId: sesiId,
    soalAsliId: soal.id,
    nomor: attemptNumber,
    teksSoal: soal.teksSoal,
    opsiJawaban: Array.isArray(soal.opsiJawaban) ? soal.opsiJawaban : [],
    jawabanBenarMcq: soal.jawabanBenarMcq ?? "",
    type: soal.type,
    difficulty: soal.difficulty,
    bloomLevel: soal.bloomLevel ?? "C1",
    jawabanSiswa: jawabanSiswaText,
    isCorrect: isCorrect,
    nilaiPoin: soal.type === TipeSoal.MCQ ? (isCorrect ? 100 : 0) : null,
    answeredAt: new Date(),
    eloBefore: eloBefore,
    eloAfter: eloAfter,
  });

  // 6. Update Session ELO
  await siswaDB.updateSessionElo(sesiId, eloAfter);

  // 7. Check if exam is over based on the exam template config
  const totalQuestionsLimit = session.jadwalUjian?.ujian?.jumlahSoal ?? 40;
  const newAnsweredCount = attemptNumber;
  if (newAnsweredCount >= totalQuestionsLimit) {
    await finishExamSession(sesiId);
    return { isFinished: true, finalElo: eloAfter };
  }

  // 8. Prepare next question
  const answeredIds = [
    ...session.jawabanSiswa.map((j) => j.soalAsliId),
    soalId,
  ];
  const nextQuestion = await _findNextQuestion(
    allQuestions,
    answeredIds,
    eloAfter,
    newAnsweredCount,
    session.jadwalUjian?.ujian?.criteria || undefined,
  );

  return {
    isFinished: false,
    newElo: eloAfter,
    nextQuestion,
  };
}

/**
 * Finalizes the exam session.
 */
export async function finishExamSession(sesiId: number) {
  const session = await prisma.sesiUjianSiswa.findUnique({
    where: { id: sesiId },
    include: { jawabanSiswa: true },
  });

  if (!session) return;

  // Optional: Calculate a final grade based on average points or final ELO
  let totalPoin = 0;
  session.jawabanSiswa.forEach((j) => {
    if (j.nilaiPoin) totalPoin += j.nilaiPoin;
  });
  const avgScore =
    session.jawabanSiswa.length > 0
      ? totalPoin / session.jawabanSiswa.length
      : 0;

  await siswaDB.finishSession(sesiId, avgScore);
}

/**
 * INTERNAL: The selection algorithm.
 * Finds the question closest to the student's target ELO for the current Bloom's phase.
 */
async function _findNextQuestion(
  allQuestions: any[],
  answeredIds: (number | null)[],
  currentElo: number,
  questionsAnswered: number,
  criteria?: any,
) {
  // 1. Filter out questions already answered
  const availableQuestions = allQuestions.filter(
    (q) => !answeredIds.includes(q.id),
  );
  if (availableQuestions.length === 0) return null;

  // 2. Determine target Bloom's Level (C1, C2, etc.)
  const targetBloom = DDAHelper.determineTargetBloomLevel(questionsAnswered, criteria);

  // 3. Filter by Bloom's Level
  let bloomFiltered = availableQuestions.filter(
    (q) => (q.bloomLevel || "C1") === targetBloom,
  );

  // Fallback if no questions of that Bloom level exist
  if (bloomFiltered.length === 0) {
    bloomFiltered = availableQuestions;
  }

  // 4. Find the question with difficulty (Bobot) closest to the student's ELO
  let bestQuestion = bloomFiltered[0];
  let smallestEloDifference = Infinity;

  for (const q of bloomFiltered) {
    const qElo = DDAHelper.mapDifficultyToElo(q.difficulty);
    const diff = Math.abs(qElo - currentElo);

    if (diff < smallestEloDifference) {
      smallestEloDifference = diff;
      bestQuestion = q;
    }
  }

  // Return the sanitized question object (similar to your old getNextQuestion)
  return {
    id: bestQuestion.id.toString(),
    babId: bestQuestion.babId?.toString(),
    type: bestQuestion.type,
    text: bestQuestion.teksSoal,
    options: bestQuestion.opsiJawaban,
    difficulty: bestQuestion.difficulty,
    bloomLevel: bestQuestion.bloomLevel,
  };
}
