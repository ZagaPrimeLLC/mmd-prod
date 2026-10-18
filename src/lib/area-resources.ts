
type AreaResource = {
  title: string;
  href: string;
  description: string;
  planningTitle: string;
  planning: string;
  questions: string[];
};

// Official county sources checked October 16, 2026. These are independent
// resources, not MMD offices, partners or a promise of program eligibility.
export const AREA_RESOURCES: Record<string, AreaResource> = {
  middlesex: {
    title: 'Middlesex County Office of Aging & Disabled Services',
    href: 'https://www.middlesexcountynj.gov/government/departments/department-of-community-services/office-of-aging-disabled-services',
    description: 'The county office provides information, referrals and assistance for residents with disabilities and their caregivers. Its Aging and Disability Resource Connection can help identify local services when a family is unsure where to turn. Contact the office about the specific help you need and the requirements of each program.',
    planningTitle: 'A conversation at our South Plainfield office',
    planning: `Middlesex County is home to our office at 2950 Hamilton Blvd in South Plainfield. For a family in Edison, Piscataway or another town, the first conversation can focus on support at home, community activities or a break for a caregiver.`,
    questions: ['Which town and days would you like support in?', 'Would you prefer a phone consultation or a visit to the South Plainfield office?'],
  },
  union: {
    title: 'Union County Office for Persons with Disabilities & Special Needs',
    href: 'https://ucnj.org/dhs/opdsn/',
    description: 'This county office shares disability information and offers social and recreational opportunities. Families looking for activities can check the current program listings and ask about registration, accessibility and the support someone needs to participate. An activity listing does not mean that DDD funding or one-to-one assistance is included.',
    planningTitle: 'Connect support with activities the person chooses',
    planning: 'For a Union County resident interested in getting out more, start with an activity they actually want to try. A county recreation program may be one option to discuss with the support coordinator. Bring the activity location and schedule to the conversation with MMD so travel and support needs can be considered together.',
    questions: ['Does the activity require advance registration or a companion?', 'Who would arrange the trip there and back, and what assistance is needed during the activity?'],
  },
  somerset: {
    title: 'Somerset County Disability Services',
    href: 'https://www.somersetcountynj.gov/government/human-services/aging-disability-services/disability-services',
    description: 'Somerset County Disability Services is an information and referral resource for people with disabilities, their families and the wider community. The county also describes the Advisory Council on Disability Issues and its educational work. This is a useful place to ask about local resources beyond the services in a DDD plan.',
    planningTitle: 'Separate local resource questions from the DDD plan',
    planning: 'A family in Bridgewater, Franklin Township or elsewhere in Somerset County may need both day-to-day support and help finding other community resources. Make two lists: the routines and goals to discuss with a DDD support coordinator, and the local information you need from the county. This helps each conversation stay focused.',
    questions: ['Which needs belong in the Individualized Service Plan?', 'Are there accessibility, community participation or referral questions to raise with the county office?'],
  },
  monmouth: {
    title: 'Monmouth County Disability Services',
    href: 'https://monmouthadvs.com/disability-office/?ID=2074',
    description: 'The county disability office provides information and assistance for adults over 18 and their loved ones. Its directory links to transportation, food assistance, legal services and other disability resources; the county site also publishes an accessible beach guide. Check each service directly for its current rules and availability.',
    planningTitle: 'Plan access before a community outing',
    planning: 'When discussing an outing in Monmouth County, name the actual destination rather than only the town. A beach visit, appointment or regular activity can involve different transport, walking distances and accessibility needs. Use the county resources to investigate options, then discuss the support and travel arrangements with your coordinator and provider.',
    questions: ['What access, rest breaks or assistance would make the outing comfortable?', 'Which transport option is suitable, and does it require a separate application or reservation?'],
  },
  hudson: {
    title: 'Hudson County services directory (PDF)',
    href: 'https://www.hcnj.us/wp-content/uploads/2025/10/2025-Directory.pdf',
    description: 'The county’s 2025 directory includes a disability services section on pages 21–23, with entries for the Office of Inclusion and Accessibility, independent living and personal assistance resources. Use the directory to identify the right organization, then confirm current contacts, requirements and availability directly.',
    planningTitle: 'Think through the whole journey',
    planning: 'For support around Jersey City, Hoboken, Bayonne or another Hudson County community, discuss the journey as well as the destination. If the person uses a bus, light rail or walks, consider the stops, transfers and assistance they prefer. Do not assume a service referral includes transportation; agree on the arrangement in advance.',
    questions: ['What route does the person already know, and where would support help?', 'Are there stairs, transfers or crowded stops that should be discussed when planning the activity?'],
  },
  bergen: {
    title: 'Bergen County Division of Disability Services',
    href: 'https://bergencountynj.gov/bergen-county-department-of-human-services/about-disability-services/',
    description: 'Bergen County lists disability information and referrals, ADA assistance, and a Caregiver Education and Support Program. The caregiver program describes guidance from professionals such as therapists and social workers for unpaid caregivers. Ask the county about eligibility and availability; these county programs have their own rules and are separate from an MMD referral.',
    planningTitle: 'Make the caregiver’s needs part of the conversation',
    planning: 'If a Bergen County family is considering respite, start with when the caregiver needs a break and the routines that should stay familiar. If the caregiver also wants practical training or guidance, the county program may be a separate resource to explore. Discuss both needs without assuming that one service replaces the other.',
    questions: ['What days and routines would a respite arrangement need to cover?', 'Would caregiver education be helpful alongside the person’s DDD services?'],
  },
  essex: {
    title: 'Essex County Aging and Disability Resource Connection',
    href: 'https://wecare.essexcountynj.org/support/solutions/articles/69000806168-aging-and-disability-resource-connection-adrc-',
    description: 'Essex County’s Information and Assistance Unit connects older adults, people with disabilities and caregivers with community services. Its official page explains referral help and access to caregiver programs. Ask about the appropriate program for the person’s situation, since county caregiver support and DDD-funded services have different requirements.',
    planningTitle: 'Clarify which kind of support you need',
    planning: 'For an Essex County household balancing several needs, write down whether the immediate question is daily assistance, caregiver relief or help finding a community service. Bring DDD plan questions to the support coordinator and county resource questions to the ADRC. MMD can discuss its services and current availability in your town.',
    questions: ['Is the priority a regular support routine or relief for a caregiver?', 'Is there an existing DDD plan, or is the family still looking for the right starting point?'],
  },
  warren: {
    title: 'Warren County local resources directory',
    href: 'https://www.warrencountynj.gov/government/human-services/division-of-aging-and-disability-services/information-and-assistance',
    description: 'Warren County’s directory groups local contacts for transportation, housing assistance, financial assistance, counseling and other community needs. It can help a family identify whom to call alongside its DDD support coordinator. Confirm the details directly with the listed organization before relying on a service or arranging travel.',
    planningTitle: 'Include travel time in the weekly plan',
    planning: 'When asking about support in Washington, Phillipsburg, Hackettstown or another Warren County town, provide the starting location and the places the person regularly visits. Discuss the full schedule, including travel and return arrangements. The county transportation contacts can be a starting point for questions about available options and booking requirements.',
    questions: ['Which journeys recur each week, and how much flexibility is there in the schedule?', 'What is the plan for getting home if an activity finishes early or travel arrangements change?'],
  },
};
