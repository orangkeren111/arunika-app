import {
  PrismaClient,
  Role,
} from "@prisma/client";

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

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

  // 2. Buat Superadmin
  const hashedPassword = await bcrypt.hash("123", 10);

  await prisma.user.create({
    data: {
      name: "Arunika Superadmin",
      email: "superadmin@arunika.com",
      password: hashedPassword,
      role: Role.SUPERADMIN,
      sekolahId: null, // Superadmin tidak terikat sekolah
    },
  });

  console.log("Seeding data selesai dengan sukses! User default:");
  console.log("Superadmin: superadmin@arunika.com / 123");
}

main()
  .catch((e) => {
    console.error("Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
