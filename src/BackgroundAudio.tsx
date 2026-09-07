import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const AUDIO_SRC = `${import.meta.env.BASE_URL}audio/classroom-original.m4a`;

export default function BackgroundAudio() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const wanted = useRef(true);
  const started = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  const play = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.error) { audio.load(); setFailed(false); }
    // Invoke directly from the gesture, before any asynchronous work.
    void audio.play().then(() => {
      started.current = true;
      if (!wanted.current || document.hidden) audio.pause();
    }).catch(() => {
      // Autoplay denial leaves the explicit play button available.
      setPlaying(false);
    });
  };

  useEffect(() => {
    const audio = audioRef.current!;
    audio.volume = .3;
    const begin = (event: Event) => {
      if (!event.isTrusted || !wanted.current || document.hidden || !audio.paused) return;
      if (event.target instanceof Element && event.target.closest('[data-music-control]')) return;
      if (event instanceof KeyboardEvent && (event.repeat || event.key === 'Tab' || event.key === 'Escape')) return;
      play();
    };
    const visibility = () => {
      if (document.hidden) audio.pause();
      else if (wanted.current && started.current) play();
    };
    window.addEventListener('pointerup', begin);
    window.addEventListener('keydown', begin);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('pointerup', begin);
      window.removeEventListener('keydown', begin);
      document.removeEventListener('visibilitychange', visibility);
      audio.pause();
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current!;
    if (!audio.paused) { wanted.current = false; audio.pause(); }
    else { wanted.current = true; play(); }
  };

  return <>
    <audio ref={audioRef} src={AUDIO_SRC} loop preload="auto" onPlaying={() => { setPlaying(true); setFailed(false); }} onPause={() => setPlaying(false)} onError={() => { setFailed(true); setPlaying(false); }} />
    <button type="button" data-music-control className="music-control" onClick={toggle} aria-label={playing ? '关闭背景音乐' : failed ? '重试播放背景音乐' : '开启背景音乐'} aria-pressed={playing}>
      {playing ? <Volume2 size={22} aria-hidden="true" /> : <VolumeX size={22} aria-hidden="true" />}
    </button>
  </>;
}

