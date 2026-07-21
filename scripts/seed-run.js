const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL || "superadmin@omnesholding.cl";
  const password = process.env.SUPER_ADMIN_PASSWORD || "OmnesAdmin2024!";
  const firstName = process.env.SUPER_ADMIN_FIRST_NAME || "Super";
  const lastName = process.env.SUPER_ADMIN_LAST_NAME || "Admin";

  const existing = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (existing) {
    console.log("El superadmin ya existe en la DB.");
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  
  await prisma.user.create({
    data: {
      email,
      passwordHash: hash,
      firstName,
      lastName,
      role: 'SUPER_ADMIN',
      mustChangePwd: true
    }
  });
  console.log("Superadmin creado exitosamente.");
}

main().catch(console.error).finally(() => { prisma.$disconnect(); pool.end(); });
