import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-24 text-center">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Scheduling, simplified</h1>
      <p className="mt-4 text-lg text-slate-600">
        Create event types, share your link, and let guests book time without double booking.
      </p>
      <div className="mt-10 flex flex-wrap gap-4 justify-center">
        <Button asChild size="lg">
          <Link href="/dashboard">Open dashboard</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/book/30min-intro">View sample booking page</Link>
        </Button>
      </div>
    </div>
  );
}
