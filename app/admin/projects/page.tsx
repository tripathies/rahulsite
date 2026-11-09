'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Code2, GitFork, Plus, FileText, Trash2, Loader2, ExternalLink } from 'lucide-react';
import AdminGuard, { getAdminToken } from '@/components/admin/AdminGuard';
import { projectFixtures, ProjectFixture } from '@/lib/fixtures';
import { isPresentationUrl } from '@/lib/content';
import ContentComposer from '@/components/admin/ContentComposer';

function ProjectsContent() {
  const [cmsProjects, setCmsProjects] = useState<ProjectFixture[]>([]);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/data/projects', {
      headers: { 'x-admin-token': getAdminToken() },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.data)) setCmsProjects(d.data);
      })
      .catch(() => {});
  }, []);

  const allProjects = [...projectFixtures, ...cmsProjects];

  const handleDelete = async (slug: string) => {
    if (!confirm('Delete this project?')) return;
    setDeleting(slug);
    try {
      await fetch('/api/admin/data/projects', {
        method: 'DELETE',
        headers: { 'x-admin-token': getAdminToken(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: slug }),
      });
      setCmsProjects((prev) => prev.filter((p) => p.slug !== slug));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="apr-page">
      <header className="apr-header">
        <Link href="/admin/dashboard" className="apr-back"><ArrowLeft size={16} /> Dashboard</Link>
        <h1 className="apr-title">Projects</h1>
        <button
          type="button"
          onClick={() => setShowPdfModal(true)}
          className="apr-pdf-btn"
        >
          <Plus size={15} /> New Project
        </button>
      </header>

      {/* PDF Upload Modal */}
      {showPdfModal && (
        <ContentComposer
          type="projects"
          existing={false}
          onClose={() => setShowPdfModal(false)}
          onSaved={(item) => { setCmsProjects((prev) => [item as unknown as ProjectFixture, ...prev]); setShowPdfModal(false); }}
        />
      )}

      <div className="apr-list">
        {allProjects.map((p) => {
          const isFixture = projectFixtures.some((f) => f.slug === p.slug);
          return (
            <div key={p.slug} className="apr-item">
              <div className="apr-item__icon">
                {p.coverImage ? (
                  <img src={p.coverImage} alt={p.title} className="apr-item__thumb" />
                ) : (
                  <Code2 size={20} />
                )}
              </div>
              <div className="apr-item__info">
                <div className="apr-item__title-row">
                  <p className="apr-item__title">{p.title}</p>
                  {p.pdfUrl && <span className="apr-item__pdf">{isPresentationUrl(p.pdfUrl) ? '📊 PPT' : '📄 PDF'}</span>}
                  {p.githubUrl && (
                    <a href={p.githubUrl} target="_blank" rel="noopener noreferrer" className="apr-item__gh" title="Source">
                      <GitFork size={14} />
                    </a>
                  )}
                  {isFixture && <span className="apr-item__fixture">Fixture</span>}
                </div>
                <p className="apr-item__desc">{p.description}</p>
                <div className="apr-item__tech">
                  {p.tech.map((t) => <span key={t} className="apr-item__tag">{t}</span>)}
                </div>
              </div>

              <div className="apr-item__actions">
                {!isFixture && (
                  <button
                    onClick={() => handleDelete(p.slug)}
                    disabled={deleting === p.slug}
                    className="apr-btn apr-btn--delete"
                    title="Delete"
                  >
                    {deleting === p.slug ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
                  </button>
                )}
                <Link href={`/projects/${p.slug}`} target="_blank" className="apr-btn apr-btn--view" title="View details">
                  <ExternalLink size={13} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .apr-page { min-height: 100vh; background: #060d1f; color: #F0F0F5; padding: 32px 28px 80px; font-family: 'Inter', sans-serif; }
        .apr-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
        .apr-back { display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: rgba(160,168,192,0.60); text-decoration: none; }
        .apr-back:hover { color: #6958FF; }
        .apr-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.6rem; font-weight: 800; letter-spacing: -0.03em; flex: 1; }

        .apr-pdf-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 18px; border-radius: 11px;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.22), rgba(16, 185, 129, 0.25));
          border: 1px solid rgba(239, 68, 68, 0.40);
          color: #FCA5A5; font-size: 0.83rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .apr-pdf-btn:hover {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.32), rgba(16, 185, 129, 0.35));
          color: #FFFFFF; transform: translateY(-1px);
        }

        .apr-list { display: flex; flex-direction: column; gap: 10px; max-width: 760px; }
        .apr-item { display: flex; align-items: flex-start; gap: 14px; padding: 18px; background: rgba(13,27,62,0.60); border: 1px solid rgba(105,88,255,0.14); border-radius: 14px; }
        .apr-item__icon { width: 52px; height: 52px; border-radius: 12px; background: rgba(16,185,129,0.12); display: flex; align-items: center; justify-content: center; color: #10B981; flex-shrink: 0; overflow: hidden; }
        .apr-item__thumb { width: 100%; height: 100%; object-fit: cover; }
        .apr-item__info { flex: 1; min-width: 0; }
        .apr-item__title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; flex-wrap: wrap; }
        .apr-item__title { font-size: 0.92rem; font-weight: 700; color: #F0F0F5; }

        .apr-item__pdf {
          font-size: 0.64rem; color: #FCA5A5;
          background: rgba(239, 68, 68, 0.12);
          padding: 2px 6px; border-radius: 5px;
          border: 1px solid rgba(239, 68, 68, 0.30);
          font-weight: 700;
        }

        .apr-item__gh { color: rgba(160,168,192,0.50); display: flex; text-decoration: none; transition: color 0.2s; }
        .apr-item__gh:hover { color: #F0F0F5; }
        .apr-item__desc { font-size: 0.78rem; color: rgba(160,168,192,0.55); margin-bottom: 10px; line-height: 1.5; }
        .apr-item__tech { display: flex; gap: 6px; flex-wrap: wrap; }
        .apr-item__tag { font-size: 0.68rem; padding: 3px 8px; border-radius: 6px; background: rgba(105,88,255,0.12); border: 1px solid rgba(105,88,255,0.20); color: #A78BFA; }
        .apr-item__fixture { font-size: 0.64rem; color: rgba(160,168,192,0.40); background: rgba(105,88,255,0.10); padding: 2px 7px; border-radius: 5px; border: 1px solid rgba(105,88,255,0.16); flex-shrink: 0; }

        .apr-item__actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .apr-btn {
          width: 32px; height: 32px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid transparent; cursor: pointer;
          transition: all 0.18s; text-decoration: none; background: none;
        }
        .apr-btn--delete {
          color: #F87171; border-color: rgba(248,113,113,0.22);
          background: rgba(248,113,113,0.08);
        }
        .apr-btn--delete:hover { background: rgba(248,113,113,0.18); border-color: #F87171; }
        .apr-btn--delete:disabled { opacity: 0.45; cursor: not-allowed; }

        .apr-btn--view {
          color: rgba(160,168,192,0.50);
          border-color: rgba(105,88,255,0.12);
        }
        .apr-btn--view:hover { color: #F0F0F5; border-color: rgba(105,88,255,0.30); }

        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function AdminProjectsPage() {
  return <AdminGuard><ProjectsContent /></AdminGuard>;
}
