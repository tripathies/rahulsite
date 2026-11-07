'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Clock, Tag, Calendar, User } from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';
import SunsetFooter from '@/components/footer/SunsetFooter';
import { blogFixtures } from '@/lib/fixtures';
import { useContent } from '@/components/admin/useContent';
import ContentTools from '@/components/admin/ContentTools';
import ContentBody from '@/components/sections/ContentBody';
import DocumentReader from '@/components/pdf/DocumentReader';
import { isPresentationUrl } from '@/lib/content';

const categoryColors: Record<string, string> = {
  CLOUD_ARCHITECTURE: '#6958FF',
  AI_LESSONS: '#00C9A7',
  TRAVEL_JOURNAL: '#FF8A3D',
  CAREER: '#FFD93D',
};

const categoryLabels: Record<string, string> = {
  CLOUD_ARCHITECTURE: 'Cloud Architecture',
  AI_LESSONS: 'AI Lessons',
  TRAVEL_JOURNAL: 'Travel Journal',
  CAREER: 'Career',
};

export default function BlogSlugPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const content = useContent('blogs', blogFixtures);
  const post = content.items.find((entry) => entry.slug === slug);
  const readingUrl = post?.readingPdfUrl || (isPresentationUrl(post?.pdfUrl) ? '' : post?.pdfUrl);

  useEffect(() => {
    if (post?.externalUrl) {
      window.location.href = post.externalUrl;
    }
  }, [post?.externalUrl]);
  if (!post) return <><Navbar /><main id="main-content" className="container-site" style={{ paddingTop: 120, minHeight: '70vh' }}><p>{content.error || (content.loading ? 'Loading article...' : 'Article not found.')}</p><Link href="/blog">Back to articles</Link></main><SunsetFooter /></>;

  return (
    <>
      <Navbar />
      <main id="main-content" style={{ paddingTop: '160px', minHeight: '100vh' }}>
        <div className="container-site" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--accent-tech)', marginBottom: '24px' }}>
              <ArrowLeft size={16} /> Back to Articles
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontSize: '0.75rem', fontWeight: 600, padding: '4px 12px',
                borderRadius: '6px', border: `1px solid ${categoryColors[post.category]}40`,
                color: categoryColors[post.category], textTransform: 'uppercase', letterSpacing: '0.03em',
              }}>
                <Tag size={12} /> {categoryLabels[post.category]}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <Clock size={12} /> {post.readTime} min read
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <Calendar size={12} /> {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 700, lineHeight: 1.15, marginBottom: '20px' }}>
              {post.title}
            </h1>
            <ContentTools type="blogs" item={post} source={content.source} onChanged={content.reload} />
            {content.error && <p role="alert">{content.error}</p>}

            {post.excerpt && <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '28px' }}>
              {post.excerpt}
            </p>}

            {/* Author Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '28px', marginBottom: '32px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-tech), #8B7AFF)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
              }}>
                👨‍💻
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Rahul Tripathi</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Cloud Architect &amp; Author</div>
              </div>
            </div>

            {!post.pdfUrl && post.coverImage && <img src={post.coverImage} alt="" style={{ display: 'block', width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 12, marginBottom: 40 }} />}

            {/* Article Content */}
            {readingUrl ? <DocumentReader key={readingUrl} url={readingUrl} title={post.title} /> : post.pdfUrl ? <p role="status">This article is being prepared for reading.</p> : <ContentBody content={post.content || ''} photos={post.photos} videos={post.videos} />}
            {post.externalUrl && <a href={post.externalUrl} target="_blank" rel="noopener noreferrer">Read the original article</a>}
          </motion.div>
        </div>
      </main>
      <SunsetFooter />
    </>
  );
}
