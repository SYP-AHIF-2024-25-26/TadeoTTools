/**
 * Temporary: `?swipedebug` shows on the phone what the browser reports during a swipe, to find
 * why swipes fail on some real phones. `?swipedebug=0` turns it off again. Remove after the
 * open day once the cause is known.
 */
const KEY = 'swipedebug';
const LINES = 12;

function readFlag(): boolean {
  try {
    const param = new URLSearchParams(location.search).get(KEY);
    if (param !== null) {
      if (param === '0') {
        sessionStorage.removeItem(KEY);
      } else {
        sessionStorage.setItem(KEY, '1');
      }
    }
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

class SwipeDebug {
  readonly enabled = readFlag();
  private panel: HTMLElement | null = null;
  private lines: string[] = [];

  constructor() {
    if (!this.enabled) {
      return;
    }
    for (const type of ['pointerdown', 'pointercancel', 'pointerup']) {
      window.addEventListener(
        type,
        (event) => this.onPointer(event as PointerEvent),
        { capture: true, passive: true }
      );
    }
    this.log(`ua ${navigator.userAgent.slice(0, 60)}`);
  }

  log(line: string) {
    if (!this.enabled) {
      return;
    }
    const time = new Date().toISOString().slice(17, 23);
    this.lines = [...this.lines, `${time} ${line}`].slice(-LINES);
    this.render();
  }

  private onPointer(event: PointerEvent) {
    const target = event.target as Element;
    const where = `${target.tagName.toLowerCase()}${target.className && typeof target.className === 'string' ? '.' + target.className.split(' ')[0] : ''}`;
    if (event.type === 'pointerdown') {
      this.log(
        `down ${event.pointerType} x=${Math.round(event.clientX)} ${where} ta=${effectiveTouchAction(target)}`
      );
    } else {
      this.log(`${event.type.slice(7)} x=${Math.round(event.clientX)}`);
    }
  }

  private render() {
    if (!this.panel) {
      this.panel = document.createElement('pre');
      this.panel.setAttribute('aria-hidden', 'true');
      this.panel.style.cssText =
        'position:fixed;left:4px;right:4px;top:calc(env(safe-area-inset-top) + 60px);z-index:9999;' +
        'margin:0;padding:6px 8px;border-radius:8px;background:rgb(2 20 34 / .88);color:#fed7aa;' +
        'font:11px/1.35 ui-monospace,monospace;white-space:pre-wrap;pointer-events:none';
      document.body.appendChild(this.panel);
    }
    this.panel.textContent = this.lines.join('\n');
  }
}

/** touch-action is not inherited: the browser combines the values up the chain, so list them all. */
function effectiveTouchAction(target: Element): string {
  const values: string[] = [];
  for (let el: Element | null = target; el; el = el.parentElement) {
    const value = getComputedStyle(el).touchAction;
    if (value !== 'auto') {
      values.push(`${el.tagName.toLowerCase()}:${value}`);
    }
  }
  return values.join(' > ') || 'auto';
}

export const swipeDebug = new SwipeDebug();
