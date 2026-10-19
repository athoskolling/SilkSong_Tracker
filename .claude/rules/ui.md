---
paths:
  - "*.html"
  - "css/**"
  - "js/main.js"
  - "js/render.js"
  - "js/data.js"
  - "img/**"
---

# Rules for the interface

- The design is settled: `docs/DESIGN.md` (written contract) and `docs/design/screens/*.png` (ground truth). Do not redesign. If something cannot be built as drawn, say so to the orchestrator.
- Tokens live once, in `css/base.css`, as custom properties. No hard-coded colors elsewhere.
- Plain HTML, CSS, JavaScript modules. No framework, no build step, no script from a CDN (the Firebase SDK is the one exception, and only `js/firebase.js` imports it). Relative paths only (the site is served under `/<repository>/`).
- Requirements, Progress and sign-in go through the functions in `docs/CONTRACTS.md` only. The interface never reads localStorage, never touches Firestore and never walks `requires` itself.
- The mockups contain invented sample content. Never copy a name, step, requirement or number from them.
- Use glossary words in the interface: Collectible, Task, Region, Route, Step, Available, Locked, Visited. Sentence case. Copy comes from `docs/DESIGN.md`.
- A new game starts empty. Never show example progress.
- Accessibility is part of done: keyboard, visible focus, `aria-pressed` on done toggles, `aria-live` for status, not color alone, `prefers-reduced-motion`, nothing scrolls sideways at 390px, one `h1` per page.
- Images: `docs/IMAGES.md`. Every hero image has a credit, and a Region renders without an image.
