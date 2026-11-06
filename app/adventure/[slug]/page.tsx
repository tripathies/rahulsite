'use client';

import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Camera, Plane, Clock, Star, CheckCircle } from 'lucide-react';
import Navbar from '@/components/navigation/Navbar';
import SunsetFooter from '@/components/footer/SunsetFooter';
import { adventureFixtures } from '@/lib/fixtures';
import { useContent } from '@/components/admin/useContent';
import ContentTools from '@/components/admin/ContentTools';
import ContentBody from '@/components/sections/ContentBody';
import PdfViewer from '@/components/pdf/PdfViewer';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function AdventureDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const content = useContent('adventures', adventureFixtures);
  const adventure = content.items.find((entry) => entry.slug === slug);
  if (!adventure) return <><Navbar /><main id="main-content" className="container-site" style={{ paddingTop: 120, minHeight: '70vh' }}><p>{content.error || (content.loading ? 'Loading travel story...' : 'Travel story not found.')}</p><Link href="/travel">Back to travel</Link></main><SunsetFooter /></>;

  const styleMap = {
    'remote-work': { label: '💻 Remote Work', color: '#6958FF' },
    solo: { label: '🎒 Solo', color: '#FF8A3D' },
    team: { label: '👥 Team', color: '#10B981' },
    leisure: { label: '✈️ Leisure', color: '#06B6D4' },
  };
  const style = styleMap[adventure.travelStyle];

  return (
    <>
      <Navbar />
      <main id="main-content" className="adv-detail">

        {/* ── Cinematic Hero ── */}
        <div className="adv-detail__hero">
          <img src={adventure.coverImage} alt={adventure.destination} className="adv-detail__hero-img" />
          <div className="adv-detail__hero-overlay" />

          <div className="container-site adv-detail__hero-inner">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="adv-detail__hero-content"
            >
              <Link href="/travel" className="adv-detail__back">
                <ArrowLeft size={16} /> Back to Adventures
              </Link>

              <div className="adv-detail__badges">
                {adventure.isCurrent && (
                  <span className="adv-detail__live">
                    <span className="adv-detail__live-dot" /> Currently Here
                  </span>
                )}
                <span className="adv-detail__style-badge" style={{ background: style.color + '22', color: style.color, borderColor: style.color + '44' }}>
                  {style.label}
                </span>
              </div>

              <h1 className="adv-detail__title">
                {adventure.emoji} {adventure.destination}
              </h1>
              <div className="adv-detail__subtitle-row">
                <span className="adv-detail__country">
                  <MapPin size={14} /> {adventure.country}
                </span>
                <span className="adv-detail__cities">{adventure.cities.join(' • ')}</span>
              </div>
              <div className="adv-detail__date">
                <Calendar size={13} />
                {formatDate(adventure.visitedAt)}{adventure.endedAt ? ` — ${formatDate(adventure.endedAt)}` : ' — Present'}
              </div>
            </motion.div>

            {/* Profile photo at this location */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="adv-detail__profile-block"
            >
              <div className="adv-detail__profile-ring">
                <Image
                  src={adventure.profilePhotoAtLocation}
                  alt="Rahul at this location"
                  width={140}
                  height={140}
                  unoptimized
                  className="adv-detail__profile-img"
                  style={{ width: '140px', height: '140px' }}
                />
              </div>
              <div className="adv-detail__profile-glow" />
              <p className="adv-detail__profile-caption">📍 Rahul in {adventure.destination}</p>
            </motion.div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="container-site adv-detail__body">
          <ContentTools type="adventures" item={adventure} source={content.source} onChanged={content.reload} />

          {/* Excerpt */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="adv-detail__excerpt"
          >
            {adventure.excerpt}
          </motion.p>

          <div className="adv-detail__grid">

            {/* Left: Highlights + Photos */}
            <div className="adv-detail__main">
              {adventure.pdfUrl && (
                <div style={{ marginBottom: '32px' }}>
                  <PdfViewer url={adventure.pdfUrl} title={adventure.destination} height="850px" />
                </div>
              )}
              <ContentBody content={adventure.content || ''} videos={adventure.videos} />

              {/* Highlights */}
              <div className="adv-detail__section">
                <h2 className="adv-detail__section-title">
                  <Star size={18} /> Highlights
                </h2>
                <ul className="adv-detail__highlights">
                  {adventure.highlights.map((h, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                      className="adv-detail__highlight-item"
                    >
                      <CheckCircle size={16} className="adv-detail__check" />
                      {h}
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Photo Gallery */}
              <div className="adv-detail__section">
                <h2 className="adv-detail__section-title">
                  <Camera size={18} /> Photo Gallery
                </h2>
                <div className="adv-detail__gallery">
                  {adventure.photos.map((src, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.45, delay: 0.3 + i * 0.1 }}
                      className={`adv-detail__photo ${i === 0 ? 'is-featured' : ''}`}
                    >
                      <img src={src} alt={`${adventure.destination} photo ${i + 1}`} />
                    </motion.div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right: Info Sidebar */}
            <aside className="adv-detail__sidebar">
              <div className="adv-detail__info-card">
                <h3 className="adv-detail__info-title">Trip Info</h3>

                <div className="adv-detail__info-row">
                  <span className="adv-detail__info-label"><Plane size={13} /> Destination</span>
                  <span className="adv-detail__info-val">{adventure.destination}</span>
                </div>
                <div className="adv-detail__info-row">
                  <span className="adv-detail__info-label"><MapPin size={13} /> Cities</span>
                  <span className="adv-detail__info-val">{adventure.cities.join(', ')}</span>
                </div>
                <div className="adv-detail__info-row">
                  <span className="adv-detail__info-label"><Calendar size={13} /> Arrived</span>
                  <span className="adv-detail__info-val">{formatDate(adventure.visitedAt)}</span>
                </div>
                {adventure.endedAt && (
                  <div className="adv-detail__info-row">
                    <span className="adv-detail__info-label"><Clock size={13} /> Departed</span>
                    <span className="adv-detail__info-val">{formatDate(adventure.endedAt)}</span>
                  </div>
                )}
                <div className="adv-detail__info-row">
                  <span className="adv-detail__info-label">🎒 Style</span>
                  <span className="adv-detail__info-val" style={{ color: style.color }}>{style.label}</span>
                </div>
                <div className="adv-detail__info-row">
                  <span className="adv-detail__info-label"><Camera size={13} /> Photos</span>
                  <span className="adv-detail__info-val">{adventure.photos.length} captured</span>
                </div>
              </div>

              {/* More adventures */}
              <div className="adv-detail__more">
                <h3 className="adv-detail__info-title">More Adventures</h3>
                {content.items
                  .filter((a) => a.slug !== adventure.slug)
                  .slice(0, 3)
                  .map((a) => (
                    <Link key={a.slug} href={`/travel/${a.slug}`} className="adv-detail__more-item">
                      <img src={a.coverImage} alt={a.destination} className="adv-detail__more-thumb" />
                      <div>
                        <p className="adv-detail__more-dest">{a.emoji} {a.destination}</p>
                        <p className="adv-detail__more-date">{formatDate(a.visitedAt)}</p>
                      </div>
                    </Link>
                  ))}
              </div>
            </aside>

          </div>
        </div>
      </main>
      <SunsetFooter />

      <style jsx>{`
        .adv-detail {
          min-height: 100vh;
          padding-top: 80px;
        }

        /* Hero */
        .adv-detail__hero {
          position: relative;
          height: 460px;
          overflow: hidden;
        }

        .adv-detail__hero-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: brightness(0.55) saturate(1.15);
        }

        .adv-detail__hero-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(to right, rgba(8,18,41,0.95) 0%, rgba(8,18,41,0.6) 55%, rgba(8,18,41,0.35) 100%),
            linear-gradient(to top, rgba(8,18,41,1) 0%, transparent 45%);
        }

        .adv-detail__hero-inner {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          padding-bottom: 40px;
          gap: 24px;
          flex-wrap: wrap;
        }

        .adv-detail__hero-content { max-width: 600px; }

        .adv-detail__back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          color: rgba(240,240,245,0.65);
          text-decoration: none;
          margin-bottom: 16px;
          transition: color 0.2s;
        }
        .adv-detail__back:hover { color: #FF8A3D; }

        .adv-detail__badges {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .adv-detail__live {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(74,222,128,0.15);
          border: 1px solid rgba(74,222,128,0.35);
          color: #4ADE80;
          padding: 4px 11px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .adv-detail__live-dot {
          width: 7px; height: 7px;
          border-radius: 50%; background: #4ADE80;
          animation: live-pulse 2s infinite;
        }

        @keyframes live-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(74,222,128,0.6); }
          70%  { box-shadow: 0 0 0 8px rgba(74,222,128,0); }
          100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
        }

        .adv-detail__style-badge {
          padding: 4px 11px;
          border-radius: 8px;
          font-size: 0.72rem;
          font-weight: 600;
          border: 1px solid transparent;
        }

        .adv-detail__title {
          font-family: var(--font-display);
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 800;
          color: #F0F0F5;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin-bottom: 10px;
        }

        .adv-detail__subtitle-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }

        .adv-detail__country {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.84rem;
          color: #FF8A3D;
          font-weight: 600;
        }

        .adv-detail__cities {
          font-size: 0.82rem;
          color: rgba(240,240,245,0.55);
        }

        .adv-detail__date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          color: rgba(240,240,245,0.50);
        }

        /* Profile block */
        .adv-detail__profile-block {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .adv-detail__profile-ring {
          width: 148px; height: 148px;
          border-radius: 50%;
          padding: 3px;
          background: linear-gradient(135deg, #6958FF, #FF8A3D);
          box-shadow: 0 0 40px rgba(105,88,255,0.50), 0 0 80px rgba(105,88,255,0.20);
        }

        .adv-detail__profile-img {
          border-radius: 50%;
          object-fit: cover;
          background: #0D1B3E;
          width: 140px !important;
          height: 140px !important;
        }

        .adv-detail__profile-glow {
          position: absolute;
          width: 160px; height: 160px;
          top: -6px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(105,88,255,0.35) 0%, transparent 70%);
          animation: profile-glow 3s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes profile-glow {
          0%,100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.12); }
        }

        .adv-detail__profile-caption {
          font-size: 0.74rem;
          color: rgba(240,240,245,0.55);
          text-align: center;
          margin-top: 4px;
        }

        /* Body */
        .adv-detail__body {
          padding: 52px 0 100px;
        }

        .adv-detail__excerpt {
          font-size: 1.15rem;
          color: var(--text-secondary);
          line-height: 1.75;
          max-width: 740px;
          margin-bottom: 48px;
          border-left: 3px solid #6958FF;
          padding-left: 20px;
        }

        .adv-detail__grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 40px;
          align-items: start;
        }

        @media (max-width: 900px) {
          .adv-detail__grid { grid-template-columns: 1fr; }
          .adv-detail__hero { height: 380px; }
          .adv-detail__profile-block { display: none; }
        }

        .adv-detail__section { margin-bottom: 48px; }

        .adv-detail__section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-display);
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 20px;
        }

        .adv-detail__highlights { list-style: none; display: flex; flex-direction: column; gap: 12px; }

        .adv-detail__highlight-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 0.92rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .adv-detail__check { color: #6958FF; flex-shrink: 0; margin-top: 2px; }

        /* Gallery */
        .adv-detail__gallery {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
        }

        .adv-detail__photo {
          border-radius: 14px;
          overflow: hidden;
          aspect-ratio: 4/3;
        }

        .adv-detail__photo.is-featured {
          grid-column: span 2;
          aspect-ratio: 16/9;
        }

        .adv-detail__photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .adv-detail__photo:hover img { transform: scale(1.05); }

        /* Sidebar */
        .adv-detail__info-card,
        .adv-detail__more {
          background: var(--glass-bg);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--glass-border);
          border-radius: 18px;
          padding: 22px;
          margin-bottom: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }

        .adv-detail__info-title {
          font-family: var(--font-display);
          font-size: 0.88rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--text-primary);
          margin-bottom: 16px;
        }

        .adv-detail__info-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 0;
          border-bottom: 1px solid var(--border-subtle);
          font-size: 0.84rem;
        }

        .adv-detail__info-row:last-child { border-bottom: none; }

        .adv-detail__info-label {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .adv-detail__info-val {
          color: var(--text-primary);
          font-weight: 600;
          text-align: right;
          max-width: 160px;
        }

        /* More adventures */
        .adv-detail__more-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid var(--border-subtle);
          text-decoration: none;
          color: inherit;
          transition: all 0.2s;
        }

        .adv-detail__more-item:last-child { border-bottom: none; }
        .adv-detail__more-item:hover { padding-left: 4px; }

        .adv-detail__more-thumb {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .adv-detail__more-dest {
          font-size: 0.84rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .adv-detail__more-date {
          font-size: 0.72rem;
          color: var(--text-muted);
          margin-top: 2px;
        }
      `}</style>
    </>
  );
}

