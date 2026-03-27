import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BookNotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Event not found</h1>
      <p className="mt-2 text-slate-600">This scheduling link may be invalid or expired.</p>
      <Button asChild className="mt-6">
        <Link href="/">Go home</Link>
      </Button>
    </div>
  );
}
