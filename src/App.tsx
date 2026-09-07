import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, ArrowDown, ChevronUp, Info, X } from 'lucide-react';
import { useVideoScrub } from '@/useVideoScrub';

const VIDEO_SRC = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260821_114821_a8ca298f-be2c-4613-a4dd-51b69e16bbde.mp4';
const DARK = '#1D3045';
const LINKS = ['VECTRUS ENERGY', 'VECTRUS UPSTREAM', 'VECTRUS MARKETS', 'VECTRUS SYSTEMS', 'VECTRUS+'];

function Stagger({ visible, delay = 0, className = '', children }: { visible: boolean; delay?: number; className?: string; children: ReactNode }) {
  return <div className={`stagger ${className}`} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transitionDelay: `${delay}ms` }}>{children}</div>;
}

export default function App() {
  const { containerRef, videoRef, canvasRef, scrollProgress: p, canvasLive } = useVideoScrub(VIDEO_SRC);
  const [menuOpen, setMenuOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isLight = p > 0.55;
  const s1 = p < .20 ? 1 : Math.max(0, 1 - (p - .20) / .08);
  const s2 = p < .32 ? 0 : p < .40 ? (p - .32) / .08 : p < .55 ? 1 : Math.max(0, 1 - (p - .55) / .08);
  const s3 = p < .67 ? 0 : p < .75 ? (p - .67) / .08 : 1;
  const go = (progress: number) => {
    setMenuOpen(false);
    window.scrollTo({ top: progress * ((containerRef.current?.offsetHeight ?? 0) - window.innerHeight), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  useEffect(() => { const timer = setTimeout(() => setEntered(true), 200); return () => clearTimeout(timer); }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const elements = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('button, a[href]') ?? []);
    elements()[0]?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
      if (event.key !== 'Tab') return;
      const focusable = elements(), first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener('keydown', keyboard);
    return () => { document.body.style.overflow = overflow; window.removeEventListener('keydown', keyboard); previous?.focus(); };
  }, [menuOpen]);
  const entrance = (delay: number) => ({ opacity: entered ? 1 : 0, transform: entered ? 'translateY(0)' : 'translateY(-12px)', transitionDelay: `${delay}ms` });
  const sectionStyle = (opacity: number) => ({ opacity, transition: 'opacity 0.1s ease-out' });
  const enabled = (opacity: number) => opacity > .3 ? 'pointer-events-auto' : 'pointer-events-none';

  return <main ref={containerRef} className="relative h-[500vh]">
    <div className="sticky top-0 h-screen w-full overflow-hidden">
      <video ref={videoRef} src={VIDEO_SRC} muted playsInline preload="auto" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
      <canvas ref={canvasRef} width={1920} height={1080} className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300" style={{ opacity: canvasLive ? 1 : 0 }} aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0">
        <nav aria-label="Main navigation" className="pointer-events-auto absolute inset-x-0 top-0 z-50 flex items-center justify-between px-6 pb-6 pt-8 transition-colors duration-500 sm:px-8 sm:pt-12 md:px-12" style={{ color: isLight ? '#fff' : DARK }}>
          <div className="hidden items-center gap-8 lg:flex xl:gap-10">
            {LINKS.map((link, i) => <a key={link} href="#" onClick={event => { event.preventDefault(); go(0); }} className="nav-enter relative text-xs font-medium uppercase tracking-[0.15em] hover:opacity-70" style={entrance(i * 80 + 100)} aria-current={i === 0 ? 'page' : undefined}>
              {link}{i === 0 && <span className="absolute -bottom-3 left-0 h-[2px] w-full bg-current" />}
            </a>)}
          </div>
          <button aria-label="Open menu" aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen(true)} className="flex flex-col gap-[5px] lg:hidden">
            <span className="h-[2px] w-6 bg-current" /><span className="h-[2px] w-6 bg-current" /><span className="h-[2px] w-4 bg-current" />
          </button>
          <div className="nav-enter hidden items-center gap-8 sm:flex" style={entrance(500)}>
            <a href="#" onClick={event => event.preventDefault()} className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] hover:opacity-70">NEWS <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current"><Info size={10} style={{ color: isLight ? DARK : '#fff' }} /></span></a>
            <span className="hidden text-xs font-medium uppercase tracking-[0.2em] lg:inline">MENU</span>
            <button className="text-xs font-medium uppercase tracking-[0.2em] lg:hidden" onClick={() => setMenuOpen(true)} aria-expanded={menuOpen} aria-controls="mobile-menu">MENU</button>
          </div>
        </nav>

        <section aria-hidden={s1 <= .3} className="absolute inset-0 flex items-center px-6 sm:px-8 md:px-20 lg:px-32" style={sectionStyle(s1)}>
          <div>
            <Stagger visible={s1 > .3}><h1 className="text-[clamp(2rem,5vw,5rem)] font-light uppercase leading-[1.2]" style={{ color: DARK }}>Advancing resources for a cleaner future</h1></Stagger>
            <Stagger visible={s1 > .3} delay={150}><p className="mt-6 text-sm uppercase tracking-[0.3em]" style={{ color: '#1D304590' }}>Sustainable power with purpose</p></Stagger>
          </div>
          <Stagger visible={s1 > .3} delay={300} className="absolute bottom-12 right-6 sm:right-8 md:right-12"><button tabIndex={s1 > .3 ? 0 : -1} onClick={() => go(.45)} aria-label="Continue to partnerships" className={`${enabled(s1)} flex h-12 w-12 items-center justify-center rounded-full border hover:opacity-70`} style={{ borderColor: '#1D304580', color: DARK }}><ArrowRight size={18} /></button></Stagger>
        </section>

        <section aria-hidden={s2 <= .3} className="absolute inset-0 flex items-center justify-center px-6 sm:px-8" style={sectionStyle(s2)}>
          <Stagger visible={s2 > .3} className="max-w-[900px]"><h2 className="text-center text-[clamp(1.5rem,4.5vw,4.5rem)] font-extralight uppercase leading-[1.3] tracking-wide" style={{ color: DARK }}>We build lasting partnerships with vision <span style={{ color: '#1D3045cc' }}>and precision</span>{' '}<span style={{ color: '#1D304580' }}>across every frontier</span></h2></Stagger>
          <div className="absolute bottom-16 right-6 flex flex-col items-center gap-4 sm:right-8 md:right-12" style={{ color: DARK }}>
            <Stagger visible={s2 > .3} delay={200}><button tabIndex={s2 > .3 ? 0 : -1} onClick={() => go(.82)} aria-label="Continue to Nordvik" className={`${enabled(s2)} flex h-12 w-12 items-center justify-center rounded-full border border-[#1D304566] hover:opacity-70`}><ArrowDown size={18} /></button></Stagger>
            <Stagger visible={s2 > .3} delay={350} className="mt-4 flex flex-col items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#1D3045]" /><span className="h-1.5 w-1.5 rounded-full bg-[#1D304566]" /><span className="h-1.5 w-1.5 rounded-full bg-[#1D304566]" /></Stagger>
            <Stagger visible={s2 > .3} delay={500} className="mt-2"><button tabIndex={s2 > .3 ? 0 : -1} onClick={() => go(0)} aria-label="Return to top" className={`${enabled(s2)} flex h-10 w-10 items-center justify-center rounded-full border border-[#1D30454d] text-[#1D3045cc] hover:opacity-70`}><ChevronUp size={16} /></button></Stagger>
          </div>
        </section>

        <section aria-hidden={s3 <= .3} className="absolute inset-0 flex items-center justify-end px-6 sm:px-8 md:px-20 lg:px-32" style={sectionStyle(s3)}>
          <div className="max-w-2xl text-left">
            <Stagger visible={s3 > .3}><p className="mb-4 text-lg tracking-wide text-white/60">Halder | Nordvik</p></Stagger>
            <Stagger visible={s3 > .3} delay={150}><h2 className="mb-8 text-[clamp(2rem,4vw,4rem)] font-light uppercase leading-[1.2] tracking-wide text-white">Fueling ambition,<br />shaping tomorrow.</h2></Stagger>
            <Stagger visible={s3 > .3} delay={300}><div className="flex items-center gap-4"><span className="text-sm uppercase tracking-[0.3em] text-white/80">Contact Nordvik</span><button tabIndex={s3 > .3 ? 0 : -1} aria-label="Contact Nordvik" className={`${enabled(s3)} flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-800 transition-transform duration-300 hover:scale-110`}><ArrowRight size={16} /></button></div></Stagger>
          </div>
        </section>
      </div>
    </div>

    <div ref={menuRef} id="mobile-menu" role="dialog" aria-label="Navigation menu" aria-modal={menuOpen ? true : undefined} aria-hidden={!menuOpen} className={`fixed inset-0 z-[100] transition-[opacity,visibility] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${menuOpen ? 'visible opacity-100' : 'invisible opacity-0'}`} style={{ background: DARK }}>
      <div className={`flex h-full flex-col transition-transform duration-500 ${menuOpen ? 'translate-y-0' : '-translate-y-8'}`}>
        <div className="absolute right-0 top-0 px-6 pt-8 sm:px-8 sm:pt-12"><button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white hover:border-white"><X size={18} /></button></div>
        <div className="flex flex-1 flex-col justify-center px-8 sm:px-12">{LINKS.map((link, i) => <a key={link} href="#" onClick={event => { event.preventDefault(); go(0); }} className={`py-3 text-2xl font-light uppercase tracking-wide transition-[opacity,transform] duration-500 sm:text-3xl ${i === 0 ? 'text-white' : 'text-white/60 hover:text-white'}`} style={{ opacity: menuOpen ? 1 : 0, transform: menuOpen ? 'translateY(0)' : 'translateY(20px)', transitionDelay: menuOpen ? `${i * 60}ms` : '0ms' }}>{link}</a>)}</div>
        <div className="flex gap-8 px-8 pb-10 text-xs uppercase tracking-[0.2em] text-white/60 sm:px-12"><a href="#" onClick={event => event.preventDefault()} className="hover:text-white">NEWS</a><a href="#" onClick={event => { event.preventDefault(); go(.82); }} className="hover:text-white">CONTACT</a></div>
      </div>
    </div>
  </main>;
}
