import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const email = process.argv[2];

if (!email) {
  console.error("Usage: npx tsx scripts/grant-pro.ts <email>");
  process.exit(1);
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error(`No user found with email: ${email}`);
      process.exit(1);
    }

    if (user.isPro) {
      console.log(`${email} already has Pro.`);
      process.exit(0);
    }

    await prisma.user.update({
      where: { email },
      data: { isPro: true },
    });

    console.log(`✓ Granted Pro to ${email}`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
