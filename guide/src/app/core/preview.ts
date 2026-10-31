/**
 * Opened in the dashboard's preview: shows the tour despite the countdown and leaves no traces.
 * Only inside a frame, so typing ?preview into the address bar still shows the countdown.
 * Read once at load, because the router drops the query string on the first navigation.
 */
export const isPreview =
  window.self !== window.top &&
  new URLSearchParams(window.location.search).has('preview');

/**
 * Guide and dashboard share an origin, so the preview would write to the real guide's
 * progress. All code uses localStorage directly, hence the swap at this one place.
 */
export function usePreviewStorage(): void {
  if (isPreview) {
    Object.defineProperty(window, 'localStorage', {
      value: window.sessionStorage,
    });
  }
}
