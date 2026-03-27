const WEEKDAY_TO_ISO: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

function getParts(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = dtf.formatToParts(date);
  const map = new Map(parts.map((p) => [p.type, p.value]));
  return {
    year: Number(map.get("year")),
    month: Number(map.get("month")),
    day: Number(map.get("day")),
    hour: Number(map.get("hour")),
    minute: Number(map.get("minute")),
    second: Number(map.get("second")),
  };
}

function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const p = getParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - date.getTime();
}

export function toUTC(dateKey: string, timeHHmm: string, timeZone: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [hh, mm] = timeHHmm.split(":").map(Number);
  const guessMs = Date.UTC(y, m - 1, d, hh, mm, 0, 0);
  let utcMs = guessMs - timeZoneOffsetMs(new Date(guessMs), timeZone);
  utcMs = guessMs - timeZoneOffsetMs(new Date(utcMs), timeZone);
  return new Date(utcMs);
}

export function fromUTC(utc: Date, timeZone: string): { dateKey: string; time: string } {
  const p = getParts(utc, timeZone);
  return {
    dateKey: `${String(p.year).padStart(4, "0")}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`,
    time: `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`,
  };
}

export function isoWeekdayInTimezone(dateKey: string, timeZone: string): number {
  const date = toUTC(dateKey, "12:00", timeZone);
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);
  return WEEKDAY_TO_ISO[short] ?? 1;
}
