'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Calendar, Plane, ArrowRight, Globe, Camera, Sparkles, Clock } from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';
import SunsetFooter from '@/components/footer/SunsetFooter';
import { adventureFixtures, AdventureEntry } from '@/lib/fixtures';
import { useContent } from '@/components/admin/useContent';
import ContentTools from '@/components/admin/ContentTools';
import { isPresentationUrl, type ContentRecord } from '@/lib/content';

const FILTERS = ['All', 'Current', 'Remote Work', 'Solo', 'Leisure'] as const;
type Filter = typeof FILTERS[number];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function styleLabel(style: AdventureEntry['travelStyle']) {
  const map = {
    'remote-work': { label: '💻 Remote Work', color: '#6958FF' },
    solo: { label: '🎒 Solo', color: '#FF8A3D' },
    team: { label: '👥 Team', color: '#10B981' },
    leisure: { label: '✈️ Leisure', color: '#06B6D4' },
  };
  return map[style];
}

// ─── Adventure Card ───────────────────────────────────────────────────
function AdventureCard({ entry, index, source, onChanged }: { entry: AdventureEntry & ContentRecord; index: number; source: string; onChanged: () => void }) {
  const style = styleLabel(entry.travelStyle);

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      className="adv-card"
    >
      <Link href={`/travel/${entry.slug}`} className="adv-card__link">
        {/* Cover image */}
        <div className="adv-card__cover" style={{ height: '260px', maxHeight: '260px', overflow: 'hidden' }}>
          <img
            src={entry.coverImage}
            alt={entry.destination}
            className="adv-card__img"
            style={{ width: '100%', height: '260px', objectFit: 'cover', objectPosition: 'center 30%', display: 'block' }}
          />
          {/* Dark gradient overlay */}
          <div className="adv-card__overlay" />

          {/* Current live badge */}
          {entry.isCurrent && (
            <div className="adv-card__live-badge">
              <span className="adv-card__live-dot" />
              Live Now
            </div>
          )}

          {/* Travel style chip */}
          <div className="adv-card__style-chip" style={{ background: style.color + '22', borderColor: style.color + '55' }}>
            <span style={{ color: style.color, fontSize: '0.72rem', fontWeight: 600 }}>{style.label}</span>
          </div>

          {/* PDF Guide badge */}
          {entry.pdfUrl && (
            <div style={{
              position: 'absolute', top: 12, right: 12,
              background: 'rgba(239, 68, 68, 0.90)', color: '#FFFFFF',
              padding: '4px 9px', borderRadius: '8px', fontSize: '0.70rem', fontWeight: 700,
              letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: '4px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', zIndex: 4,
            }}>
              {isPresentationUrl(entry.pdfUrl) ? '📊 PPT Guide' : '📄 PDF Guide'}
            </div>
          )}

          {/* Profile photo pinned at bottom-left — Rahul at this location */}
          <div className="adv-card__profile-pin">
            <Image
              src={entry.profilePhotoAtLocation}
              alt={`At ${entry.destination}`}
              width={60}
              height={60}
              unoptimized
              className="adv-card__profile-img"
              style={{ width: '60px', height: '60px' }}
            />
            <div className="adv-card__profile-glow" />
          </div>

          {/* Bottom info on card */}
          <div className="adv-card__info">
            <div className="adv-card__flag">{entry.emoji}</div>
            <div>
              <h3 className="adv-card__destination">{entry.destination}</h3>
              <p className="adv-card__cities">{entry.cities.join(' • ')}</p>
            </div>
          </div>
        </div>

        {/* Card body */}
        <div className="adv-card__body">
          <div className="adv-card__meta">
            <span className="adv-card__date">
              <Calendar size={11} />
              {formatDate(entry.visitedAt)}{entry.endedAt ? ` → ${formatDate(entry.endedAt)}` : ' → Now'}
            </span>
            <span className="adv-card__photos-count">
              <Camera size={11} /> {entry.photos.length} photos
            </span>
          </div>
          <p className="adv-card__excerpt">{entry.excerpt}</p>
          <ul className="adv-card__highlights">
            {entry.highlights.slice(0, 2).map((h, i) => (
              <li key={i}>✦ {h}</li>
            ))}
          </ul>
          <div className="adv-card__cta">
            Read Story <ArrowRight size={13} />
          </div>
        </div>
      </Link>
      <div style={{ padding: '0 20px' }}>
        {entry.isPublished === false && <small>Draft</small>}
        <ContentTools type="adventures" item={entry} source={source} onChanged={onChanged} />
      </div>
    </motion.article>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────
export default function AdventurePage() {
  const [filter, setFilter] = useState<Filter>('All');
  const content = useContent('adventures', adventureFixtures);
  const currentAdventure = content.items.find((a) => a.isCurrent);

  const filtered = content.items.filter((a) => {
    if (filter === 'All') return true;
    if (filter === 'Current') return a.isCurrent;
    if (filter === 'Remote Work') return a.travelStyle === 'remote-work';
    if (filter === 'Solo') return a.travelStyle === 'solo';
    if (filter === 'Leisure') return a.travelStyle === 'leisure';
    return true;
  });

  const countriesVisited = new Set(content.items.map((a) => a.country)).size;

  return (
    <>
      <Navbar />
      <main id="main-content" className="adv-page">

        {/* ── Hero Banner ─────────────────────────── */}
        <section className="adv-hero">
          {/* Parallax background using current adventure cover */}
          {currentAdventure && (
            <div className="adv-hero__bg">
              <img src={currentAdventure.coverImage} alt="" aria-hidden className="adv-hero__bg-img" />
              <div className="adv-hero__bg-overlay" />
            </div>
          )}

          <div className="container-site adv-hero__inner">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="adv-hero__content"
            >
              <div className="adv-hero__eyebrow">
                <Plane size={16} />
                <span>Adventure Journal</span>
              </div>

              <h1 className="adv-hero__title">
                Build. Explore.<br />
                <span className="adv-hero__title-accent">Share.</span>
              </h1>
              <p className="adv-hero__subtitle">
                Engineering from anywhere. {countriesVisited} countries explored. Stories from every timezone.
              </p>

              <div className="adv-hero__stats">
                <div className="adv-hero__stat">
                  <Globe size={18} />
                  <span><strong>{countriesVisited}</strong> Countries</span>
                </div>
                <div className="adv-hero__stat">
                  <Plane size={18} />
                  <span><strong>{content.items.length}</strong> Adventures</span>
                </div>
                <div className="adv-hero__stat">
                  <Camera size={18} />
                  <span><strong>{content.items.reduce((acc, a) => acc + a.photos.length, 0)}</strong> Photos</span>
                </div>
              </div>
            </motion.div>

            {/* Current Adventure Card */}
            {currentAdventure && (
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="adv-hero__current"
              >
                <div className="adv-hero__current-label">
                  <span className="adv-hero__live-dot" />
                  Current Adventure
                </div>
                <div className="adv-hero__current-location">
                  <MapPin size={16} className="adv-hero__pin-icon" />
                  <div>
                    <p className="adv-hero__current-dest">{currentAdventure.destination}</p>
                    <p className="adv-hero__current-cities">{currentAdventure.cities.join(' • ')}</p>
                  </div>
                </div>
                <div className="adv-hero__current-date">
                  <Clock size={12} />
                  Since {formatDate(currentAdventure.visitedAt)}
                </div>
                <Link href={`/travel/${currentAdventure.slug}`} className="adv-hero__current-cta">
                  View Adventure <ArrowRight size={14} />
                </Link>
              </motion.div>
            )}
          </div>
        </section>

        {/* ── Filter Tabs + Grid ──────────────────── */}
        <section className="adv-section">
          <div className="container-site">
            <ContentTools type="adventures" source={content.source} onChanged={content.reload} importItems={adventureFixtures} />
            {content.error && <p role="alert">{content.error}</p>}

            {/* Filter tabs */}
            <div className="adv-filters">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`adv-filter-btn ${filter === f ? 'is-active' : ''}`}
                >
                  {f}
                </button>
              ))}
              <div className="adv-filters__count">{filtered.length} adventures</div>
            </div>

            {/* Adventure Grid */}
            <div className="adv-grid">
              <AnimatePresence mode="popLayout">
                {filtered.map((entry, i) => (
                  <AdventureCard key={entry.slug} entry={entry} index={i} source={content.source} onChanged={content.reload} />
                ))}
              </AnimatePresence>
            </div>

            {/* Where Next teaser */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="adv-where-next"
            >
              <div className="adv-where-next__icon">
                <Sparkles size={28} />
              </div>
              <h3>Where Next?</h3>
              <p>The map is always open. Follow along for the next adventure.</p>
            </motion.div>

          </div>
        </section>
      </main>

      <SunsetFooter />

      <style jsx>{`

        .adv-page {
          min-height: 100vh;
          padding-top: 110px;
        }

        /* ── Hero ── */
        .adv-hero {
          position: relative;
          min-height: 480px;
          display: flex;
          align-items: center;
          overflow: hidden;
          margin-bottom: 0;
        }

        .adv-hero__bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .adv-hero__bg-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(1.2) brightness(0.55);
        }

        .adv-hero__bg-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(to right, rgba(8, 18, 41, 0.92) 0%, rgba(8, 18, 41, 0.55) 55%, rgba(8, 18, 41, 0.30) 100%),
            linear-gradient(to top, rgba(8, 18, 41, 1) 0%, transparent 40%);
        }

        .adv-hero__inner {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 40px;
          padding-top: 70px;
          padding-bottom: 60px;
          flex-wrap: wrap;
        }

        .adv-hero__content {
          flex: 1;
          min-width: 280px;
          max-width: 560px;
        }

        .adv-hero__eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 138, 61, 0.15);
          border: 1px solid rgba(255, 138, 61, 0.3);
          color: #FF8A3D;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        .adv-hero__title {
          font-family: var(--font-display);
          font-size: clamp(2.4rem, 5vw, 3.8rem);
          font-weight: 800;
          line-height: 1.08;
          color: #F0F0F5;
          margin-bottom: 16px;
          letter-spacing: -0.03em;
        }

        .adv-hero__title-accent {
          background: linear-gradient(135deg, #FF8A3D, #FFB366);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .adv-hero__subtitle {
          font-size: 1.05rem;
          color: rgba(240, 240, 245, 0.75);
          line-height: 1.65;
          margin-bottom: 28px;
          max-width: 440px;
        }

        .adv-hero__stats {
          display: flex;
          gap: 28px;
          flex-wrap: wrap;
        }

        .adv-hero__stat {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.88rem;
          color: rgba(240, 240, 245, 0.70);
        }

        .adv-hero__stat strong { color: #FF8A3D; }

        /* Current card */
        .adv-hero__current {
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          padding: 24px;
          min-width: 240px;
          max-width: 300px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }

        .adv-hero__current-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #4ADE80;
        }

        .adv-hero__live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4ADE80;
          box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.6);
          animation: live-pulse 2s infinite;
          flex-shrink: 0;
        }

        @keyframes live-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.6); }
          70%  { box-shadow: 0 0 0 8px rgba(74, 222, 128, 0); }
          100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
        }

        .adv-hero__current-location {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .adv-hero__pin-icon { color: #FF8A3D; margin-top: 2px; flex-shrink: 0; }

        .adv-hero__current-dest {
          font-family: var(--font-display);
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .adv-hero__current-cities {
          font-size: 0.78rem;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .adv-hero__current-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .adv-hero__current-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #FF8A3D, #FF9F5A);
          color: white;
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 0.82rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(255, 138, 61, 0.3);
          width: fit-content;
        }

        .adv-hero__current-cta:hover {
          transform: translateX(2px);
          box-shadow: 0 6px 20px rgba(255, 138, 61, 0.45);
        }

        /* ── Section ── */
        .adv-section {
          padding: 60px 0 100px;
        }

        /* ── Filters ── */
        .adv-filters {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 40px;
        }

        .adv-filter-btn {
          padding: 8px 20px;
          border-radius: 999px;
          font-size: 0.84rem;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid var(--glass-border);
          background: var(--glass-bg);
          color: var(--text-secondary);
          transition: all 0.2s;
        }

        .adv-filter-btn:hover {
          border-color: rgba(105, 88, 255, 0.5);
          color: var(--text-primary);
          background: rgba(105, 88, 255, 0.12);
        }

        .adv-filter-btn.is-active {
          background: linear-gradient(135deg, #6958FF, #8B7AFF);
          border-color: transparent;
          color: white;
          box-shadow: 0 4px 16px rgba(105, 88, 255, 0.35);
        }

        .adv-filters__count {
          margin-left: auto;
          font-size: 0.80rem;
          color: var(--text-muted);
        }

        /* ── Grid ── */
        .adv-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
          gap: 28px;
          margin-bottom: 64px;
          align-items: stretch;
        }

        /* ── Card ── */
        .adv-card {
          border-radius: 20px;
          overflow: hidden;
          background: var(--glass-bg);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--glass-border);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
          display: flex;
          flex-direction: column;
          height: 100%;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border-color 0.3s;
        }

        .adv-card:hover {
          transform: translateY(-6px);
          border-color: rgba(105, 88, 255, 0.45);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.20), 0 0 0 1px rgba(105, 88, 255, 0.20);
        }

        .adv-card__link {
          display: flex;
          flex-direction: column;
          text-decoration: none;
          color: inherit;
          height: 100%;
          flex: 1;
        }

        .adv-card__cover {
          position: relative;
          height: 260px;
          width: 100%;
          overflow: hidden;
          flex-shrink: 0;
        }

        .adv-card__img {
          width: 100% !important;
          height: 260px !important;
          object-fit: cover !important;
          object-position: center 30% !important;
          display: block;
          transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .adv-card:hover .adv-card__img {
          transform: scale(1.06);
        }

        .adv-card__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(8, 18, 41, 0.05) 0%,
            rgba(8, 18, 41, 0.20) 50%,
            rgba(8, 18, 41, 0.85) 100%
          );
        }

        .adv-card__live-badge {
          position: absolute;
          top: 14px;
          right: 14px;
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(13, 27, 62, 0.80);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(74, 222, 128, 0.40);
          color: #4ADE80;
          padding: 5px 11px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .adv-card__live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #4ADE80;
          animation: live-pulse 2s infinite;
        }

        .adv-card__style-chip {
          position: absolute;
          top: 14px;
          left: 14px;
          backdrop-filter: blur(10px);
          padding: 4px 10px;
          border-radius: 8px;
          border: 1px solid transparent;
        }

        /* Profile photo pin — Rahul at location */
        .adv-card__profile-pin {
          position: absolute;
          bottom: 14px;
          left: 16px;
          z-index: 2;
          width: 56px;
          height: 56px;
        }

        .adv-card__profile-img {
          border-radius: 50%;
          border: 2px solid rgba(105, 88, 255, 0.70);
          object-fit: cover;
          width: 56px !important;
          height: 56px !important;
          background: #0D1B3E;
          box-shadow: 0 0 0 3px rgba(13, 27, 62, 0.8), 0 4px 20px rgba(0,0,0,0.5);
        }

        .adv-card__profile-glow {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(105, 88, 255, 0.45) 0%, transparent 70%);
          pointer-events: none;
          animation: profile-glow-pulse 3s ease-in-out infinite;
        }

        @keyframes profile-glow-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        .adv-card__info {
          position: absolute;
          bottom: 14px;
          left: 84px;
          right: 14px;
        }

        .adv-card__flag { font-size: 1.2rem; margin-bottom: 2px; }

        .adv-card__destination {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 700;
          color: white;
          text-shadow: 0 2px 8px rgba(0,0,0,0.7);
          line-height: 1.2;
        }

        .adv-card__cities {
          font-size: 0.74rem;
          color: rgba(255,255,255,0.75);
          margin-top: 1px;
        }

        /* Card body */
        .adv-card__body {
          padding: 18px 20px 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 12px;
          flex: 1;
        }

        .adv-card__meta {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .adv-card__date,
        .adv-card__photos-count {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .adv-card__excerpt {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.65;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .adv-card__highlights {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 0;
          margin: 0;
        }

        .adv-card__highlights li {
          font-size: 0.76rem;
          color: var(--text-secondary);
        }

        .adv-card__cta {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #6958FF;
          margin-top: 6px;
          transition: gap 0.2s;
        }

        .adv-card:hover .adv-card__cta {
          gap: 9px;
        }

        /* ── Where Next ── */
        .adv-where-next {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 60px 20px;
          gap: 12px;
          border: 1px dashed var(--glass-border);
          border-radius: 24px;
          background: var(--glass-bg);
        }

        .adv-where-next__icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(105, 88, 255, 0.12);
          border: 1px solid rgba(105, 88, 255, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8B7AFF;
          margin-bottom: 4px;
        }

        .adv-where-next h3 {
          font-family: var(--font-display);
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .adv-where-next p {
          font-size: 0.88rem;
          color: var(--text-muted);
          max-width: 360px;
        }

        @media (max-width: 768px) {
          .adv-hero__inner { flex-direction: column; }
          .adv-hero__current { max-width: 100%; width: 100%; }
          .adv-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}

