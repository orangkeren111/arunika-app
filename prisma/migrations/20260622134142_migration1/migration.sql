-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'ADMIN', 'GURU', 'SISWA');

-- CreateEnum
CREATE TYPE "TipeSoal" AS ENUM ('MCQ', 'ESSAY');

-- CreateEnum
CREATE TYPE "StatusUjian" AS ENUM ('DRAFT', 'SCHEDULED', 'ONGOING', 'COMPLETED');

-- CreateTable
CREATE TABLE "sekolah" (
    "id" SERIAL NOT NULL,
    "nama_sekolah" TEXT NOT NULL,
    "alamat" TEXT,

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
    "sekolah_id" INTEGER NOT NULL,

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
CREATE TABLE "bab" (
    "id" SERIAL NOT NULL,
    "judul_bab" TEXT NOT NULL,
    "buku_id" INTEGER NOT NULL,

    CONSTRAINT "bab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_soal" (
    "id" SERIAL NOT NULL,
    "teks_soal" TEXT NOT NULL,
    "opsi_jawaban" JSONB,
    "jawaban_benar_mcq" TEXT,
    "type" "TipeSoal" NOT NULL,
    "bab_id" INTEGER NOT NULL,

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
    "guru_id" INTEGER NOT NULL,

    CONSTRAINT "ujian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detail_ujian" (
    "ujian_id" INTEGER NOT NULL,
    "soal_id" INTEGER NOT NULL,

    CONSTRAINT "detail_ujian_pkey" PRIMARY KEY ("ujian_id","soal_id")
);

-- CreateTable
CREATE TABLE "jadwal_ujian" (
    "id" SERIAL NOT NULL,
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
    "jadwal_ujian_id" INTEGER NOT NULL,
    "siswa_id" INTEGER NOT NULL,

    CONSTRAINT "sesi_ujian_siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jawaban_siswa" (
    "id" SERIAL NOT NULL,
    "jawaban_siswa" TEXT,
    "is_correct" BOOLEAN,
    "nilai_poin" DOUBLE PRECISION,
    "catatan_koreksi" TEXT,
    "attempt_id" INTEGER NOT NULL,
    "soal_id" INTEGER NOT NULL,

    CONSTRAINT "jawaban_siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_responses" (
    "id" SERIAL NOT NULL,
    "ai_statement_summary" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attempt_id" INTEGER NOT NULL,

    CONSTRAINT "saved_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelas" ADD CONSTRAINT "kelas_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keanggotaan_kelas" ADD CONSTRAINT "keanggotaan_kelas_kelas_id_fkey" FOREIGN KEY ("kelas_id") REFERENCES "kelas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "keanggotaan_kelas" ADD CONSTRAINT "keanggotaan_kelas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buku" ADD CONSTRAINT "buku_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bab" ADD CONSTRAINT "bab_buku_id_fkey" FOREIGN KEY ("buku_id") REFERENCES "buku"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_soal" ADD CONSTRAINT "bank_soal_bab_id_fkey" FOREIGN KEY ("bab_id") REFERENCES "bab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ujian" ADD CONSTRAINT "ujian_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_ujian" ADD CONSTRAINT "detail_ujian_ujian_id_fkey" FOREIGN KEY ("ujian_id") REFERENCES "ujian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_ujian" ADD CONSTRAINT "detail_ujian_soal_id_fkey" FOREIGN KEY ("soal_id") REFERENCES "bank_soal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "jawaban_siswa" ADD CONSTRAINT "jawaban_siswa_soal_id_fkey" FOREIGN KEY ("soal_id") REFERENCES "bank_soal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_responses" ADD CONSTRAINT "saved_responses_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "sesi_ujian_siswa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
