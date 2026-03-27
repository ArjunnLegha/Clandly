import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BookingFlow } from "@/components/booking/booking-flow";

type Props = { params: { slug: string } };

export default async function BookPage({ params }: Props) {
  const event = await prisma.eventType.findUnique({
    where: { slug: params.slug },
    include: { user: { select: { name: true, timezone: true } } },
  });

  if (!event) {
    notFound();
  }

  return (
    <BookingFlow
      event={{
        id: event.id,
        title: event.title,
        description: event.description,
        duration: event.duration,
        bufferBefore: event.bufferBefore,
        bufferAfter: event.bufferAfter,
        slug: event.slug,
        hostName: event.user.name,
        timezone: event.user.timezone,
      }}
    />
  );
}
