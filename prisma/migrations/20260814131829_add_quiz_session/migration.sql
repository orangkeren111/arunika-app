-- CreateTable
CREATE TABLE "quiz_session" (
    "id" SERIAL NOT NULL,
    "siswa_id" INTEGER NOT NULL,
    "ujian_id" INTEGER NOT NULL,
    "current_level" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "wrong_streak" INTEGER NOT NULL DEFAULT 0,
    "history" JSONB,

    CONSTRAINT "quiz_session_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "quiz_session" ADD CONSTRAINT "quiz_session_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_session" ADD CONSTRAINT "quiz_session_ujian_id_fkey" FOREIGN KEY ("ujian_id") REFERENCES "ujian"("id") ON DELETE CASCADE ON UPDATE CASCADE;
