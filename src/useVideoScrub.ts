import { useEffect, useRef, useState } from 'react';
import * as MP4Box from 'mp4box';
import type { Sample, Track } from 'mp4box';

const LERP_TAU = 8;
const SNAP = 0.002;
const LRU_MAX = 24;
const LEAD = 24;
const WATCHDOG = 60000;
type BankFrame = { ts: number; blob: Blob };

export function nearestIndex(bank: BankFrame[], time: number) {
  const ts = time * 1e6;
  let lo = 0, hi = bank.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (bank[mid].ts < ts) lo = mid + 1;
    else hi = mid;
  }
  return lo > 0 && ts - bank[lo - 1].ts < bank[lo].ts - ts ? lo - 1 : lo;
}

export function useVideoScrub(videoSrc: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canvasLive, setCanvasLive] = useState(false);

  useEffect(() => {
    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d');
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const controller = new AbortController();
    let bank: BankFrame[] = [];
    const lru = new Map<number, ImageBitmap | null>();
    let current = 0, target = 0, dur = 0;
    let ready = false, reverted = false, painted = false, building = false;
    let disposed = false, raf = 0, last = performance.now(), lastPaint = -1;
    let span = 1;
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    let decoder: VideoDecoder | undefined;
    const updateSpan = () => { span = Math.max(1, (containerRef.current?.offsetHeight ?? 0) - window.innerHeight); };
    const getProgress = () => Math.max(0, Math.min(1, window.scrollY / span));
    const metadata = () => { if (Number.isFinite(video.duration)) dur = video.duration; };
    const clearCache = () => { lru.forEach(bitmap => bitmap?.close()); lru.clear(); };
    const revert = () => {
      reverted = true; ready = false; building = false; painted = false;
      controller.abort();
      if (decoder && decoder.state !== 'closed') decoder.close();
      bank = []; clearCache(); clearTimeout(watchdog);
      if (!disposed) setCanvasLive(false);
    };

    const warmLRU = (index: number) => {
      // Load the requested frame first, followed by its immediate neighbours.
      for (const i of [index, index - 1, index + 1, index + 2]) {
        if (i < 0 || i >= bank.length) continue;
        if (lru.has(i)) {
          const bitmap = lru.get(i)!;
          lru.delete(i); lru.set(i, bitmap);
          continue;
        }
        lru.set(i, null);
        void createImageBitmap(bank[i].blob).then(bitmap => {
          if (disposed || reverted || !lru.has(i)) { bitmap.close(); return; }
          lru.set(i, bitmap);
        }).catch(() => { if (!disposed && !reverted) revert(); });
        while (lru.size > LRU_MAX) {
          const oldest = lru.keys().next().value!;
          lru.get(oldest)?.close(); lru.delete(oldest);
        }
      }
    };
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const p = getProgress();
      setScrollProgress(previous => previous === p ? previous : p);
      if (dur > 0) {
        target = p * dur;
        current = media.matches ? target : current + (target - current) * (1 - Math.exp(-dt * LERP_TAU));
        if (Math.abs(target - current) < SNAP) current = target;
        if (ready && ctx && bank.length) {
          const i = nearestIndex(bank, current);
          warmLRU(i);
          const bitmap = lru.get(i);
          if (bitmap && lastPaint !== i) {
            ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            lastPaint = i;
            if (!painted) { painted = true; setCanvasLive(true); }
          }
        } else if (!video.seeking && video.readyState >= 1 && Math.abs(video.currentTime - current) > 0.01) {
          video.currentTime = current;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    async function extract(buffer: ArrayBuffer) {
      return new Promise<{ track: Track; samples: Sample[]; description?: Uint8Array }>((resolve, reject) => {
        const file = MP4Box.createFile();
        let track: Track;
        let description: Uint8Array | undefined;
        const samples: Sample[] = [];
        file.onError = error => reject(new Error(error));
        file.onReady = info => {
          try {
            track = info.videoTracks[0];
            if (!track) throw new Error('No video track');
            const entry = file.getTrackById(track.id).mdia.minf.stbl.stsd.entries[0];
            const box = entry.avcC ?? entry.hvcC ?? entry.vpcC ?? entry.av1C;
            if (box) {
              const stream = new MP4Box.DataStream(undefined, 0, MP4Box.DataStream.BIG_ENDIAN);
              box.write(stream);
              description = new Uint8Array(stream.buffer.slice(8));
            }
            file.setExtractionOptions(track.id, null, { nbSamples: 100 });
            file.start();
          } catch (error) { reject(error); }
        };
        file.onSamples = (_id, _user, batch) => {
          samples.push(...batch);
          if (samples.length >= track.nb_samples) resolve({ track, samples, description });
        };
        const input = buffer as ArrayBuffer & { fileStart: number };
        input.fileStart = 0;
        file.appendBuffer(input);
        file.flush();
      });
    }

    async function decodeFrames(track: Track, samples: Sample[], description: Uint8Array | undefined, software: boolean) {
      const frames: BankFrame[] = [];
      const pending = new Set<Promise<void>>();
      let failure: unknown;
      let active = true;
      let submitted = 0, completed = 0;
      const config: VideoDecoderConfig = {
        codec: track.codec, codedWidth: track.video.width, codedHeight: track.video.height,
        description, hardwareAcceleration: software ? 'prefer-software' : 'prefer-hardware',
      };
      const supported = await VideoDecoder.isConfigSupported(config);
      if (!supported.supported) throw new Error('Unsupported decoder configuration');
      if (disposed || reverted) throw new Error('Cancelled');
      const local = new VideoDecoder({
        error: error => { failure = error; },
        output: frame => {
          if (!active || disposed || reverted) { frame.close(); return; }
          const ts = frame.timestamp;
          const surface = document.createElement('canvas');
          surface.width = frame.displayWidth; surface.height = frame.displayHeight;
          const context = surface.getContext('2d');
          if (!context) { frame.close(); failure = new Error('Canvas unavailable'); return; }
          try { context.drawImage(frame, 0, 0); } catch (error) { failure = error; }
          finally { frame.close(); }
          const task = new Promise<void>(resolve => {
            surface.toBlob(blob => {
              if (active && !disposed && !reverted) {
                if (blob) frames.push({ ts, blob });
                else failure = new Error('Frame encoding failed');
              }
              surface.width = 0; surface.height = 0;
              completed++; resolve();
            }, 'image/webp', 0.82);
          });
          pending.add(task);
          void task.then(() => pending.delete(task));
        },
      });
      decoder = local;
      const check = () => { if (failure) throw failure; if (disposed || reverted) throw new Error('Cancelled'); };
      try {
        local.configure(config);
        for (const sample of samples) {
          check();
          while (submitted - completed >= LEAD) {
            await new Promise(resolve => setTimeout(resolve, 4));
            check();
          }
          local.decode(new EncodedVideoChunk({
            type: sample.is_sync ? 'key' : 'delta',
            timestamp: Math.round(sample.cts * 1e6 / sample.timescale),
            duration: Math.round(sample.duration * 1e6 / sample.timescale),
            data: sample.data,
          }));
          submitted++;
        }
        await local.flush();
        await Promise.all(pending);
        check();
        if (!frames.length) throw new Error('Empty frame bank');
        return frames.sort((a, b) => a.ts - b.ts);
      } finally {
        active = false;
        if (local.state !== 'closed') local.close();
      }
    }

    const build = async () => {
      if (building || ready || reverted || disposed || media.matches || !('VideoDecoder' in window) || !ctx) return;
      building = true;
      watchdog = setTimeout(revert, WATCHDOG);
      try {
        const response = await fetch(videoSrc, { signal: controller.signal });
        if (!response.ok) throw new Error(`Video fetch: ${response.status}`);
        const { track, samples, description } = await extract(await response.arrayBuffer());
        if (disposed || reverted) return;
        dur = track.duration / track.timescale;
        let decoded: BankFrame[];
        try { decoded = await decodeFrames(track, samples, description, false); }
        catch (error) {
          if (disposed || reverted) throw error;
          decoded = await decodeFrames(track, samples, description, true);
        }
        if (disposed || reverted) return;
        bank = decoded;
        canvas.width = track.video.width; canvas.height = track.video.height;
        ready = true; building = false; clearTimeout(watchdog);
      } catch { if (!disposed) revert(); }
    };
    const motionChange = () => { if (media.matches) revert(); };
    updateSpan(); metadata(); setCanvasLive(false);
    video.addEventListener('loadedmetadata', metadata);
    window.addEventListener('resize', updateSpan);
    window.addEventListener('orientationchange', updateSpan);
    media.addEventListener('change', motionChange);
    window.addEventListener('load', build, { once: true });
    if (document.readyState === 'complete') void build();
    raf = requestAnimationFrame(tick);
    return () => {
      disposed = true; revert(); cancelAnimationFrame(raf);
      video.removeEventListener('loadedmetadata', metadata);
      window.removeEventListener('resize', updateSpan);
      window.removeEventListener('orientationchange', updateSpan);
      window.removeEventListener('load', build);
      media.removeEventListener('change', motionChange);
    };
  }, [videoSrc]);
  return { containerRef, videoRef, canvasRef, scrollProgress, canvasLive };
}
