import { AvailabilityClient } from "@/components/availability/availability-client";

export default function AvailabilityPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Availability</h1>
        <p className="text-slate-600 mt-1">Choose which days you are available and your working hours.</p>
      </div>
      <AvailabilityClient />
    </div>
  );
}
