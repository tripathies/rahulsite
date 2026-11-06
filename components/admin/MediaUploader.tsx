'use client';

import { useMemo, useState } from 'react';
import { Upload, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface MediaUploaderProps {
  onUploaded: (url: string) => void;
  accept?: string;
  onBusyChange?: (busy: boolean) => void;
}

export default function MediaUploader({ onUploaded, accept = 'image/*,video/mp4,application/pdf,.ppt,.pptx', onBusyChange }: MediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const helpText = useMemo(
    () => 'Images: JPG/PNG/WebP (20MB) • Videos: MP4 (100MB) • Documents: PDF (50MB), PPT/PPTX (100MB)',
    []
  );

  function uploadFile(file: File) {
    if (uploading) return;
    setError('');
    setSuccess('');
    setProgress(0);
    setUploading(true);
    onBusyChange?.(true);

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/upload');
    xhr.withCredentials = true;
    xhr.timeout = 300000;
    xhr.onloadend = () => onBusyChange?.(false);
    xhr.ontimeout = () => { setUploading(false); setError('Upload timed out. Please retry.'); };

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }
      const nextProgress = Math.round((event.loaded / event.total) * 100);
      setProgress(nextProgress);
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status < 200 || xhr.status >= 300) {
        try {
          const parsed = JSON.parse(xhr.responseText) as { error?: string };
          setError(parsed.error ?? 'Upload failed.');
        } catch {
          setError('Upload failed.');
        }
        return;
      }

      try {
        const parsed = JSON.parse(xhr.responseText) as { ok: boolean; url?: string; error?: string };
        if (!parsed.ok || !parsed.url) {
          setError(parsed.error ?? 'Upload failed.');
          return;
        }
        setSuccess('Upload complete.');
        onUploaded(parsed.url);
      } catch {
        setError('Upload response was invalid.');
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setError('Upload failed due to a network error.');
    };

    xhr.send(formData);
  }

  function onFileSelection(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return;
    }
    uploadFile(fileList[0]);
  }

  return (
    <div>
      <label
        className={`media-dropzone ${isDragging ? 'is-dragging' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          onFileSelection(event.dataTransfer.files);
        }}
      >
        <input
          type="file"
          accept={accept}
          onChange={(event) => onFileSelection(event.target.files)}
          className="media-dropzone__input"
          disabled={uploading}
        />
        <Upload size={18} />
        <span>Drag and drop media, or click to browse</span>
      </label>

      {uploading && (
        <div className="media-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <div className="media-progress__bar" style={{ width: `${progress}%` }} />
          <span className="media-progress__text">
            <Loader2 size={14} className="spin" /> {progress}%
          </span>
        </div>
      )}

      {error && (
        <p className="media-msg media-msg--error">
          <AlertTriangle size={14} /> {error}
        </p>
      )}
      {success && (
        <p className="media-msg media-msg--success">
          <CheckCircle2 size={14} /> {success}
        </p>
      )}
      <p className="media-help">{helpText}</p>

      <style jsx>{`
        .media-dropzone {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: 1px dashed rgba(105, 88, 255, 0.4);
          background: rgba(13, 27, 62, 0.5);
          border-radius: 12px;
          padding: 14px;
          font-size: 0.84rem;
          color: rgba(240, 240, 245, 0.9);
          cursor: pointer;
        }

        .media-dropzone.is-dragging {
          background: rgba(105, 88, 255, 0.22);
        }

        .media-dropzone__input {
          display: none;
        }

        .media-progress {
          margin-top: 10px;
          height: 28px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          position: relative;
          overflow: hidden;
        }

        .media-progress__bar {
          height: 100%;
          background: linear-gradient(90deg, #6958ff, #8b7aff);
          transition: width 0.2s ease;
        }

        .media-progress__text {
          position: absolute;
          inset: 0;
          justify-content: center;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: rgba(240, 240, 245, 0.85);
        }

        .spin {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .media-msg {
          margin-top: 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
        }

        .media-msg--error {
          color: #f87171;
        }

        .media-msg--success {
          color: #34d399;
        }

        .media-help {
          margin-top: 8px;
          font-size: 0.73rem;
          color: rgba(160, 168, 192, 0.8);
        }
      `}</style>
    </div>
  );
}
