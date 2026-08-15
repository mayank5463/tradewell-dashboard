
const MARKET_OPEN_MIN = 9 * 60 + 15; // 09:15
const MARKET_CLOSE_MIN = 15 * 60 + 30; // 15:30

// Re-render a Date as its IST wall-clock reading, regardless of the
// browser's own timezone — so this behaves the same for a trader in
// Mumbai and one in London testing the app.
function toIST(date) {
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}

export function isWeekend(date = new Date()) {
  const day = toIST(date).getDay(); // 0 = Sun, 6 = Sat
  return day === 0 || day === 6;
}

export function minutesSinceMidnightIST(date = new Date()) {
  const ist = toIST(date);
  return ist.getHours() * 60 + ist.getMinutes();
}

// True only during an actual live session: weekday AND within
// 09:15–15:30. This is the single source of truth for "should ANY range
// tab be polling right now" — RangeSelector.jsx flags which tabs are
// live-eligible (1D/1W/1M/3M/6M/1Y), this function gates whether that
// eligibility is actually allowed to fire at this exact moment.
export function isMarketOpenNow(date = new Date()) {
  if (isWeekend(date)) return false;
  const mins = minutesSinceMidnightIST(date);
  return mins >= MARKET_OPEN_MIN && mins < MARKET_CLOSE_MIN;
}

function toDateStr(date) {
  const ist = toIST(date);
  const y = ist.getFullYear();
  const m = String(ist.getMonth() + 1).padStart(2, "0");
  const d = String(ist.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Steps back a day at a time until landing on Mon–Fri. Weekend-only —
// see the module-level note above re: holidays.
function previousWeekday(date) {
  const d = toIST(date);
  do {
    d.setDate(d.getDate() - 1);
  } while (d.getDay() === 0 || d.getDay() === 6);
  return d;
}

// The single decision point for what the "1D" tab should show right now.
//
//   weekday, 09:15–15:30  -> { isToday: true,  live: true  }  today, polling
//   weekday, after 15:30  -> { isToday: true,  live: false }  today, static (session over)
//   weekday, before 09:15 -> { isToday: false, live: false }  previous trading day, static
//   weekend                -> { isToday: false, live: false }  most recent Friday, static
//
// `dateStr` is always the day whose candles should actually be requested
// — for the "today" cases that's just today's date (used only for
// display/comparison; the intraday endpoint itself takes no date), for
// the "previous day" cases it's the from=to= date to send the regular
// historical endpoint.
export function getOneDayPlan(now = new Date()) {
  if (isWeekend(now)) {
    return { dateStr: toDateStr(previousWeekday(now)), isToday: false, live: false };
  }

  const mins = minutesSinceMidnightIST(now);

  if (mins < MARKET_OPEN_MIN) {
    return { dateStr: toDateStr(previousWeekday(now)), isToday: false, live: false };
  }

  if (mins < MARKET_CLOSE_MIN) {
    return { dateStr: toDateStr(now), isToday: true, live: true };
  }

  // Weekday, after close — same day, just not live anymore.
  return { dateStr: toDateStr(now), isToday: true, live: false };
}