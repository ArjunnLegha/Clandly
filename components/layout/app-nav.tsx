import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";

const links = [
  { href: "/dashboard", label: "Event types" },
  { href: "/availability", label: "Availability" },
  { href: "/meetings", label: "Meetings" },
];
export function AppNav() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <Image
            src="/logo.png"
            alt="Clandly"
            width={55}
            height={55}
            className="rounded-sm"
          />
          Clandly
        </Link>
        <nav className="flex items-center gap-1 sm:gap-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "text-sm text-slate-600 hover:text-slate-900 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
