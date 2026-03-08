# my-canvas

A browser-based design canvas built with React + Vite. Think of it as a stripped-down Figma — you can drop shapes and text onto a canvas, move things around, resize them, and tweak properties without leaving the page.

Built this as a frontend challenge to get comfortable with drag interactions, ref-based mouse tracking, and undo/redo state management without reaching for a library.

---

## What it does

- Add rectangles, circles, text blocks, and image placeholders to a canvas
- Drag elements freely — positions snap to a 10px grid
- Resize from any of the 8 handles (corners + edges)
- Click to select, see a properties panel update in real time
- Layers panel on the right shows stacking order
- Undo / redo with full history
- Export the canvas as a PNG

---

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `Delete` / `Backspace` | Remove selected element |
| `Ctrl + Z` | Undo |
| `Ctrl + Y` | Redo |
| `Ctrl + D` | Duplicate selected |

---

## Running locally

```bash
git clone https://github.com/VGAJI469/my-canvas.git
cd my-canvas
npm install
npm run dev
```

Opens at `http://localhost:5173`

---

## Stack

- React 18 (hooks only, no external state lib)
- Vite
- Plain CSS-in-JS for styling
- html2canvas for PNG export
- Deployed on Vercel

---

## How the drag system works

Mouse events are tracked through refs rather than state — this avoids re-renders on every pixel of movement. On `mousedown` we record the cursor start position and the element's original coordinates. On `mousemove` we calculate the delta from the origin (not incrementally) to prevent drift, then snap to grid. On `mouseup` we commit the final position to history.

Resize works the same way, except when dragging a left or top handle we also shift the element's X/Y position to keep the opposite edge anchored.

---

## Folder structure

```
src/
└── App.jsx    — everything lives here (canvas, panels, drag logic)
```

Kept it as a single file since the scope didn't warrant splitting. Would refactor into separate components if this grew further.
