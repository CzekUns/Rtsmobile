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
export function reportKeyboardTarget(buttons, current, key) {
  const index = buttons.indexOf(current);
  if (index < 0) return null;
  if (key === 'Home') return buttons[0] || null;
  if (key === 'End') return buttons[buttons.length - 1] || null;
  if (key === 'ArrowRight') return buttons[index + 1] || null;
  if (key === 'ArrowLeft') return buttons[index - 1] || null;
  return null;
}
export function installReportToolbar(container, back, forward) {
  if (!container || !back || !forward) return () => {};
  const update = () => {
    const state = reportScrollState(container);
    back.disabled = !state.backward;
    forward.disabled = !state.forward;
  };
  const wheel = event => {
    // Translate vertical wheel input only while the report strip can scroll.
    // Native horizontal trackpad scrolling remains browser-managed.
    if (event.ctrlKey || event.altKey || event.metaKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
    const state = reportScrollState(container);
    if ((event.deltaY > 0 && !state.forward) || (event.deltaY < 0 && !state.backward)) return;
    event.preventDefault();
    const max = Math.max(0, container.scrollWidth - container.clientWidth);
    container.scrollLeft = Math.max(0, Math.min(max, container.scrollLeft + event.deltaY));
    update();
  };
  const previous = () => scrollReports(container, -1);
  const next = () => scrollReports(container, 1);
  const keyboard = event => {
    const buttons = [...container.querySelectorAll('button[data-report]')];
    const target = reportKeyboardTarget(buttons, event.target, event.key);
    if (!target) return;
    event.preventDefault();
    target.focus();
    target.scrollIntoView({block:'nearest',inline:'nearest'});
  };
  back.addEventListener('click',previous);
  forward.addEventListener('click',next);
  container.addEventListener('scroll',update,{passive:true});
  container.addEventListener('wheel',wheel,{passive:false});
  container.addEventListener('keydown',keyboard);
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
  observer?.observe(container);
  // Changes to label sizes or the report list can change overflow without resizing the viewport.
  const mutationObserver = typeof MutationObserver === 'undefined' ? null : new MutationObserver(update);
  mutationObserver?.observe(container,{childList:true,subtree:true,characterData:true});
  update();
  return () => {
    back.removeEventListener('click',previous);
    forward.removeEventListener('click',next);
    container.removeEventListener('scroll',update);
    container.removeEventListener('wheel',wheel);
    container.removeEventListener('keydown',keyboard);
    observer?.disconnect();
    mutationObserver?.disconnect();
  };
}
