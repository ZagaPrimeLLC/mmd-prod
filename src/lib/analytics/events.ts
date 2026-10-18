/**
 * The measurement contract for the public site: which events exist, which
 * properties each may carry, and the one rule for each. The tracker, the
 * ingest function (proj_mmd.ingest_web_events) and the CRM reports all follow
 * this list. Counts are of received, validated, deduplicated events, not of
 * all human activity.
 */
export const EVENT_VERSION = 1;

export const EVENTS = [
  'page_view',          // once per route view, including client-side navigation; a reload is a new view
  'section_impression', // a registered slot ≥50% visible for one continuous second while the tab is visible; once per slot per view
  'cta_impression',     // same rule, for a registered call to action (data-cta); once per placement per view
  'cta_click',          // a registered call to action activated; stable ids, never the button text
  'contact_action',     // a tel:, mailto: or WhatsApp link activated; not proof a call or message happened
  'form_start',         // first interaction with a form on this view
  'form_error',         // a submit that failed, by allowlisted category only
  'scroll_depth',       // 25, 50, 75, 100, once each per view
  'engaged_time',       // active seconds (tab visible, input within 15s), sent once when the view ends, capped
  'video_progress',     // 25, 50, 75, 100 of a muted loop, once each per view
  'outbound_click',     // a link to another host; host only
  'download_click',     // a link to a document; file name only
] as const;
export type EventName = (typeof EVENTS)[number];

/** Allowed property keys per event; the database drops anything else. */
export const EVENT_PROPS: Record<EventName, readonly string[]> = {
  page_view: ['title'],
  section_impression: ['slot'],
  cta_impression: ['cta_id', 'placement_id'],
  cta_click: ['cta_id', 'placement_id', 'href'],
  contact_action: ['kind'],
  form_start: ['form'],
  form_error: ['form', 'category'],
  scroll_depth: ['depth'],
  engaged_time: ['seconds'],
  video_progress: ['video', 'pct'],
  outbound_click: ['host'],
  download_click: ['file'],
};

/** The hosts the booking and lead forms may save as a referrer: none. Saved leads carry only the session id. */
export const SESSION_IDLE_MINUTES = 30;
