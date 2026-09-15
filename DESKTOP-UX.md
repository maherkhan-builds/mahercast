# Desktop recording UX

MaherCast's desktop workflow is designed around one constraint: the controls must remain reachable without taking over the application being recorded.

## The gap this revision closes

The old flow displayed the floating-control prompt only after the browser's screen picker returned. On desktop, the picker can focus the selected editing application immediately. That left the prompt in the MaherCast tab behind the editor—the creator had to switch back before they could open the supposedly always-visible controls.

MaherCast now passes a `CaptureController` to `getDisplayMedia()` when the browser supports it and requests `no-focus-change` immediately after a window or browser tab is selected. This keeps MaherCast visible for the floating-dock handoff. The dock prompt is a focused, full-screen decision instead of a small banner.

## Control-dock behavior

- The compact dock is a 430 × 66 control rail with timer, annotation expansion, pause, retake, and stop.
- Annotation tools are hidden in compact mode so they cannot wrap or be clipped.
- Choosing an annotation tool expands the exact-aspect preview automatically.
- The creator positions the dock manually on a quiet screen edge or secondary display. The Document Picture-in-Picture standard does not allow websites to set window position.
- If Document Picture-in-Picture is unavailable, recording and the in-page studio remain functional and the home screen identifies the limitation before capture begins.

## Browser reality

The always-on-top custom dock relies on Document Picture-in-Picture. It is a progressive enhancement with limited cross-browser support and requires a secure context (HTTPS; localhost is treated as secure). Current Chromium-based Chrome and Edge are the intended desktop path. Camera and overlay recording remain the primary mobile path.

## Remaining platform boundary

A browser PWA cannot register system-wide shortcuts, force itself above exclusive full-screen applications, choose the dock's screen coordinates, or become click-through. Those capabilities require a signed native desktop wrapper. The web version should describe this boundary honestly rather than promise behavior the platform cannot guarantee.
