'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, MapPin, Calendar, ArrowLeft, Search, ChevronRight, Plane, FileText } from 'lucide-react';
import AdminGuard, { getAdminToken } from '@/components/admin/AdminGuard';
import { adventureFixtures, AdventureEntry } from '@/lib/fixtures';
import { isPresentationUrl } from '@/lib/content';
import ContentComposer from '@/components/admin/ContentComposer';

function AdventuresList() {
  const [cmsEntries, setCmsEntries] = useState<AdventureEntry[]>([]);
  const [search, setSearch] = useState('');
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/data/adventures', {
      headers: { 'x-admin-token': getAdminToken() },
    })
      .then((r) => r.json())
      .then((d) => { if (d.ok) setCmsEntries(d.data); })
      .catch(() => {});
  }, []);

  const allEntries = [...adventureFixtures, ...cmsEntries];
  const filtered = allEntries.filter(
    (a) =>
      a.destination.toLowerCase().includes(search.toLowerCase()) ||
      a.country.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this adventure?')) return;
    setDeleting(id);
    try {
      await fetch('/api/admin/data/adventures', {
        method: 'DELETE',
        headers: { 'x-admin-token': getAdminToken(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setCmsEntries((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="adm-page">
      {/* Header */}
      <header className="adm-header">
        <Link href="/admin/dashboard" className="adm-back">
          <ArrowLeft size={16} /> Dashboard
        </Link>
        <h1 className="adm-title">Adventures</h1>
        <button type="button" onClick={() => setShowPdfModal(true)} className="adm-pdf-btn">
          <Plus size={15} /> New Travel Story
        </button>
        <Link href="/admin/adventures/new" className="adm-add-btn">
          <Plus size={15} /> Add Adventure
        </Link>
      </header>

      {/* PDF Upload Modal */}
      {showPdfModal && (
        <ContentComposer
          type="adventures"
          existing={false}
          onClose={() => setShowPdfModal(false)}
          onSaved={(item) => { setCmsEntries((prev) => [item as unknown as AdventureEntry, ...prev]); setShowPdfModal(false); }}
        />
      )}

      {/* Search */}
      <div className="adm-search-wrap">
        <Search size={15} className="adm-search-icon" />
        <input
          type="text"
          placeholder="Search destinations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="adm-search"
        />
      </div>

      {/* Count */}
      <p className="adm-count">{filtered.length} adventure{filtered.length !== 1 ? 's' : ''}</p>

      {/* List */}
      <div className="adm-list">
        <AnimatePresence>
          {filtered.map((adv, i) => {
            const isFixture = adventureFixtures.some((f) => f.slug === adv.slug);
            return (
              <motion.div
                key={adv.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="adm-item"
              >
                <img src={adv.coverImage} alt={adv.destination} className="adm-item__thumb" />

                <div className="adm-item__info">
                  <div className="adm-item__top">
                    <span className="adm-item__flag">{adv.emoji}</span>
                    <h3 className="adm-item__dest">{adv.destination}</h3>
                    {adv.pdfUrl && <span className="adm-item__pdf">{isPresentationUrl(adv.pdfUrl) ? '📊 PPT' : '📄 PDF'}</span>}
                    {adv.isCurrent && <span className="adm-item__live">● Live</span>}
                    {isFixture && <span className="adm-item__fixture">Fixture</span>}
                  </div>
                  <div className="adm-item__meta">
                    <span><MapPin size={11} /> {adv.country}</span>
                    <span><Calendar size={11} /> {new Date(adv.visitedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                    <span>🏙 {adv.cities.join(', ')}</span>
                  </div>
                  <p className="adm-item__excerpt">{adv.excerpt}</p>
                </div>

                <div className="adm-item__actions">
                  <Link
                    href={`/admin/adventures/${adv.slug}`}
                    className="adm-btn adm-btn--edit"
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </Link>
                  {!isFixture && (
                    <button
                      onClick={() => handleDelete(adv.id)}
                      disabled={deleting === adv.id}
                      className="adm-btn adm-btn--delete"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <Link href={`/adventure/${adv.slug}`} target="_blank" className="adm-btn adm-btn--view" title="View live">
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="adm-empty">
            <Plane size={32} />
            <p>No adventures found. <Link href="/admin/adventures/new">Add your first one →</Link></p>
          </div>
        )}
      </div>

      <style jsx>{`
        .adm-page {
          min-height: 100vh;
          background: #060d1f;
          color: #F0F0F5;
          padding: 32px 28px 80px;
          font-family: 'Inter', sans-serif;
        }

        .adm-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }

        .adm-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          color: rgba(160,168,192,0.60);
          text-decoration: none;
          transition: color 0.2s;
        }
        .adm-back:hover { color: #6958FF; }

        .adm-title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.6rem;
          font-weight: 800;
          color: #F0F0F5;
          letter-spacing: -0.03em;
          flex: 1;
        }

        .adm-pdf-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 10px 18px;
          border-radius: 11px;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.22), rgba(255, 138, 61, 0.28));
          border: 1px solid rgba(239, 68, 68, 0.40);
          color: #FCA5A5;
          font-size: 0.83rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .adm-pdf-btn:hover {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.32), rgba(255, 138, 61, 0.38));
          color: #FFFFFF;
          transform: translateY(-1px);
        }

        .adm-add-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 10px 20px;
          border-radius: 11px;
          background: linear-gradient(135deg, #FF8A3D, #FF9F5A);
          color: white;
          font-size: 0.83rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(255,138,61,0.30);
        }

        .adm-item__pdf {
          font-size: 0.64rem;
          color: #FCA5A5;
          background: rgba(239, 68, 68, 0.12);
          padding: 2px 6px;
          border-radius: 5px;
          border: 1px solid rgba(239, 68, 68, 0.30);
          font-weight: 700;
        }
        .adm-add-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(255,138,61,0.45);
        }

        .adm-search-wrap {
          position: relative;
          max-width: 440px;
          margin-bottom: 16px;
        }
        .adm-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(160,168,192,0.45);
        }
        .adm-search {
          width: 100%;
          padding: 11px 16px 11px 38px;
          border-radius: 11px;
          background: rgba(13,27,62,0.65);
          border: 1px solid rgba(105,88,255,0.20);
          color: #F0F0F5;
          font-size: 0.86rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .adm-search:focus { border-color: #6958FF; }
        .adm-search::placeholder { color: rgba(160,168,192,0.35); }

        .adm-count {
          font-size: 0.78rem;
          color: rgba(160,168,192,0.45);
          margin-bottom: 20px;
        }

        .adm-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 860px;
        }

        .adm-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: rgba(13,27,62,0.60);
          border: 1px solid rgba(105,88,255,0.15);
          border-radius: 16px;
          transition: all 0.2s;
        }
        .adm-item:hover {
          border-color: rgba(105,88,255,0.35);
          box-shadow: 0 4px 20px rgba(0,0,0,0.20);
        }

        .adm-item__thumb {
          width: 72px; height: 72px;
          border-radius: 12px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .adm-item__info { flex: 1; min-width: 0; }

        .adm-item__top {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          flex-wrap: wrap;
        }

        .adm-item__flag { font-size: 1.1rem; }

        .adm-item__dest {
          font-size: 0.95rem;
          font-weight: 700;
          color: #F0F0F5;
        }

        .adm-item__live {
          font-size: 0.68rem;
          font-weight: 700;
          color: #4ADE80;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .adm-item__fixture {
          font-size: 0.66rem;
          color: rgba(160,168,192,0.45);
          background: rgba(105,88,255,0.10);
          padding: 2px 7px;
          border-radius: 5px;
          border: 1px solid rgba(105,88,255,0.18);
        }

        .adm-item__meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.73rem;
          color: rgba(160,168,192,0.55);
          margin-bottom: 5px;
          flex-wrap: wrap;
        }
        .adm-item__meta span {
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .adm-item__excerpt {
          font-size: 0.78rem;
          color: rgba(160,168,192,0.50);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 460px;
        }

        .adm-item__actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .adm-btn {
          width: 34px; height: 34px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.18s;
          text-decoration: none;
          background: none;
        }
        .adm-btn--edit {
          color: #6958FF;
          border-color: rgba(105,88,255,0.25);
          background: rgba(105,88,255,0.10);
        }
        .adm-btn--edit:hover { background: rgba(105,88,255,0.22); border-color: #6958FF; }

        .adm-btn--delete {
          color: #F87171;
          border-color: rgba(248,113,113,0.22);
          background: rgba(248,113,113,0.08);
        }
        .adm-btn--delete:hover { background: rgba(248,113,113,0.18); border-color: #F87171; }
        .adm-btn--delete:disabled { opacity: 0.45; cursor: not-allowed; }

        .adm-btn--view {
          color: rgba(160,168,192,0.50);
          border-color: rgba(105,88,255,0.12);
        }
        .adm-btn--view:hover { color: #F0F0F5; border-color: rgba(105,88,255,0.30); }

        .adm-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 60px 20px;
          color: rgba(160,168,192,0.40);
          text-align: center;
        }
        .adm-empty a { color: #6958FF; text-decoration: none; }
        .adm-empty a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}

export default function AdminAdventuresPage() {
  return (
    <AdminGuard>
      <AdventuresList />
    </AdminGuard>
  );
}
