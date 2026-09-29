// Consultations are held during the office walk-in window: Tuesdays and
// Thursdays, 11am to 4pm. Slots are generated from that rule so the form can
// never offer a time the office does not actually staff.
export const SLOT_MINUTES = 45;
export const CONSULT_DAYS = [2, 4]; // Tue, Thu
export const CONSULT_START_HOUR = 11;
export const CONSULT_END_HOUR = 16;
export const WEEKS_AHEAD = 3;
export const MIN_NOTICE_HOURS = 24;

export type Slot = { iso: string; dayLabel: string; timeLabel: string };

export function availableSlots(from: Date = new Date()): Slot[] {
  const out: Slot[] = [];
  const earliest = new Date(from.getTime() + MIN_NOTICE_HOURS * 3600_000);
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);

  for (let d = 0; d < WEEKS_AHEAD * 7; d++) {
    const day = new Date(cursor);
    day.setDate(cursor.getDate() + d);
    if (!CONSULT_DAYS.includes(day.getDay())) continue;

    for (let h = CONSULT_START_HOUR; h < CONSULT_END_HOUR; h++) {
      for (const m of [0, SLOT_MINUTES % 60 === 0 ? 30 : 45]) {
        if (m >= 60) continue;
        const slot = new Date(day);
        slot.setHours(h, m, 0, 0);
        if (slot < earliest) continue;
        out.push({
          iso: slot.toISOString(),
          dayLabel: slot.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
          timeLabel: slot.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        });
      }
    }
  }
  return out;
}

export function groupByDay(slots: Slot[]): { day: string; slots: Slot[] }[] {
  const map = new Map<string, Slot[]>();
  for (const s of slots) {
    const list = map.get(s.dayLabel) ?? [];
    list.push(s);
    map.set(s.dayLabel, list);
  }
  return [...map.entries()].map(([day, slots]) => ({ day, slots }));
}
