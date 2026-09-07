
import { ArrowDown } from 'lucide-react';
import { useVideoScrub } from '@/useVideoScrub';
import LandingContent from '@/LandingContent';
import BackgroundAudio from '@/BackgroundAudio';
import { chapters } from '@/story';

const VIDEO_SRC = `${import.meta.env.BASE_URL}videos/classroom-horror.mp4`;
export default function App() {
  const { containerRef, videoRef, canvasRef, scrollProgress, canvasLive } = useVideoScrub(VIDEO_SRC);
  return <main>

    <a href="#story" className="skip-link">跳过视频，阅读故事</a>
    <div id="prologue" ref={containerRef} className="cinema-track">
      <div className="cinema-sticky">
        <header className="topbar">
          <a href="#prologue" className="wordmark">THE FILLING</a>
          <nav aria-label="主导航" className="desktop-chapters">{chapters.map(chapter => <a key={chapter.id} href={`#${chapter.id}`}>{chapter.label}</a>)}</nav>
          <BackgroundAudio />
        </header>
        <div className="cinema-presentation"><div className="cinema-width">
          <div className="film-heading"><h1><span className="title-chinese">《填塞物》</span></h1><a className="read-link" href="#story">阅读故事 <span className="circle-arrow"><ArrowDown size={18} /></span></a></div>
          <div className="scene-media"><video ref={videoRef} src={VIDEO_SRC} muted playsInline preload="auto" aria-label="教室视频，画面随页面滚动变化" /><canvas ref={canvasRef} width={1280} height={720} style={{ opacity: canvasLive ? 1 : 0 }} aria-hidden="true" /></div>
          <div className="film-progress" aria-hidden="true"><span style={{ transform: `scaleX(${scrollProgress})` }} /></div>
          <div className="film-caption"><span>滚动查看 <ArrowDown size={12} /></span><span>{String(Math.round(scrollProgress * 100)).padStart(2, '0')} / 100</span></div>
        </div></div>
      </div>
    </div>
    <LandingContent />
  </main>;
}

