# MotionBoard — Project Spec

## What Is This

A dynamic, freeform canvas moodboard for video editors, animators, and motion designers. Unlike Pinterest or Eagle, everything on this board is *alive* — videos loop on hover, Lottie animations play inline, Rive files respond to interaction, GIFs animate, code snippets execute live. It's a living reference board, not a static grid of thumbnails.

**Target users:** Video editors, motion designers, animators, creative directors — anyone who gathers visual/motion inspiration and needs to see it *moving*, not frozen.

---

## Tech Stack

- **Frontend:** React + TypeScript
- **Canvas:** React Flow (gives us pan/zoom/node positioning/selection/minimap for free — custom React components render as nodes, so rich content like video players and code editors work inside nodes without fighting the library)
- **Video playback:** Native HTML5 `<video>` for uploads, iframe embeds for YouTube/Vimeo
- **Animation runtimes:** `@lottiefiles/lottie-player` web component for Lottie, `@rive-app/canvas` for Rive
- **Code execution:** Sandboxed iframes for live preview (CSS animations, p5.js, HTML/JS)
- **Code editor:** Monaco Editor or CodeMirror
- **Storage:** IndexedDB via Dexie.js for local-first persistence. Media files (video, Rive binaries) stored as blobs in a separate object store from board state for fast board list loading.
- **Sharing:** Export board as `.motionboard` file (JSON state + media blobs zipped). Self-contained HTML viewer is a v1.1 goal.
- **Build:** Vite
- **Styling:** Tailwind CSS

---

## Core Features (v1)

### 1. Board Management & Navigation

The app has two modes: a **Home View** (board manager) and a **Canvas View** (board editor).

#### Home View (Landing Screen)
- Grid of board cards showing: board name, last modified date, item count, auto-generated thumbnail
- Thumbnail: canvas snapshot taken on save (debounced, low-res JPEG stored in board metadata)
- Actions: Create new board, Rename board (inline edit), Duplicate board, Delete board (with confirmation — no cloud backup)
- Import `.motionboard` file → creates new board
- Export selected board → downloads `.motionboard` zip

#### Canvas View
- Top-left: logo/icon → click to return to Home View
- Left sidebar (collapsible, collapsed by default): board list for quick-switching without going back to Home
- Top bar: board name (editable inline), tag filter, search, share/export button
- Bottom bar: zoom level, item count, storage usage indicator (e.g. "12.3 MB / ~500 MB"), quick-add button

#### Navigation Flow
```
App opens → Home View (board grid)
Click board → Canvas View
Top-left icon → back to Home View
Sidebar → quick-switch between boards
```

#### Settings
Global settings for v1 (not per-board): dark/light mode, default hover behavior for videos, grid snap preference.

#### Storage Architecture
```
IndexedDB Database: "motionboard"
├── Object Store: "boards"    → board metadata + item state (JSON, fast to load)
└── Object Store: "media"     → blobs keyed by ID (video, images, .riv files)
```
Media loaded lazily — board list renders instantly, blobs hydrate as items scroll into viewport.
Storage usage indicator in bottom bar warns when approaching browser limits.

### 2. Freeform Canvas

Infinite canvas with pan, zoom, and freeform item positioning.

**Requirements:**
- Infinite pan in all directions (mouse drag on empty space, or middle-click drag)
- Scroll-to-zoom with smooth interpolation
- Grid snapping toggle (off by default)
- Items freely positioned anywhere via drag-and-drop
- Items resizable by dragging corners/edges
- Multi-select with shift-click or lasso selection
- Delete selected items with Backspace/Delete key
- Undo/redo (Cmd+Z / Cmd+Shift+Z)
- Double-click empty space to open "Add Item" menu at click position
- Z-index controls: bring to front / send to back

### 3. Supported Item Types

Each item on the canvas is a "card" with a type-specific renderer.

#### 3a. Video Embed (URL)
- Paste a YouTube or Vimeo URL
- Auto-detect platform, extract embed URL via oembed or regex
- Fetch thumbnail automatically (YouTube: `img.youtube.com/vi/{id}/hqdefault.jpg`, Vimeo: oembed endpoint)
- Show thumbnail at rest, play inline on hover (configurable: hover-to-play or click-to-play)
- Display: title, source platform badge, duration if available
- Click to expand to larger inline player (not a modal — keep spatial context)
- Instagram/TikTok: stretch goal. YouTube + Vimeo cover 90% of use cases.

#### 3b. Uploaded Video/GIF
- Drag-and-drop or file picker for .mp4, .webm, .mov, .gif
- Store in IndexedDB media object store as blobs
- GIFs: always animate
- Videos: loop on hover, click for full playback with controls
- Show file name and duration as overlay
- File size: warn at 50MB, hard limit at 100MB per file

#### 3c. Image/Still
- Upload .png, .jpg, .webp, .svg
- Paste from clipboard (Cmd+V with image data)
- Simple display with optional caption/label
- Click to zoom/expand inline

#### 3d. Lottie Animation
- Upload `.json` Lottie file via drag-drop or file picker
- Paste LottieFiles URL → fetch JSON via their API
- Render via `<lottie-player>` web component (no React wrapper needed)
- Plays on loop by default, hover-to-play as option (match video behavior setting)
- Controls: speed (0.5x, 1x, 2x), play/pause
- Small JSON files can be stored inline in board state; larger ones as blobs

#### 3e. Rive Animation
- Upload `.riv` file via drag-drop or file picker
- Render via `@rive-app/canvas` runtime (~200KB)
- Plays on loop by default
- If file has state machines: expose interactive triggers on the card (hover zones, toggle switches). This is the killer feature — you can see how an animation *responds*, not just how it plays.
- Controls: speed (0.5x, 1x, 2x), state machine selector dropdown if multiple are available
- `.riv` files are binary — always stored as blobs in IndexedDB

#### 3f. Code Snippet (Live Preview)
- Monaco editor or CodeMirror for editing
- Language selector: HTML, CSS, JavaScript, p5.js
- GLSL and Three.js support: v1.1 (architecture supports adding languages later — it's just iframe content templates)
- Split view on the card: code on one side, live preview on the other
- Preview renders in sandboxed iframe (`sandbox="allow-scripts"`, no parent window access)
- For p5.js: auto-inject the p5.js library into the iframe
- For CSS: render a preview div with the CSS applied
- "Play" button to re-execute / refresh the preview
- Cards resizable to give more space to code or preview

#### 3g. Text/Note
- Rich text block (bold, italic, links — keep minimal)
- Used for annotations, labels, section headers on the board

#### 3h. Color Swatch
- Color picker or paste hex/rgb value
- Displays color as filled card with value overlaid
- For collecting palette inspiration alongside motion references

### 4. Content Ingestion

Multiple ways to add items:

- **Drag and drop** files onto canvas → creates item at drop position (detect file type: .json → Lottie, .riv → Rive, .mp4/.webm/.mov → video, .gif → GIF, .png/.jpg/.webp/.svg → image)
- **Paste URL** (Cmd+V with URL on clipboard) → auto-detect YouTube/Vimeo/LottieFiles and create appropriate embed card
- **Paste image** from clipboard → create image card
- **"+" button** → popover with options: Upload File, Paste URL, Code Snippet, Text Note, Color Swatch
- **Double-click empty space** → same as "+" but positioned at click location

### 5. Organization

- **Tags** — each item can have one or more text tags (e.g. "transitions", "typography", "color-grading", "shader")
- **Filter by tag** — top bar filter that dims/hides non-matching items
- **Search** — search across item titles, tags, URLs, note content
- **Grouping** — select multiple items → "Group". Groups move together, can be collapsed to a single card, can have a group label.
- **Z-index** — bring to front / send to back controls on hover

### 6. Board Persistence (Local-First)

- Auto-save to IndexedDB on every change (debounced ~500ms)
- Board state includes: item positions, sizes, types, content, tags, groups, canvas viewport position/zoom
- Board metadata: name, created date, last modified, item count, thumbnail, storage size
- Import/export as `.motionboard` file (JSON + media blobs zipped together)

### 7. Sharing (View-Only)

**v1:** Export board as `.motionboard` zip (JSON state + media files). Share by sending the file — recipient imports into their own MotionBoard instance.

**v1.1:** Generate a self-contained HTML file bundling a lightweight read-only canvas renderer + all media. Recipient opens in any browser, no install needed. Videos under 5MB embedded as base64; larger ones become links. File size warning if total exceeds 50MB.

---

## Data Model

```typescript
interface Board {
  id: string;                    // UUID
  name: string;
  createdAt: Date;
  updatedAt: Date;
  viewport: {
    x: number;                   // pan offset
    y: number;
    zoom: number;
  };
  items: BoardItem[];
  groups: Group[];
  thumbnail?: Blob;              // low-res JPEG canvas snapshot
  storageSize?: number;          // bytes, calculated on save
}

interface BoardItem {
  id: string;                    // UUID
  type: 'video-embed' | 'video-upload' | 'image' | 'lottie' | 'rive' | 'code' | 'text' | 'color';
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  tags: string[];
  groupId?: string;
  createdAt: Date;
  data: VideoEmbedData | VideoUploadData | ImageData | LottieData | RiveData | CodeData | TextData | ColorData;
}

interface VideoEmbedData {
  url: string;                   // Original URL
  embedUrl: string;              // Resolved embed URL
  platform: 'youtube' | 'vimeo' | 'other';
  title?: string;
  thumbnailUrl?: string;         // Auto-fetched on add
  duration?: number;             // seconds
}

interface VideoUploadData {
  blobId: string;                // Reference to IndexedDB media store
  fileName: string;
  mimeType: string;
  duration?: number;
  fileSize: number;              // bytes
}

interface ImageData {
  blobId?: string;               // For uploads
  url?: string;                  // For external images
  fileName?: string;
  caption?: string;
}

interface LottieData {
  blobId?: string;               // For larger JSON files stored as blobs
  url?: string;                  // LottieFiles URL
  animationData?: object;        // For small files, inline in board state
  speed: number;                 // Playback speed multiplier, default 1
  fileName?: string;
}

interface RiveData {
  blobId: string;                // .riv binary in IndexedDB media store
  fileName: string;
  fileSize: number;
  stateMachineNames?: string[];  // Available state machines detected on load
  activeStateMachine?: string;   // Currently selected
  speed: number;                 // Playback speed multiplier, default 1
}

interface CodeData {
  language: 'html' | 'css' | 'javascript' | 'p5js';
  code: string;
  showPreview: boolean;
}

interface TextData {
  content: string;               // Rich text or markdown
}

interface ColorData {
  hex: string;
  label?: string;
}

interface Group {
  id: string;
  label?: string;
  itemIds: string[];
  collapsed: boolean;
}
```

---

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  ◀ MotionBoard    [Board Name]     [Tags ▼]  [🔍]  [Export]  │
├──────┬──────────────────────────────────────────────────┤
│      │                                                  │
│Board │          Infinite Freeform Canvas                │
│List  │                                                  │
│      │    ┌──────┐  ┌──────────┐   ┌────────┐          │
│  +   │    │Lottie│  │ YouTube  │   │ Code   │          │
│ New  │    │ anim │  │ Embed    │   │+Preview│          │
│Board │    └──────┘  └──────────┘   └────────┘          │
│      │         ┌─────────┐                              │
│      │         │  Rive   │    ┌──────────┐             │
│      │         │interact │    │ Text Note│             │
│      │         └─────────┘    └──────────┘             │
│      │                                                  │
├──────┴──────────────────────────────────────────────────┤
│  Zoom: 100%  │  Items: 12  │  12.3 MB / ~500 MB  │  +  │
└─────────────────────────────────────────────────────────┘
```

### Visual Design Direction

- **Dark mode default** (creatives working with video prefer dark UIs — less eye strain, content pops)
- Light mode toggle available
- Neutral dark background (#1a1a1a), cards slightly lighter (#2a2a2a)
- Accent color: electric blue (#4A90FF) for selection states, hover highlights, "+" button
- Cards: subtle rounded corners (8px), minimal shadows
- Content-first: card chrome as minimal as possible. Item type icon + title in thin top bar, everything else is content.
- Hover states reveal controls (delete, resize, tag, z-index)
- Selection: blue outline with resize handles at corners/edges

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space + drag` | Pan canvas |
| `Scroll` | Zoom in/out |
| `Cmd + Z` | Undo |
| `Cmd + Shift + Z` | Redo |
| `Delete / Backspace` | Delete selected items |
| `Cmd + A` | Select all items |
| `Cmd + D` | Duplicate selected |
| `Cmd + G` | Group selected |
| `Cmd + Shift + G` | Ungroup |
| `Cmd + V` | Paste (URL → embed, image → image card) |
| `Cmd + F` | Focus search bar |
| `Cmd + N` | New board |
| `]` | Bring to front |
| `[` | Send to back |
| `Escape` | Deselect all |
| `T` | Quick-add text note at cursor |
| `C` | Quick-add code snippet at cursor |

---

## Implementation Milestones

These milestones are structured as learning loops. Each ends with putting the build in front of 3-5 motion/video people and watching them use it (not asking what they think — watching what they do).

### Milestone 0: Paper Prototype (1 day, before any code)

Throw 15-20 pieces of motion reference into Miro or FigJam — actual Lottie files, YouTube links, GIF screenshots, code snippets. Invite 3-4 motion designer friends and ask: "How would you organize this? What's missing? What do you keep going back to?"

**Validates:** Is freeform spatial organization the actual mental model, or do people default to lists/folders/tags?

### Milestone 1: Static Canvas with Mixed Media (1 week)

Build the canvas with drag-drop positioning, pan/zoom, and three item types: images, GIFs (always animating), and video embeds (hover-to-play). No persistence. Single board in memory that dies when you close the tab.

Deploy it. Put 20-30 items on it — real references from a real project. Use it for a week. Have two other people do the same.

**Validates:** Does "everything is alive" change how you engage with references vs. Pinterest? Is freeform positioning useful or do things end up in a messy pile?

**Build scope:**
- React + Vite + Tailwind project setup
- React Flow canvas with pan/zoom
- Image card (upload + clipboard paste)
- GIF card (always animating, drag-drop)
- Video embed card (URL paste → auto-detect YouTube/Vimeo → embed, thumbnail fetch, hover-to-play)
- Drag to reposition, resize items
- Add/delete items
- "+" menu and double-click-to-add

### Milestone 2: Persistence + Lottie/Rive (1 week)

Add IndexedDB persistence, file upload for Lottie and Rive, and basic board CRUD. This is where it stops being a demo and starts being a tool you leave open.

Lottie/Rive here is strategic — this is the differentiator. If people react to inline-playing Lottie on a freeform canvas with "oh shit, I've wanted this," you have PMF signal. If they shrug, the thesis is weaker than you think.

**Validates:** Do people come back? Do they start a second board unprompted? What's the ratio of "I added content" sessions vs. "I just browsed my board" sessions?

**Build scope:**
- IndexedDB setup with Dexie.js (boards + media object stores)
- Auto-save on every change (debounced 500ms)
- Home View: board grid with thumbnails, create/rename/delete
- Board switching via sidebar
- Lottie card (`<lottie-player>` web component, .json upload + LottieFiles URL)
- Rive card (`@rive-app/canvas`, .riv upload, state machine detection)
- Speed controls (0.5x, 1x, 2x) for Lottie and Rive
- Video upload card (drag-drop .mp4/.webm/.mov, blob storage, hover-to-play)
- Storage usage indicator in bottom bar

### Milestone 3: Organization + Code Snippets (1-2 weeks)

Tags, search, grouping, and code snippet cards with live preview (HTML/CSS/JS/p5.js only). This is where you learn whether people organize proactively (tagging as they add) or reactively (searching when they need something).

**Validates:** How do people retrieve inspiration? Spatially ("it was near the top-left"), by keyword search, or by tag filter? This tells you what to invest in.

**Build scope:**
- Tag system: add/remove tags on items, tag filter in top bar
- Search: across item titles, tags, URLs, note content
- Grouping: multi-select → group, group label, collapse/expand
- Z-index controls (bring to front / send to back)
- Multi-select with shift-click and lasso
- Undo/redo (Cmd+Z / Cmd+Shift+Z)
- Code snippet card: Monaco/CodeMirror editor, language selector, sandboxed iframe preview
- p5.js auto-injection into preview iframe
- Text/note card
- Color swatch card
- Full keyboard shortcuts

### Milestone 4: Export & Polish (1 week)

Export/import `.motionboard` files, board management polish, and the full sharing flow.

**Validates:** Does anyone actually share a board? Does the recipient engage with it or skim and close? If sharing is dead on arrival, deprioritize the HTML viewer and focus on single-player depth.

**Build scope:**
- Export board as `.motionboard` zip (JSON + media)
- Import `.motionboard` file → creates new board
- Board duplicate
- Board thumbnail generation (canvas snapshot on save)
- Light mode toggle
- Drag-and-drop file type detection (auto-route .json → Lottie, .riv → Rive, video/image types)
- File size warnings and storage limit handling
- Polish: loading states, error handling, empty states

---

## Non-Goals (v1)

- Real-time multi-user collaboration (Figma-style cursors, conflict resolution)
- Cloud storage / accounts / auth
- Mobile-responsive layout (desktop-first creative tool)
- AI-powered auto-tagging or content recommendations
- GLSL shader preview (v1.1)
- Three.js preview (v1.1)
- Self-contained HTML export for sharing (v1.1)
- Version history / time travel
- Plugin system
- Integration with Figma, After Effects, or other creative tools
- Comments or annotations beyond text notes
- Instagram/TikTok embed support (v1.1)
- Browser extension / bookmarklet for saving references

---

## Open Questions / Decisions to Make During Build

1. **React Flow node rendering** — React Flow renders custom React components as nodes. Verify early that complex content (video players with controls, Monaco editors, Rive canvases) performs well inside React Flow nodes. If performance is poor with 20+ rich nodes, consider virtualization or switching to a lighter canvas approach.

2. **IndexedDB storage limits** — Browser-specific, often 50% of available disk space. The storage indicator in the bottom bar is critical. Test with a board containing 20+ video files to find practical limits.

3. **Lottie file size threshold** — Small Lottie JSONs (< 100KB) can live inline in board state for faster loading. Larger ones should go to the media blob store. Find the right threshold during build.

4. **Rive state machine UX** — How to expose interactive triggers on a card without cluttering the UI? Consider: hover reveals a small control panel below the card, or a "interact" toggle that switches the card from preview mode to interaction mode.

5. **Embed URL extraction** — YouTube/Vimeo embed URLs are straightforward (regex + oembed). Don't overengineer platform detection. A simple URL pattern matcher is sufficient for v1.

6. **Code sandbox security** — Sandboxed iframe: `sandbox="allow-scripts"` attribute. No network access for executed code unless loading a library (p5.js CDN). Test that parent window is inaccessible from within the sandbox.

7. **Canvas snapshot for thumbnails** — `html2canvas` or React Flow's built-in viewport export. Needs to capture actual media content (at least placeholders) not just empty card outlines.

---

## Success Criteria

A board with ~20 items (mix of video embeds, uploaded GIFs, Lottie animations, Rive files, code snippets, images, and notes) should:
- Load in under 2 seconds
- Pan/zoom at 60fps
- Auto-save without perceptible lag
- Export to a `.motionboard` file that imports cleanly on another machine
- Feel like a creative tool, not a spreadsheet
