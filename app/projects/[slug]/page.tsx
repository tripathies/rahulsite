'use client';

import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Rocket } from 'lucide-react';
import { GithubIcon } from '@/components/icons/SocialIcons';
import Navbar from '@/components/navigation/Navbar';
import SunsetFooter from '@/components/footer/SunsetFooter';
import { projectFixtures } from '@/lib/fixtures';
import { useContent } from '@/components/admin/useContent';
import ContentTools from '@/components/admin/ContentTools';
import ContentBody from '@/components/sections/ContentBody';
import PdfViewer from '@/components/pdf/PdfViewer';

export default function ProjectSlugPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const content = useContent('projects', projectFixtures);
  const project = content.items.find((entry) => entry.slug === slug);
  if (!project) return <><Navbar /><main id="main-content" className="container-site" style={{ paddingTop: 120, minHeight: '70vh' }}><p>{content.error || (content.loading ? 'Loading project...' : 'Project not found.')}</p><Link href="/projects">Back to projects</Link></main><SunsetFooter /></>;

  return (
    <>
      <Navbar />
      <main id="main-content" style={{ paddingTop: '100px', minHeight: '100vh' }}>
        <div className="container-site" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--accent-tech)', marginBottom: '24px' }}>
              <ArrowLeft size={16} /> Back to Projects
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-tech)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>
              <Rocket size={16} /> Architecture &amp; Code Showcase
            </div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, marginBottom: '16px' }}>
              {project.title}
            </h1>
            <ContentTools type="projects" item={project} source={content.source} onChanged={content.reload} />
            {project.coverImage && <img src={project.coverImage} alt={project.title} style={{ width: '100%', maxHeight: 500, objectFit: 'cover' }} />}

            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '32px' }}>
              {project.description}
            </p>

            {/* Tech Stack */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
              {project.tech.map((t) => (
                <span
                  key={t}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                    background: 'rgba(105, 88, 255, 0.12)',
                    color: 'var(--accent-tech)',
                    border: '1px solid rgba(105, 88, 255, 0.25)',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>

            {project.pdfUrl && (
              <div style={{ marginBottom: '32px' }}>
                <PdfViewer url={project.pdfUrl} title={project.title} height="850px" />
              </div>
            )}

            <div className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>
                Architecture &amp; Key Features
              </h2>
              <ContentBody content={project.content || ''} photos={project.photos} videos={project.videos} />
              
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ width: 'fit-content', marginTop: '12px' }}
                >
                  <GithubIcon size={18} /> View on GitHub
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </main>
      <SunsetFooter />
    </>
  );
}
