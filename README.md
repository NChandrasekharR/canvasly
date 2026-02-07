# MotionBoard

A freeform canvas moodboard for video editors, animators, and motion designers. Unlike static pinboards, everything on MotionBoard is **alive** — videos loop on hover, Lottie animations play inline, Rive files respond to interaction, GIFs animate, and code snippets execute live.

## Features

- **Infinite canvas** — Pan, zoom, and arrange cards freely using React Flow
- **Mixed media support** — Images, GIFs, YouTube/Vimeo embeds, uploaded videos, Lottie animations, Rive files
- **Live code snippets** — HTML, CSS, JavaScript, and p5.js with sandboxed iframe preview
- **Text notes & color swatches** — Quick annotation and palette tools
- **Tagging & search** — Tag any card, filter by tag, full-text search across all items
- **Organization** — Z-index layering, item grouping, undo/redo (50-state history)
- **Multi-board management** — Create, rename, duplicate, and delete boards from the home view
- **Export/Import** — Save boards as `.motionboard` files (zipped JSON + media blobs) and re-import them
- **Dark & light themes** — Toggle between dark and light mode
- **Local-first persistence** — All data stored in IndexedDB via Dexie.js, no server required

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Canvas | React Flow (@xyflow/react) |
| State | Zustand |
| Storage | IndexedDB (Dexie.js) |
| Animations | @lottiefiles/dotlottie-react, @rive-app/react-canvas |
| Export | JSZip |
| Styling | Tailwind CSS v4 |
| Build | Vite 7 |

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check with `tsc` and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Testing Locally

MotionBoard is a client-side-only app with no backend. To verify everything works:

1. **Start the dev server** — `npm run dev` and open `http://localhost:5173`
2. **Create a board** — Click "New Board" from the home view
3. **Add items via right-click** — Right-click the canvas to open the add menu:
   - **Upload File** — Drop or select images, GIFs, videos, `.json` (Lottie), or `.riv` (Rive) files
   - **Paste URL** — Enter a YouTube or Vimeo link to embed
   - **Code Snippet** — Add live HTML/CSS/JS/p5.js editors
   - **Text Note** — Add editable text cards
   - **Color Swatch** — Add color palette entries
4. **Drag & drop** — Drag files directly onto the canvas to add them
5. **Clipboard paste** — Copy an image and press Ctrl/Cmd+V to paste it onto the canvas
6. **Resize cards** — Select a card and drag its resize handles
7. **Tag items** — Hover a card, click the tag icon, and add tags
8. **Search & filter** — Use the search bar or tag dropdown in the top bar
9. **Keyboard shortcuts**:
   - `Ctrl/Cmd + Z` — Undo
   - `Ctrl/Cmd + Shift + Z` — Redo
   - `Ctrl/Cmd + D` — Duplicate selected items
   - `Ctrl/Cmd + G` — Group selected items
   - `Ctrl/Cmd + Shift + G` — Ungroup
   - `]` / `[` — Bring to front / send to back
   - `T` — Add text note at center
   - `C` — Add code snippet at center
   - `Ctrl/Cmd + F` — Focus search
   - `Escape` — Clear search
10. **Export/Import** — Export a board from the top bar or home view, import `.motionboard` files from the home view
11. **Theme toggle** — Switch between dark and light mode from the home view header
12. **Production build** — Run `npm run build` and verify it completes without errors

## Project Structure

```
src/
├── components/
│   ├── cards/          # Card components (Image, GIF, Video, Lottie, Rive, Text, Color, Code)
│   │   ├── CardWrapper.tsx
│   │   ├── ImageCard.tsx
│   │   ├── GifCard.tsx
│   │   ├── VideoEmbedCard.tsx
│   │   ├── VideoUploadCard.tsx
│   │   ├── LottieCard.tsx
│   │   ├── RiveCard.tsx
│   │   ├── TextCard.tsx
│   │   ├── ColorCard.tsx
│   │   └── CodeCard.tsx
│   ├── Canvas.tsx       # Main React Flow canvas with drag/drop, paste, keyboard shortcuts
│   ├── BoardNode.tsx    # Custom React Flow node rendering the appropriate card
│   ├── HomeView.tsx     # Board management grid
│   ├── TopBar.tsx       # Board name, search, tag filter, export
│   ├── BottomBar.tsx    # Zoom, item count, storage, add button
│   ├── Sidebar.tsx      # Collapsible board list
│   ├── AddItemMenu.tsx  # Right-click context menu for adding items
│   └── TagEditor.tsx    # Tag display and editing
├── db/
│   ├── database.ts      # Dexie.js schema (boards + media stores)
│   └── boardRepository.ts  # CRUD operations for boards and media
├── store/
│   └── boardStore.ts    # Zustand store (state, actions, undo/redo, auto-save)
├── utils/
│   ├── video.ts         # YouTube/Vimeo URL parsing
│   ├── files.ts         # File type detection and data URL conversion
│   └── exportImport.ts  # .motionboard zip export/import
├── types.ts             # TypeScript interfaces for all data models
├── App.tsx              # Root component (home vs canvas routing)
├── main.tsx             # Entry point
└── index.css            # Global styles, CSS variables, theme definitions
```
