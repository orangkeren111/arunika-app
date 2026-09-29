-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'BOOK_ONLY', 'PREMIUM');

-- AlterTable
ALTER TABLE "generation_job" ADD COLUMN     "jumlah_essay" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "jumlah_mcq" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pilihan_per_mcq" INTEGER NOT NULL DEFAULT 4;

-- AlterTable
ALTER TABLE "sekolah" ADD COLUMN     "aktif_sampai" TIMESTAMP(3),
ADD COLUMN     "tier" "SubscriptionTier" NOT NULL DEFAULT 'FREE';

-- CreateTable
CREATE TABLE "pembayaran" (
    "id" SERIAL NOT NULL,
    "sekolah_id" INTEGER NOT NULL,
    "jumlah_bulan" INTEGER NOT NULL,
    "tanggal_bayar" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nominal" DOUBLE PRECISION,

    CONSTRAINT "pembayaran_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pembayaran" ADD CONSTRAINT "pembayaran_sekolah_id_fkey" FOREIGN KEY ("sekolah_id") REFERENCES "sekolah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
