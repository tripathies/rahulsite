/**
 * Development Fixtures — RahulTripathi.dev
 *
 * All fixture data is marked with isPlaceholder: true.
 * Production data MUST come from live APIs (YouTube Data API v3, PostgreSQL).
 * Never display fake production numbers.
 */

export interface BlogFixture {
  slug: string;
  title: string;
  excerpt: string;
  category: 'CLOUD_ARCHITECTURE' | 'AI_LESSONS' | 'TRAVEL_JOURNAL' | 'CAREER';
  readTime: number;
  publishedAt: string;
  externalUrl?: string;
  pdfUrl?: string;
  isPlaceholder: true;
}

export interface TravelFixture {
  slug: string;
  destination: string;
  country: string;
  excerpt: string;
  visitedAt: string;
  isPlaceholder: true;
}

// Rich adventure entry — powers /adventure page & admin CMS
export interface AdventureEntry {
  id: string;
  slug: string;
  destination: string;
  country: string;
  countryCode: string;
  cities: string[];
  excerpt: string;
  visitedAt: string;
  endedAt?: string;
  isCurrent: boolean;
  coverImage: string;
  profilePhotoAtLocation: string;
  photos: string[];
  highlights: string[];
  travelStyle: 'solo' | 'team' | 'remote-work' | 'leisure';
  emoji: string;
  lat: number;
  lng: number;
  pdfUrl?: string;
}

export interface VideoFixture {
  youtubeId: string;
  title: string;
  topic: string;
  duration: string;
  publishedAt: string;
  isPlaceholder: true;
}

export interface ProjectFixture {
  slug: string;
  title: string;
  description: string;
  tech: string[];
  githubUrl?: string;
  coverImage?: string;
  pdfUrl?: string;
  isPlaceholder: true;
}

// ============================================================
// Blog Fixtures (Including Curated Front-End & System Design Articles)
// ============================================================

export const blogFixtures: BlogFixture[] = [
  {
    slug: 'designing-event-driven-microservices-on-azure',
    title: 'Designing Event-Driven Microservices on Azure',
    excerpt: 'A deep dive into building scalable event-driven architectures using Azure Service Bus, Event Grid, and Functions.',
    category: 'CLOUD_ARCHITECTURE',
    readTime: 12,
    publishedAt: '2026-08-15',
    isPlaceholder: true,
  },
  {
    slug: 'getting-started-with-anchor-positioning',
    title: 'Getting Started with Anchor Positioning',
    excerpt: 'For decades, sticking one element to another for tooltips and nested menus was challenging. Discover CSS Anchor Positioning.',
    category: 'AI_LESSONS',
    readTime: 8,
    publishedAt: '2026-07-06',
    externalUrl: 'https://www.joshwcomeau.com/css/anchor-positioning/',
    isPlaceholder: true,
  },
  {
    slug: 'css-vs-javascript-animation-performance',
    title: 'CSS vs. JavaScript: Performance Nuances',
    excerpt: 'Comparing JS animation libraries against native CSS transitions and keyframe animations to evaluate frame-budget costs.',
    category: 'AI_LESSONS',
    readTime: 10,
    publishedAt: '2026-05-26',
    externalUrl: 'https://www.joshwcomeau.com/animation/css-vs-javascript/',
    isPlaceholder: true,
  },
  {
    slug: 'scroll-driven-animations-without-javascript',
    title: 'Scroll-Driven Animations in Native CSS',
    excerpt: 'Using the Animation Timeline API to craft dynamic scroll-driven micro-interactions without single lines of JavaScript.',
    category: 'AI_LESSONS',
    readTime: 9,
    publishedAt: '2026-04-28',
    externalUrl: 'https://www.joshwcomeau.com/animation/scroll-driven-animations/',
    isPlaceholder: true,
  },
  {
    slug: 'terraform-azure-landing-zones',
    title: 'Terraform Azure Landing Zones: From Zero to Production',
    excerpt: 'Step-by-step guide to implementing Azure Cloud Adoption Framework landing zones with Terraform modules.',
    category: 'CLOUD_ARCHITECTURE',
    readTime: 15,
    publishedAt: '2026-04-01',
    isPlaceholder: true,
  },
  {
    slug: 'understanding-transformer-architectures',
    title: 'Understanding Transformer Architectures for Engineers',
    excerpt: 'Breaking down attention mechanisms, tokenization, and positional encoding for software engineers.',
    category: 'AI_LESSONS',
    readTime: 18,
    publishedAt: '2026-03-20',
    isPlaceholder: true,
  },
  {
    slug: 'the-post-developer-era-and-ai',
    title: 'The Post-Developer Era: AI & Software Engineering',
    excerpt: 'Revisiting predictions on AI eliminating engineering jobs and examining where software craftsmanship is headed.',
    category: 'CAREER',
    readTime: 11,
    publishedAt: '2025-04-14',
    externalUrl: 'https://www.joshwcomeau.com/blog/the-post-developer-era/',
    isPlaceholder: true,
  },
  {
    slug: 'remote-work-from-bali',
    title: 'Remote Work from Bali: An Engineer\'s Guide',
    excerpt: 'Lessons learned from three months of engineering leadership while working remotely from Bali.',
    category: 'TRAVEL_JOURNAL',
    readTime: 8,
    publishedAt: '2025-02-10',
    isPlaceholder: true,
  },
];

// ============================================================
// Travel Fixtures
// ============================================================

export const travelFixtures: TravelFixture[] = [
  {
    slug: 'japan-tokyo-osaka',
    destination: 'Tokyo & Osaka',
    country: 'Japan',
    excerpt: 'Cherry blossoms, bullet trains, and the intersection of tradition and technology.',
    visitedAt: '2026-04-15',
    isPlaceholder: true,
  },
  {
    slug: 'iceland-ring-road',
    destination: 'Ring Road Adventure',
    country: 'Iceland',
    excerpt: 'Driving the entire Ring Road — glaciers, waterfalls, and volcanic landscapes.',
    visitedAt: '2026-03-01',
    isPlaceholder: true,
  },
  {
    slug: 'swiss-alps-retreat',
    destination: 'Swiss Alps',
    country: 'Switzerland',
    excerpt: 'Mountain retreats, scenic trains, and the best chocolate in the world.',
    visitedAt: '2025-12-20',
    isPlaceholder: true,
  },
];

// ============================================================
// Adventure Fixtures (Rich — used by /adventure page)
// ============================================================

export const adventureFixtures: AdventureEntry[] = [
  {
    id: 'adv-001',
    slug: 'thailand-bangkok-chiangmai',
    destination: 'Thailand',
    country: 'Thailand',
    countryCode: 'TH',
    cities: ['Bangkok', 'Chiang Mai'],
    excerpt: 'Remote-working from temples and rooftop cafés — where street food costs less than your coffee back home and the sunsets are absolutely unreal.',
    visitedAt: '2026-05-01',
    isCurrent: true,
    coverImage: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200&h=800&fit=crop&q=80',
    profilePhotoAtLocation: '/avatar-3d-head-only.png',
    photos: [
      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    ],
    highlights: [
      'Digital nomad base in Chiang Mai old city',
      'Doi Inthanon — highest peak in Thailand',
      'Street food tour through Bangkok night markets',
      'Remote work from a bamboo café with mountain views',
    ],
    travelStyle: 'remote-work',
    emoji: '🇹🇭',
    lat: 13.7563,
    lng: 100.5018,
  },
  {
    id: 'adv-002',
    slug: 'singapore-city',
    destination: 'Singapore',
    country: 'Singapore',
    countryCode: 'SG',
    cities: ['Singapore'],
    excerpt: 'The city where hawker stalls coexist with Michelin stars — a layover that turned into a full engineering conference detour.',
    visitedAt: '2026-04-10',
    endedAt: '2026-04-18',
    isCurrent: false,
    coverImage: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&h=800&fit=crop&q=80',
    profilePhotoAtLocation: '/avatar-3d-head-only.png',
    photos: [
      'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=800&q=80',
      'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80',
    ],
    highlights: [
      'Marina Bay Sands rooftop — best skyline view in Asia',
      'Tech meetup at Singapore Science Park',
      'Gardens by the Bay light show',
      'Hawker centre hopping at Maxwell Food Centre',
    ],
    travelStyle: 'remote-work',
    emoji: '🇸🇬',
    lat: 1.3521,
    lng: 103.8198,
  },
  {
    id: 'adv-003',
    slug: 'paris-france',
    destination: 'Paris',
    country: 'France',
    countryCode: 'FR',
    cities: ['Paris'],
    excerpt: 'Croissants, code, and the Eiffel Tower — Paris proved that the best architecture isn\'t always in the cloud.',
    visitedAt: '2026-02-14',
    endedAt: '2026-02-22',
    isCurrent: false,
    coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&h=800&fit=crop&q=80',
    profilePhotoAtLocation: '/avatar-3d-head-only.png',
    photos: [
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
      'https://images.unsplash.com/photo-1431274172761-fcdab704a5bd?w=800&q=80',
    ],
    highlights: [
      'Sunrise at Eiffel Tower — absolutely worth the early alarm',
      'Worked from Shakespeare & Company bookshop café',
      'Day trip to Versailles palace gardens',
      'French pastry tasting — 12 croissants, no regrets',
    ],
    travelStyle: 'leisure',
    emoji: '🇫🇷',
    lat: 48.8566,
    lng: 2.3522,
  },
  {
    id: 'adv-004',
    slug: 'tokyo-japan',
    destination: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    cities: ['Tokyo', 'Osaka', 'Kyoto'],
    excerpt: 'Bullet trains, cherry blossoms, and the intersection of ancient tradition with bleeding-edge technology.',
    visitedAt: '2026-04-01',
    endedAt: '2026-04-09',
    isCurrent: false,
    coverImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&h=800&fit=crop&q=80',
    profilePhotoAtLocation: '/avatar-3d-head-only.png',
    photos: [
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80',
    ],
    highlights: [
      'Cherry blossom hanami in Shinjuku Gyoen',
      'TeamLab Borderless digital art museum',
      'Shinkansen ride Osaka → Kyoto → Tokyo',
      'Late-night ramen in Shibuya after a dev meetup',
    ],
    travelStyle: 'remote-work',
    emoji: '🇯🇵',
    lat: 35.6762,
    lng: 139.6503,
  },
  {
    id: 'adv-005',
    slug: 'iceland-ring-road',
    destination: 'Iceland Ring Road',
    country: 'Iceland',
    countryCode: 'IS',
    cities: ['Reykjavik', 'Akureyri', 'Vik'],
    excerpt: 'Driving 1332km around the entire island — glaciers, volcanoes, waterfalls, and the Northern Lights. No WiFi needed.',
    visitedAt: '2026-03-01',
    endedAt: '2026-03-14',
    isCurrent: false,
    coverImage: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1200&h=800&fit=crop&q=80',
    profilePhotoAtLocation: '/avatar-3d-head-only.png',
    photos: [
      'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80',
      'https://images.unsplash.com/photo-1504233529578-6d46baba6d34?w=800&q=80',
    ],
    highlights: [
      'Northern Lights at Jokulsarlon glacier lagoon',
      'Completed the full Ring Road in 10 days',
      'Skaftafell glacier hike',
      'Geothermal hot springs in the highlands',
    ],
    travelStyle: 'solo',
    emoji: '🇮🇸',
    lat: 64.9631,
    lng: -19.0208,
  },
];

// ============================================================
// Video Lecture Fixtures
// ============================================================

export const videoFixtures: VideoFixture[] = [
  {
    youtubeId: 'plcehlder-1',
    title: 'Building LLM Applications from Scratch',
    topic: 'Cloud By Design',
    duration: '1:45:30',
    publishedAt: '2026-07-15',
    isPlaceholder: true,
  },
  {
    youtubeId: 'plcehlder-2',
    title: 'System Design: Distributed Caching at Scale',
    topic: 'The Committee Files',
    duration: '52:10',
    publishedAt: '2026-06-28',
    isPlaceholder: true,
  },
  {
    youtubeId: 'plcehlder-3',
    title: 'Deep Dive: Azure Kubernetes Service Architecture',
    topic: 'Money By Design',
    duration: '1:12:45',
    publishedAt: '2026-06-10',
    isPlaceholder: true,
  },
  {
    youtubeId: 'plcehlder-4',
    title: 'Attention Is All You Need — Paper Walkthrough',
    topic: 'Life By Design',
    duration: '2:05:20',
    publishedAt: '2026-05-22',
    isPlaceholder: true,
  },
];

// ============================================================
// Project Fixtures
// ============================================================

export const projectFixtures: ProjectFixture[] = [
  {
    slug: 'cloud-architecture-patterns',
    title: 'Cloud Architecture Patterns',
    description: 'A collection of production-ready cloud architecture patterns implemented with Terraform and Azure.',
    tech: ['Terraform', 'Azure', 'Kubernetes', 'Bicep'],
    githubUrl: 'https://github.com/rahultripathi',
    isPlaceholder: true,
  },
  {
    slug: 'ai-teaching-platform',
    title: 'AI Teaching Platform',
    description: 'Open-source Karpathy-style video lecture platform with search, transcripts, and bookmarks.',
    tech: ['Next.js', 'TypeScript', 'PostgreSQL', 'Azure AI'],
    githubUrl: 'https://github.com/rahultripathi',
    isPlaceholder: true,
  },
  {
    slug: 'travel-journal-engine',
    title: 'Travel Journal Engine',
    description: 'A serverless travel journaling platform with photo galleries and interactive maps.',
    tech: ['React', 'Azure Blob Storage', 'Mapbox', 'Prisma'],
    githubUrl: 'https://github.com/rahultripathi',
    isPlaceholder: true,
  },
];

// ============================================================
// Quick Card Data (Non-placeholder — Authored Content)
// ============================================================

export const quickCards = [
  {
    title: 'Blog',
    description: 'In-depth tutorials on cloud, architecture, and engineering.',
    icon: '📝',
    href: '/blog',
  },
  {
    title: 'Travel',
    description: 'Stories, guides, and tips from around the world.',
    icon: '🧳',
    href: '/travel',
  },
  {
    title: 'YouTube',
    description: 'Videos on cloud, tech, and real-world learnings.',
    icon: '▶️',
    href: '/youtube',
  },
  {
    title: 'Projects',
    description: 'Open-source projects and architecture samples.',
    icon: '🚀',
    href: '/projects',
  },
  {
    title: 'About',
    description: 'More about me, my journey, and what drives me.',
    icon: '👤',
    href: '/about',
  },
];

// ============================================================
// Social Links (Verified — Non-placeholder)
// ============================================================

export const socialLinks = [
  { name: 'GitHub', url: 'https://github.com/tripathies', icon: 'github' },
  { name: 'YouTube', url: 'https://youtube.com/@rahultripathi', icon: 'youtube' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/rahul-tripathi-a05a1693', icon: 'linkedin' },
  { name: 'X / Twitter', url: 'https://x.com/rahultripathi', icon: 'twitter' },
  { name: 'Instagram', url: 'https://www.instagram.com/tripathir01?cplk=MTlzc3V2czQ2bHE4eQ==', icon: 'instagram' },
  { name: 'Threads', url: 'https://www.threads.com/@tripathir01', icon: 'threads' },
];

// ============================================================
// Navigation Links
// ============================================================

export const navLinks = [
  { label: 'Blog', href: '/blog' },
  { label: 'Travel', href: '/travel' },
  { label: 'YouTube', href: '/youtube' },
  { label: 'Projects', href: '/projects' },
  { label: 'About', href: '/about' },
];
