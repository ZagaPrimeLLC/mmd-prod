/**
 * Every photograph on the public site, with the shapes it exists in.
 *
 * Portrait and square crops accompany wide scenes. `ArtImage` selects the
 * wide source for larger screens; group photographs retain the whole frame.
 *
 * These are AI-generated illustrations of the work, with the agency's shield
 * on every caregiver's polo. Replace with real photography when available.
 */
export type Photo = {
  src: string;
  width: number;
  height: number;
  /** 16:9 version with the scene extended sideways. */
  wide?: string;
  /** 21:9 version for the widest screens. */
  ultra?: string;
  alt: string;
};

export const PHOTOS = {
  kitchen: {
    src: '/img/refresh/kitchen-v2.webp', width: 752, height: 940, wide: '/img/refresh/kitchen-wide-v2.webp',
    alt: 'An MMD support professional cooking breakfast with a young man with Down syndrome in his kitchen',
  },
  walk: {
    src: '/img/refresh/walk-v2.webp', width: 752, height: 940, wide: '/img/refresh/walk-wide-v2.webp',
    alt: 'An MMD support professional walking beside a client using a rollator on a suburban New Jersey sidewalk',
  },
  boardgame: {
    src: '/img/refresh/boardgame-v2.webp', width: 752, height: 940, wide: '/img/refresh/boardgame-wide-v2.webp',
    alt: 'An MMD support professional playing a board game with a client at his dining table',
  },
  respite: {
    src: '/img/refresh/respite-v2.webp', width: 752, height: 940, wide: '/img/refresh/respite-wide-v2.webp',
    alt: 'An MMD support professional looking through a photo album with a young woman who uses a wheelchair',
  },
  library: {
    src: '/img/refresh/library-v2.webp', width: 752, height: 940, wide: '/img/refresh/library-wide-v2.webp',
    alt: 'An MMD support professional and a client checking out books at a public library',
  },
  office: {
    src: '/img/refresh/office-v2.webp', width: 752, height: 940, wide: '/img/refresh/office-wide-v2.webp',
    alt: 'An MMD coordinator on a headset taking a call from a family at the South Plainfield office',
  },
  hands: {
    src: '/img/refresh/hands-v2.webp', width: 940, height: 940, wide: '/img/refresh/hands-wide-v2.webp',
    alt: 'An MMD support professional helping a client fill a weekly pill organiser at the kitchen table',
  },
  garden: {
    src: '/img/refresh/garden-v2.webp', width: 940, height: 940, wide: '/img/refresh/garden-wide-v2.webp',
    alt: 'A client watering tomato plants in a community garden with an MMD support professional',
  },
  bus: {
    src: '/img/refresh/bus-v2.webp', width: 752, height: 940, wide: '/img/refresh/bus-wide-v2.webp',
    alt: 'An MMD support professional and a client checking the bus times on her phone at a bus stop',
  },
  grocery: {
    src: '/img/refresh/grocery-v2.webp', width: 752, height: 940, wide: '/img/refresh/grocery-wide-v2.webp',
    alt: 'A client choosing apples at the grocery store while an MMD support professional holds the list',
  },
  art: {
    src: '/img/refresh/art-v2.webp', width: 1672, height: 941,
    alt: 'A client painting at a community art class with an MMD support professional beside him',
  },
  team: {
    src: '/img/refresh/team-v2.webp', width: 1672, height: 941,
    alt: 'MMD Direct Support Professionals together outside the office in their navy polos',
  },
  park: {
    src: '/img/refresh/park-v2.webp', width: 1672, height: 941,
    alt: 'An MMD support professional sharing a snack with a client on a park bench at golden hour',
  },
  'about-listening': {
    src: '/img/distinct/about-listening-v2.webp', width: 1672, height: 941,
    alt: "An MMD coordinator listening as an adult discusses her goals at a sunlit table",
  },
  'about-teamwork': {
    src: '/img/distinct/about-teamwork-v2.webp', width: 1672, height: 941,
    alt: "Two MMD colleagues preparing a schedule together at their planning table",
  },
  'careers-training': {
    src: '/img/distinct/careers-training-v2.webp', width: 1672, height: 941,
    alt: "An MMD instructor demonstrating CPR on a training mannequin with an adult trainee",
  },
  'careers-mentor': {
    src: '/img/distinct/careers-mentor-v2.webp', width: 1672, height: 941,
    alt: "An experienced MMD colleague welcoming a new team member during orientation",
  },
  'services-welcome': {
    src: '/img/distinct/services-welcome-v2.webp', width: 1672, height: 941,
    alt: "An MMD professional being welcomed at the door of a client’s home",
  },
  'community-cafe': {
    src: '/img/distinct/community-cafe-v2.webp', width: 1672, height: 941,
    alt: "A client ordering at a neighborhood café with an MMD professional beside her",
  },
  'individual-routine': {
    src: '/img/distinct/individual-routine-v2.webp', width: 1672, height: 941,
    alt: "A client choosing a shirt with support from an MMD professional at home",
  },
  'respite-jigsaw': {
    src: '/img/distinct/respite-jigsaw-v2.webp', width: 1672, height: 941,
    alt: "A client and an MMD professional enjoying a jigsaw puzzle together",
  },
  'mission-music': {
    src: '/img/distinct/mission-music-v2.webp', width: 1672, height: 941,
    alt: "An adult playing guitar while an MMD support professional listens",
  },
  'getting-started-plan': {
    src: '/img/distinct/getting-started-plan-v2.webp', width: 1672, height: 941,
    alt: "A client, a family member and an MMD coordinator planning a weekly routine",
  },
  'feedback-conversation': {
    src: '/img/distinct/feedback-conversation-v2.webp', width: 1672, height: 941,
    alt: "An adult using a power wheelchair sharing her thoughts with an MMD professional",
  },
  'home-care-companionship': {
    src: '/img/distinct/home-care-companionship-v2.webp', width: 1672, height: 941,
    alt: "An older woman and an MMD home health aide enjoying a conversation and music at home",
  },
  'home-care-porch': {
    src: '/img/distinct/home-care-porch-v2.webp', width: 1672, height: 941,
    alt: "An MMD home health aide and an older woman sharing tea on a sunlit porch",
  },
  'home-care-routine': {
    src: '/img/distinct/home-care-routine-v2.webp', width: 1672, height: 941,
    alt: "An older woman and an MMD home health aide folding fresh towels together",
  },
} satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof PHOTOS;
