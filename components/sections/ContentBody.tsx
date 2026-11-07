import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './ContentBody.module.css';

export default function ContentBody({ content = '', photos = [], videos = [] }: { content?: string; photos?: string[]; videos?: string[] }) {
  return <div className={styles.article}>
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
      img: ({ src, alt }) => typeof src === 'string' && src.startsWith('#pending-image-')
        ? <span role="status" style={{ display: 'block', padding: 24, textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: 10, color: 'var(--text-secondary)' }}>Uploading image…</span>
        : <img src={src} alt={alt || ''} loading="lazy" />,
      a: ({ href, children }) => href && /^(\/(?!\/)|#)/.test(href)
        ? <a href={href}>{children}</a>
        : <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
      table: ({ children }) => <div className={styles.tableWrap}><table>{children}</table></div>,
    }}>{content}</ReactMarkdown>
    {photos.length > 0 && <div className={styles.gallery}>{photos.map((url, index) => <a href={url} key={`${index}-${url}`} target="_blank" rel="noopener noreferrer"><img src={url} alt={`Photo ${index + 1}`} loading="lazy" /></a>)}</div>}
    {videos.map((url, index) => <video key={`${index}-${url}`} className={styles.video} src={url} controls preload="metadata" />)}
  </div>;
}
