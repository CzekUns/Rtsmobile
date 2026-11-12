/* Report navigation for the responsive classic HUD; no game-state writes. */
export function reportScrollState(container) {
  const max = Math.max(0, container.scrollWidth - container.clientWidth);
  const left = Math.max(0, Math.min(max, container.scrollLeft));
  return { backward: left > 1, forward: max - left > 1 };
}
export function scrollReports(container, direction) {
  if (!container || !Number.isFinite(direction) || direction === 0) return;
  const buttons = [...container.querySelectorAll('button[data-report]')];
  const viewport = container.getBoundingClientRect();
  const next = direction > 0
    ? buttons.find(button => button.getBoundingClientRect().right > viewport.right + 1)
    : buttons.reverse().find(button => button.getBoundingClientRect().left < viewport.left - 1);
  if (next) next.scrollIntoView({block:'nearest', inline:'nearest', behavior:'smooth'});
}
export function installReportToolbar(container, back, forward) {
  if (!container || !back || !forward) return () => {};
  const update = () => {
    const state = reportScrollState(container);
    back.disabled = !state.backward;
    forward.disabled = !state.forward;
  };
  const previous = () => scrollReports(container, -1);
  const next = () => scrollReports(container, 1);
  const keyboard = event => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const buttons = [...container.querySelectorAll('button[data-report]')];
    const index = buttons.indexOf(event.target);
    if (index < 0) return;
    const target = buttons[index + (event.key === 'ArrowRight' ? 1 : -1)];
    if (!target) return;
    event.preventDefault();
    target.focus();
    target.scrollIntoView({block:'nearest',inline:'nearest'});
  };
  back.addEventListener('click',previous);
  forward.addEventListener('click',next);
  container.addEventListener('scroll',update,{passive:true});
  container.addEventListener('keydown',keyboard);
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
  observer?.observe(container);
  update();
  return () => {
    back.removeEventListener('click',previous);
    forward.removeEventListener('click',next);
    container.removeEventListener('scroll',update);
    container.removeEventListener('keydown',keyboard);
    observer?.disconnect();
  };
}
