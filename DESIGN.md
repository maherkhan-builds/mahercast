---
name: MaherCast
description: A private recording control bay that keeps the creator's canvas clear and every critical control within reach.
colors:
  signal-orange: "#ff6a3d"
  signal-orange-deep: "#d94723"
  operational-cyan: "#22c7d6"
  operational-cyan-deep: "#119aa8"
  warm-paper: "#f5f3ea"
  ink-black: "#111310"
  console: "#1a1d19"
  console-raised: "#232721"
  console-control: "#2a2f28"
  structural-line: "#343832"
  muted-copy: "#aaa99f"
  success-green: "#69da78"
  caution-amber: "#ffd166"
  warning-soft: "#ffb29e"
typography:
  display:
    fontFamily: "Aptos Display, Segoe UI, sans-serif"
    fontSize: "clamp(30px, 4vw, 48px)"
    fontWeight: 720
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Aptos Display, Segoe UI, sans-serif"
    fontSize: "34px"
    fontWeight: 720
    lineHeight: 1
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Segoe UI Variable, Segoe UI, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Segoe UI Variable, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "ui-monospace, monospace"
    fontSize: "10px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.09em"
rounded:
  compact: "6px"
  control: "8px"
  field: "10px"
  panel: "12px"
  surface: "16px"
  pill: "999px"
  circle: "50%"
spacing:
  xxs: "4px"
  xs: "8px"
  sm: "12px"
  md: "18px"
  lg: "24px"
  xl: "28px"
  xxl: "34px"
components:
  button-record:
    backgroundColor: "{colors.signal-orange}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.panel}"
    padding: "16px 18px"
    height: "62px"
    typography: "{typography.body}"
  button-record-hover:
    backgroundColor: "#ff805b"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.panel}"
  button-operational:
    backgroundColor: "{colors.operational-cyan}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.control}"
    padding: "9px 12px"
  button-console:
    backgroundColor: "{colors.console-control}"
    textColor: "{colors.warm-paper}"
    rounded: "{rounded.control}"
    padding: "9px 11px"
  tab-default:
    backgroundColor: "{colors.console-raised}"
    textColor: "{colors.muted-copy}"
    rounded: "0"
    padding: "14px 16px"
    height: "78px"
  tab-active:
    backgroundColor: "{colors.warm-paper}"
    textColor: "{colors.ink-black}"
    rounded: "0"
    padding: "14px 16px"
    height: "78px"
  card-console:
    backgroundColor: "{colors.console}"
    textColor: "{colors.warm-paper}"
    rounded: "{rounded.surface}"
    padding: "30px"
  field-dark:
    backgroundColor: "{colors.console-raised}"
    textColor: "{colors.warm-paper}"
    rounded: "{rounded.control}"
    padding: "7px 9px"
---

# Design System: MaherCast

## Overview

**Creative North Star: "The Creator's Control Bay"**

MaherCast feels like a compact piece of dependable recording hardware translated into a browser: ink-black console surfaces, warm high-contrast copy, signal lights, tight rails, and controls whose labels remain understandable under pressure. The interface is purposeful rather than cinematic. Its strongest visual moments identify recording commitment, source state, and the safe path back to the creator's work.

The system protects working space. Desktop screens use an asymmetric capture bay and readiness rail instead of a generic centered card, while active recording moves essential controls into a compact, always-on-top dock where the browser permits it. Advanced annotation surfaces expand only when requested. On mobile, the same world simplifies to a single column and preserves camera and overlay capture without pretending desktop screen-capture capabilities exist.

**Key Characteristics:**

- Warm industrial darkness with paper-like active reversals.
- Signal orange reserved for recording, stopping, and limited-capability attention.
- Operational cyan for selection, focus, annotation tools, and live interaction.
- Labeled, hardware-like controls with compact monospace instrumentation.
- A compact-first desktop dock designed to sit beside content, not over it.

## Colors

The palette is a warm near-black console with two deliberately scarce signals: orange communicates recording consequence, while cyan communicates operation and control.

### Primary

- **Signal Orange:** The main recording action, stop controls, recording indicators, and limited-support status. The brighter hover state confirms interactivity; the deep state is reserved for pressed or stronger emphasis.

### Secondary

- **Operational Cyan:** Selected tools, toggles, keyboard focus, selection color, instructional tips, and readiness sequencing. It means “the system is working here,” never “danger.”

### Tertiary

- **Success Green:** Local-storage and supported-capability lights only.
- **Caution Amber:** Preventive guidance and unresolved readiness only; it is not a decorative highlight.

### Neutral

- **Ink Black:** Page canvas and darkest diagram or overlay ground.
- **Console:** Primary cards and dense control surfaces.
- **Raised Console:** Tabs, fields, and nested controls that need separation without a shadow.
- **Warm Paper:** Primary copy and the active-tab reversal surface.
- **Muted Copy:** Supporting explanations and low-priority labels.
- **Structural Line:** Dividers, borders, and the one-pixel tab gutter.

### Named Rules

**The Two-Signal Rule.** Orange communicates recording consequence; cyan communicates operation. Do not swap them or use both as ambient decoration.

**The Local-State Rule.** Green is evidence of supported or locally stored state, not a generic brand accent.

## Typography

**Display Font:** Aptos Display (with Segoe UI and sans-serif fallbacks)  
**Body Font:** Segoe UI Variable (with Segoe UI and sans-serif fallbacks)  
**Label/Mono Font:** UI monospace (with monospace fallback)

**Character:** The pairing is direct and technical without becoming sterile. Display type is tightly tracked and compact; body copy remains familiar and highly readable; monospace appears only where instrumentation, keyboard cues, or system status benefits from machine-like cadence.

### Hierarchy

- **Display** (weight 720, fluid 30–48px, line-height .98): First-view task questions; keep to roughly 18 characters per line and balance wrapping.
- **Headline** (weight 720, 34px, line-height 1): Modal or dock-handoff statements with short, decisive phrasing.
- **Title** (weight 700, 20px, line-height 1.2): Library and section titles.
- **Body** (weight 400, 14px, line-height 1.55): Explanations and guidance, generally constrained to about 56 characters per line.
- **Label** (weight 700, 10px, tracking .09em, uppercase): Format badges and status instrumentation, never paragraphs.

### Named Rules

**The Instrumentation Rule.** Use monospace only for timers, step numerals, keycaps, formats, and compact status readouts.

## Layout

The page is capped at 1280px. Its main desktop grid uses a flexible 1.75fr capture bay and a minimum-300px, .8fr readiness rail, with a 22px gutter and 28px page insets. The local library spans both columns. Primary card padding is 30px; the readiness rail uses 24px. Repeated internal rhythm clusters around 8px, 12px, 18px, and 24px rather than a spacious marketing-page cadence.

At 860px and below, the shell becomes one column: recorder first, readiness second, library third. At 600px and below, horizontal insets fall to 12px, card padding becomes 20px by 16px, source tabs become a three-column icon-and-label grid, secondary tab descriptions and the desktop-readiness rail disappear, and the library remains a two-column grid. The header honors the top safe-area inset, and body bottom padding leaves space for fixed recording controls.

The studio is a full-viewport work surface. Its stage reserves 132px at the bottom for the annotation toolbar and recording rail. The toolbar can scroll horizontally within 96vw rather than wrapping over the canvas.

**The No-Occlusion Rule.** The compact desktop dock starts at approximately 430×66px and carries timer, annotate, pause, retake, and stop. Preview and tool palettes stay collapsed until requested; selecting a drawing tool expands them automatically. The site may ask the user to place the browser-controlled window on a quiet screen edge, but must never imply it can position that window itself.

**The Exact-Canvas Rule.** Expanded dock previews preserve the recording's aspect ratio with no letterbox interaction zone, so pointer coordinates land in the same place in the output.

## Elevation & Depth

MaherCast uses a hybrid depth model. Most controls are separated by tonal layers and structural borders; broad, diffuse shadows are reserved for major console cards, the recording action, floating rails, and modal handoff moments. There is no glassmorphism or backdrop blur. A faint four-pixel scanline texture and restrained cyan radial wash create atmosphere without competing with content.

### Shadow Vocabulary

- **Console Ambient** (`0 22px 70px rgba(0,0,0,.24)`): Main recorder and readiness surfaces.
- **Signal Lift** (`0 14px 34px rgba(255,90,54,.18)`): The record action only.
- **Floating Rail** (`0 12px 26px rgba(0,0,0,.44)`): Dock demonstrations and compact controls above another surface.
- **Handoff Modal** (`0 30px 90px rgba(0,0,0,.55)`): The desktop dock prompt, where focus must clearly leave the page behind it.
- **Status Halo** (`0 0 0 4px` with a 10–12% state-color tint): Small capability and privacy lights.

### Named Rules

**The Tonal-First Rule.** Use background steps and one-pixel borders for nested controls; add a shadow only when a surface must read as physically above another surface.

## Shapes

The form language is compact and manufactured: 8px control corners, 10px fields and guidance blocks, 12px action and nested-panel corners, and 16px major surfaces. Six-pixel corners belong to badges and keycaps. Circles identify lights, recording dots, color wells, and genuinely radial controls. Pills are limited to switch tracks and legacy chip-like selectors; rectangular controls should not become pills.

Active source tabs deliberately have square internal corners. Their shared 12px outer clipping and one-pixel structural gutter make the group read as one slotted hardware selector. Canvas and media edges use 10–12px clipping. Borders are low-contrast and structural, never ornamental.

**The Honest-Silhouette Rule.** A control's shape must describe its behavior: circles for signals and radial choices, compact rectangles for actions, pills only for continuous toggles or chips.

## Components

### Buttons

- **Shape:** Compact rectangular controls use 8–12px corners; the primary record action is a full-width 62px bar with a 12px radius.
- **Primary:** Signal orange on near-black text, padded 16px by 18px, with a recording dot and optional right-aligned keyboard cue.
- **Hover / Focus:** Record hover brightens to the documented orange hover token. Every keyboard-focusable control receives a 3px cyan outline with a 3px offset (2px inside the dock). Press feedback may scale the record action to .98.
- **Operational:** Cyan buttons select or reveal tools. Neutral console buttons use the raised control tone and brighten one tonal step on hover. Stop remains orange because it commits recording state.
- **Labels:** Critical dock actions use text—Annotate, Pause, Retake, Stop—even when neighboring annotation tools use symbols with tooltips.

### Chips

- **Style:** Filter chips are transparent with a low-contrast border, 12.5px semibold text, 7px by 11px padding, and a pill silhouette. Shape choices use 42px square controls with 10px corners; color and ring choices are circular.
- **State:** Active choices fill with operational cyan and remove ambiguity through strong foreground contrast. Do not rely on outline or hue alone when a label is available.

### Cards / Containers

- **Corner Style:** Major console panels use 16px corners on desktop and 14px on small screens; recording cards use 12px.
- **Background:** Console surfaces sit on ink black, with raised console tones for nested content.
- **Shadow Strategy:** Major planes use ambient shadows; nested regions use tonal contrast and borders.
- **Border:** One-pixel structural lines organize tab groups, toggles, lists, and empty states.
- **Internal Padding:** 30px for the primary recorder, 24px for the readiness rail, and 12–16px for smaller cards.

### Inputs / Fields

- **Style:** Dark raised-console background, warm-paper text, 8–10px corners, and 7–12px internal padding. Range and color controls use operational cyan.
- **Focus:** A 3px cyan focus-visible outline is the system default. Note-entry fields may also carry a 2px cyan border to remain locatable over video.
- **Error / Disabled:** Disabled controls reduce opacity to .4–.5 and remove the pointer affordance. Unsupported screen capture is stated in soft warning copy, disables the Screen tab, and moves the user to Camera rather than leaving a dead path.

### Navigation

Source selection is a segmented tab rail with explicit tab roles and synchronized `aria-selected`. Default tabs are raised-console blocks; the active tab reverses to warm paper with ink text. On phones, the rail remains three equal columns, moves icons above labels, and removes only secondary descriptions.

### Status and Guidance

Capability state pairs a colored light with live text. Yellow means checking, green means the floating dock is supported, and orange means the browser is limited. Preventive guidance uses an amber circular exclamation and plain-language recovery instructions. State must never be communicated by the light alone.

### Desktop Control Dock

The Document Picture-in-Picture dock opens compact and always-on-top in supporting secure browsers. It exposes recording-critical controls before any preview. “Annotate” expands to a tall or wide canvas with a tool rail; “Hide preview” returns to compact mode. Choosing a drawing tool while collapsed expands automatically. The dock may request 430×66px compact, 420px-wide tall, or 760px-wide horizontal layouts, but browser and operating-system constraints remain authoritative.

Where Document Picture-in-Picture is unavailable, the same recording and annotation controls remain on-page. Readiness copy names the limitation and suggests a current Chrome or Edge browser without blocking recording. Where screen capture itself is unavailable, especially on iOS, Camera and Overlay become the honest mobile path.

### Overlays and Motion

Countdowns, recording dots, toasts, modals, and the dock handoff are functional overlays. Modal and prompt layers dim the canvas without blur. Recording indicators may pulse at 1.2 seconds; toast entry may rise over .25 seconds. Under `prefers-reduced-motion: reduce`, all animation durations collapse to .01ms, iteration counts become one, and smooth scrolling is disabled.

## Do's and Don'ts

### Do:

- **Do** keep record, pause, retake, and stop reachable before revealing advanced tools.
- **Do** use orange for recording consequence and cyan for operation, selection, and keyboard focus.
- **Do** pair icons and colored status lights with persistent text or accessible labels.
- **Do** preserve on-page controls as the baseline and treat the floating dock as a capability enhancement.
- **Do** maintain the compact-first dock and ask users to place it beside—not over—the application they are presenting.
- **Do** preserve camera and overlay modes when mobile browsers cannot capture a desktop screen.

### Don't:

- **Don't** collapse the product into a generic centered recorder card or marketing hero.
- **Don't** promise automatic placement of the always-on-top dock; browsers do not grant that control.
- **Don't** allow “Entire Screen” capture to create a recursive mirror tunnel; direct users to a single app window or browser tab.
- **Don't** make advanced annotation tools permanently consume the creator's canvas.
- **Don't** use blur, glossy gradients, or decorative glow as a substitute for the tonal console hierarchy.
- **Don't** hide keyboard focus, depend on color alone, or leave unsupported actions enabled without an alternative.
