import { z } from 'zod';

const text = z.string().trim().max(500);
const url = z.string().max(2048).refine((value) => !value || /^https?:\/\//i.test(value) || /^\/(?!\/)/.test(value), 'Use an HTTP(S) URL or a local media path.');
const slug = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase words separated by hyphens.').max(180);
const common = {
  id: z.string().max(200).optional(),
  content: z.string().max(500000).default(''),
  coverImage: url.default(''),
  pdfUrl: url.default(''),
  readingPdfUrl: url.refine(value => !value || /\.pdf(?:$|[?#])/i.test(value), 'The reading version must be a PDF.').default(''),
  photos: z.array(url).max(100).default([]),
  videos: z.array(url).max(30).default([]),
  isPublished: z.boolean().default(true),
};

export const contentSchemas = {
  blogs: z.object({ ...common, slug, title: text.min(1), excerpt: z.string().max(3000).default(''), category: z.enum(['CLOUD_ARCHITECTURE', 'AI_LESSONS', 'TRAVEL_JOURNAL', 'CAREER']).default('CLOUD_ARCHITECTURE'), readTime: z.coerce.number().int().min(1).max(300).default(6), publishedAt: z.string().date(), externalUrl: url.default('') }),
  adventures: z.object({ ...common, slug, destination: text.min(1), country: text.min(1), countryCode: text.default(''), cities: z.array(text).default([]), excerpt: z.string().max(3000).default(''), visitedAt: z.string().date(), endedAt: z.union([z.string().date(), z.literal('')]).default(''), isCurrent: z.boolean().default(false), profilePhotoAtLocation: url.default('/avatar-travel-clean.png'), highlights: z.array(text).default([]), travelStyle: z.enum(['solo', 'team', 'remote-work', 'leisure']).default('leisure'), emoji: text.default(''), lat: z.coerce.number().min(-90).max(90).default(0), lng: z.coerce.number().min(-180).max(180).default(0) }),
  projects: z.object({ ...common, slug, title: text.min(1), description: z.string().max(5000).default(''), tech: z.array(text).max(50).default([]), githubUrl: url.default(''), externalUrl: url.default('') }),
  videos: z.object({ id: common.id, title: text.min(1), youtubeId: z.string().regex(/^[a-zA-Z0-9_-]{11}$/), topic: text.default(''), duration: text.default(''), publishedAt: z.string().date(), isPublished: common.isPublished }),
  about: z.object({ ...common, title: text.min(1), subtitle: text.default(''), githubUrl: url.default(''), youtubeUrl: url.default(''), linkedinUrl: url.default(''), twitterUrl: url.default(''), instagramUrl: url.default(''), threadsUrl: url.default('') }),
};

export type ContentType = keyof typeof contentSchemas;
export interface ContentRecord {
  id?: string;
  content?: string;
  coverImage?: string;
  pdfUrl?: string;
  readingPdfUrl?: string;
  photos?: string[];
  videos?: string[];
  isPublished?: boolean;
}

export type ContentField = { key: string; label: string; kind?: 'textarea' | 'date' | 'number' | 'list' | 'checkbox' | 'select' | 'image'; options?: string[] };
export const contentFields: Record<ContentType, ContentField[]> = {
  blogs: [{ key: 'title', label: 'Title' }, { key: 'slug', label: 'Slug' }, { key: 'excerpt', label: 'Excerpt', kind: 'textarea' }, { key: 'pdfUrl', label: 'Document URL (PDF / PPT)' }, { key: 'category', label: 'Category', kind: 'select', options: ['CLOUD_ARCHITECTURE', 'AI_LESSONS', 'TRAVEL_JOURNAL', 'CAREER'] }, { key: 'readTime', label: 'Reading time (minutes)', kind: 'number' }, { key: 'publishedAt', label: 'Publication date', kind: 'date' }, { key: 'externalUrl', label: 'External article URL' }],
  adventures: [{ key: 'destination', label: 'Destination' }, { key: 'slug', label: 'Slug' }, { key: 'country', label: 'Country' }, { key: 'countryCode', label: 'Country code' }, { key: 'cities', label: 'Cities (one per line)', kind: 'list' }, { key: 'excerpt', label: 'Summary', kind: 'textarea' }, { key: 'pdfUrl', label: 'Document URL (PDF / PPT)' }, { key: 'visitedAt', label: 'Arrival date', kind: 'date' }, { key: 'endedAt', label: 'Departure date', kind: 'date' }, { key: 'isCurrent', label: 'Current adventure', kind: 'checkbox' }, { key: 'travelStyle', label: 'Travel style', kind: 'select', options: ['solo', 'team', 'remote-work', 'leisure'] }, { key: 'highlights', label: 'Highlights (one per line)', kind: 'list' }, { key: 'profilePhotoAtLocation', label: 'Profile photo', kind: 'image' }, { key: 'emoji', label: 'Flag or symbol' }, { key: 'lat', label: 'Latitude', kind: 'number' }, { key: 'lng', label: 'Longitude', kind: 'number' }],
  projects: [{ key: 'title', label: 'Title' }, { key: 'slug', label: 'Slug' }, { key: 'description', label: 'Description', kind: 'textarea' }, { key: 'pdfUrl', label: 'Document URL (PDF / PPT)' }, { key: 'tech', label: 'Technologies (one per line)', kind: 'list' }, { key: 'githubUrl', label: 'Source repository URL' }, { key: 'externalUrl', label: 'Project website URL' }],
  videos: [{ key: 'title', label: 'Title' }, { key: 'youtubeId', label: 'YouTube video ID' }, { key: 'topic', label: 'Topic' }, { key: 'duration', label: 'Duration' }, { key: 'publishedAt', label: 'Publication date', kind: 'date' }],
  about: [{ key: 'title', label: 'Name' }, { key: 'subtitle', label: 'Headline' }, { key: 'githubUrl', label: 'GitHub URL' }, { key: 'youtubeUrl', label: 'YouTube URL' }, { key: 'linkedinUrl', label: 'LinkedIn URL' }, { key: 'twitterUrl', label: 'X URL' }, { key: 'instagramUrl', label: 'Instagram URL' }, { key: 'threadsUrl', label: 'Threads URL' }],
};

export const isPresentationUrl = (value?: string) => /\.pptx?(?:$|[?#])/i.test(value ?? '');

export function newContentDraft(type: ContentType, item?: object): Record<string, unknown> {
  const today = new Date().toISOString().slice(0, 10);
  return { title: '', slug: '', content: '', coverImage: '', pdfUrl: '', photos: [], videos: [], isPublished: true, category: 'CLOUD_ARCHITECTURE', readTime: 6, publishedAt: today, visitedAt: today, travelStyle: 'leisure', lat: 0, lng: 0, profilePhotoAtLocation: '/avatar-travel-clean.png', ...(type === 'about' ? { id: 'about' } : {}), ...item };
}