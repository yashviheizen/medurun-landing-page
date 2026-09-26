/**
 * Single source of truth for every piece of MEDURUN copy on the landing page.
 * Section ids here are what the header/footer anchors point at — `tests/content.test.js`
 * asserts the two stay in sync.
 */

export type NavItem = { label: string; href: string };

export const company = {
  name: "MEDURUN",
  legalName: "EMEXPRESS Healthtech Private Limited",
  tagline: "Fusion of Trust & Speed",
  descriptor: "Digitalizing Medical Emergency Support",
  helpline: "+91 8770875949",
  helplineHref: "tel:+918770875949",
  website: "www.medurun.com",
  websiteHref: "https://www.medurun.com",
  address:
    "Plot No. 122, Phase 2, Sundar Vihar, Vaishali Nagar, Behind Nalanda School, Bhilai, Durg, Chhattisgarh, India, 490023",
  copyright: "© 2026 EMEXPRESS Healthtech Private Limited. All Rights Reserved.",
} as const;

export const emails = {
  support: { label: "MEDURUN Support Team", address: "tech.support@medurun.com" },
  business: { label: "Business Partnerships", address: "business@medurun.com" },
  operations: { label: "Driver Support", address: "operations@medurun.com" },
} as const;

export const nav: NavItem[] = [
  { label: "About Us", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Driver Partner", href: "#drivers" },
  { label: "Agency Partner", href: "#agencies" },
  { label: "Why MEDURUN", href: "#why" },
  { label: "How it works", href: "#how" },
  { label: "Voices", href: "#testimonials" },
  { label: "Contact Us", href: "#contact" },
];

export const legalLinks: NavItem[] = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
];

export const hero = {
  eyebrow: "Fusion of Trust & Speed",
  headline: {
    before: "Emergency support, ",
    accent: "delivered faster",
    after: " than ever.",
  },
  subhead:
    "A technology-driven emergency network for patients, hospitals, agencies, and crews.",
  primaryCta: { label: "Get in touch", href: "#contact" },
  secondaryCta: { label: "What we provide", href: "#services" },
  // PLACEHOLDER: stock photography standing in for an approved asset. Replace with
  // an Indian-context or MEDURUN-branded ambulance photograph once one is cleared.
  image: {
    src: "https://images.unsplash.com/photo-1619025873875-59dfdd2bbbd6",
    alt: "An ambulance with its emergency beacons lit, ready to move on a night call",
  },
} as const;

export const positioning =
  "MEDURUN is India's next-generation digital healthcare mobility platform connecting patients, hospitals, ambulance providers, medical agencies, and emergency response teams through a seamless technology-driven ecosystem.";

/**
 * One stage of the emergency network, read left to right: what is handed from one
 * side of the network to the next. `status` is the small interface-style readout
 * under the stage — a state the system is in, never a metric — and `hub` marks
 * MEDURUN itself, the one stage every other stage passes through.
 */
export type FlowStage = { id: string; label: string; status: string; hub?: boolean };

export const networkFlow: FlowStage[] = [
  { id: "request", label: "Patient Request", status: "Request raised" },
  { id: "network", label: "MEDURUN Network", status: "Routing", hub: true },
  { id: "assigned", label: "Ambulance Assigned", status: "Crew accepted" },
  { id: "tracking", label: "Live Tracking", status: "Shared view" },
  { id: "hospital", label: "Hospital Ready", status: "Handover prepared" },
];

export const about = {
  eyebrow: "About MEDURUN",
  heading: "Revolutionizing emergency healthcare through technology",
  body: [
    "MEDURUN, a flagship product of EMEXPRESS Healthtech Private Limited, is dedicated to simplifying and strengthening medical emergency services through digital innovation.",
    "We bridge the gap between patients and emergency healthcare providers by offering a fast, transparent, and technology-enabled platform.",
  ],
  vision: {
    title: "Our vision",
    body: "To become India's most trusted digital medical emergency support network.",
  },
  mission: {
    title: "Our mission",
    body: "To provide immediate, reliable, and accessible emergency healthcare transportation and support services anytime, anywhere.",
  },
  image: {
    src: "https://images.unsplash.com/photo-1686797366685-6420f4bd9c2f",
    alt: "An advanced life support ambulance parked on an Indian street with its rear doors open and a crew member alongside",
  },
  /**
   * The plate's caption. Three operational words, not a sentence and not a
   * statistic — it says what the photograph is a picture of, which is the one
   * thing a full-width plate on an editorial page cannot say for itself.
   */
  caption: "Field network / Emergency mobility / India",
} as const;

export type Service = {
  id: string;
  number: string;
  title: string;
  body: string;
  icon: "ambulance" | "transfer" | "assistance" | "logistics" | "agency";
  image: { src: string; alt: string };
};

export const services: Service[] = [
  {
    id: "emergency-ambulance",
    number: "01",
    title: "Emergency ambulance",
    body: "Rapid ambulance dispatch when minutes are the difference — coordinated through a single digital network.",
    icon: "ambulance",
    image: {
      src: "https://images.unsplash.com/photo-1780570348966-051be4416237",
      alt: "Two crew members loading a patient on a stretcher into the back of an ambulance",
    },
  },
  {
    id: "patient-transfer",
    number: "02",
    title: "Patient transfer",
    body: "Planned inter-facility movement with visibility for families, hospitals, and the crew on the road.",
    icon: "transfer",
    image: {
      src: "https://images.unsplash.com/photo-1696243144290-792f1f48339e",
      alt: "The inside of an ambulance with a stretcher secured and crew seating ready for a planned transfer",
    },
  },
  {
    id: "medical-assistance",
    number: "03",
    title: "Medical assistance",
    body: "On-demand medical support routed to the right responder, without the usual chain of phone calls.",
    icon: "assistance",
    image: {
      src: "https://images.unsplash.com/photo-1648964388258-e71b58683ed0",
      alt: "A masked ambulance crew member giving oxygen to a patient seated inside the vehicle",
    },
  },
  {
    id: "healthcare-logistics",
    number: "04",
    title: "Healthcare logistics",
    body: "Movement of patients, teams, and medical resources on one operational layer.",
    icon: "logistics",
    image: {
      src: "https://images.unsplash.com/photo-1782835430483-283b2cfb4256",
      alt: "The interior of an ambulance stocked with monitoring and airway equipment",
    },
  },
  {
    id: "agency-coordination",
    number: "05",
    title: "Agency coordination",
    body: "A shared system for agencies, drivers, and hospitals to work as one emergency network.",
    icon: "agency",
    image: {
      src: "https://images.unsplash.com/photo-1783348428738-4130e9742223",
      alt: "A line of ambulances parked nose-out and ready for assignment",
    },
  },
];

export const driverPartner = {
  eyebrow: "Driver Partner",
  heading: "Drive with a network that treats minutes as the job.",
  body: "Join MEDURUN as a driver partner and take verified emergency and transfer assignments with live dispatch, clear destinations, and support from operations.",
  points: [
    "Verified emergency and transfer assignments",
    "Live dispatch with the destination set before you roll",
    "Operations support on every trip",
  ],
  cta: "Join as Driver Partner",
  /** Operational metadata: the three conditions of a MEDURUN assignment. */
  meta: ["Verified request", "Clear destination", "Live support"],
  contact: emails.operations,
  image: {
    src: "https://images.unsplash.com/photo-1696243144413-503bc482a608",
    alt: "The cab and patient compartment of an ambulance seen from the crew door, stretcher loaded and ready",
  },
} as const;

export const agencyPartner = {
  eyebrow: "Agency Partner",
  heading: "Run your fleet on the same system hospitals already trust.",
  body: "Agencies coordinate ambulances, drivers, and hospital requests on one operational layer — built for reliability, transparency, and scale.",
  points: [
    "One operational layer for ambulances, drivers, and hospital requests",
    "Shared visibility instead of a second version of the truth",
    "Built for reliability, transparency, and scale",
  ],
  cta: "Partner Your Fleet",
  /** The same line for the agency side: what running on the network gives a fleet. */
  meta: ["Shared visibility", "Fleet coordination", "Hospital network"],
  contact: emails.business,
  image: {
    src: "https://images.unsplash.com/photo-1716305150577-9f5b374a60bc",
    alt: "A basic life support ambulance standing at its base between assignments",
  },
} as const;

export type Pillar = {
  id: string;
  title: string;
  body: string;
  icon: "trust" | "speed" | "transparency" | "reliability";
};

export const pillars: Pillar[] = [
  {
    id: "trust",
    title: "Trust",
    body: "A platform built to be India's most reliable medical emergency support network.",
    icon: "trust",
  },
  {
    id: "speed",
    title: "Speed",
    body: "Technology that shortens the distance between a request and a responding crew.",
    icon: "speed",
  },
  {
    id: "transparency",
    title: "Transparency",
    body: "Live coordination so patients, providers, and agencies see the same picture.",
    icon: "transparency",
  },
  {
    id: "reliability",
    title: "Reliability",
    body: "Immediate, accessible support — anytime, anywhere.",
    icon: "reliability",
  },
];

export type Step = {
  id: string;
  number: string;
  title: string;
  body: string;
};

export const steps: Step[] = [
  {
    id: "request",
    number: "01",
    title: "Request",
    body: "A patient, hospital, or agency raises a need on the platform.",
  },
  {
    id: "dispatch",
    number: "02",
    title: "Dispatch",
    body: "The request is routed to an available crew, with the destination attached before the ambulance moves.",
  },
  {
    id: "track",
    number: "03",
    title: "Track",
    body: "Everyone involved follows the same live view — the family, the agency, and the receiving hospital.",
  },
  {
    id: "care",
    number: "04",
    title: "Care",
    body: "The ward is expecting the patient, so handover is a trail rather than a story retold at the door.",
  },
];

/**
 * One reading on the operational strip. `label` is the strip's own words; `detail`
 * is the plain-English expansion a screen reader gets, since "24/7 ACTIVE" set in
 * letter-spaced caps is a readout, not a sentence.
 */
export type Credibility = { id: string; label: string; detail: string };

export const credibility: Credibility[] = [
  { id: "availability", label: "24/7 Active", detail: "Available around the clock, every day" },
  { id: "coverage", label: "Pan-India Network", detail: "Reachable across India" },
  { id: "system", label: "One Coordinated System", detail: "Patients, hospitals, agencies and crews on one system" },
];

export const testimonialsIntro = {
  eyebrow: "Voices Across the Network",
  heading: "One emergency, seen from every side.",
  body: "Four sides of the network have to act on the same emergency. Here is what the moment used to look like for each of them, and what changes when all four are working from one shared request.",
  /**
   * Shown with the perspectives, not buried. They are written to show how each
   * side of the network uses the same request; presenting them as collected
   * customer testimonials would be a claim the product cannot support yet.
   */
  disclosure:
    "Illustrative workflow perspectives, written to show how each side of the network uses one shared request. Not verified customer testimonials.",
} as const;

/**
 * One side of the network's view of a single emergency. `problem` is the moment
 * before a shared request exists; `shift` is what the same moment becomes once it
 * does. Attributed by role only — there are no named people here, because there
 * are no collected quotes here.
 */
export type Testimonial = {
  id: string;
  role: string;
  quote: string;
  problem: string;
  shift: string;
};

export const testimonials: Testimonial[] = [
  {
    id: "patient-family",
    role: "Patient / Family",
    quote: "One request, and someone was already on the way.",
    problem:
      "A call goes to whichever ambulance number is to hand, then to the next one, with no way of knowing which will answer.",
    shift:
      "One request reaches the network at once, and the family follows the same live view as everyone else working on it.",
  },
  {
    id: "driver-partner",
    role: "Driver Partner",
    quote: "I know where I am going, and the hospital is already expecting us.",
    problem:
      "Assignments arrive by phone, the address is repeated twice, and the destination gets confirmed somewhere along the way.",
    shift:
      "The assignment arrives verified with the destination attached, and operations stays reachable for the whole trip.",
  },
  {
    id: "hospital",
    role: "Hospital",
    quote: "The receiving ward sees the request before the ambulance leaves.",
    problem:
      "A patient is described down a phone line, and the ward only starts preparing once the stretcher is at the door.",
    shift:
      "The request is visible from the moment it is raised, so handover is a trail the ward already has rather than a story retold at the door.",
  },
  {
    id: "agency",
    role: "Agency",
    quote: "No side channel, and no second version of the truth.",
    problem:
      "Vehicles, drivers and hospital requests sit in three different places, and reconciling them is somebody's whole morning.",
    shift:
      "One operational layer carries the fleet, the crews and the incoming requests — the same picture the hospitals are working from.",
  },
];

export const contact = {
  eyebrow: "Contact us",
  heading: "Get in touch",
  body: "Reach the MEDURUN team directly — for emergency support, driver onboarding, or agency partnerships.",
} as const;
