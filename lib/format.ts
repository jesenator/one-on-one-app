/**
 * Format a slot Date (stored as UTC but representing wall-clock retreat time)
 * for display.
 */
export function formatSlotTime(d: Date): string {
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${m.toString().padStart(2, "0")}${ampm}`;
}

export function formatSlotDay(d: Date): string {
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
    d.getUTCDay()
  ];
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return `${weekday} ${month}/${day}`;
}
