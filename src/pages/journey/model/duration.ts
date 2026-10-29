export const durationParts = (minutes: number): [number, string][] => {
  const hours = Math.floor(minutes / 60),
    rest = minutes % 60;
  if (!hours) return [[rest, "분"]];
  return rest
    ? [
        [hours, "시간"],
        [rest, "분"],
      ]
    : [[hours, "시간"]];
};
