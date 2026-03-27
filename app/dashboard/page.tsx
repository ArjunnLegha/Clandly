import { EventTypesClient } from "@/components/dashboard/event-types-client";

export default function DashboardPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Event types</h1>
        <p className="text-slate-600 mt-1">Create links guests use to book time with you.</p>
      </div>
      <EventTypesClient />
    </div>
  );
}
