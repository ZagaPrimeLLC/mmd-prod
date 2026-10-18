/**
 * Every photograph on the public site, with the shapes it exists in.
 *
 * The originals are portrait or square. For wide slots (full-width heroes and
 * bands) each has a 16:9 and a 21:9 version with the scene extended to the
 * sides, so a slot can always show the whole picture instead of cropping
 * heads off. `ArtImage` picks the version that fits the viewport.
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
    src: '/img/kitchen.jpg', width: 1440, height: 1800, wide: '/img/kitchen-16x9.jpg', ultra: '/img/kitchen-21x9.jpg',
    alt: 'An MMD support professional cooking breakfast with a young man with Down syndrome in his kitchen',
  },
  walk: {
    src: '/img/walk.jpg', width: 1440, height: 1800, wide: '/img/walk-16x9.jpg', ultra: '/img/walk-21x9.jpg',
    alt: 'An MMD support professional walking beside a client using a rollator on a suburban New Jersey sidewalk',
  },
  boardgame: {
    src: '/img/boardgame.jpg', width: 1440, height: 1800, wide: '/img/boardgame-16x9.jpg', ultra: '/img/boardgame-21x9.jpg',
    alt: 'An MMD support professional playing a board game with a client at his dining table',
  },
  respite: {
    src: '/img/respite.jpg', width: 1440, height: 1800, wide: '/img/respite-16x9.jpg', ultra: '/img/respite-21x9.jpg',
    alt: 'An MMD support professional looking through a photo album with a young woman who uses a wheelchair',
  },
  library: {
    src: '/img/library.jpg', width: 1440, height: 1800,
    alt: 'An MMD support professional and a client checking out books at a public library',
  },
  office: {
    src: '/img/office.jpg', width: 1344, height: 1800, wide: '/img/office-16x9.jpg', ultra: '/img/office-21x9.jpg',
    alt: 'An MMD coordinator on a headset taking a call from a family at the South Plainfield office',
  },
  hands: {
    src: '/img/hands.jpg', width: 1800, height: 1800, wide: '/img/hands-16x9.jpg', ultra: '/img/hands-21x9.jpg',
    alt: 'An MMD support professional helping a client fill a weekly pill organiser at the kitchen table',
  },
  garden: {
    src: '/img/garden.jpg', width: 900, height: 900, wide: '/img/garden-16x9.jpg', ultra: '/img/garden-21x9.jpg',
    alt: 'A client watering tomato plants in a community garden with an MMD support professional',
  },
  bus: {
    src: '/img/bus.jpg', width: 672, height: 900, wide: '/img/bus-16x9.jpg', ultra: '/img/bus-21x9.jpg',
    alt: 'An MMD support professional and a client checking the bus times on her phone at a bus stop',
  },
  grocery: {
    src: '/img/grocery.jpg', width: 672, height: 900, wide: '/img/grocery-16x9.jpg', ultra: '/img/grocery-21x9.jpg',
    alt: 'A client choosing apples at the grocery store while an MMD support professional holds the list',
  },
  art: {
    src: '/img/art.jpg', width: 900, height: 598,
    alt: 'A client painting at a community art class with an MMD support professional beside him',
  },
  team: {
    src: '/img/team.jpg', width: 1800, height: 1195, wide: '/img/team-21x9.jpg', ultra: '/img/team-21x9.jpg',
    alt: 'MMD Direct Support Professionals together outside the office in their navy polos',
  },
  park: {
    src: '/img/park.jpg', width: 1800, height: 1018, wide: '/img/park.jpg', ultra: '/img/park.jpg',
    alt: 'An MMD support professional sharing a snack with a client on a park bench at golden hour',
  },
} satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof PHOTOS;
