-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'ADMIN', 'GURU', 'SISWA');

-- CreateEnum
CREATE TYPE "TipeSoal" AS ENUM ('MCQ', 'ESSAY');

-- CreateEnum
CREATE TYPE "Tingkat" AS ENUM ('SD', 'SMP', 'SMA', 'Kuliah');

-- CreateEnum
CREATE TYPE "StatusUjian" AS ENUM ('DRAFT', 'SCHEDULED', 'ONGOING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING_PDF', 'EXTRACTING_IMAGES', 'WAITING_EXTRACTION_VALIDATION', 'CAPTIONING_IMAGES', 'WAITING_CAPTION_VALIDATION', 'GENERATING_QUESTIONS', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "sekolah" (
    "id" SERIAL NOT NULL,
    "nama_sekolah" TEXT NOT NULL,
    "alamat" TEXT,
    "tingkat" "Tingkat",
    "is_retired" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sekolah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "sekolah_id" INTEGER,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelas" (
    "id" SERIAL NOT NULL,
    "nama_kelas" TEXT NOT NULL,
    "is_retired" BOOLEAN NOT NULL DEFAULT false,
    "class_code" TEXT,
    "sekolah_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,

    CONSTRAINT "kelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keanggotaan_kelas" (
    "kelas_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "keanggotaan_kelas_pkey" PRIMARY KEY ("kelas_id","user_id")
);

-- CreateTable
CREATE TABLE "buku" (
    "id" SERIAL NOT NULL,
    "judul" TEXT NOT NULL,
    "guru_id" INTEGER NOT NULL,

    CONSTRAINT "buku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buku_image" (
    "id" SERIAL NOT NULL,
    "buku_id" INTEGER NOT NULL,
    "bab_id" INTEGER,
    "image_path" TEXT NOT NULL,
    "page_number" INTEGER NOT NULL,
    "context_text" TEXT,
    "caption" TEXT,
    "keywords" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "is_kept" BOOLEAN NOT NULL DEFAULT true,
    "is_manual_upload" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buku_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generation_job" (
    "id" SERIAL NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "file_name" TEXT NOT NULL,
    "file_url" TEXT,
    "error_message" TEXT,
    "jumlah_soal" INTEGER NOT NULL DEFAULT 10,
    "tokens_spent" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "buku_id" INTEGER NOT NULL,
    "bab_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generation_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bab" (
    "id" SERIAL NOT NULL,
    "judul_bab" TEXT NOT NULL,
    "start_page" INTEGER,
    "end_page" INTEGER,
    "buku_id" INTEGER NOT NULL,
    "learning_goals" TEXT,

    CONSTRAINT "bab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_soal" (
    "id" SERIAL NOT NULL,
    "teks_soal" TEXT NOT NULL,
    "opsi_jawaban" JSONB,
    "jawaban_benar_mcq" TEXT,
    "jawaban_benar_essay" TEXT,
    "type" "TipeSoal" NOT NULL,
    "bab_id" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "bloomLevel" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "kompetensi_bab_id" INTEGER,
    "link_gambar_soal" TEXT,
    "is_accepted" BOOLEAN NOT NULL DEFAULT true,
    "is_rejected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "bank_soal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipe_ujian" (
    "id" SERIAL NOT NULL,
    "nama_tipe_ujian" TEXT NOT NULL,

    CONSTRAINT "tipe_ujian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ujian" (
    "id" SERIAL NOT NULL,
    "judul_ujian" TEXT NOT NULL,
    "durasi_menit" INTEGER NOT NULL,
    "jumlah_soal" INTEGER NOT NULL,
    "isAdaptive" BOOLEAN NOT NULL DEFAULT true,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "guru_id" INTEGER NOT NULL,

    CONSTRAINT "ujian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ujian_bab" (
    "ujianId" INTEGER NOT NULL,
    "babId" INTEGER NOT NULL,

    CONSTRAINT "ujian_bab_pkey" PRIMARY KEY ("ujianId","babId")
);

-- CreateTable
CREATE TABLE "jadwal_ujian" (
    "id" SERIAL NOT NULL,
    "judul_jadwal" TEXT,
    "waktu_mulai_aktif" TIMESTAMP(3),
    "waktu_selesai_aktif" TIMESTAMP(3),
    "status" "StatusUjian" NOT NULL DEFAULT 'DRAFT',
    "ujian_id" INTEGER NOT NULL,
    "kelas_id" INTEGER NOT NULL,
    "tipe_ujian_id" INTEGER NOT NULL,

    CONSTRAINT "jadwal_ujian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesi_ujian_siswa" (
    "id" SERIAL NOT NULL,
    "waktu_mulai" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waktu_selesai" TIMESTAMP(3),
    "nilai_akhir" DOUBLE PRECISION,
    "current_elo" DOUBLE PRECISION NOT NULL DEFAULT 1000.0,
    "is_checked" BOOLEAN NOT NULL DEFAULT false,
    "jadwal_ujian_id" INTEGER NOT NULL,
    "siswa_id" INTEGER NOT NULL,

    CONSTRAINT "sesi_ujian_siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jawaban_siswa" (
    "id" SERIAL NOT NULL,
    "soal_asli_id" INTEGER,
    "nomor" INTEGER NOT NULL,
    "teks_soal" TEXT NOT NULL,
    "opsi_jawaban" JSONB,
    "jawaban_benar_mcq" TEXT,
    "jawaban_benar_essay" TEXT,
    "type" "TipeSoal" NOT NULL,
    "jawaban_siswa" TEXT,
    "is_correct" BOOLEAN,
    "nilai_poin" DOUBLE PRECISION,
    "catatan_koreksi" TEXT,
    "ai_response" TEXT,
    "answered_at" TIMESTAMP(3),
    "elo_before" DOUBLE PRECISION,
    "elo_after" DOUBLE PRECISION,
    "attempt_id" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "bloomLevel" TEXT,

    CONSTRAINT "jawaban_siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_queue" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payload" JSONB NOT NULL,
    "provider" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "errorLog" TEXT,
    "tokens_spent" INTEGER NOT NULL DEFAULT 0,
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_responses" (
    "id" SERIAL NOT NULL,
    "overview" TEXT,
    "weakness" TEXT,
    "recommendation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attempt_id" INTEGER NOT NULL,

    CONSTRAINT "saved_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ujian_criteria" (
    "id" SERIAL NOT NULL,
    "ujian_id" INTEGER NOT NULL,
    "req_c1" INTEGER NOT NULL DEFAULT 10,
    "req_c2" INTEGER NOT NULL DEFAULT 10,
    "req_c3" INTEGER NOT NULL DEFAULT 10,
    "req_c4" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "ujian_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kompetensi_pelajaran" (
    "id" SERIAL NOT NULL,
    "nomer_kompetensi" TEXT NOT NULL,
    "isi_kompetensi" TEXT NOT NULL,
    "nama_bab" TEXT NOT NULL,
    "nama_buku" TEXT NOT NULL,

    CONSTRAINT "kompetensi_pelajaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kompetensi_bab" (
    "id" SERIAL NOT NULL,
    "bab_id" INTEGER NOT NULL,
    "nomer_kompetensi" TEXT NOT NULL,
    "isi_kompetensi" TEXT NOT NULL,
    "kompetensi_pelajaran_id" INTEGER,

    CONSTRAINT "kompetensi_bab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ujian_template_kompetensi" (
    "id" SERIAL NOT NULL,
    "ujian_id" INTEGER NOT NULL,
    "kompetensi_bab_id" INTEGER NOT NULL,
    "jumlah_soal" INTEGER NOT NULL DEFAULT 0,
    "total_point" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ujian_template_kompetensi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_session" (
    "id" SERIAL NOT NULL,
    "siswa_id" INTEGER NOT NULL,
    "ujian_id" INTEGER NOT NULL,
    "current_level" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "session_mode" TEXT NOT NULL DEFAULT 'QUIZ_ACTIVE',
    "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "wrong_streak" INTEGER NOT NULL DEFAULT 0,
    "history" JSONB,

    CONSTRAINT "quiz_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LlmApiKey" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "name" TEXT,
    "key" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "cooldownUntil" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LlmApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LlmTaskRouting" (
    "id" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LlmTaskRouting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "kelas_class_code_key" ON "kelas"("class_code");

-- CreateIndex
CREATE UNIQUE INDEX "saved_responses_attempt_id_key" ON "saved_responses"("attempt_id");

-- CreateIndex
CREATE UNIQUE INDEX "ujian_criteria_ujian_id_key" ON "ujian_criteria"("ujian_id");

-- CreateIndex
CREATE INDEX "LlmApiKey_provider_isActive_idx" ON "LlmApiKey"("provider", "isActive");

-- CreateIndex
CREATE INDEX "LlmTaskRouting_taskType_isActive_idx" ON "LlmTaskRouting"("taskType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "LlmTaskRouting_taskType_priority_key" ON "LlmTaskRouting"("taskType", "priority");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelas" ADD CONSTRAINT "kelas_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelas" ADD CONSTRAINT "kelas_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keanggotaan_kelas" ADD CONSTRAINT "keanggotaan_kelas_kelas_id_fkey" FOREIGN KEY ("kelas_id") REFERENCES "kelas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keanggotaan_kelas" ADD CONSTRAINT "keanggotaan_kelas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buku" ADD CONSTRAINT "buku_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buku_image" ADD CONSTRAINT "buku_image_buku_id_fkey" FOREIGN KEY ("buku_id") REFERENCES "buku"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buku_image" ADD CONSTRAINT "buku_image_bab_id_fkey" FOREIGN KEY ("bab_id") REFERENCES "bab"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_job" ADD CONSTRAINT "generation_job_buku_id_fkey" FOREIGN KEY ("buku_id") REFERENCES "buku"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_job" ADD CONSTRAINT "generation_job_bab_id_fkey" FOREIGN KEY ("bab_id") REFERENCES "bab"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bab" ADD CONSTRAINT "bab_buku_id_fkey" FOREIGN KEY ("buku_id") REFERENCES "buku"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_soal" ADD CONSTRAINT "bank_soal_bab_id_fkey" FOREIGN KEY ("bab_id") REFERENCES "bab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_soal" ADD CONSTRAINT "bank_soal_kompetensi_bab_id_fkey" FOREIGN KEY ("kompetensi_bab_id") REFERENCES "kompetensi_bab"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ujian" ADD CONSTRAINT "ujian_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ujian_bab" ADD CONSTRAINT "ujian_bab_ujianId_fkey" FOREIGN KEY ("ujianId") REFERENCES "ujian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ujian_bab" ADD CONSTRAINT "ujian_bab_babId_fkey" FOREIGN KEY ("babId") REFERENCES "bab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_ujian" ADD CONSTRAINT "jadwal_ujian_ujian_id_fkey" FOREIGN KEY ("ujian_id") REFERENCES "ujian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_ujian" ADD CONSTRAINT "jadwal_ujian_kelas_id_fkey" FOREIGN KEY ("kelas_id") REFERENCES "kelas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_ujian" ADD CONSTRAINT "jadwal_ujian_tipe_ujian_id_fkey" FOREIGN KEY ("tipe_ujian_id") REFERENCES "tipe_ujian"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesi_ujian_siswa" ADD CONSTRAINT "sesi_ujian_siswa_jadwal_ujian_id_fkey" FOREIGN KEY ("jadwal_ujian_id") REFERENCES "jadwal_ujian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesi_ujian_siswa" ADD CONSTRAINT "sesi_ujian_siswa_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jawaban_siswa" ADD CONSTRAINT "jawaban_siswa_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "sesi_ujian_siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jawaban_siswa" ADD CONSTRAINT "jawaban_siswa_soal_asli_id_fkey" FOREIGN KEY ("soal_asli_id") REFERENCES "bank_soal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_responses" ADD CONSTRAINT "saved_responses_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "sesi_ujian_siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ujian_criteria" ADD CONSTRAINT "ujian_criteria_ujian_id_fkey" FOREIGN KEY ("ujian_id") REFERENCES "ujian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kompetensi_bab" ADD CONSTRAINT "kompetensi_bab_bab_id_fkey" FOREIGN KEY ("bab_id") REFERENCES "bab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kompetensi_bab" ADD CONSTRAINT "kompetensi_bab_kompetensi_pelajaran_id_fkey" FOREIGN KEY ("kompetensi_pelajaran_id") REFERENCES "kompetensi_pelajaran"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ujian_template_kompetensi" ADD CONSTRAINT "ujian_template_kompetensi_ujian_id_fkey" FOREIGN KEY ("ujian_id") REFERENCES "ujian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ujian_template_kompetensi" ADD CONSTRAINT "ujian_template_kompetensi_kompetensi_bab_id_fkey" FOREIGN KEY ("kompetensi_bab_id") REFERENCES "kompetensi_bab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_session" ADD CONSTRAINT "quiz_session_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_session" ADD CONSTRAINT "quiz_session_ujian_id_fkey" FOREIGN KEY ("ujian_id") REFERENCES "ujian"("id") ON DELETE CASCADE ON UPDATE CASCADE;
