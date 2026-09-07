declare module 'mp4box' {
  export interface Sample { cts: number; duration: number; timescale: number; is_sync: boolean; data: Uint8Array }
  export interface Track { id: number; codec: string; duration: number; timescale: number; nb_samples: number; video: { width: number; height: number } }
  export interface Box { write(stream: DataStream): void }
  export class DataStream { static BIG_ENDIAN: boolean; constructor(buffer?: ArrayBuffer, byteOffset?: number, endianness?: boolean); buffer: ArrayBuffer }
  export interface MP4File {
    onError: (error: string) => void;
    onReady: (info: { videoTracks: Track[] }) => void;
    onSamples: (id: number, user: unknown, samples: Sample[]) => void;
    appendBuffer(buffer: ArrayBuffer & { fileStart: number }): void;
    flush(): void;
    start(): void;
    stop(): void;
    setExtractionOptions(id: number, user: unknown, options: { nbSamples: number }): void;
    getTrackById(id: number): { mdia: { minf: { stbl: { stsd: { entries: Array<{ avcC?: Box; hvcC?: Box; vpcC?: Box; av1C?: Box }> } } } } };
  }
  export function createFile(): MP4File;
}
