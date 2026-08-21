-- AlterTable
ALTER TABLE "bank_soal" ADD COLUMN     "is_accepted" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_rejected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kompetensi_bab_id" INTEGER,
ADD COLUMN     "link_gambar_soal" TEXT;

-- AlterTable
ALTER TABLE "generation_job" ADD COLUMN     "jumlah_soal" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "tokens_spent" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "task_queue" ADD COLUMN     "tokens_spent" INTEGER NOT NULL DEFAULT 0;

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

-- CreateIndex
CREATE UNIQUE INDEX "ujian_criteria_ujian_id_key" ON "ujian_criteria"("ujian_id");

-- AddForeignKey
ALTER TABLE "bank_soal" ADD CONSTRAINT "bank_soal_kompetensi_bab_id_fkey" FOREIGN KEY ("kompetensi_bab_id") REFERENCES "kompetensi_bab"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
