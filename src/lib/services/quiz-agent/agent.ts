// import prisma from "../db/prisma";
// import { executeLLMStrategy } from "../llm/router";
// import { calculateNewElo } from "../exam-dda/ddaHelper";

// /**
//  * 9. Agentic Tools
//  */
// export const AgentTools = {
//   getStudentMistakes: async (sessionId: string) => {
//     const mistakes = await prisma.historicalAnswer.findMany({
//       where: { sessionId, isCorrect: false },
//       include: { question: true },
//     });
//     return mistakes;
//   },

//   getStudentSkillLevel: async (sessionId: string) => {
//     const session = await prisma.userSession.findUnique({
//       where: { id: sessionId },
//     });
//     return {
//       elo: session?.eloRating,
//       taxonomy: session?.currentTaxonomy,
//     };
//   },
// };

// /**
//  * 10. Adaptive Agentic Quiz Play
//  * Processes a submitted answer, updates Elo, and uses Groq for immediate micro-feedback.
//  */
// export async function processAnswerAndFeedback(
//   sessionId: string,
//   questionId: string,
//   userAnswer: string,
// ) {
//   // 1. Fetch current question and session
//   const question = await prisma.question.findUnique({
//     where: { id: questionId },
//   });
//   const session = await prisma.userSession.findUnique({
//     where: { id: sessionId },
//   });

//   if (!question || !session) throw new Error("Invalid state");

//   // 2. Evaluate
//   const qContent = question.content as any;
//   const isCorrect =
//     userAnswer.toLowerCase().trim() ===
//     qContent.correctAnswer.toLowerCase().trim();

//   // 3. Update Elo (DDA)
//   const newElo = calculateNewElo(
//     session.eloRating,
//     question.complexity,
//     isCorrect,
//   );
//   await prisma.userSession.update({
//     where: { id: sessionId },
//     data: { eloRating: newElo },
//   });

//   // 4. Record History
//   await prisma.historicalAnswer.create({
//     data: {
//       sessionId,
//       questionId,
//       isCorrect,
//       userAnswer,
//     },
//   });

//   // 5. Agentic Recommendation (Real-time feedback)
//   // Use Groq because it is ultra-fast, perfect for inline chat/feedback delays
//   let feedback = "";
//   if (!isCorrect) {
//     const prompt = `
//       The student answered a question incorrectly.
//       Question: ${qContent.question}
//       Correct Answer: ${qContent.correctAnswer}
//       Student Answer: ${userAnswer}
//       Explanation: ${qContent.explanation}

//       Act as an encouraging tutor. In 2 sentences, gently correct them and give a quick micro-lesson or tip based on the explanation.
//     `;
//     feedback = await executeLLMStrategy("groq", prompt);
//   } else {
//     feedback =
//       "Great job! That is correct. Let's move on to the next challenge.";
//   }

//   return {
//     isCorrect,
//     newElo,
//     feedback,
//     nextAction: "FETCH_NEXT_QUESTION", // Instruct UI to call getNextQuestion()
//   };
// }
