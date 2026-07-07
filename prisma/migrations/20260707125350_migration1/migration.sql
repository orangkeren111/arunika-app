/*
  Warnings:

  - The primary key for the `detail_ujian` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `soal_id` on the `detail_ujian` table. All the data in the column will be lost.
  - Added the required column `teks_soal` to the `detail_ujian` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `detail_ujian` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teacher_id` to the `kelas` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "detail_ujian" DROP CONSTRAINT "detail_ujian_soal_id_fkey";

-- AlterTable
ALTER TABLE "detail_ujian" DROP CONSTRAINT "detail_ujian_pkey",
DROP COLUMN "soal_id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "jawaban_benar_mcq" TEXT,
ADD COLUMN     "opsi_jawaban" JSONB,
ADD COLUMN     "soal_asli_id" INTEGER,
ADD COLUMN     "teks_soal" TEXT NOT NULL,
ADD COLUMN     "type" "TipeSoal" NOT NULL,
ADD CONSTRAINT "detail_ujian_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "kelas" ADD COLUMN     "teacher_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ujian" ADD COLUMN     "is_locked" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "kelas" ADD CONSTRAINT "kelas_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_ujian" ADD CONSTRAINT "detail_ujian_soal_asli_id_fkey" FOREIGN KEY ("soal_asli_id") REFERENCES "bank_soal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
