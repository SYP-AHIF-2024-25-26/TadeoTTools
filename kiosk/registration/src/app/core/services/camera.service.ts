import { computed, Injectable, signal } from '@angular/core';
import {
  CAMERA_FRAME_TIMEOUT_MS,
  CAMERA_KEY,
  CAMERA_SETTLE_MS,
} from '@shared/constants';

/** Brightest pixel (0-255) still counted as black. */
const BLACK_LEVEL = 24;

export type CameraError =
  'denied' | 'missing' | 'insecure' | 'busy' | 'no-picture' | 'other';

export interface Camera {
  id: string;
  label: string;
}

/**
 * Infrared sensors for face login (Windows Hello) show up as cameras but only
 * deliver a black picture, so they are never picked or offered.
 */
const INFRARED = /\b(ir|infrared|infrarot)\b/i;

/**
 * The camera of the tablet. Starts with the camera chosen last on this device,
 * otherwise the rear camera, skipping cameras that only deliver black.
 * "Kamera wechseln" goes through the real devices (front/rear alone does not
 * help on laptops with an infrared sensor or a virtual camera).
 */
@Injectable({
  providedIn: 'root',
})
export class CameraService {
  private stream: MediaStream | null = null;
  /** Bumped on every start and stop, so a camera that answers late is dropped. */
  private attempt = 0;

  readonly streaming = signal(false);
  readonly error = signal<CameraError | null>(null);
  readonly cameras = signal<Camera[]>([]);
  readonly current = signal<Camera | null>(null);
  /** Front cameras are shown mirrored, like a mirror; the photo is never mirrored. */
  readonly mirrored = signal(false);
  /** The cameras worth offering: all but infrared ones (unless there is nothing else). */
  readonly usable = computed(() => {
    const normal = this.cameras().filter((c) => !INFRARED.test(c.label));
    return normal.length > 0 ? normal : this.cameras();
  });

  /**
   * Starts the camera chosen on this device before. Without such a choice the
   * browser's default is tried first, and cameras that only deliver black
   * (infrared sensors, idle virtual cameras) are skipped automatically.
   */
  start(video: HTMLVideoElement): Promise<void> {
    const chosen = readChoice();
    return this.run(video, chosen, chosen ? null : new Set());
  }

  /** Next usable camera; the choice is remembered on this device. */
  switchCamera(video: HTMLVideoElement): void {
    const list = this.usable();
    if (list.length < 2) return;
    const index = list.findIndex((c) => c.id === this.current()?.id);
    const next = list[(index + 1) % list.length];
    saveChoice(next.id);
    this.run(video, next.id, null);
  }

  /**
   * @param auto cameras already tried while looking for one with a picture;
   *   null when the camera was chosen (then it is shown even if it is dark).
   */
  private async run(
    video: HTMLVideoElement,
    deviceId: string | null,
    auto: Set<string> | null
  ): Promise<void> {
    this.stop();
    this.error.set(null);
    const attempt = ++this.attempt;
    if (!navigator.mediaDevices?.getUserMedia) {
      this.error.set(window.isSecureContext ? 'missing' : 'insecure');
      return;
    }

    let stream: MediaStream;
    try {
      stream = await open(deviceId);
    } catch (err) {
      if (attempt !== this.attempt) return;
      // The remembered camera is gone (other tablet, unplugged): start over without it.
      if (deviceId && !auto && isDeviceProblem(err)) {
        saveChoice(null);
        return this.run(video, null, new Set());
      }
      console.warn('Camera could not be started', err);
      this.error.set(classify(err));
      return;
    }
    if (attempt !== this.attempt) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    this.stream = stream;
    const settings = stream.getVideoTracks()[0]?.getSettings() ?? {};
    this.mirrored.set(settings.facingMode === 'user');
    await this.listCameras(settings.deviceId);
    if (attempt !== this.attempt) return;

    const current = this.current();
    if (auto && current) auto.add(current.id);
    const nextUntried = () =>
      auto ? this.usable().find((c) => !auto.has(c.id)) : undefined;

    // The browser picked an infrared sensor: try a real camera instead.
    if (current && INFRARED.test(current.label)) {
      const other = nextUntried();
      if (other) return this.run(video, other.id, auto);
    }

    // Set as properties: the `muted` attribute alone does not mute an element
    // created by script, and an unmuted video may be refused autoplay.
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    video.play().catch(() => undefined);
    const picture = await hasPicture(video);
    if (attempt !== this.attempt) return;
    if (!picture) {
      this.error.set('no-picture');
      return;
    }

    // Only black (virtual camera without a source, covered sensor): try the next one.
    if (auto && (await isBlack(video))) {
      if (attempt !== this.attempt) return;
      const other = nextUntried();
      if (other) return this.run(video, other.id, auto);
    }
    if (attempt === this.attempt) this.streaming.set(true);
  }

  stop(): void {
    this.attempt++;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.streaming.set(false);
  }

  private async listCameras(currentId: string | undefined): Promise<void> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices
        .filter((d) => d.kind === 'videoinput' && d.deviceId)
        .map((d, i) => ({ id: d.deviceId, label: cleanLabel(d.label, i) }));
      this.cameras.set(cameras);
      this.current.set(cameras.find((c) => c.id === currentId) ?? null);
    } catch {
      this.cameras.set([]);
      this.current.set(null);
    }
  }
}

function open(deviceId: string | null): Promise<MediaStream> {
  const size = { width: { ideal: 1280 }, height: { ideal: 960 } };
  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: deviceId
      ? { deviceId: { exact: deviceId }, ...size }
      : { facingMode: { ideal: 'environment' }, ...size },
  });
}

/** Resolves true once the video shows frames, false if none arrive in time. */
function hasPicture(video: HTMLVideoElement): Promise<boolean> {
  if (
    video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
    video.videoWidth > 0
  ) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    const done = (ok: boolean) => {
      clearTimeout(timer);
      video.removeEventListener('loadeddata', onData);
      resolve(ok);
    };
    const onData = () => done(video.videoWidth > 0);
    const timer = setTimeout(
      () => done(video.videoWidth > 0),
      CAMERA_FRAME_TIMEOUT_MS
    );
    video.addEventListener('loadeddata', onData);
  });
}

/**
 * True when two samples a moment apart are both (nearly) black. The second
 * sample gives a real camera time for its auto exposure after switching on.
 */
async function isBlack(video: HTMLVideoElement): Promise<boolean> {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 24;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return false;
  const brightest = () => {
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let max = 0;
    for (let i = 0; i < data.length; i += 4) {
      max = Math.max(max, (data[i] + data[i + 1] + data[i + 2]) / 3);
    }
    return max;
  };
  if (brightest() > BLACK_LEVEL) return false;
  await new Promise((r) => setTimeout(r, CAMERA_SETTLE_MS));
  return brightest() <= BLACK_LEVEL;
}

/** "HP HD Camera (04f2:b6bf)" -> "HP HD Camera"; unnamed ones get a number. */
function cleanLabel(label: string, index: number): string {
  const clean = label.replace(/\s*\([0-9a-f]{4}:[0-9a-f]{4}\)\s*$/i, '').trim();
  return clean || `Kamera ${index + 1}`;
}

function isDeviceProblem(err: unknown): boolean {
  const name = err instanceof DOMException ? err.name : '';
  return ['OverconstrainedError', 'NotFoundError', 'NotReadableError'].includes(
    name
  );
}

function classify(err: unknown): CameraError {
  const name = err instanceof DOMException ? err.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError')
    return 'missing';
  if (name === 'NotReadableError' || name === 'AbortError') return 'busy';
  return 'other';
}

function readChoice(): string | null {
  try {
    return localStorage.getItem(CAMERA_KEY);
  } catch {
    return null;
  }
}

function saveChoice(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(CAMERA_KEY, id);
    } else {
      localStorage.removeItem(CAMERA_KEY);
    }
  } catch {
    // Not remembered; the tablet starts with the rear camera next time.
  }
}
