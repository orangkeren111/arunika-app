-- AlterTable
ALTER TABLE "sesi_ujian_siswa" ADD COLUMN     "cheat_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cheat_logs" JSONB;
