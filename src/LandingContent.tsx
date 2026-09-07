import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowUp, ArrowUpRight } from 'lucide-react';
import { chapters } from '@/story';

function Inline({ text }: { text: string }) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\\\n)/g).map((piece, i) => {
    if (piece === '\\\n') return <br key={i} />;
    if (piece.startsWith('**')) return <strong key={i}>{piece.slice(2, -2)}</strong>;
    if (piece.startsWith('*')) return <em key={i}>{piece.slice(1, -1)}</em>;
    return piece;
  });
}
function Block({ text }: { text: string }) {
  if (/^\d+\. /.test(text)) return <ol>{text.split('\n').map((line, i) => <li key={i}><Inline text={line.replace(/^\d+\. /, '')} /></li>)}</ol>;
  if (text.startsWith('- ')) return <ul>{text.split('\n').map((line, i) => <li key={i}><Inline text={line.slice(2)} /></li>)}</ul>;
  return <p><Inline text={text} /></p>;
}
function Reveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const element = ref.current;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { element.classList.add('has-entered'); observer.disconnect(); }
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div className="story-reveal" ref={ref}>{children}</div>;
}
export default function LandingContent() {
  const [active, setActive] = useState(chapters[0].id);
  useEffect(() => {
    let queued = false, raf = 0;
    const update = () => {
      queued = false;
      let current = chapters[0].id;
      for (const chapter of chapters) {
        if ((document.getElementById(chapter.id)?.getBoundingClientRect().top ?? Infinity) <= window.innerHeight * .35) current = chapter.id;
      }
      setActive(current);
    };
    const scroll = () => { if (!queued) { queued = true; raf = requestAnimationFrame(update); } };
    update();
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', scroll);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', scroll); window.removeEventListener('resize', scroll); };
  }, []);
  return <div className="manuscript" id="story">
    <div className="manuscript-rule"><span>《填塞物》</span><span>01 — 05</span></div>
    <div className="reading-layout">
      <aside className="reading-index"><nav aria-label="故事章节">{chapters.map(chapter => <a key={chapter.id} href={`#${chapter.id}`} aria-current={active === chapter.id ? 'location' : undefined}><span>{chapter.number}</span><span>{chapter.label}</span><ArrowUpRight size={13} aria-hidden="true" /></a>)}</nav><a className="index-back" href="#prologue"><ArrowUp size={13} /> 返回首屏</a></aside>
      <article aria-label="《填塞物》完整故事">{chapters.map(chapter => <section className={`story-chapter story-chapter-${chapter.number}`} id={chapter.id} key={chapter.id} aria-labelledby={`${chapter.id}-title`}>
        <Reveal><header className="chapter-heading"><span className="chapter-number" aria-hidden="true">{chapter.number}</span><h2 id={`${chapter.id}-title`}>{chapter.title}</h2></header></Reveal>
        <div className="story-body">{chapter.blocks.map((block, i) => <Reveal key={i}><Block text={block} /></Reveal>)}</div>
      </section>)}</article>
    </div>
    <footer className="story-footer"><span>《填塞物》<span className="footer-english">The Filling</span></span><a href="#prologue">返回首屏 <ArrowUp size={16} /></a></footer>
  </div>;
}
