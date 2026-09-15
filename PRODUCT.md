# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Maher Khan and other educators, consultants, creators, and privacy-conscious teams who record walkthroughs, lessons, and process videos from a desktop or phone. Desktop users often work inside dense editing applications where screen space and always-visible controls are critical.

## Product Purpose

MaherCast is a local-first recording studio for capturing a screen or camera, annotating while recording, editing the result, and sharing it without requiring an account, subscription, or cloud upload. Success means a creator can begin, control, finish, and retrieve a recording without losing the application they are presenting or hunting for hidden controls.

## Positioning

MaherCast combines Loom-like recording and sharing with live compositing, local browser storage, real MP4 output when supported, and optional LAN sharing controlled by the user's own machine.

## Operating Context

- Desktop creators move between MaherCast and applications with crowded editing panels and tab bars.
- A floating control surface must remain useful without covering the controls or content being demonstrated.
- Mobile camera and overlay capture already work well and should remain simple.
- Users may run the static PWA from GitHub Pages or the bundled local Node.js server for LAN sharing.

## Capabilities and Constraints

- Preserve screen, camera, and overlay recording modes; microphone, camera bubble, and countdown controls; live annotations and captions; retake, pause, and stop; local library; built-in editing; MP4/WebM fallback; and local-network sharing.
- Browser screen capture cannot capture or control arbitrary desktop applications directly beyond standards-based capture APIs.
- Document Picture-in-Picture provides an always-on-top custom control window only in supporting browsers and secure contexts; its screen position cannot be set by the website.
- iOS browsers do not expose desktop-style screen capture, so camera and overlay modes remain the mobile path.
- Maintain a dependency-light vanilla HTML/CSS/JavaScript client and zero-dependency Node.js server unless a future decision explicitly changes the stack.

## Brand Commitments

Keep the MaherCast name, Maher Khan creator attribution, privacy-first/local-first promise, and approachable creator-facing voice. Do not fabricate customers, performance claims, prices, or endorsements.

## Evidence on Hand

The repository contains the working application, README feature inventory, MaherCast SVG icon, recording/compositing pipeline, editor, live encoder, local server, and existing PWA manifest. No customer testimonials or independent benchmarks are present.

## Product Principles

1. Recording controls stay reachable without stealing the creator's canvas.
2. Desktop workflows explain and survive browser capability limits.
3. Privacy and storage location are visible product state, not fine print.
4. The common path is calm and obvious; advanced studio tools appear when needed.
5. Mobile simplicity is preserved while desktop gains purpose-built control density.

## Accessibility & Inclusion

Core actions must be operable by keyboard, use visible focus states, expose text labels in addition to icons, honor reduced-motion preferences, and maintain readable contrast at desktop and mobile sizes.
