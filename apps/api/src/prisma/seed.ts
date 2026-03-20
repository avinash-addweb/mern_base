import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("admin123", 12);
  const userPassword = await bcrypt.hash("user123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@base-mern.dev" },
    update: {},
    create: {
      email: "admin@base-mern.dev",
      name: "Admin User",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log(`Admin user: ${admin.email} (${admin.id})`);

  const sampleUsers = [
    { email: "alice@example.com", name: "Alice Johnson" },
    { email: "bob@example.com", name: "Bob Smith" },
    { email: "carol@example.com", name: "Carol Williams" },
    { email: "david@example.com", name: "David Brown" },
    { email: "eve@example.com", name: "Eve Davis" },
  ];

  for (const userData of sampleUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        password: userPassword,
        role: "USER",
      },
    });
    console.log(`Sample user: ${user.email} (${user.id})`);
  }

  console.log("Seeding completed.");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
