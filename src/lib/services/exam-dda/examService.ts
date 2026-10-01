"use server";

import prisma from "../db/prisma";
import * as siswaDB from "../db/siswa/siswaDB";
import { enqueueStudentReport } from "../report/generator";
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
  const totalDurationMinutes = examData.ujian.durasiMenit || 90;

  // Calculate how much time has actually passed since the exam started
  const elapsedMs = Date.now() - session.waktuMulai.getTime();
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const totalDurationSeconds = totalDurationMinutes * 60;

  // Math.max ensures we don't send negative time if they resume after expiration
  const remainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds);

  // Optional but recommended: Auto-finish if they open the exam after time is up
  if (remainingSeconds === 0) {
    // await finishExamSession(session.id); // Uncomment if you have this function available here
  }

  return {
    sessionId: session.id,
    currentElo: session.currentElo,
    answeredCount: session.jawabanSiswa.length,
    totalQuestions,
    remainingSeconds,
    cheatCount: session.cheatCount,
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
  const durasiMenit = session.jadwalUjian?.ujian?.durasiMenit || 90;
  const examEndTime = new Date(session.waktuMulai.getTime() + (durasiMenit + 5) * 60000);

  if (new Date() > examEndTime) {
    // The absolute server time has passed. The student is out of time.
    await finishExamSession(sesiId);

    // You can throw an error, or return a finished state so the frontend redirects them.
    return {
      isFinished: true,
      finalElo: session.currentElo,
      error: "TIME_EXPIRED"
    };
  }

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
    include: {
      jawabanSiswa: true,
      jadwalUjian: {
        include: {
          ujian: {
            include: {
              templateKompetensi: {
                where: { isEnabled: true },
              },
            },
          },
        },
      },
    },
  });

  if (!session) return;

  const enabledComp = session.jadwalUjian?.ujian?.templateKompetensi || [];
  const totalQuestions =
    enabledComp.length > 0
      ? enabledComp.reduce((sum, tk) => sum + tk.jumlahSoal, 0)
      : session.jadwalUjian?.ujian?.jumlahSoal || session.jawabanSiswa.length || 10;

  let totalPoin = 0;
  session.jawabanSiswa.forEach((j) => {
    if (j.nilaiPoin) totalPoin += j.nilaiPoin;
  });

  const maxTotalPoin = totalQuestions * 100;
  const finalScore =
    maxTotalPoin > 0
      ? Math.round((totalPoin / maxTotalPoin) * 100 * 100) / 100
      : 0;
  await enqueueStudentReport(sesiId);

  await siswaDB.finishSession(sesiId, finalScore);
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
    (q) => !answeredIds.includes(q.id)
  );
  if (availableQuestions.length === 0) return null;

  // 2. Fetch already answered questions details
  const answeredQuestions = await prisma.bankSoal.findMany({
    where: { id: { in: answeredIds.filter((id): id is number => id !== null) } },
  });

  // 3. 80/20 Format Split Controller
  const activeCompetencies = templateKompetensi.filter((tk) => tk.isEnabled);

  // Calculate total N for the exam based on competencies
  const totalQuestions = activeCompetencies.length > 0
    ? activeCompetencies.reduce((sum, tk) => sum + tk.jumlahSoal, 0)
    : 10; // Fallback if no competencies are defined

  const targetMcq = Math.floor(totalQuestions * 0.8);
  const targetEssay = Math.ceil(totalQuestions * 0.2);

  const answeredMcqCount = answeredQuestions.filter(q => q.type === TipeSoal.MCQ).length;
  const answeredEssayCount = answeredQuestions.filter(q => q.type === TipeSoal.ESSAY).length;

  const remainingEssaysNeeded = targetEssay - answeredEssayCount;
  const remainingQuestionsTotal = totalQuestions - answeredQuestions.length;

  let needsEssay = false;
  if (remainingEssaysNeeded > 0) {
    // If the remaining slots exactly match the required essays, force an essay.
    // Otherwise, serve an essay if MCQ quota is met, or with a 20% random chance to spread them out.
    if (remainingQuestionsTotal <= remainingEssaysNeeded) {
      needsEssay = true;
    } else {
      needsEssay = (answeredMcqCount >= targetMcq) || (Math.random() < 0.2);
    }
  }

  // 4. Find the first enabled competency that hasn't met its limit
  let targetCompetency = null;
  for (const tk of activeCompetencies) {
    const answeredCount = answeredQuestions.filter((q) => q.kompetensiBabId === tk.kompetensiBabId).length;
    if (answeredCount < tk.jumlahSoal) {
      targetCompetency = tk;
      break;
    }
  }

  if (!targetCompetency) return null; // All competency target limits met

  // 5. Filter available questions to matching competency
  let competencyQuestions = availableQuestions.filter(
    (q) => targetCompetency && q.kompetensiBabId === targetCompetency.kompetensiBabId
  );

  if (competencyQuestions.length === 0) {
    // Fallback: pick from any available question in the exam if competency pool is dry
    competencyQuestions = availableQuestions;
  }

  // 6. Filter Candidates by the Required Type (MCQ vs Essay)
  let candidates = competencyQuestions.filter(
    (q) => q.type === (needsEssay ? TipeSoal.ESSAY : TipeSoal.MCQ)
  );

  // Fallback if we run out of the specific type requested
  if (candidates.length === 0) {
    candidates = competencyQuestions;
  }

  // 8. Nearest-Neighbor Selection (for BOTH MCQ and Essay)
  let bestQuestion = candidates[0];

  if (isAdaptive) {
    const progress = totalQuestions > 0
      ? Math.min(1, answeredQuestions.length / totalQuestions)
      : 0;

    // B. Define maximum allowable bias stretch (e.g., up to +200 Elo push by the end)
    const maxBias = 200;

    // C. Scale the bias using a smooth curve
    const upwardBias = Math.pow(progress, 0.8) * maxBias;

    // D. Calculate target search Elo and clamp it strictly between your 800 and 2000 limits
    const targetSearchElo = Math.max(800, Math.min(2000, currentElo + upwardBias));

    let smallestEloDifference = Infinity;

    for (const q of candidates) {
      const qElo = DDAHelper.calculateQElo(q.bloomLevel, q.difficulty);

      // Compare against the biased target Elo instead of raw currentElo
      const diff = Math.abs(qElo - targetSearchElo);

      if (diff < smallestEloDifference) {
        smallestEloDifference = diff;
        bestQuestion = q;
      }
    }
  } else {
    // Non-adaptive mode: pick a random question
    const randomIndex = Math.floor(Math.random() * candidates.length);
    bestQuestion = candidates[randomIndex];
  }

  return {
    id: bestQuestion.id.toString(),
    babId: bestQuestion.babId?.toString(),
    type: bestQuestion.type,
    text: bestQuestion.teksSoal,
    options: bestQuestion.opsiJawaban,
    difficulty: bestQuestion.difficulty,
    bloomLevel: bestQuestion.bloomLevel,
    linkGambarSoal: bestQuestion.linkGambarSoal || null,
  };
}
