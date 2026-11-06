'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { GithubIcon } from '@/components/icons/SocialIcons';
import Navbar from '@/components/navigation/Navbar';
import SunsetFooter from '@/components/footer/SunsetFooter';
import { projectFixtures } from '@/lib/fixtures';
import { isPresentationUrl } from '@/lib/content';
import { useContent } from '@/components/admin/useContent';
import ContentTools from '@/components/admin/ContentTools';

const techColors: Record<string, string> = {
  'Terraform': '#7B42BC',
  'Azure': '#0078D4',
  'Kubernetes': '#326CE5',
  'Bicep': '#00A4EF',
  'Next.js': '#FFFFFF',
  'TypeScript': '#3178C6',
  'PostgreSQL': '#336791',
  'Azure AI': '#00C9A7',
  'React': '#61DAFB',
  'Azure Blob Storage': '#0078D4',
  'Mapbox': '#4264FB',
  'Prisma': '#2D3748',
};

export default function ProjectsPage() {
  const content = useContent('projects', projectFixtures);
  return (
    <>
      <Navbar />
      <main id="main-content" style={{ paddingTop: '100px', minHeight: '100vh' }}>
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
              Projects
            </h1>
            <ContentTools type="projects" source={content.source} onChanged={content.reload} importItems={projectFixtures} />
            {content.error && <p role="alert">{content.error}</p>}
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginBottom: '48px', maxWidth: '600px' }}>
              Open-source projects, architecture patterns, and engineering samples.
            </p>

            {!content.loading && content.items.length === 0 && <p>No projects published yet.</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(380px, 100%), 1fr))', gap: '24px', paddingBottom: '80px' }}>
              {content.items.map((project, i) => (
                <motion.article
                  key={project.slug}
                  className="glass-card glass-card-hover"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                  {project.coverImage && (
                    <div style={{ position: 'relative', width: '100%', height: 200, borderRadius: '10px', overflow: 'hidden' }}>
                      <img src={project.coverImage} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {project.pdfUrl && (
                        <span style={{
                          position: 'absolute', top: 10, right: 10,
                          background: 'rgba(239, 68, 68, 0.90)', color: '#FFFFFF',
                          padding: '3px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700,
                          letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: '4px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)',
                        }}>
                          {isPresentationUrl(project.pdfUrl) ? '📊 PPT' : '📄 PDF'}
                        </span>
                      )}
                    </div>
                  )}
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 600 }}>
                    {project.title}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {project.description}
                  </p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {project.tech.map((t) => (
                      <span
                        key={t}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 500,
                          fontFamily: 'var(--font-mono)',
                          background: 'rgba(105, 88, 255, 0.1)',
                          color: techColors[t] || 'var(--text-secondary)',
                          border: '1px solid rgba(105, 88, 255, 0.15)',
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '8px 16px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 500,
                          background: 'var(--accent-tech-dim)', border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)', textDecoration: 'none',
                        }}
                      >
                        <GithubIcon size={14} /> View Source
                      </a>
                    )}
                    <Link
                      href={`/projects/${project.slug}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '8px 16px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 500,
                        background: 'transparent', border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)', textDecoration: 'none',
                      }}
                    >
                      <ExternalLink size={14} /> Details
                    </Link>
                  </div>
                  {project.isPublished === false && <small>Draft</small>}
                  <ContentTools type="projects" item={project} source={content.source} onChanged={content.reload} />
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
