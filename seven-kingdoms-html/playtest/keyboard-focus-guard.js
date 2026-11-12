/* Prevent RTS shortcuts from stealing keyboard activation on HUD controls. GPL-2.0-only. */
export function shouldIgnoreGlobalShortcut(target, modalOpen=false){
 if(modalOpen)return true;
 if(!target||typeof target.closest!=='function')return false;
 return Boolean(target.closest('button, input, textarea, select, a[href], [contenteditable]:not([contenteditable="false"]), [role="button"], [role="textbox"], [role="combobox"]'));
}
