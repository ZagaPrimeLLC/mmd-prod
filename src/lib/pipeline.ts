export const STAGES = [
  { key: 'new',              label: 'New',              hint: 'straight from CareerPlug' },
  { key: 'screening',        label: 'Screening',        hint: 'qualification call' },
  { key: 'ready',            label: 'Ready',            hint: 'qualified and available' },
  { key: 'with_coordinator', label: 'With Coordinator', hint: 'handed off' },
  { key: 'appointment_set',  label: 'Appointment Set',  hint: 'Tue / Thu, 11–4' },
  { key: 'completed',        label: 'Completed',        hint: 'applied in person' },
  { key: 'archived',         label: 'Archived',         hint: 'not qualified / unresponsive' },
] as const;

export type StageKey = (typeof STAGES)[number]['key'];

export const ROLES = ['admin', 'hr', 'supervisor', 'case_manager', 'coordinator'] as const;
export type Role = (typeof ROLES)[number];

export const STALE_HOURS = 48;

export function isStale(lastContactAt: string | null, createdAt: string): boolean {
  const since = new Date(lastContactAt ?? createdAt).getTime();
  return Date.now() - since > STALE_HOURS * 3600 * 1000;
}
