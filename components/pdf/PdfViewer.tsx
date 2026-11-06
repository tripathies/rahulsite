'use client';

import { useState, useRef, useEffect } from 'react';
import {
  FileText, Download, ExternalLink, Maximize2, Minimize2,
  Loader2, RefreshCw, AlertCircle, Presentation
} from 'lucide-react';
import { isPresentationUrl } from '@/lib/content';

interface PdfViewerProps {
  url: string;
  title: string;
  height?: string | number;
  className?: string;
}

export default function PdfViewer({ url, title, height = '820px', className = '' }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Fullscreen change listener
  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fallback to CSS fullscreen
      setIsFullscreen(!isFullscreen);
    }
  };

  // Construct viewer URL with browser PDF parameters
  // #toolbar=1&navpanes=1&view=FitH ensures the native viewer displays cleanly
  const isPresentation = isPresentationUrl(url);
  const [viewerUrl, setViewerUrl] = useState(isPresentation ? '' : `${url}#toolbar=1&navpanes=0&view=FitH`);
  const [isLocalHost, setIsLocalHost] = useState(false);

  // Office Online fetches the file itself, so it needs an absolute public URL.
  useEffect(() => {
    if (!isPresentation) return;
    const absolute = new URL(url, window.location.origin).toString();
    setIsLocalHost(/^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(new URL(absolute).hostname));
    setViewerUrl(`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absolute)}`);
  }, [url, isPresentation]);
  const docLabel = isPresentation ? 'Presentation' : 'PDF';

  return (
    <div
      ref={containerRef}
      className={`pdf-viewer-wrap ${isFullscreen ? 'is-fullscreen' : ''} ${className}`}
      style={{ height: isFullscreen ? '100vh' : typeof height === 'number' ? `${height}px` : height }}
    >
      {/* ── Top Control Bar ────────────────────────────────────────────── */}
      <header className="pdf-bar">
        <div className="pdf-bar__left">
          <span className="pdf-bar__badge">
            {isPresentation ? <Presentation size={14} /> : <FileText size={14} />} {docLabel} Document
          </span>
          <span className="pdf-bar__title" title={title}>{title}</span>
        </div>

        <div className="pdf-bar__actions">
          <a
            href={url}
            download
            className="pdf-btn"
            title={`Download ${docLabel}`}
            aria-label={`Download ${docLabel}`}
          >
            <Download size={15} />
            <span className="pdf-btn__label">Download</span>
          </a>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="pdf-btn"
            title="Open in new window"
            aria-label="Open in new window"
          >
            <ExternalLink size={15} />
            <span className="pdf-btn__label">New Tab</span>
          </a>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="pdf-btn"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span className="pdf-btn__label">{isFullscreen ? 'Exit' : 'Full Screen'}</span>
          </button>
        </div>
      </header>

      {/* ── Frame Body ─────────────────────────────────────────────────── */}
      <div className="pdf-body">
        {loading && !isLocalHost && (
          <div className="pdf-loader">
            <Loader2 size={32} className="pdf-spin" />
            <p>Loading document…</p>
          </div>
        )}

        {(error || isLocalHost) && (
          <div className="pdf-error">
            <AlertCircle size={32} />
            <p>{isLocalHost ? 'Presentation preview works once the site is publicly deployed.' : 'Unable to embed this document directly.'}</p>
            <a href={url} target="_blank" rel="noopener noreferrer" className="pdf-error__btn">
              <ExternalLink size={14} /> Open or Download {docLabel}
            </a>
          </div>
        )}

        {viewerUrl && !isLocalHost && (
          <iframe
            src={viewerUrl}
            title={title}
            className="pdf-iframe"
            allowFullScreen
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
          />
        )}
      </div>

      {/* ── Mobile Notice ──────────────────────────────────────────────── */}
      <footer className="pdf-footer-note">
        <span>Tip: On mobile devices, tap <strong>New Tab</strong> or <strong>Full Screen</strong> for the best reading experience.</span>
      </footer>

      <style jsx>{`
        .pdf-viewer-wrap {
          display: flex;
          flex-direction: column;
          background: #081229;
          border: 1px solid rgba(105, 88, 255, 0.28);
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 12px 48px rgba(0, 0, 0, 0.45);
          position: relative;
          transition: all 0.25s ease;
          width: 100%;
        }

        .pdf-viewer-wrap.is-fullscreen {
          position: fixed;
          inset: 0;
          z-index: 99999;
          border-radius: 0;
          border: none;
        }

        .pdf-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 18px;
          background: rgba(13, 27, 62, 0.95);
          border-bottom: 1px solid rgba(105, 88, 255, 0.20);
          backdrop-filter: blur(12px);
          flex-wrap: wrap;
        }

        .pdf-bar__left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex: 1;
        }

        .pdf-bar__badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 8px;
          background: rgba(239, 68, 68, 0.16);
          border: 1px solid rgba(239, 68, 68, 0.32);
          color: #F87171;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }

        .pdf-bar__title {
          font-size: 0.88rem;
          font-weight: 600;
          color: #F0F0F5;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pdf-bar__actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .pdf-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          border-radius: 9px;
          background: rgba(105, 88, 255, 0.12);
          border: 1px solid rgba(105, 88, 255, 0.22);
          color: rgba(240, 240, 245, 0.88);
          font-size: 0.78rem;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.18s;
        }

        .pdf-btn:hover {
          background: rgba(105, 88, 255, 0.26);
          border-color: #6958FF;
          color: #FFFFFF;
          transform: translateY(-1px);
        }

        @media (max-width: 640px) {
          .pdf-btn__label { display: none; }
          .pdf-btn { padding: 7px 9px; }
        }

        .pdf-body {
          flex: 1;
          position: relative;
          background: #020617;
          width: 100%;
          min-height: 0;
        }

        .pdf-iframe {
          width: 100%;
          height: 100%;
          border: none;
          display: block;
          background: #0D1117;
        }

        .pdf-loader, .pdf-error {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: rgba(160, 168, 192, 0.65);
          font-size: 0.86rem;
          z-index: 2;
          background: rgba(8, 18, 41, 0.94);
        }

        .pdf-spin {
          animation: spin 0.8s linear infinite;
          color: #6958FF;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .pdf-error {
          color: #F87171;
        }

        .pdf-error__btn {
          margin-top: 8px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 9px;
          background: #6958FF;
          color: white;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.82rem;
        }

        .pdf-footer-note {
          padding: 6px 16px;
          background: rgba(13, 27, 62, 0.75);
          border-top: 1px solid rgba(105, 88, 255, 0.12);
          font-size: 0.70rem;
          color: rgba(160, 168, 192, 0.50);
          text-align: center;
        }
      `}</style>
    </div>
  );
}
