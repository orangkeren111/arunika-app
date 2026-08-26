"use server";

import prisma from "../db/prisma";
import * as siswaDB from "../db/siswa/siswaDB";
import { DDAHelper } from "./ddaHelper";
import { TipeSoal } from "@prisma/client";

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
  const examData = await prisma.jadwalUjian.findUnique({
    where: { id: jId },
    include: {
      ujian: {
        include: {
          ujianBab: {
            include: {
              bab: {
                include: {
                  soal: {
                    where: { isAccepted: true, isRejected: false },
                  },
                },
              },
            },
          },
          templateKompetensi: {
            include: { kompetensiBab: true },
          },
        },
      },
    },
  });

  if (!examData?.ujian) throw new Error("Exam data not found");

  const allQuestions = examData.ujian.ujianBab.flatMap((ub: any) => ub.bab.soal);
  const answeredIds = session.jawabanSiswa.map((j) => j.soalAsliId);

  // 4. Find the best next question using ELO and Competency mapping
  const nextQuestion = await _findNextQuestion(
    allQuestions,
    answeredIds,
    session.currentElo,
    examData.ujian.templateKompetensi,
    examData.ujian.isAdaptive !== false
  );

  const enabledComp = examData.ujian.templateKompetensi.filter((tk) => tk.isEnabled);
  const totalQuestions = enabledComp.length > 0
    ? enabledComp.reduce((sum, tk) => sum + tk.jumlahSoal, 0)
    : examData.ujian.jumlahSoal || 10;
  const durationMinutes = examData.ujian.durasiMenit || 90;

  return {
    sessionId: session.id,
    currentElo: session.currentElo,
    answeredCount: session.jawabanSiswa.length,
    totalQuestions,
    durationMinutes,
    nextQuestion,
    isResuming,
  };
}

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
              templateKompetensi: {
                include: { kompetensiBab: true },
              },
            },
          },
        },
      },
    },
  });
  if (!session) throw new Error("Session not found");

  // 2. Find the original question to grade it
  const originalQuestion = await prisma.bankSoal.findUnique({
    where: { id: soalId },
  });
  if (!originalQuestion) throw new Error("Question not found");

  // 3. Auto-grade for MCQ, manual for Essay
  const isCorrect =
    originalQuestion.type === TipeSoal.MCQ
      ? jawabanSiswaText === originalQuestion.jawabanBenarMcq
      : null;

  // 4. Calculate new ELO (only for MCQs)
  const eloBefore = session.currentElo;
  const eloAfter =
    isCorrect !== null
      ? DDAHelper.calculateNewElo(eloBefore, originalQuestion.difficulty, isCorrect)
      : eloBefore;

  // 5. Snapshot the answer to DB if not already submitted
  const alreadyAnswered = session.jawabanSiswa.some((j) => j.soalAsliId === soalId);
  const attemptNumber = alreadyAnswered
    ? session.jawabanSiswa.length
    : session.jawabanSiswa.length + 1;

  if (!alreadyAnswered) {
    await siswaDB.saveSingleAnswer({
      attemptId: sesiId,
      soalAsliId: originalQuestion.id,
      nomor: attemptNumber,
      teksSoal: originalQuestion.teksSoal,
      opsiJawaban: Array.isArray(originalQuestion.opsiJawaban) ? originalQuestion.opsiJawaban : [],
      jawabanBenarMcq: originalQuestion.jawabanBenarMcq ?? "",
      type: originalQuestion.type,
      difficulty: originalQuestion.difficulty,
      bloomLevel: originalQuestion.bloomLevel ?? "C1",
      jawabanSiswa: jawabanSiswaText,
      isCorrect: isCorrect,
      nilaiPoin: originalQuestion.type === TipeSoal.MCQ ? (isCorrect ? 100 : 0) : null,
      answeredAt: new Date(),
      eloBefore: eloBefore,
      eloAfter: eloAfter,
    });

    // 6. Update Session ELO
    await siswaDB.updateSessionElo(sesiId, eloAfter);
  }

  // 7. Check if exam is over based on the enabled competencies
  const enabledCompetencies = session.jadwalUjian?.ujian?.templateKompetensi?.filter((tk) => tk.isEnabled) || [];
  const totalQuestionsLimit = enabledCompetencies.reduce((sum, tk) => sum + tk.jumlahSoal, 0);

  const newAnsweredCount = attemptNumber;
  if (totalQuestionsLimit > 0 && newAnsweredCount >= totalQuestionsLimit) {
    await finishExamSession(sesiId);
    return { isFinished: true, finalElo: eloAfter };
  }

  // 8. Prepare next question
  const examData = await prisma.jadwalUjian.findUnique({
    where: { id: jId },
    include: {
      ujian: {
        include: {
          ujianBab: {
            include: {
              bab: {
                include: {
                  soal: {
                    where: { isAccepted: true, isRejected: false },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const allQuestions = examData?.ujian.ujianBab.flatMap((ub: any) => ub.bab.soal) || [];
  const answeredIds = [
    ...session.jawabanSiswa.map((j) => j.soalAsliId),
    soalId,
  ];

  const nextQuestion = await _findNextQuestion(
    allQuestions,
    answeredIds,
    eloAfter,
    session.jadwalUjian?.ujian?.templateKompetensi || [],
    session.jadwalUjian?.ujian?.isAdaptive !== false
  );

  if (!nextQuestion) {
    // If no more valid questions exist to serve, finish session gracefully
    await finishExamSession(sesiId);
    return { isFinished: true, finalElo: eloAfter };
  }

  return {
    isFinished: false,
    newElo: eloAfter,
    nextQuestion,
  };
}

export async function finishExamSession(sesiId: number) {
  const session = await prisma.sesiUjianSiswa.findUnique({
    where: { id: sesiId },
    include: { jawabanSiswa: true },
  });

  if (!session) return;

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

async function _findNextQuestion(
  allQuestions: any[],
  answeredIds: (number | null)[],
  currentElo: number,
  templateKompetensi: any[],
  isAdaptive: boolean = true
) {
  // 1. Filter out questions already answered
  const availableQuestions = allQuestions.filter(
    (q) => !answeredIds.includes(q.id),
  );
  if (availableQuestions.length === 0) return null;

  // 2. Fetch already answered questions details to count by competency
  const answeredQuestions = await prisma.bankSoal.findMany({
    where: { id: { in: answeredIds.filter((id): id is number => id !== null) } },
  });

  // 3. Find the first enabled competency that hasn't met its limit
  const activeCompetencies = templateKompetensi.filter((tk) => tk.isEnabled);
  let targetCompetency = null;

  for (const tk of activeCompetencies) {
    const answeredCount = answeredQuestions.filter((q) => q.kompetensiBabId === tk.kompetensiBabId).length;
    if (answeredCount < tk.jumlahSoal) {
      targetCompetency = tk;
      break;
    }
  }

  if (!targetCompetency) return null; // All competency target limits met!

  // 4. Filter available questions to only those matching target competency
  let competencyQuestions = availableQuestions.filter(
    (q) => targetCompetency && q.kompetensiBabId === targetCompetency.kompetensiBabId
  );

  if (competencyQuestions.length === 0) {
    // Fallback: If no remaining questions match this specific competency, pick from any available question in the exam
    competencyQuestions = availableQuestions;
  }

  // 5. Check if we have Essay questions. Essay questions must be statically served (same for all students)
  const essayQuestions = competencyQuestions.filter((q) => q.type === TipeSoal.ESSAY);
  if (essayQuestions.length > 0) {
    // Sort statically by ID so every student gets exactly the same essay questions in the same order
    essayQuestions.sort((a, b) => a.id - b.id);
    const bestQuestion = essayQuestions[0];
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

  // 6. Serve MCQ: Adaptively using ELO closest match (if isAdaptive = true), or Randomized (if isAdaptive = false)
  const mcqQuestions = competencyQuestions.filter((q) => q.type === TipeSoal.MCQ);
  if (mcqQuestions.length === 0) return null;

  let bestQuestion = mcqQuestions[0];

  if (isAdaptive) {
    let smallestEloDifference = Infinity;
    for (const q of mcqQuestions) {
      const qElo = DDAHelper.mapDifficultyToElo(q.difficulty);
      const diff = Math.abs(qElo - currentElo);

      if (diff < smallestEloDifference) {
        smallestEloDifference = diff;
        bestQuestion = q;
      }
    }
  } else {
    // Non-adaptive mode: pick a random question from available MCQ candidates
    const randomIndex = Math.floor(Math.random() * mcqQuestions.length);
    bestQuestion = mcqQuestions[randomIndex];
  }

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
