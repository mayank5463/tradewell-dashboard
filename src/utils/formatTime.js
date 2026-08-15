import dayjs from "dayjs";

// Device-local time on purpose, not server time - the greeting should match whatever
// the user's own clock says, same as every trading app does.
export function getTimeOfDay(date = new Date()) {
  const hour = dayjs(date).hour();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function getGreetingLabel(date = new Date()) {
  const labels = {
    morning: "Good morning",
    afternoon: "Good afternoon",
    evening: "Good evening",
  };
  return labels[getTimeOfDay(date)];
}

export function formatOrderTimestamp(timestamp) {
  return dayjs(timestamp).format("DD MMM YYYY, hh:mm A");
}

export function formatShortTime(timestamp) {
  return dayjs(timestamp).format("hh:mm A");
}

// For the watchlist/marquee "last updated" label — shows seconds since
// quotes refresh on a 7s poll cycle, where minute-level precision alone
// (formatShortTime) wouldn't distinguish one tick from the next.
// Falls back to "—" for missing/invalid timestamps instead of printing
// "Invalid Date".
export function formatUpdatedAt(timestamp) {
  const parsed = dayjs(timestamp);
  if (!timestamp || !parsed.isValid()) return "—";
  return parsed.format("hh:mm:ss A");
}