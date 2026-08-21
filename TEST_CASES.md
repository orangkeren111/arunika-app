# Test Cases - Arunika App

This document outlines manual and functional test cases for key user flows. Each use case contains at least 10 points covering positive and negative test cases.

---

## 1. Curriculum Upload & AI Extraction (Admin)
* **1.1. Positive - Upload valid PDF**: Admin uploads a valid curriculum PDF. The system should save the file, register a `extract_kurikulum` task in the queue, and show a success message.
* **1.2. Positive - Background queue extraction**: The queue worker processes the task, extracts competencies via Gemini, and successfully populates the `KompetensiPelajaran` table.
* **1.3. Negative - Upload invalid file format**: Admin attempts to upload a `.docx` or `.txt` file. The interface should block the submit button or validation should reject the format immediately.
* **1.4. Negative - Upload large PDF**: Admin uploads a 100MB PDF. The system should reject it with a file-size limit warning.
* **1.5. Negative - Upload empty file**: Admin attempts to submit the upload form without selecting a file. The validation should prevent form submission.
* **1.6. Negative - Gemini extraction failure**: Gemini service fails to parse the document. The task status in the database should mark as `FAILED` and log the error.
* **1.7. Negative - Duplicate book/curriculum upload**: Admin uploads the same curriculum PDF twice. The extraction should overwrite or handle duplicates cleanly without DB violations.
* **1.8. Negative - Concurrent uploads**: Two admins upload different PDFs at the same time. The task queue should sequence the jobs and execute them in order without database locks.
* **1.9. Negative - Network disconnect during upload**: Network disconnects mid-upload. The page should show a network failure warning and allow retry.
* **1.10. Negative - Corrupted PDF upload**: Admin uploads a corrupted PDF. The worker should catch the PDF parsing error, fail the task gracefully, and update status to `FAILED`.

---

## 2. Chapter Competency CRUD & Linking (Guru)
* **2.1. Positive - Create manual competency**: Teacher adds a competency manually by inputting code "KD 1.1" and a description. The new row should display immediately in the list.
* **2.2. Positive - Update competency details**: Teacher edits the description of an existing competency. The page updates and shows the modified details.
* **2.3. Positive - Delete competency**: Teacher deletes a competency. The row should be removed, and all linked bank questions should set their `kompetensiBabId` to null (Cascade set-null).
* **2.4. Positive - Linking curriculum competencies**: Teacher selects a book and chapter from the curriculum extraction database, selects 3 competencies, and clicks link. The competencies are copied to the chapter.
* **2.5. Negative - Empty manual creation input**: Teacher attempts to save a manual competency with empty code or text fields. Validation should prompt them.
* **2.6. Negative - Duplicate competency code**: Teacher tries to add a competency with a code that already exists in the same chapter. System should show a warning or allow duplicate values if designed for custom text.
* **2.7. Negative - Link empty selection**: Teacher opens the link wizard but selects no competencies before clicking submit. The submit button should be disabled.
* **2.8. Negative - Delete locked competency**: Teacher attempts to delete a competency linked to active exam templates. The system should block the delete and prompt the teacher to remove it from the templates first.
* **2.9. Negative - Freetext SQL injection**: Teacher inputs SQL characters in manual competency fields. The database ORM must parameterize inputs and save the text safely.
* **2.10. Negative - Invalid Bab ID routing**: Teacher accesses the competency page with a non-existent `bab_id` in the URL. The page should render a "Bab tidak ditemukan" warning.

---

## 3. Question Bank & LLM Feedback Loop (Guru)
* **3.1. Positive - AI generation by competency**: Teacher triggers question generation. The prompt retrieves the target competency and chapter summaries to create tailored questions.
* **3.2. Positive - LLM feedback context**: The generator query pulls up to 10 accepted and 10 rejected questions from `BankSoal` to serve as context for generating better questions.
* **3.3. Positive - Accept generated question**: Teacher clicks "Accept" on a question. The database status `isAccepted` is set to true, and it becomes available for exams.
* **3.4. Positive - Reject generated question**: Teacher clicks "Reject" on a question. The status `isRejected` is set to true, hiding it from exam builders.
* **3.5. Positive - Image URL upload**: Teacher updates the image link for a question. The question card updates to display the image.
* **3.6. Negative - Empty bank generation**: Teacher attempts to generate questions for a chapter with no competencies defined. The system should notify the teacher to add competencies first.
* **3.7. Negative - Duplicate generation context**: LLM ignores the feedback context and generates a question identical to a rejected one. The server validation or DB unique keys should prevent duplicate insertion.
* **3.8. Negative - Invalid Image URL**: Teacher inputs an invalid image string (e.g. "not-a-url"). The UI should fallback to a placeholder or display a broken link icon safely.
* **3.9. Negative - Gen limit overflow**: Teacher requests 100 questions at once. The system limits the request batch to avoid LLM timeouts.
* **3.10. Negative - LLM API timeout**: Groq/Gemini APIs time out during generation. The interface should show a retry button and fail gracefully.

---

## 4. Exam Template Builder & Validation (Guru)
* **4.1. Positive - Create exam template**: Teacher fills title, duration, checks chapters, sets competency counts, and saves.
* **4.2. Positive - Automatic question target**: The target question count textbox is read-only and automatically sums the question numbers of all enabled competencies.
* **4.3. Positive - Verify question counts**: Teacher sets target competency count to 5. The competency row shows 12 available questions in the bank. Validation passes.
* **4.4. Negative - Insufficient questions in bank**: Teacher requests 10 questions for competency A, but the bank only contains 4 accepted questions. Saving is blocked, and an alert is shown.
* **4.5. Negative - Save with empty title**: Teacher tries to save the template without a title. The application alerts "Judul ujian harus diisi".
* **4.6. Negative - Negative counts or points input**: Teacher enters `-5` questions or `-10` points. Validation rejects the input.
* **4.7. Negative - Zero total questions**: Teacher disables all competencies, resulting in a target count of 0. Saving is blocked.
* **4.8. Negative - Large duration value**: Teacher inputs `9999` minutes. Validation restricts the duration to a reasonable limit (e.g. max 300 minutes).
* **4.9. Negative - DB constraint violation on delete**: Teacher deletes a template currently scheduled for a class. The system blocks deletion due to relational foreign key constraints.
* **4.10. Negative - Modify exam while active**: Teacher attempts to edit template criteria while a student is currently taking the exam. The system blocks editing.

---

## 5. Student Adaptive Exam Taking (Siswa)
* **5.1. Positive - Start exam session**: Student enters exam lobby and clicks start. The session is created, ELO initialized to 1000, and the first question is loaded.
* **5.2. Positive - MCQ ELO adjustments**: Student answers MCQ correctly. Student ELO increases; if incorrect, ELO decreases.
* **5.3. Positive - Deterministic essay serving**: Student encounters essay questions. The essay questions are served statically in the same order for everyone, and ELO remains unchanged.
* **5.4. Positive - Auto-submit on time limit**: The exam timer reaches 0. SesiUjianSiswa is closed, and answers are automatically submitted.
* **5.5. Positive - Resume session**: Student loses connection, re-enters lobby, and clicks start. The session resumes from the exact question they were on.
* **5.6. Negative - Answer expired session**: Student attempts to submit an answer after the session has been closed. The server rejects the submission.
* **5.7. Negative - Double submission**: Student clicks "Next" twice rapidly. The frontend disables the button during submission to prevent double entry.
* **5.8. Negative - Out of tab warnings**: Student leaves the exam tab. A warning prompt is shown. On the 3rd exit, the exam is automatically submitted.
* **5.9. Negative - Incomplete criteria matching**: The question bank doesn't have enough MCQs for adaptive ELO selection. The engine falls back to selecting any available question.
* **5.10. Negative - Access closed exam**: Student attempts to access the exam after submitting it. The lobby blocks access.

---

## 6. AI Reports & Competency Analysis (Siswa/Guru)
* **6.1. Positive - Statistics by competency**: The report displays ketuntasan stats (e.g. `n/m` correct answers) for each tested competency instead of Bloom's Taxonomy.
* **6.2. Positive - AI analysis load**: Page displays AI-generated summaries (performance overview, weaknesses, and recommendations).
* **6.3. Positive - Zero answer tracking**: Student submits an exam without answering any questions. The report correctly shows `0/jumlahSoal` for all competencies instead of failing.
* **6.4. Negative - Pending report display**: Student opens report while AI generation is in `PENDING` status. The page displays a loading spinner with Mascot explanation.
* **6.5. Negative - Worker task failure**: AI report generation task fails. The page displays an "Analisis Gagal" warning with a retry link.
* **6.6. Negative - SQL injection inside feedback**: AI model returns malicious characters. The report page encodes the HTML strings to prevent cross-site scripting (XSS).
* **6.7. Negative - Unmapped competency answers**: Student answers a question that doesn't have an associated competency in the DB. The report groups it under a "General/Lainnya" section without crashing.
* **6.8. Negative - Missing attempt ID**: Accessing report page without an `attemptId` parameter. Page redirects to dashboard.
* **6.9. Negative - Access other student's report**: Student attempts to open another student's report page. The server routes check session credentials and return a `403 Forbidden` error.
* **6.10. Negative - Database connection drop**: Connection drops while loading report. Page shows a friendly reload instruction.

---

## 7. Quiz Lobby & Concurrency Queue (Siswa)
* **7.1. Positive - Active counter updates**: Lobby shows the number of active players (e.g. `12/20 slot terisi`).
* **7.2. Positive - Singleton queue registry**: Student joins lobby. Any previously active/stuck queue sessions of this student are ended, keeping a single active wait per student.
* **7.3. Positive - Warm-up lobby game**: Student plays the 10-question lobby minigame while waiting in the queue.
* **7.4. Positive - Warm-up results list**: After answering all 10 questions, the student gets a list showing their answers and correct keys.
* **7.5. Positive - Claim slot popup**: A slot opens up, the database transaction locks the slot, `slotClaimed` state is set, and the welcome popup is displayed.
* **7.6. Negative - Access lobby before report is finished**: Student tries to access quiz lobby while report generation task is in progress. The lobby blocks access until report is finished.
* **7.7. Negative - Queue limit overflow**: 20 slots are full, and the 21st student enters. The student remains in `WAITING` status and is blocked from entering the play room.
* **7.8. Negative - Inactive queue kicked**: Student leaves the lobby page open and goes AFK. The queue activity check registers no updates and flags the status to `AFK`, freeing up slot.
* **7.9. Negative - Claim slot when full**: Two students poll at the same time. The database transactions run sequentially, letting the first student in and keeping the second in the queue.
* **7.10. Negative - Double join queue**: Student opens two browser tabs of the lobby. The singleton rule ends the first session and registers the second, preventing duplicate queue spaces.

---

## 8. Quiz Play Session & AFK Kicks (Siswa)
* **8.1. Positive - Active session initialization**: Student enters play page. Active Batch of 5 questions is selected by the AI Agent and displayed.
* **8.2. Positive - Typewriter AI feedback**: Student answers 5 questions. The AI agent evaluates answers, updates wrong streak, and outputs feedback using a character typewriter effect.
* **8.3. Positive - Advance competency level**: AI agent deems the student has understood the concept. Student advances to the next level/competency.
* **8.4. Positive - Game over (Win)**: Student successfully completes all competency levels. The page shows a victory screen with the Eagle mascot.
* **8.5. Positive - 15-minute session timeout**: The session reaches 15 minutes limit. Sesi is closed and marked as `FAILED`.
* **8.6. Negative - 5-minute AFK kick warning**: Student does not move mouse or type for 4.5 minutes. A warning dialog pops up asking "Are you still there?".
* **8.7. Negative - AFK kick execution**: Student ignores the AFK warning dialog for 30 seconds. Sesi is closed, status set to `AFK`, and student redirected back to the lobby.
* **8.8. Negative - 5 wrong streak fail**: Student makes 5 cumulative errors during the quiz. The session is closed and marked as `FAILED`.
* **8.9. Negative - Answer selection while evaluating**: Student tries to click options while the AI Agent is evaluating answers. The options are disabled during processing.
* **8.10. Negative - Play quiz when not ongoing**: Student attempts to access play page with a session ID that is already `FINISHED` or `FAILED`. The page shows a game over warning.
