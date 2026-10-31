import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';

const MAX_ZOOM = 4;
const DOUBLE_ZOOM = 2.5;
const DRAG_THRESHOLD = 6;
const DOUBLE_TAP_MS = 300;

interface Point {
  x: number;
  y: number;
}

/**
 * A floor plan to zoom and drag: pinch, double tap, wheel or the buttons. The projected markers
 * sit at fractions of the plan and undo the zoom with --plan-zoom, so they keep their size.
 */
@Component({
  selector: 'app-plan-view',
  templateUrl: './plan-view.component.html',
  styleUrl: './plan-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(pointercancel)': 'onPointerUp($event)',
    '(wheel)': 'onWheel($event)',
    '[style.touch-action]': "zoom() > 1 ? 'none' : 'pan-y'",
  },
})
export class PlanViewComponent {
  image = input.required<string>();
  alt = input.required<string>();
  width = input.required<number>();
  height = input.required<number>();

  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');

  protected zoom = signal(1);
  private offset = signal<Point>({ x: 0, y: 0 });
  protected maxZoom = MAX_ZOOM;
  protected transform = computed(() => {
    const { x, y } = this.offset();
    return `translate(${x}px, ${y}px) scale(${this.zoom()})`;
  });

  private pointers = new Map<number, Point>();
  private pinch: { distance: number; zoom: number } | null = null;
  private start: Point | null = null;
  private dragged = false;
  private lastTap = 0;

  constructor() {
    // A new floor starts whole.
    effect(() => {
      this.image();
      untracked(() => this.reset());
    });
    // A drag that ends on a marker is no tap.
    afterNextRender(() => {
      this.host.nativeElement.addEventListener(
        'click',
        (event) => {
          if (this.dragged) {
            event.stopPropagation();
            event.preventDefault();
            this.dragged = false;
          }
        },
        true
      );
    });
  }

  /** Distance on the screen between two points given as fractions of the plan. */
  screenDistance(a: Point, b: Point): number {
    const { width, height } = this.size();
    return Math.hypot((a.x - b.x) * width, (a.y - b.y) * height) * this.zoom();
  }

  protected zoomBy(factor: number) {
    const { width, height } = this.size();
    this.zoomTo(this.zoom() * factor, { x: width / 2, y: height / 2 });
  }

  protected onPointerDown(event: PointerEvent) {
    this.pointers.set(event.pointerId, this.local(event));
    this.dragged = false;
    if (this.pointers.size === 1) {
      this.start = this.local(event);
    } else if (this.pointers.size === 2) {
      this.pinch = { distance: this.pointerDistance(), zoom: this.zoom() };
      this.dragged = true;
    }
  }

  protected onPointerMove(event: PointerEvent) {
    const previous = this.pointers.get(event.pointerId);
    if (!previous) {
      return;
    }
    const point = this.local(event);
    this.pointers.set(event.pointerId, point);

    if (this.pinch && this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.zoomTo(
        this.pinch.zoom * (this.pointerDistance() / this.pinch.distance),
        {
          x: (a.x + b.x) / 2,
          y: (a.y + b.y) / 2,
        }
      );
      return;
    }

    if (this.pointers.size !== 1 || !this.start) {
      return;
    }
    if (
      !this.dragged &&
      Math.hypot(point.x - this.start.x, point.y - this.start.y) >
        DRAG_THRESHOLD
    ) {
      this.dragged = this.zoom() > 1;
    }
    if (this.dragged) {
      this.moveTo({
        x: this.offset().x + point.x - previous.x,
        y: this.offset().y + point.y - previous.y,
      });
    }
  }

  protected onPointerUp(event: PointerEvent) {
    const wasTap = !this.dragged && this.pointers.size === 1;
    this.pointers.delete(event.pointerId);
    if (this.pointers.size < 2) {
      this.pinch = null;
    }
    if (this.pointers.size === 1) {
      return;
    }
    const onControl = (event.target as Element).closest('button');
    if (event.type !== 'pointerup' || !wasTap || onControl) {
      return;
    }
    if (event.timeStamp - this.lastTap < DOUBLE_TAP_MS) {
      this.lastTap = 0;
      if (this.zoom() > 1) {
        this.reset();
      } else {
        this.zoomTo(DOUBLE_ZOOM, this.local(event));
      }
    } else {
      this.lastTap = event.timeStamp;
    }
  }

  protected onWheel(event: WheelEvent) {
    if (!event.ctrlKey && this.zoom() === 1 && event.deltaY > 0) {
      return;
    }
    event.preventDefault();
    this.zoomTo(
      this.zoom() * (event.deltaY < 0 ? 1.15 : 0.87),
      this.local(event)
    );
  }

  protected reset() {
    this.zoom.set(1);
    this.offset.set({ x: 0, y: 0 });
  }

  private zoomTo(target: number, around: Point) {
    const zoom = Math.min(MAX_ZOOM, Math.max(1, target));
    const ratio = zoom / this.zoom();
    const { x, y } = this.offset();
    this.zoom.set(zoom);
    this.moveTo({
      x: around.x - (around.x - x) * ratio,
      y: around.y - (around.y - y) * ratio,
    });
  }

  /** Keeps the plan covering the view: it never slides out of its frame. */
  private moveTo({ x, y }: Point) {
    const { width, height } = this.size();
    const zoom = this.zoom();
    this.offset.set({
      x: Math.min(0, Math.max(width * (1 - zoom), x)),
      y: Math.min(0, Math.max(height * (1 - zoom), y)),
    });
  }

  private pointerDistance(): number {
    const [a, b] = [...this.pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y) || 1;
  }

  private local(event: PointerEvent | WheelEvent): Point {
    const rect = this.viewport().nativeElement.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  private size() {
    const rect = this.viewport().nativeElement.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }
}
