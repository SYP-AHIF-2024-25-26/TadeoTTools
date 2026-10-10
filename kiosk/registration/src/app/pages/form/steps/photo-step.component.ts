import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  untracked,
  viewChild,
} from '@angular/core';
import { RegistrationSessionService } from '@core/services/registration-session.service';
import { FocusOnShowDirective } from '@shared/directives/focus-on-show.directive';
import { moveFocus } from '@shared/radio-keys';
import { PHOTO_HEIGHT, PHOTO_WIDTH } from '@shared/constants';
import { CameraError, CameraService } from '@core/services/camera.service';

/**
 * Optional photo for the Roboterführerschein. The student holds the tablet,
 * so the rear camera comes first; "Kamera wechseln" goes through the others.
 */
@Component({
  selector: 'app-photo-step',
  imports: [FocusOnShowDirective],
  template: `
    <div
      class="m-auto grid w-full max-w-5xl gap-x-12 gap-y-6 lg:grid-cols-[1fr_auto] lg:items-center"
    >
      <div>
        <h1
          id="photo-title"
          class="text-3xl font-bold text-gray-800 md:text-4xl short:text-3xl"
          appFocusOnShow
        >
          Foto für den Roboterführerschein?
        </h1>
        <p class="mt-2 max-w-xl text-xl text-gray-600">
          Für den Roboterführerschein brauchst du ein Foto. Wir können es gleich
          jetzt machen.
        </p>

        <div
          class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 short:mt-4"
          role="radiogroup"
          aria-labelledby="photo-title"
        >
          <button
            type="button"
            role="radio"
            class="choice min-h-20 px-5 py-3 text-xl font-medium short:min-h-16"
            [attr.aria-checked]="usePhoto() === true"
            (click)="choose(true)"
            (keydown)="moveFocus($event)"
          >
            <span class="mark-radio"></span>
            Ja, Foto machen
          </button>
          <button
            type="button"
            role="radio"
            class="choice min-h-20 px-5 py-3 text-xl font-medium short:min-h-16"
            [attr.aria-checked]="usePhoto() === false"
            (click)="choose(false)"
            (keydown)="moveFocus($event)"
          >
            <span class="mark-radio"></span>
            Nein, ohne Foto
          </button>
        </div>
      </div>

      @if (usePhoto()) {
        <section class="flex flex-col items-center gap-4" aria-label="Kamera">
          <!-- Portrait 3:4 frame, the same crop that is saved -->
          <div
            class="relative aspect-[3/4] h-[min(40dvh,26rem)] overflow-hidden rounded-lg bg-gray-800 shadow-lg lg:h-[min(46dvh,30rem)] short:h-[min(50dvh,22rem)]"
          >
            @if (photo(); as src) {
              <img
                [src]="src"
                alt="Aufgenommenes Foto"
                class="h-full w-full object-cover"
              />
            } @else {
              <video
                #video
                class="h-full w-full object-cover"
                [class.-scale-x-100]="camera.mirrored()"
                autoplay
                muted
                playsinline
                aria-label="Kamerabild"
              ></video>
              @if (camera.error(); as error) {
                <div
                  class="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-800 p-6 text-center text-white"
                  role="alert"
                >
                  <p class="text-xl font-medium">{{ errorText[error] }}</p>
                  <div class="flex flex-wrap justify-center gap-3">
                    @if (canSwitch()) {
                      <button
                        type="button"
                        class="h-14 rounded-2xl bg-white px-6 text-lg font-medium text-gray-800 hover:bg-gray-100"
                        (click)="switchCamera()"
                      >
                        Andere Kamera
                      </button>
                    }
                    @if (error !== 'insecure' && error !== 'missing') {
                      <button
                        type="button"
                        class="h-14 rounded-2xl bg-white px-6 text-lg font-medium text-gray-800 hover:bg-gray-100"
                        (click)="retry()"
                      >
                        Erneut versuchen
                      </button>
                    }
                  </div>
                  <p class="text-base text-gray-200">
                    Oder „Nein, ohne Foto“ wählen.
                  </p>
                </div>
              } @else if (!camera.streaming()) {
                <p
                  class="absolute inset-0 flex items-center justify-center text-lg text-gray-200"
                  role="status"
                >
                  Kamera startet …
                </p>
              }
            }
          </div>

          @if (!photo() && canSwitch() && camera.current(); as current) {
            <p class="-mt-1 text-base text-gray-600">
              Kamera: {{ current.label }}
            </p>
          }
          <div class="flex flex-wrap justify-center gap-3">
            @if (photo()) {
              <button
                type="button"
                class="btn-secondary px-6"
                (click)="retake()"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M4 4v5h.6m14.8 2A8 8 0 004.6 9m0 0H9m11 11v-5h-.6m0 0a8 8 0 01-15.3-2m15.3 2H15"
                  />
                </svg>
                Neu aufnehmen
              </button>
            } @else {
              @if (canSwitch()) {
                <button
                  type="button"
                  class="btn-secondary px-6"
                  (click)="switchCamera()"
                >
                  Kamera wechseln
                </button>
              }
              <button
                type="button"
                class="btn-primary px-8"
                [disabled]="!camera.streaming()"
                (click)="capture()"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3 9a2 2 0 012-2h.9a2 2 0 001.7-.9l.8-1.2A2 2 0 0110.1 4h3.8a2 2 0 011.7.9l.8 1.2a2 2 0 001.7.9H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Aufnehmen
              </button>
            }
          </div>
        </section>
      }
    </div>
  `,
  host: { class: 'm-auto flex w-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoStepComponent implements OnDestroy {
  private session = inject(RegistrationSessionService);
  protected camera = inject(CameraService);
  private video = viewChild<ElementRef<HTMLVideoElement>>('video');

  protected moveFocus = moveFocus;
  protected usePhoto = computed(() => this.session.draft().usePhoto);
  protected photo = computed(() => this.session.draft().photo);
  protected canSwitch = computed(() => this.camera.usable().length > 1);
  protected errorText: Record<CameraError, string> = {
    denied:
      'Der Zugriff auf die Kamera ist gesperrt. Bitte in den Browser-Einstellungen für diese Seite erlauben.',
    missing: 'Dieses Gerät hat keine Kamera.',
    insecure: 'Die Kamera geht nur, wenn die Seite über HTTPS geöffnet ist.',
    busy: 'Die Kamera wird gerade von einer anderen App verwendet. Bitte diese App schließen.',
    'no-picture': 'Diese Kamera liefert kein Bild.',
    other: 'Die Kamera konnte nicht gestartet werden.',
  };

  constructor() {
    // The camera runs only while a photo is wanted and not taken yet.
    effect(() => {
      const wanted = this.usePhoto() === true && this.photo() === null;
      const video = this.video()?.nativeElement;
      untracked(() => {
        if (wanted && video) {
          this.camera.start(video);
        } else if (!wanted) {
          this.camera.stop();
        }
      });
    });
  }

  protected choose(usePhoto: boolean): void {
    this.session.update(usePhoto ? { usePhoto } : { usePhoto, photo: null });
  }

  protected retry(): void {
    const video = this.video()?.nativeElement;
    if (video) this.camera.start(video);
  }

  protected switchCamera(): void {
    const video = this.video()?.nativeElement;
    if (video) this.camera.switchCamera(video);
  }

  /** Saves the centre of the picture as a 3:4 portrait PNG, never mirrored. */
  protected capture(): void {
    const video = this.video()?.nativeElement;
    if (!video || !video.videoWidth) return;
    const ratio = PHOTO_WIDTH / PHOTO_HEIGHT;
    let sw = video.videoWidth;
    let sh = video.videoHeight;
    if (sw / sh > ratio) {
      sw = sh * ratio;
    } else {
      sh = sw / ratio;
    }
    const sx = (video.videoWidth - sw) / 2;
    const sy = (video.videoHeight - sh) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = PHOTO_WIDTH;
    canvas.height = PHOTO_HEIGHT;
    canvas
      .getContext('2d')
      ?.drawImage(video, sx, sy, sw, sh, 0, 0, PHOTO_WIDTH, PHOTO_HEIGHT);
    this.session.update({ photo: canvas.toDataURL('image/png') });
  }

  protected retake(): void {
    this.session.update({ photo: null });
  }

  ngOnDestroy(): void {
    this.camera.stop();
  }
}
