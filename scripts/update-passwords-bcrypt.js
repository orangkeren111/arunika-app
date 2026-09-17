require("dotenv").config();
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Fetching all users from database...");
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users.`);

  let updatedCount = 0;

  for (const user of users) {
    // Check if password is already hashed with bcrypt (starts with $2a$, $2b$, or $2y$)
    const isAlreadyHashed = /^\$2[aby]\$/.test(user.password);

    if (!isAlreadyHashed) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      console.log(`Updated password for user ID ${user.id} (${user.email})`);
      updatedCount++;
    } else {
      console.log(`User ID ${user.id} (${user.email}) already has hashed password. Skipping.`);
    }
  }

  console.log(`Done! ${updatedCount} users updated.`);
}

main()
  .catch((e) => {
    console.error("Error updating passwords:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
