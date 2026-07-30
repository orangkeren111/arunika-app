import {
  PrismaClient,
  Role,
  TipeSoal,
  StatusUjian,
  JobStatus,
} from "@prisma/client";

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Menghapus data lama...");
  await prisma.jawabanSiswa.deleteMany();
  await prisma.savedResponses.deleteMany();
  await prisma.sesiUjianSiswa.deleteMany();
  await prisma.taskQueue.deleteMany();
  await prisma.ujianBab.deleteMany();
  await prisma.ujian.deleteMany();
  await prisma.generationJob.deleteMany();
  await prisma.bankSoal.deleteMany();
  await prisma.bab.deleteMany();
  await prisma.buku.deleteMany();
  await prisma.kelasMember.deleteMany();
  await prisma.kelas.deleteMany();
  await prisma.user.deleteMany();
  await prisma.sekolah.deleteMany();

  console.log("Mulai proses seeding data baru...");

  // 1. Buat 2 Sekolah
  const sekolah1 = await prisma.sekolah.create({
    data: {
      namaSekolah: "SMA Terpadu Surabaya",
      alamat: "Jl. Ngagel Jaya Tengah, Surabaya",
    },
  });

  const sekolah2 = await prisma.sekolah.create({
    data: {
      namaSekolah: "SMA Arunika Jakarta",
      alamat: "Jl. Sudirman No. 12, Jakarta",
    },
  });

  // 2. Buat Superadmin
  await prisma.user.create({
    data: {
      name: "Arunika Superadmin",
      email: "superadmin@arunika.com",
      password: "123",
      role: Role.SUPERADMIN,
      sekolahId: null, // Superadmin tidak terikat sekolah
    },
  });

  // 3. Buat Admin Sekolah
  await prisma.user.create({
    data: {
      name: "Admin Surabaya",
      email: "admin1@sekolah.com",
      password: "123",
      role: Role.ADMIN,
      sekolahId: sekolah1.id,
    },
  });

  await prisma.user.create({
    data: {
      name: "Admin Jakarta",
      email: "admin2@sekolah.com",
      password: "123",
      role: Role.ADMIN,
      sekolahId: sekolah2.id,
    },
  });

  // 4. Buat Guru
  const guru1 = await prisma.user.create({
    data: {
      name: "Guru Biologi Surabaya",
      email: "guru1@sekolah.com",
      password: "123",
      role: Role.GURU,
      sekolahId: sekolah1.id,
    },
  });

  const guru2 = await prisma.user.create({
    data: {
      name: "Guru Fisika Jakarta",
      email: "guru2@sekolah.com",
      password: "123",
      role: Role.GURU,
      sekolahId: sekolah2.id,
    },
  });

  // 5. Buat Kelas
  const kelasSurabaya = await prisma.kelas.create({
    data: {
      namaKelas: "X - Biologi Unggulan",
      sekolahId: sekolah1.id,
      teacherId: guru1.id,
    },
  });

  const kelasJakarta = await prisma.kelas.create({
    data: {
      namaKelas: "XI - Fisika Unggulan",
      sekolahId: sekolah2.id,
      teacherId: guru2.id,
    },
  });

  // 6. Buat Siswa
  const siswa1 = await prisma.user.create({
    data: {
      name: "Budi Santoso",
      email: "siswa1@sekolah.com",
      password: "123",
      role: Role.SISWA,
      sekolahId: sekolah1.id,
    },
  });

  const siswa2 = await prisma.user.create({
    data: {
      name: "Ani Wijaya",
      email: "siswa2@sekolah.com",
      password: "123",
      role: Role.SISWA,
      sekolahId: sekolah2.id,
    },
  });

  // Gabungkan ke kelas
  await prisma.kelasMember.createMany({
    data: [
      { kelasId: kelasSurabaya.id, userId: siswa1.id },
      { kelasId: kelasJakarta.id, userId: siswa2.id },
    ],
  });

  // 7. Buat Buku & Bab
  const buku1 = await prisma.buku.create({
    data: {
      judul: "Biologi Sel Modern",
      guruId: guru1.id,
    },
  });

  const buku2 = await prisma.buku.create({
    data: {
      judul: "Fisika Quantum Dasar",
      guruId: guru2.id,
    },
  });

  const bab1 = await prisma.bab.create({
    data: {
      judulBab: "Bab 1: Struktur Organel Sel",
      bukuId: buku1.id,
      learningGoals: "Mengidentifikasi organel sel hewan dan tumbuhan beserta fungsinya.",
    },
  });

  const bab2 = await prisma.bab.create({
    data: {
      judulBab: "Bab 1: Pengenalan Dualisme Gelombang Partikel",
      bukuId: buku2.id,
      learningGoals: "Memahami fenomena fotolistrik dan dualisme gelombang.",
    },
  });

  // Soal Biologi
  await prisma.bankSoal.createMany({
    data: [
      {
        babId: bab1.id,
        teksSoal: "Organel sel yang berperan sebagai pusat pengendali seluruh kegiatan sel adalah...",
        type: TipeSoal.MCQ,
        opsiJawaban: ["Nukleus", "Mitokondria", "Ribosom", "Lisosom"],
        jawabanBenarMcq: "Nukleus",
        difficulty: 3,
        bloomLevel: "C1",
      },
      {
        babId: bab1.id,
        teksSoal: "Jelaskan perbedaan mendasar fungsi membran sel dan dinding sel pada tumbuhan!",
        type: TipeSoal.ESSAY,
        difficulty: 6,
        bloomLevel: "C3",
      },
    ],
  });

  // Soal Fisika
  await prisma.bankSoal.createMany({
    data: [
      {
        babId: bab2.id,
        teksSoal: "Partikel cahaya yang memiliki energi kuantum disebut...",
        type: TipeSoal.MCQ,
        opsiJawaban: ["Foton", "Electron", "Proton", "Neutron"],
        jawabanBenarMcq: "Foton",
        difficulty: 4,
        bloomLevel: "C2",
      },
      {
        babId: bab2.id,
        teksSoal: "Tuliskan persamaan energi Planck dan jelaskan makna masing-masing variabelnya!",
        type: TipeSoal.ESSAY,
        difficulty: 7,
        bloomLevel: "C3",
      },
    ],
  });

  // 8. Buat Generation Job dengan log Token Spent (Buku 1 / Sekolah 1)
  await prisma.generationJob.create({
    data: {
      status: JobStatus.DONE,
      fileName: "biologi_sel.pdf",
      fileUrl: "/tmp/biologi_sel.pdf",
      jumlahSoal: 10,
      tokensSpent: 8500, // Token terpakai
      bukuId: buku1.id,
    },
  });

  // Generation Job untuk Buku 2 / Sekolah 2
  await prisma.generationJob.create({
    data: {
      status: JobStatus.DONE,
      fileName: "fisika_quantum.pdf",
      fileUrl: "/tmp/fisika_quantum.pdf",
      jumlahSoal: 15,
      tokensSpent: 12400, // Token terpakai
      bukuId: buku2.id,
    },
  });

  // 9. Buat Task Queue dengan log Token Spent (Laporan Ujian)
  await prisma.taskQueue.create({
    data: {
      type: "generate_report",
      status: "completed",
      payload: { attemptId: 1 },
      provider: "groq",
      tokensSpent: 1200,
    },
  });

  await prisma.taskQueue.create({
    data: {
      type: "generate_report",
      status: "completed",
      payload: { attemptId: 2 },
      provider: "gemini",
      tokensSpent: 2100,
    },
  });

  // 10. Seed Tipe Ujian, Ujian Templates & Criteria
  const tipeUTS = await prisma.tipeUjian.create({
    data: {
      namaTipeUjian: "UTS",
    },
  });

  const tipeUAS = await prisma.tipeUjian.create({
    data: {
      namaTipeUjian: "UAS",
    },
  });

  const ujian1 = await prisma.ujian.create({
    data: {
      judulUjian: "Ujian Akhir Biologi Sel",
      durasiMenit: 60,
      jumlahSoal: 40,
      isAdaptive: true,
      isLocked: false,
      guruId: guru1.id,
      criteria: {
        create: {
          reqC1: 10,
          reqC2: 10,
          reqC3: 10,
          reqC4: 10,
        },
      },
    },
  });

  // Hubungkan ke bab
  await prisma.ujianBab.create({
    data: {
      ujianId: ujian1.id,
      babId: bab1.id,
    },
  });

  // 11. Buat Jadwal Ujian
  // Ongoing Ujian (Bisa diakses siswa)
  await prisma.jadwalUjian.create({
    data: {
      ujianId: ujian1.id,
      kelasId: kelasSurabaya.id,
      tipeUjianId: tipeUTS.id,
      status: StatusUjian.ONGOING,
      waktuMulaiAktif: new Date(),
      waktuSelesaiAktif: new Date(Date.now() + 2 * 3600 * 1000), // 2 jam ke depan
    },
  });

  // Scheduled Ujian (Belum dimulai, tidak bisa diakses siswa)
  await prisma.jadwalUjian.create({
    data: {
      ujianId: ujian1.id,
      kelasId: kelasSurabaya.id,
      tipeUjianId: tipeUAS.id,
      status: StatusUjian.SCHEDULED,
      waktuMulaiAktif: new Date(Date.now() + 24 * 3600 * 1000), // besok
      waktuSelesaiAktif: new Date(Date.now() + 26 * 3600 * 1000),
    },
  });

  console.log("Seeding data selesai dengan sukses! User default:");
  console.log("Superadmin: superadmin@arunika.com / 123");
  console.log("Admin Sekolah 1: admin1@sekolah.com / 123");
  console.log("Guru Sekolah 1: guru1@sekolah.com / 123");
}

main()
  .catch((e) => {
    console.error("Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
