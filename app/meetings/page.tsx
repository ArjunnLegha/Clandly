import { MeetingsClient } from "@/components/meetings/meetings-client";

export default function MeetingsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Meetings</h1>
        <p className="text-slate-600 mt-1">Upcoming bookings and history.</p>
      </div>
      <MeetingsClient />
    </div>
  );
}
