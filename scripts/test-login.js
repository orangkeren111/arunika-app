require("dotenv").config();
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function test() {
  const user = await prisma.user.findFirst({
    where: { email: "superadmin@arunika.com" }
  });
  console.log("User found:", user.email);
  const isMatch = await bcrypt.compare("123", user.password);
  console.log("Password match result for '123':", isMatch);
}

test()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
