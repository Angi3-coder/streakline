const DAY = 86400000;
const toDay = (s) => Date.parse(s + 'T00:00:00Z') / DAY;

// dates: array of 'YYYY-MM-DD'; today: 'YYYY-MM-DD'
export function computeStreaks(dates, today) {
  const days = [...new Set(dates.map(toDay))].sort((a, b) => a - b);
  let best = 0, run = 0;
  days.forEach((d, i) => {
    run = i > 0 && d - days[i - 1] === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  // current streak: consecutive days ending today (or yesterday, so it isn't lost until the day ends)
  const set = new Set(days);
  let cursor = toDay(today);
  if (!set.has(cursor)) cursor -= 1;
  let current = 0;
  while (set.has(cursor)) { current++; cursor--; }
  return { current, best };
}
