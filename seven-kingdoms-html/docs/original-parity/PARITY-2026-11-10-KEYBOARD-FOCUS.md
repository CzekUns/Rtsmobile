# PARITY-2026-11-10-KEYBOARD-FOCUS

Status: DA CORREGGERE (browser verification pending).

Source: HTML runtime `game.js` global keydown handler (main as of 2026-11-10). The handler previously ignored only HTMLInputElement. In particular, Space on a focused HUD button toggled game pause instead of activating the focused button. This is a demonstrable browser keyboard interaction defect, **not** a claim about original 7KAA keyboard behavior.

Implementation: `playtest/keyboard-focus-guard.js` skips global shortcuts for focused native and ARIA interactive controls. The map/document retains F1–F9, 0–5, Space, S and Escape shortcuts. Existing mobile fullscreen layout, left controls, MOD, joystick and multi-select unchanged. No original assets copied; Asset PR #13 untouched.

Tests: `tests/keyboard-focus-guard.test.js` covers focused interactive controls and map targets. Browser keyboard test and full CI remain pending.

Dependency: compare HUD visual layout with verified 7KAA screenshots and licensed graphics in the asset stream; do not treat this input correction as graphical parity.
