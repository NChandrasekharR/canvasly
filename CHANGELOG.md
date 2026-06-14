# Changelog

All notable changes to MotionBoard are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Toast notification system (`toastStore` + `Toaster`) for app-wide feedback on
  import/export results, file-size limits, unsupported file types, invalid Lottie
  JSON, and unrecognized video URLs (previously console-only).
- Group visual UI: `GroupOverlay` renders a dashed bounding box with a label and
  ungroup button around each group via `ViewportPortal`.
- Video duration extraction on upload via an offscreen `<video>` element; the
  duration overlay on `VideoUploadCard` now displays.
- Rive state-machine detection from the runtime once a `.riv` loads, persisted to
  item data, enabling the state-machine selector dropdown.
- Per-board viewport persistence: each board restores its own pan/zoom.
- Drag moves are now undoable via a batched `updateItemPositions` action (one undo
  entry per drag gesture, including multi-select).

### Changed
- Code-splitting: the Canvas and the jszip-backed export/import are lazy-loaded,
  dropping the initial bundle from 1,456 KB to 314 KB (gzip 319 KB → 100 KB).
- Images are stored as IndexedDB blobs referenced by `blobId` instead of inline
  base64 data URLs.
- `listBoards` reads a stored `itemCount` instead of parsing each board's full
  serialized items.
- Undo/redo snapshots now capture both items and groups.

### Fixed
- Imported items not rendering on the canvas: React Flow v12 controlled mode now
  applies all internal node changes via `applyNodeChanges()` so nodes receive
  measured dimensions and paint (#3).
- Auto-save race condition that could overwrite newer state with a slow earlier
  write (module-level debounce timer + in-flight locking).
- Blob URL memory leak and load race in `BoardNode`.
- Theme not persisting across reloads (restored at store init before first render).
- Orphaned media blobs now garbage-collected at board-open, when the undo stack is
  empty and an item cannot be resurrected.
- Added file-size validation, export/import error handling, and tag input
  validation.

### Security
- Resolved all 7 `npm audit` vulnerabilities (vite, rollup, minimatch, picomatch,
  flatted, brace-expansion, ajv).
