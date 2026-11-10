/* Prevent global RTS shortcuts from stealing native keyboard activation.
 * Keyboard shortcuts remain active when focus is on the world or document.
 * GPL-2.0-only.
 */
export function shouldIgnoreGlobalShortcut(target, modalOpen = false) {
  if (modalOpen) return true;
  if (!target || typeof target.closest !== 'function') return false;
  return Boolean(target.closest('button, input, textarea, select, a[href], [contenteditable]:not([contenteditable="false"]), [role="button"], [role="textbox"], [role="combobox"]'));
}
