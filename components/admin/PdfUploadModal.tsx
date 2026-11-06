'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Upload, X, Loader2, Sparkles, CheckCircle2,
  AlertTriangle, Image as ImageIcon, ArrowRight, Eye, ImagePlus
} from 'lucide-react';
import { extractPdfFirstPage, PdfThumbnailResult } from '@/lib/pdfThumbnail';
import { ContentType, contentSchemas, newContentDraft } from '@/lib/content';

interface PdfUploadModalProps {
  type: 'blogs' | 'adventures' | 'projects';
  isOpen: boolean;
  onClose: () => void;
  onSaved: (item: Record<string, unknown>) => void;
}

export default function PdfUploadModal({ type, isOpen, onClose, onSaved }: PdfUploadModalProps) {
  // ── Form State ────────────────────────────────────────────────────────
  const [heading, setHeading] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState<'CLOUD_ARCHITECTURE' | 'AI_LESSONS' | 'TRAVEL_JOURNAL' | 'CAREER'>('CLOUD_ARCHITECTURE');
  const [readTime, setReadTime] = useState(8);
  const [country, setCountry] = useState('Global');
  const [travelStyle, setTravelStyle] = useState<'remote-work' | 'solo' | 'team' | 'leisure'>('remote-work');
  const [emoji, setEmoji] = useState('📄');
  const [tech, setTech] = useState('Azure, Cloud Architecture');

  // ── File & Thumbnail State ────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [thumbnail, setThumbnail] = useState<PdfThumbnailResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadStep, setUploadStep] = useState('');
  const [error, setError] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (coverPreview) URL.revokeObjectURL(coverPreview); }, [coverPreview]);

  if (!isOpen) return null;

  const isPresentation = Boolean(file && /\.pptx?$/i.test(file.name));
  const docLabel = isPresentation ? 'PPT' : 'PDF';

  const handleCoverChange = (selected: File) => {
    if (!/^image\/(jpeg|png|webp)$/.test(selected.type)) {
      setError('Cover image must be JPG, PNG, or WebP.');
      return;
    }
    setError('');
    setCoverFile(selected);
    setCoverPreview(URL.createObjectURL(selected));
  };

  // Handle PDF / PowerPoint file selection
  const handleFileChange = async (selectedFile: File) => {
    const lowerName = selectedFile.name.toLowerCase();
    const isPdf = lowerName.endsWith('.pdf');
    if (!isPdf && !/\.pptx?$/.test(lowerName)) {
      setError('Please select a PDF (.pdf) or PowerPoint (.ppt, .pptx) file.');
      return;
    }

    setError('');
    setFile(selectedFile);
    setThumbnail(null);

    // Auto-fill heading from filename if empty
    if (!heading) {
      const clean = selectedFile.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setHeading(clean);
    }

    // Extract first page as cover image (PDF only)
    if (!isPdf) return;
    setExtracting(true);
    try {
      const result = await extractPdfFirstPage(selectedFile);
      setThumbnail(result);
    } catch (err) {
      console.error('Failed to extract PDF cover:', err);
      setError('Could not extract PDF first page as image. Default cover will be used.');
    } finally {
      setExtracting(false);
    }
  };

  // Helper to upload a single File to /api/admin/upload
  const uploadSingleFile = async (f: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', f);

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok || !data.ok || !data.url) {
      throw new Error(data.error || `Upload of ${f.name} failed`);
    }

    return data.url as string;
  };

  // Publish / Save
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heading.trim()) {
      setError('Please enter a heading in the writeup box.');
      return;
    }
    if (!file) {
      setError('Please select a PDF or PowerPoint file to upload.');
      return;
    }
    if (!coverFile && !thumbnail?.imageBlob) {
      setError('Please add a cover image for this post.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // 1. Upload the document
      setUploadStep(`Uploading ${docLabel} document…`);
      const pdfUrl = await uploadSingleFile(file);

      // 2. Upload the cover image (custom one wins over the PDF page-1 render)
      setUploadStep('Uploading cover image…');
      let coverImageUrl = '';
      if (coverFile) {
        coverImageUrl = await uploadSingleFile(coverFile);
      } else if (thumbnail?.imageBlob) {
        const coverFileName = `${file.name.replace(/\.[^/.]+$/, '')}-page1-cover.jpg`;
        const pageOneFile = new File([thumbnail.imageBlob], coverFileName, { type: 'image/jpeg' });
        coverImageUrl = await uploadSingleFile(pageOneFile);
      }

      // 3. Construct slug & payload
      setUploadStep('Saving post…');
      const cleanSlug = heading
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 100);
      const uniqueSlug = `${cleanSlug}-${Date.now().toString(36)}`;
      const today = new Date().toISOString().split('T')[0];

      let payload: Record<string, unknown> = {};

      if (type === 'blogs') {
        payload = {
          title: heading.trim(),
          slug: uniqueSlug,
          excerpt: excerpt.trim() || `${heading.trim()} — read the full ${docLabel} below.`,
          category,
          readTime: Number(readTime) || 8,
          publishedAt: today,
          coverImage: coverImageUrl,
          pdfUrl,
          content: `# ${heading.trim()}\n\n${excerpt.trim()}`,
          isPublished: true,
        };
      } else if (type === 'adventures') {
        payload = {
          destination: heading.trim(),
          slug: uniqueSlug,
          country: country.trim() || 'Global',
          countryCode: 'XX',
          cities: [heading.trim()],
          excerpt: excerpt.trim() || `Travel journal and guide: ${heading.trim()}. View the full ${docLabel} below.`,
          visitedAt: today,
          endedAt: '',
          isCurrent: false,
          coverImage: coverImageUrl,
          profilePhotoAtLocation: coverImageUrl || '/avatar-travel-clean.png',
          photos: coverImageUrl ? [coverImageUrl] : [],
          highlights: [`${docLabel} Travel Guide`],
          travelStyle,
          emoji: emoji || '✈️',
          lat: 0,
          lng: 0,
          pdfUrl,
          content: `# ${heading.trim()}\n\n${excerpt.trim()}`,
          isPublished: true,
        };
      } else if (type === 'projects') {
        const techList = tech
          .split(/[,;\n]+/)
          .map((t) => t.trim())
          .filter(Boolean);
        payload = {
          title: heading.trim(),
          slug: uniqueSlug,
          description: excerpt.trim() || `Architecture blueprint & project documentation for ${heading.trim()}. Full ${docLabel} attached.`,
          tech: techList.length > 0 ? techList : ['Azure', 'Architecture'],
          coverImage: coverImageUrl,
          pdfUrl,
          content: `# ${heading.trim()}\n\n${excerpt.trim()}`,
          isPublished: true,
        };
      }

      // 4. Save to database / CMS
      const endpoint = `/api/admin/data/${type}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok || !resData.ok) {
        throw new Error(resData.error || 'Failed to save post in database.');
      }

      onSaved(resData.data || payload);
      onClose();
    } catch (err) {
      console.error('PDF publication failed:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during upload.');
    } finally {
      setSaving(false);
      setUploadStep('');
    }
  };

  const typeLabel =
    type === 'blogs' ? 'Blog Post' : type === 'adventures' ? 'Travel Story' : 'Project';

  return (
    <div className="pdf-modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ duration: 0.24 }}
        className="pdf-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className="pdf-modal__header">
          <div className="pdf-modal__header-left">
            <div className="pdf-modal__icon-wrap">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="pdf-modal__title">Upload PDF / PPT {typeLabel}</h2>
              <p className="pdf-modal__subtitle">
                Give it a title and a cover image, then publish. Files are stored in Azure Blob Storage.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="pdf-modal__close" aria-label="Close">
            <X size={18} />
          </button>
        </header>

        {error && (
          <div className="pdf-modal__alert">
            <AlertTriangle size={15} /> {error}
          </div>
        )}

        <form onSubmit={handlePublish} className="pdf-modal__form">
          <div className="pdf-modal__columns">
            {/* ── Left Column: Form Inputs ─────────────────────────────── */}
            <div className="pdf-modal__inputs">
              {/* Heading Writeup Box */}
              <label className="pdf-field">
                <span className="pdf-field__label">
                  {typeLabel} Title <strong className="required">*</strong>
                </span>
                <input
                  type="text"
                  required
                  placeholder={`Enter ${typeLabel.toLowerCase()} heading...`}
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                  className="pdf-input pdf-input--heading"
                  disabled={saving}
                />
                <span className="pdf-field__hint">This heading becomes the title of the new {typeLabel.toLowerCase()}.</span>
              </label>

              {/* PDF Dropzone */}
              <div className="pdf-field">
                <span className="pdf-field__label">
                  PDF or PowerPoint File <strong className="required">*</strong>
                </span>
                <div
                  className={`pdf-dropzone ${isDragging ? 'is-dragging' : ''} ${file ? 'has-file' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    className="pdf-file-input"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                    }}
                    disabled={saving}
                  />

                  {extracting ? (
                    <div className="pdf-dropzone__loading">
                      <Loader2 size={24} className="spin" />
                      <span>Extracting first page cover image…</span>
                    </div>
                  ) : file ? (
                    <div className="pdf-dropzone__file-info">
                      <CheckCircle2 size={22} className="check" />
                      <div>
                        <strong>{file.name}</strong>
                        <span>({(file.size / (1024 * 1024)).toFixed(2)} MB {thumbnail ? `• ${thumbnail.pageCount} pages` : ''})</span>
                      </div>
                      <span className="pdf-dropzone__change">Change</span>
                    </div>
                  ) : (
                    <div className="pdf-dropzone__empty">
                      <Upload size={24} />
                      <p><strong>Click to browse</strong> or drag and drop a PDF or PPT</p>
                      <small>PDF up to 50MB • PPT/PPTX up to 100MB</small>
                    </div>
                  )}
                </div>
              </div>

              {/* Type-Specific Options */}
              {type === 'blogs' && (
                <div className="pdf-row">
                  <label className="pdf-field">
                    <span className="pdf-field__label">Category</span>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="pdf-select"
                      disabled={saving}
                    >
                      <option value="CLOUD_ARCHITECTURE">Cloud Architecture</option>
                      <option value="AI_LESSONS">AI Lessons</option>
                      <option value="TRAVEL_JOURNAL">Travel Journal</option>
                      <option value="CAREER">Career</option>
                    </select>
                  </label>

                  <label className="pdf-field">
                    <span className="pdf-field__label">Read Time (min)</span>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={readTime}
                      onChange={(e) => setReadTime(parseInt(e.target.value) || 8)}
                      className="pdf-input"
                      disabled={saving}
                    />
                  </label>
                </div>
              )}

              {type === 'adventures' && (
                <div className="pdf-row">
                  <label className="pdf-field">
                    <span className="pdf-field__label">Country / Region</span>
                    <input
                      type="text"
                      placeholder="e.g. Japan, Iceland, Swiss Alps"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="pdf-input"
                      disabled={saving}
                    />
                  </label>

                  <label className="pdf-field">
                    <span className="pdf-field__label">Travel Style</span>
                    <select
                      value={travelStyle}
                      onChange={(e) => setTravelStyle(e.target.value as any)}
                      className="pdf-select"
                      disabled={saving}
                    >
                      <option value="remote-work">💻 Remote Work</option>
                      <option value="solo">🎒 Solo</option>
                      <option value="team">👥 Team</option>
                      <option value="leisure">✈️ Leisure</option>
                    </select>
                  </label>

                  <label className="pdf-field" style={{ maxWidth: '80px' }}>
                    <span className="pdf-field__label">Flag / Emoji</span>
                    <input
                      type="text"
                      value={emoji}
                      onChange={(e) => setEmoji(e.target.value)}
                      className="pdf-input text-center"
                      disabled={saving}
                    />
                  </label>
                </div>
              )}

              {type === 'projects' && (
                <label className="pdf-field">
                  <span className="pdf-field__label">Technologies (comma-separated)</span>
                  <input
                    type="text"
                    value={tech}
                    onChange={(e) => setTech(e.target.value)}
                    placeholder="e.g. Terraform, Azure, Architecture, Bicep"
                    className="pdf-input"
                    disabled={saving}
                  />
                </label>
              )}

              {/* Optional Excerpt / Summary */}
              <label className="pdf-field">
                <span className="pdf-field__label">Short Writeup / Excerpt (optional)</span>
                <textarea
                  rows={2}
                  placeholder={`Brief summary of this ${typeLabel.toLowerCase()}...`}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="pdf-textarea"
                  disabled={saving}
                />
              </label>
            </div>

            {/* ── Right Column: Live Cover Image Preview ─────────────── */}
            <div className="pdf-modal__preview">
              <span className="pdf-field__label">
                <Sparkles size={13} className="spark" /> Cover Image <strong className="required">*</strong>
              </span>

              <div className="pdf-preview-card">
                {coverPreview || thumbnail?.dataUrl ? (
                  <div className="pdf-preview-card__img-wrap">
                    <img
                      src={coverPreview || thumbnail?.dataUrl}
                      alt="Cover preview"
                      className="pdf-preview-card__img"
                    />
                    <span className="pdf-preview-card__badge">
                      <ImageIcon size={12} /> {coverPreview ? 'Custom cover' : 'Page 1 Thumbnail'}
                    </span>
                  </div>
                ) : extracting ? (
                  <div className="pdf-preview-card__placeholder">
                    <Loader2 size={28} className="spin" />
                    <span>Rendering page 1 preview…</span>
                  </div>
                ) : (
                  <div className="pdf-preview-card__placeholder">
                    <FileText size={40} />
                    <p>Add a cover image</p>
                    <small>For PDFs, page 1 is used automatically unless you choose your own image.</small>
                  </div>
                )}

                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="pdf-file-input"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleCoverChange(e.target.files[0]);
                    e.target.value = '';
                  }}
                  disabled={saving}
                />
                <button
                  type="button"
                  className="pdf-btn pdf-btn--cancel"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={saving}
                  style={{ margin: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                >
                  <ImagePlus size={15} /> {coverFile ? 'Change cover image' : 'Upload cover image'}
                </button>
                {coverFile && (
                  <button
                    type="button"
                    className="pdf-btn pdf-btn--cancel"
                    onClick={() => { setCoverFile(null); setCoverPreview(''); }}
                    disabled={saving}
                    style={{ margin: '0 10px 10px' }}
                  >
                    Remove custom cover
                  </button>
                )}

                {thumbnail && (
                  <div className="pdf-preview-card__meta">
                    <span>Dimensions: {thumbnail.width} × {thumbnail.height}px</span>
                    <span>Ready for publication</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Footer Actions ───────────────────────────────────────── */}
          <footer className="pdf-modal__footer">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="pdf-btn pdf-btn--cancel"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || !file || !heading.trim() || extracting || (!coverFile && !thumbnail)}
              className="pdf-btn pdf-btn--submit"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="spin" />
                  <span>{uploadStep || 'Publishing…'}</span>
                </>
              ) : (
                <>
                  <span>Publish {docLabel} {typeLabel}</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </footer>
        </form>

        <style jsx>{`
          .pdf-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(4, 9, 23, 0.85);
            backdrop-filter: blur(14px);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .pdf-modal {
            background: #081229;
            border: 1px solid rgba(105, 88, 255, 0.32);
            border-radius: 22px;
            width: 100%;
            max-width: 900px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 24px 64px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(105, 88, 255, 0.15);
            color: #F0F0F5;
            font-family: 'Inter', sans-serif;
            display: flex;
            flex-direction: column;
          }

          .pdf-modal__header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 22px 26px;
            border-bottom: 1px solid rgba(105, 88, 255, 0.16);
            background: rgba(13, 27, 62, 0.50);
          }

          .pdf-modal__header-left {
            display: flex;
            align-items: center;
            gap: 14px;
          }

          .pdf-modal__icon-wrap {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.20), rgba(105, 88, 255, 0.25));
            border: 1px solid rgba(239, 68, 68, 0.35);
            color: #F87171;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .pdf-modal__title {
            font-size: 1.22rem;
            font-weight: 700;
            margin: 0;
            color: #FFFFFF;
            letter-spacing: -0.01em;
          }

          .pdf-modal__subtitle {
            font-size: 0.78rem;
            color: rgba(160, 168, 192, 0.70);
            margin: 3px 0 0;
          }

          .pdf-modal__close {
            background: none;
            border: none;
            color: rgba(160, 168, 192, 0.55);
            cursor: pointer;
            padding: 8px;
            border-radius: 8px;
            transition: all 0.2s;
            display: flex;
          }

          .pdf-modal__close:hover {
            color: #FFFFFF;
            background: rgba(255, 255, 255, 0.08);
          }

          .pdf-modal__alert {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 16px 26px 0;
            padding: 10px 14px;
            border-radius: 10px;
            background: rgba(239, 68, 68, 0.12);
            border: 1px solid rgba(239, 68, 68, 0.30);
            color: #FCA5A5;
            font-size: 0.82rem;
          }

          .pdf-modal__form {
            padding: 24px 26px;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .pdf-modal__columns {
            display: grid;
            grid-template-columns: 1.3fr 0.9fr;
            gap: 24px;
          }

          @media (max-width: 768px) {
            .pdf-modal__columns {
              grid-template-columns: 1fr;
            }
          }

          .pdf-modal__inputs {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .pdf-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
            width: 100%;
          }

          .pdf-field__label {
            font-size: 0.80rem;
            font-weight: 600;
            color: rgba(240, 240, 245, 0.85);
            display: flex;
            align-items: center;
            gap: 5px;
          }

          .pdf-field__hint {
            font-size: 0.72rem;
            color: rgba(160, 168, 192, 0.50);
          }

          .required {
            color: #F87171;
          }

          .spark {
            color: #00FF99;
          }

          .pdf-input, .pdf-select, .pdf-textarea {
            width: 100%;
            padding: 11px 14px;
            border-radius: 11px;
            background: rgba(13, 27, 62, 0.70);
            border: 1px solid rgba(105, 88, 255, 0.22);
            color: #FFFFFF;
            font-size: 0.88rem;
            outline: none;
            transition: all 0.2s;
            font-family: inherit;
          }

          .pdf-input--heading {
            font-size: 1rem;
            font-weight: 600;
            background: rgba(105, 88, 255, 0.10);
            border-color: rgba(105, 88, 255, 0.38);
          }

          .pdf-input:focus, .pdf-select:focus, .pdf-textarea:focus {
            border-color: #6958FF;
            box-shadow: 0 0 0 3px rgba(105, 88, 255, 0.18);
          }

          .pdf-select option {
            background: #081229;
            color: #F0F0F5;
          }

          .pdf-row {
            display: flex;
            gap: 12px;
            align-items: flex-start;
          }

          .pdf-dropzone {
            border: 1.5px dashed rgba(105, 88, 255, 0.35);
            background: rgba(13, 27, 62, 0.45);
            border-radius: 12px;
            padding: 16px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 80px;
          }

          .pdf-dropzone:hover, .pdf-dropzone.is-dragging {
            border-color: #6958FF;
            background: rgba(105, 88, 255, 0.15);
          }

          .pdf-dropzone.has-file {
            border-style: solid;
            border-color: rgba(0, 255, 153, 0.40);
            background: rgba(0, 255, 153, 0.05);
          }

          .pdf-file-input {
            display: none;
          }

          .pdf-dropzone__empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            color: rgba(160, 168, 192, 0.70);
            font-size: 0.82rem;
            text-align: center;
          }

          .pdf-dropzone__empty strong {
            color: #6958FF;
          }

          .pdf-dropzone__empty small {
            font-size: 0.72rem;
            color: rgba(160, 168, 192, 0.45);
          }

          .pdf-dropzone__file-info {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
          }

          .pdf-dropzone__file-info strong {
            display: block;
            font-size: 0.86rem;
            color: #F0F0F5;
          }

          .pdf-dropzone__file-info span {
            font-size: 0.74rem;
            color: rgba(160, 168, 192, 0.60);
          }

          .pdf-dropzone__change {
            margin-left: auto;
            font-size: 0.75rem;
            color: #6958FF;
            text-decoration: underline;
          }

          .pdf-dropzone__loading {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #6958FF;
            font-size: 0.84rem;
          }

          .check {
            color: #00FF99;
            flex-shrink: 0;
          }

          .spin {
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          /* ── Preview Column ── */
          .pdf-modal__preview {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .pdf-preview-card {
            background: rgba(13, 27, 62, 0.60);
            border: 1px solid rgba(105, 88, 255, 0.20);
            border-radius: 14px;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            height: 100%;
            min-height: 280px;
          }

          .pdf-preview-card__img-wrap {
            position: relative;
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid rgba(105, 88, 255, 0.25);
            background: #FFFFFF;
            max-height: 340px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .pdf-preview-card__img {
            width: 100%;
            height: auto;
            max-height: 340px;
            object-fit: contain;
            display: block;
          }

          .pdf-preview-card__badge {
            position: absolute;
            top: 8px;
            right: 8px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 3px 8px;
            border-radius: 6px;
            background: rgba(4, 9, 23, 0.85);
            color: #00FF99;
            font-size: 0.68rem;
            font-weight: 600;
            backdrop-filter: blur(8px);
          }

          .pdf-preview-card__placeholder {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: rgba(160, 168, 192, 0.40);
            text-align: center;
            padding: 30px 16px;
          }

          .pdf-preview-card__placeholder p {
            font-size: 0.82rem;
            font-weight: 600;
            margin: 0;
            color: rgba(240, 240, 245, 0.70);
          }

          .pdf-preview-card__placeholder small {
            font-size: 0.72rem;
            max-width: 220px;
          }

          .pdf-preview-card__meta {
            display: flex;
            justify-content: space-between;
            font-size: 0.70rem;
            color: rgba(160, 168, 192, 0.55);
            padding: 4px 6px;
            border-top: 1px solid rgba(105, 88, 255, 0.12);
          }

          /* ── Footer ── */
          .pdf-modal__footer {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 12px;
            padding-top: 16px;
            border-top: 1px solid rgba(105, 88, 255, 0.16);
          }

          .pdf-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 11px 22px;
            border-radius: 11px;
            font-size: 0.86rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
          }

          .pdf-btn--cancel {
            background: rgba(105, 88, 255, 0.10);
            border: 1px solid rgba(105, 88, 255, 0.22);
            color: rgba(160, 168, 192, 0.80);
          }

          .pdf-btn--cancel:hover {
            color: #FFFFFF;
            border-color: rgba(105, 88, 255, 0.40);
          }

          .pdf-btn--submit {
            background: linear-gradient(135deg, #6958FF, #8B7AFF);
            color: #FFFFFF;
            box-shadow: 0 4px 20px rgba(105, 88, 255, 0.40);
          }

          .pdf-btn--submit:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 6px 28px rgba(105, 88, 255, 0.55);
          }

          .pdf-btn--submit:disabled {
            opacity: 0.55;
            cursor: not-allowed;
          }
        `}</style>
      </motion.div>
    </div>
  );
}
