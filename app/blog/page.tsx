'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Tag, Clock, Search } from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';
import SunsetFooter from '@/components/footer/SunsetFooter';
import { blogFixtures } from '@/lib/fixtures';
import { useContent } from '@/components/admin/useContent';
import ContentTools from '@/components/admin/ContentTools';

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

export default function BlogPage() {
  const content = useContent('blogs', blogFixtures);
  const [search, setSearch] = useState('');
  const posts = content.items.filter((post) => `${post.title} ${post.excerpt}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <>
      <Navbar />
      <main id="main-content" style={{ paddingTop: '160px', minHeight: '100vh' }}>
        <div className="container-site">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--accent-tech)', marginBottom: '24px' }}>
              <ArrowLeft size={16} /> Back to Home
            </Link>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, marginBottom: '8px' }}>
              Blog
            </h1>
            <ContentTools type="blogs" source={content.source} onChanged={content.reload} importItems={blogFixtures} />
            {content.error && <p role="alert">{content.error}</p>}
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginBottom: '40px', maxWidth: '600px' }}>
              In-depth tutorials on cloud architecture, AI lessons, travel journals, and engineering insights.
            </p>

            {/* Search Bar */}
            <div style={{ position: 'relative', maxWidth: '480px', marginBottom: '48px' }}>
              <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                aria-label="Search articles"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search articles..."
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 48px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(12px)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* Blog Grid */}
            {!content.loading && posts.length === 0 && <p>No articles found.</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))', gap: '24px', paddingBottom: '80px' }}>
              {posts.map((post, i) => (
                <motion.article
                  key={post.slug}
                  className="glass-card glass-card-hover"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                >
                  <Link
                    href={post.externalUrl || `/blog/${post.slug}`}
                    target={post.externalUrl ? '_blank' : undefined}
                    rel={post.externalUrl ? 'noopener noreferrer' : undefined}
                    style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit', flex: 1 }}
                  >
                    <div style={{
                      aspectRatio: '16 / 9',
                      background: `linear-gradient(135deg, ${categoryColors[post.category]}22, ${categoryColors[post.category]}08)`,
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      {post.coverImage && <img src={post.coverImage} alt={post.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />}
                    </div>
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          fontSize: '0.7rem', fontWeight: 600, padding: '4px 10px',
                          borderRadius: '6px', border: `1px solid ${categoryColors[post.category]}40`,
                          color: categoryColors[post.category], textTransform: 'uppercase', letterSpacing: '0.03em',
                        }}>
                          <Tag size={11} /> {categoryLabels[post.category]}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          <Clock size={11} /> {post.readTime} min read
                        </span>
                      </div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.35 }}>
                        {post.title}
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 }}>
                        {post.excerpt}
                      </p>
                      <time style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                        {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </time>
                    </div>
                  </Link>
                  <div style={{ padding: '0 20px' }}>
                    {post.isPublished === false && <small>Draft</small>}
                    <ContentTools type="blogs" item={post} source={content.source} onChanged={content.reload} />
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
      <SunsetFooter />
    </>
  );
}
