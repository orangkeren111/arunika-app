import {
  Bab,
  BankSoal,
  Prisma,
  PrismaClient,
  Role,
  TipeSoal,
} from "@prisma/client";

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// 1. Setup Driver Adapter untuk Prisma v7
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// 2. Masukkan adapter ke dalam PrismaClient
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Menghapus data lama...");
  // Opsional: Bersihkan database sebelum seeding agar tidak duplicate key
  await prisma.ujian.deleteMany();
  await prisma.bankSoal.deleteMany();
  await prisma.bab.deleteMany();
  await prisma.buku.deleteMany();
  await prisma.kelasMember.deleteMany();
  await prisma.kelas.deleteMany();
  await prisma.user.deleteMany();
  await prisma.sekolah.deleteMany();

  console.log("Mulai proses seeding...");

  // 1. Buat 1 Sekolah
  const sekolah = await prisma.sekolah.create({
    data: {
      namaSekolah: "SMA Terpadu Surabaya",
      alamat: "Jl. Ngagel Jaya Tengah, Surabaya",
    },
  });

  // 2. Buat 1 Admin
  await prisma.user.create({
    data: {
      name: "Admin Utama",
      email: "admin@sekolah.com",
      password: "hashed_password_123", // Di production gunakan bcrypt
      role: Role.ADMIN,
      sekolahId: sekolah.id,
    },
  });

  // 3. Buat 3 Guru
  const gurus = await Promise.all([
    prisma.user.create({
      data: {
        name: "Guru Pemrograman Perangkat Bergerak",
        email: "guru.mobile@sekolah.com",
        password: "123",
        role: Role.GURU,
        sekolahId: sekolah.id,
      },
    }),
    prisma.user.create({
      data: {
        name: "Guru Basis Data Dasar",
        email: "guru.db@sekolah.com",
        password: "123",
        role: Role.GURU,
        sekolahId: sekolah.id,
      },
    }),
    prisma.user.create({
      data: {
        name: "Guru Rekayasa Perangkat Lunak",
        email: "guru.rpl@sekolah.com",
        password: "123",
        role: Role.GURU,
        sekolahId: sekolah.id,
      },
    }),
  ]);

  // 4. Buat 5 Kelas beserta 10 Siswa per Kelas
  const namaKelas = ["XI-SIB 1", "XI-SIB 2", "XII-SIB 1", "XII-SIB 2", "X-RPL"];
  const semuaSiswaIds: number[] = [];

  for (let i = 0; i < namaKelas.length; i++) {
    // Pilih guru secara acak atau bergantian dari array gurus
    const guruWali = gurus[i % gurus.length];

    const kelas = await prisma.kelas.create({
      data: {
        namaKelas: namaKelas[i],
        sekolahId: sekolah.id,
        teacherId: guruWali.id, // Menambahkan teacherId ke pembuatan kelas
      },
    });

    for (let j = 1; j <= 10; j++) {
      const siswa = await prisma.user.create({
        data: {
          name: `Siswa ${j} - ${namaKelas[i]}`,
          email: `siswa.${i + 1}.${j}@sekolah.com`,
          password: "123",
          role: Role.SISWA,
          sekolahId: sekolah.id,
        },
      });
      semuaSiswaIds.push(siswa.id);

      // Masukkan siswa ke dalam kelas (Relasi KelasMember)
      await prisma.kelasMember.create({
        data: {
          kelasId: kelas.id,
          userId: siswa.id,
        },
      });
    }
  }

  // 5. Buat 2 Buku, 5 Bab per Buku, dan 10 Soal per Bab
  const dataBuku = [
    { judul: "Modul Kotlin & Android Studio", guruId: gurus[0].id },
    { judul: "Desain Database Relasional", guruId: gurus[1].id },
  ];

  const semuaBab: Bab[] = [];

  const bloomLevels = ["C1", "C2", "C3", "C4"];

  for (const infoBuku of dataBuku) {
    const buku = await prisma.buku.create({
      data: infoBuku,
    });

    for (let babKe = 1; babKe <= 5; babKe++) {
      const bab = await prisma.bab.create({
        data: {
          judulBab: `Bab ${babKe}: Pembahasan Materi ${babKe}`,
          bukuId: buku.id,
        },
      });

      semuaBab.push(bab);

      for (let soalKe = 1; soalKe <= 10; soalKe++) {
        const isMcq = soalKe <= 8;

        await prisma.bankSoal.create({
          data: {
            teksSoal: isMcq
              ? `Pertanyaan pilihan ganda ke-${soalKe} untuk ${bab.judulBab}.`
              : `Jelaskan studi kasus essay ke-${soalKe} pada ${bab.judulBab}.`,

            type: isMcq ? TipeSoal.MCQ : TipeSoal.ESSAY,

            opsiJawaban: isMcq
              ? ["Opsi A", "Opsi B", "Opsi C", "Opsi D"]
              : undefined,

            jawabanBenarMcq: isMcq ? "Opsi A" : null,

            babId: bab.id,

            difficulty: Number(Math.random().toFixed(2)),

            bloomLevel:
              bloomLevels[Math.floor(Math.random() * bloomLevels.length)],
          },
        });
      }
    }
  }

  const uts = await prisma.ujian.create({
    data: {
      judulUjian: "Ujian Tengah Semester - Pemrograman Mobile",
      durasiMenit: 90,
      jumlahSoal: 25,
      guruId: gurus[0].id,
      isLocked: false,
      isAdaptive: true,
    },
  });

  await prisma.ujianBab.createMany({
    data: [
      {
        ujianId: uts.id,
        babId: semuaBab[0].id,
      },
      {
        ujianId: uts.id,
        babId: semuaBab[1].id,
      },
    ],
  });

  console.log("Seeding berhasil! Dummy data telah ditambahkan.");
}

main()
  .catch((e) => {
    console.error("Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
