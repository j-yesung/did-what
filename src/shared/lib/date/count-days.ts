const DAY = 86_400_000;

const toUtc = (date: string) => Date.parse(`${date}T00:00:00Z`);

export const countDaysSince = (from: string, today: string) => {
  return Math.round((toUtc(today) - toUtc(from)) / DAY) + 1;
};
