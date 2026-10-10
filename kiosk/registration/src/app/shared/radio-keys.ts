/**
 * Arrow keys move the focus between the answers of a radiogroup without
 * choosing one (choosing may move on to the next step).
 */
export function moveFocus(event: KeyboardEvent): void {
  const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
  const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
  if (!forward && !backward) return;
  const current = event.currentTarget as HTMLElement;
  const group = current.closest('[role="radiogroup"]');
  if (!group) return;
  const items = Array.from(
    group.querySelectorAll<HTMLElement>('[role="radio"]')
  );
  const index = items.indexOf(current);
  const next =
    items[(index + (forward ? 1 : -1) + items.length) % items.length];
  event.preventDefault();
  next.focus();
}
