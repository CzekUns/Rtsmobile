# PARITY-2026-11-11-MINIMAP-MODIFIER-KEYS

- **ID:** SKH-106 / PR #104 (follow-up).
- **Original:** the3dfxdude/7kaa, original keyboard binding parity **not established**. This is an HTML accessibility extension, not an original 7KAA feature.
- **HTML:** `game.js` focused minimap keydown and `playtest/minimap-keyboard.js`.
- **Observed defect:** focused minimap intercepted modified Arrow/Home keystrokes, potentially stealing browser and assistive technology shortcuts.
- **Change:** only unmodified Arrow/Home moves the camera; Alt/Ctrl/Meta/Shift and composition events remain unhandled. No graphic assets or mobile MOD/joystick controls changed.
- **Commit:** 6a2cd92b, fee61f44, 7556e3de (PR #104).
- **Tests:** Node v22 direct smoke of helper: six assertions PASS in a local reconstruction. Regression cases added to `tests/ui/minimap-keyboard.test.js`. Full repository npm suite, Chromium 1x/2x, CI and deployment **not verified**.
- **State:** DA CORREGGERE (pending full CI and browser verification); no graphical parity claim.
