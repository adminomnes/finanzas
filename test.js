const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/omnes_finance' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const user = await prisma.user.create({
      data: {
        email: 'test' + Date.now() + '@test.com',
        passwordHash: 'test',
        firstName: 'test',
        lastName: 'test',
        role: 'OPERATOR',
        mustChangePwd: true
      }
    });
    console.log("Success:", user);
  } catch (e) {
    console.error("Error creating user:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
