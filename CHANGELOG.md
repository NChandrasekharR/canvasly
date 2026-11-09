# Changelog

All notable changes to MotionBoard are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Fixed
- Duplicating a board now copies its media and rewrites blob ids. Copies previously
  displayed the original board's files, then lost them when that board was cleaned
  up or deleted.
- Switching boards, going home, exporting, or duplicating flushes the debounced
  save first, so the last edit is not written onto the wrong board or dropped.
- Grouped cards move together, including while dragging, and deleted or regrouped
  cards no longer stay attached to a stale group.
- Hover-to-play embeds no longer stop the moment the player appears. Click
  Controls to use the player, or Expand to enlarge the card in place.
- Rive speed buttons change playback, and files with state machines actually run
  that state machine, including its inputs.
- Lottie files load under React Strict Mode. Files over 100KB are stored as media
  instead of inside the board document.
- Undo and redo no longer fire while typing in a note, snippet, tag, or search
  field. Code edits follow undo again.
- Pasting into a text field no longer also creates a card. Double-clicking a card
  no longer opens the add menu or zooms the canvas.
- Resizing a card from the left or top keeps its new position. Imported videos keep
  their MIME type so they play, and downloads are not cancelled by revoking the
  file URL immediately.
- Cmd/Ctrl+A selects every card, Cmd/Ctrl+N creates a board, and Escape clears
  the selection when search is empty.
- Item `createdAt` values round-trip through save and duplicate. `Date.toJSON`
  was turning them into plain strings before the serializer could mark them.

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
