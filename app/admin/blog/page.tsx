'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Trash2, Search, FileText,
  ExternalLink, Loader2, ChevronRight
} from 'lucide-react';
import AdminGuard, { getAdminToken } from '@/components/admin/AdminGuard';
import { blogFixtures, BlogFixture } from '@/lib/fixtures';
import { isPresentationUrl } from '@/lib/content';
import BlogComposer from '@/components/admin/BlogComposer';

// ── Blog List ──────────────────────────────────────────────────────────
function BlogListContent() {
  const [cmsBlogs, setCmsBlogs] = useState<BlogFixture[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/data/blogs', { headers: { 'x-admin-token': getAdminToken() } })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setCmsBlogs(d.data); })
      .catch(() => {});
  }, []);

  const all = [...blogFixtures, ...cmsBlogs];
  const filtered = all.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (slug: string) => {
    if (!confirm('Delete this post?')) return;
    setDeleting(slug);
    try {
      await fetch('/api/admin/data/blogs', {
        method: 'DELETE',
        headers: { 'x-admin-token': getAdminToken(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: slug }),
      });
      setCmsBlogs((prev) => prev.filter((b) => b.slug !== slug));
    } finally {
      setDeleting(null);
    }
  };

  const CATEGORY_COLORS: Record<string, string> = {
    CLOUD_ARCHITECTURE: '#6958FF',
    AI_LESSONS: '#06B6D4',
    TRAVEL_JOURNAL: '#FF8A3D',
    CAREER: '#10B981',
  };

  return (
    <div className="blg-page">
      <header className="blg-header">
        <Link href="/admin/dashboard" className="blg-back"><ArrowLeft size={16} /> Dashboard</Link>
        <h1 className="blg-title">Blog Posts</h1>
        <button onClick={() => setShowForm(true)} className="blg-add-btn">
          <Plus size={15} /> New Post
        </button>
      </header>

      {showForm && (
        <BlogComposer existing={false} onClose={() => setShowForm(false)} onSaved={(post) => {
          setCmsBlogs((prev) => [post as unknown as BlogFixture, ...prev]);
          setShowForm(false);
        }} />
      )}

      {/* Search */}
      <div className="blg-search-wrap">
        <Search size={15} className="blg-search-icon" />
        <input type="text" placeholder="Search posts…" value={search}
          onChange={(e) => setSearch(e.target.value)} className="blg-search" />
      </div>

      <p className="blg-count">{filtered.length} post{filtered.length !== 1 ? 's' : ''}</p>

      <div className="blg-list">
        <AnimatePresence>
          {filtered.map((post, i) => {
            const isFixture = blogFixtures.some((f) => f.slug === post.slug);
            const color = CATEGORY_COLORS[post.category] || '#6958FF';
            return (
              <motion.div
                key={post.slug}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.28, delay: i * 0.04 }}
                className="blg-item"
              >
                <div className="blg-item__cat" style={{ background: color + '18', color }}>
                  {post.category.replace(/_/g, ' ')}
                </div>
                <div className="blg-item__info">
                  <div className="blg-item__title-row">
                    <h3 className="blg-item__title">{post.title}</h3>
                    {post.pdfUrl && <span className="blg-item__pdf">{isPresentationUrl(post.pdfUrl) ? '📊 PPT' : '📄 PDF'}</span>}
                    {isFixture && <span className="blg-item__fixture">Fixture</span>}
                    {post.externalUrl && (
                      <a href={post.externalUrl} target="_blank" rel="noopener noreferrer" className="blg-item__ext">
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  <p className="blg-item__excerpt">{post.excerpt}</p>
                  <div className="blg-item__meta">
                    <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span>· {post.readTime} min read</span>
                  </div>
                </div>
                <div className="blg-item__actions">
                  {!isFixture && (
                    <button onClick={() => handleDelete(post.slug)}
                      disabled={deleting === post.slug}
                      className="blg-btn blg-btn--delete" title="Delete">
                      {deleting === post.slug ? <Loader2 size={13} className="blg-spin" /> : <Trash2 size={13} />}
                    </button>
                  )}
                  <Link href={`/blog/${post.slug}`} target="_blank"
                    className="blg-btn blg-btn--view" title="View live">
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="blg-empty">
            <FileText size={32} />
            <p>No posts found. <button onClick={() => setShowForm(true)} className="blg-empty__link">Write your first →</button></p>
          </div>
        )}
      </div>

      <style jsx>{`
        .blg-page {
          min-height: 100vh;
          background: #060d1f;
          color: #F0F0F5;
          padding: 32px 28px 80px;
          font-family: 'Inter', sans-serif;
        }

        .blg-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .blg-back {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 0.82rem; color: rgba(160,168,192,0.60);
          text-decoration: none; transition: color 0.2s;
        }
        .blg-back:hover { color: #6958FF; }

        .blg-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.6rem; font-weight: 800;
          letter-spacing: -0.03em; flex: 1;
        }

        .blg-pdf-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 18px; border-radius: 11px;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.22), rgba(105, 88, 255, 0.28));
          border: 1px solid rgba(239, 68, 68, 0.40);
          color: #FCA5A5; font-size: 0.83rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .blg-pdf-btn:hover {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.32), rgba(105, 88, 255, 0.38));
          color: #FFFFFF; transform: translateY(-1px);
        }

        .blg-add-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 10px 20px; border-radius: 11px;
          background: linear-gradient(135deg, #6958FF, #8B7AFF);
          color: white; font-size: 0.83rem; font-weight: 600;
          border: none; cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(105,88,255,0.30);
        }
        .blg-add-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(105,88,255,0.45); }

        .blg-item__pdf {
          font-size: 0.64rem; color: #FCA5A5;
          background: rgba(239, 68, 68, 0.12);
          padding: 2px 6px; border-radius: 5px;
          border: 1px solid rgba(239, 68, 68, 0.30);
          font-weight: 700;
        }

        .blg-search-wrap { position: relative; max-width: 440px; margin-bottom: 16px; }
        .blg-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: rgba(160,168,192,0.45); }
        .blg-search {
          width: 100%; padding: 11px 16px 11px 38px;
          border-radius: 11px; background: rgba(13,27,62,0.65);
          border: 1px solid rgba(105,88,255,0.20); color: #F0F0F5;
          font-size: 0.86rem; outline: none; transition: border-color 0.2s;
        }
        .blg-search:focus { border-color: #6958FF; }
        .blg-search::placeholder { color: rgba(160,168,192,0.35); }

        .blg-count { font-size: 0.78rem; color: rgba(160,168,192,0.45); margin-bottom: 20px; }

        .blg-list { display: flex; flex-direction: column; gap: 10px; max-width: 820px; }

        .blg-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: rgba(13,27,62,0.60);
          border: 1px solid rgba(105,88,255,0.14);
          border-radius: 14px;
          transition: all 0.2s;
        }
        .blg-item:hover { border-color: rgba(105,88,255,0.32); }

        .blg-item__cat {
          padding: 4px 10px; border-radius: 7px;
          font-size: 0.66rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.06em;
          white-space: nowrap; flex-shrink: 0;
        }

        .blg-item__info { flex: 1; min-width: 0; }

        .blg-item__title-row {
          display: flex; align-items: center; gap: 8px; margin-bottom: 4px;
        }

        .blg-item__title { font-size: 0.90rem; font-weight: 600; color: #F0F0F5; }

        .blg-item__fixture {
          font-size: 0.64rem; color: rgba(160,168,192,0.45);
          background: rgba(105,88,255,0.10);
          padding: 2px 6px; border-radius: 5px;
          border: 1px solid rgba(105,88,255,0.16);
        }

        .blg-item__ext {
          color: rgba(160,168,192,0.40);
          display: flex; align-items: center;
          text-decoration: none; transition: color 0.2s;
        }
        .blg-item__ext:hover { color: #6958FF; }

        .blg-item__excerpt {
          font-size: 0.76rem; color: rgba(160,168,192,0.50);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          margin-bottom: 5px;
        }

        .blg-item__meta {
          display: flex; gap: 4px;
          font-size: 0.70rem; color: rgba(160,168,192,0.40);
        }

        .blg-item__actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

        .blg-btn {
          width: 32px; height: 32px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid transparent; cursor: pointer;
          transition: all 0.18s; text-decoration: none; background: none;
        }
        .blg-btn--delete {
          color: #F87171; border-color: rgba(248,113,113,0.22);
          background: rgba(248,113,113,0.08);
        }
        .blg-btn--delete:hover { background: rgba(248,113,113,0.18); border-color: #F87171; }
        .blg-btn--delete:disabled { opacity: 0.45; cursor: not-allowed; }

        .blg-btn--view {
          color: rgba(160,168,192,0.50);
          border-color: rgba(105,88,255,0.12);
        }
        .blg-btn--view:hover { color: #F0F0F5; border-color: rgba(105,88,255,0.30); }

        .blg-spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .blg-empty {
          display: flex; flex-direction: column; align-items: center;
          gap: 12px; padding: 60px 20px;
          color: rgba(160,168,192,0.40); text-align: center;
        }
        .blg-empty__link {
          background: none; border: none; color: #6958FF; cursor: pointer;
          text-decoration: underline; font-size: inherit;
        }
      `}</style>
    </div>
  );
}

export default function AdminBlogPage() {
  return (
    <AdminGuard>
      <BlogListContent />
    </AdminGuard>
  );
}
