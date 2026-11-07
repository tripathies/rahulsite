import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const IMAGE_TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

export interface PastedContent {
  markdown: string;
  images: { token: string; file: File }[];
  skippedImages: number;
}

let service: TurndownService | undefined;
function turndown() {
  if (service) return service;
  service = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced', emDelimiter: '*', hr: '---' });
  service.use(gfm);
  service.remove(['script', 'style', 'meta', 'title', 'head', 'iframe', 'object', 'embed', 'form', 'button', 'input']);
  // Word and PowerPoint mark headings with styled paragraphs instead of <h*> tags.
  service.addRule('officeHeadings', {
    filter: node => node.nodeName === 'P' && /\bMsoTitle\b|\bMsoHeading[1-3]\b/i.test((node as HTMLElement).className),
    replacement: (content, node) => `\n\n${/MsoHeading3/i.test((node as HTMLElement).className) ? '###' : '##'} ${content.trim()}\n\n`,
  });
  service.addRule('officeBullets', {
    filter: node => node.nodeName === 'P' && /\bMsoListParagraph/i.test((node as HTMLElement).className),
    replacement: content => `\n- ${content.replace(/^[\s\u00a0]*(?:[·•▪§o]|\d+[.)])[\s\u00a0]+/, '').trim()}\n`,
  });
  return service;
}

export function fileFromDataUrl(source: string, index: number): File | null {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([a-z0-9+/=\s]+)$/i.exec(source);
  if (!match) return null;
  const bytes = Uint8Array.from(atob(match[2].replace(/\s/g, '')), character => character.charCodeAt(0));
  return new File([bytes], `pasted-${Date.now()}-${index}.${IMAGE_TYPES[match[1].toLowerCase()]}`, { type: match[1].toLowerCase() });
}

export function isSupportedImage(file: File) {
  return Boolean(IMAGE_TYPES[file.type]);
}

export function htmlToMarkdown(html: string): PastedContent {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const images: PastedContent['images'] = [];
  let skippedImages = 0;
  document.querySelectorAll('img').forEach((image, index) => {
    const source = image.getAttribute('src') || '';
    const file = fileFromDataUrl(source, index);
    if (file) {
      const token = `#pending-image-${crypto.randomUUID()}`;
      images.push({ token, file });
      image.setAttribute('src', token);
    } else if (/^\/(?!\/)/.test(source)) {
      return;
    } else {
      // Local file:// and third-party links are unreadable or blocked by CSP once published.
      skippedImages++;
      image.remove();
    }
  });
  const markdown = turndown().turndown(document.body)
    .replace(/\u00a0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { markdown, images, skippedImages };
}

export function estimateReadTime(markdown: string) {
  const words = markdown.replace(/!\[[^\]]*\]\([^)]*\)/g, '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function summarize(markdown: string, limit = 220) {
  const text = markdown
    .split(/\n{2,}/)
    .map(block => block.trim())
    .find(block => block && !/^(#|!\[|\||```|>|-{3,})/.test(block)) || '';
  const plain = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`~]/g, '').replace(/\s+/g, ' ').trim();
  return plain.length > limit ? `${plain.slice(0, limit - 1).replace(/\s+\S*$/, '')}…` : plain;
}

export function slugify(title: string) {
  return title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
}
