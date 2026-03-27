import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.booking.deleteMany();
  await prisma.eventType.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      name: "Alex Morgan",
      email: "alex@example.com",
      timezone: "America/New_York",
    },
  });

  await prisma.eventType.createMany({
    data: [
      {
        title: "30 Minute Meeting",
        duration: 30,
        slug: "30min-intro",
        userId: user.id,
      },
      {
        title: "60 Minute Deep Dive",
        duration: 60,
        slug: "60min-deep-dive",
        userId: user.id,
      },
    ],
  });

  await prisma.availability.createMany({
    data: [
      { userId: user.id, dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
      { userId: user.id, dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
      { userId: user.id, dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
      { userId: user.id, dayOfWeek: 4, startTime: "09:00", endTime: "17:00" },
      { userId: user.id, dayOfWeek: 5, startTime: "09:00", endTime: "17:00" },
    ],
  });

  console.log("Seed complete. User id:", user.id);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
