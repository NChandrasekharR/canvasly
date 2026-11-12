# MotionBoard roadmap

Ordered by what to do first. Each item is unfinished work in this repo, with the files it starts from. The bar for a finished item is at the bottom of that item.

Duplicate media, save flushing, group drag, embed hover, Rive and Lottie playback, resize, and import MIME are already in place. This list is what comes after that.

## 1. Home shows the board

Home is a name, a date, and an item count. `DBBoard.thumbnail` exists and is never written. `HomeView` already reserves a 160px block for it and fills that block with the count.

On save, write a low-resolution JPEG of the current canvas into `thumbnail`. Home renders that image. Empty boards stay the empty state.

Done when opening the app shows the work on each board, and a save updates the picture.

## 2. The card gets out of the way

Every card prints its canvas coordinates in `CardWrapper`, all the time. Lottie and Rive keep speed buttons in a permanent footer. Images never grow. Embeds already rest on a thumbnail, play on hover, and expand in place.

- Remove the coordinate readout.
- Use one contract for image, video, Lottie, and Rive: a still or a quiet loop at rest, playback on hover, chrome (speed, state machine, controls) only while hovered, and expand in place for images the way embeds already expand.
- Color swatches copy their hex on click. The value is already drawn in `ColorCard`.
- Image captions exist on `ImageData` and are only used as a title fallback. A caption should be editable on the card.

Done when a board of references reads as the references, and the controls appear when a card is hovered.

## 3. Groups can be named and folded

`Group.collapsed` is stored and always `false`. `groupItems` accepts a label, and the only caller (`Canvas` on Cmd/Ctrl+G) never passes one. `GroupOverlay` can ungroup and cannot rename or collapse.

- Naming a group edits `label` in place.
- Collapsing a group draws one card for the group and parks the members. Expanding restores them where they were.
- Dragging a collapsed group moves every member.

Done when a region of a board can fold to a labeled card and open back to the same layout.

## 4. A LottieFiles link becomes an animation

`parseLottieUrl` accepts a URL that already ends in `.json` or `.lottie`. A LottieFiles or lottie.host page is rejected with a toast in `AddItemMenu` and `Canvas`. That is how these files are usually shared.

Resolve a page URL to the animation file, then add the same lottie card a direct file would add.

Done when pasting a LottieFiles animation page puts a playing card on the board.

## 5. Offscreen cards stop working

`ReactFlow` mounts every node. Spec wanted media to load as cards come into view. A board of clips, Lotties, and `.riv` files will keep every runtime playing.

Skip rendering cards well outside the viewport, and pause video, Lottie, and Rive that are not on screen. Opening a board should not fetch every blob up front (`BoardNode` loads each blob on mount).

Done when a large board stays responsive and only the visible cards are playing.

## 6. The library survives the browser

Boards live in the `motionboard` IndexedDB. Export is a zip the user has to remember, from a hover button on the home card or the canvas top bar. Clearing the browser profile deletes the library. There is no account to add. The copy should live in a folder the user picks, the way a project file already does.

- Say so on Home until that folder exists.
- Save and reopen boards from a chosen directory, media included.
- Keep `.motionboard` import and export for handing a board to someone else.

Done when a chosen folder still has the boards after the site data is cleared, and a board can still be exported as `.motionboard`.

## 7. Arrange a board that has more than a few cards

Freeform placement has no align or distribute. Once groups fold, the remaining pain is lining up the cards that stay open. Align and distribute come before grid snap.

Align and distribute the current selection (left, right, top, bottom, centers, and even gaps).

Done when a row of references can be lined up from the selection without dragging each card.

## 8. Notes can be a heading

`TextData.content` is one plain string. The spec's rich text editor is more than these boards need. A note needs a scale: body, or a heading used as a section title.

Done when a note can be set large enough to label a region of the board.

## 9. Hand someone a board they can open

v1.1 in `MOTIONBOARD-SPEC.md`: a self-contained HTML file with a read-only canvas. Videos under 5MB inline, larger ones linked, with a warning past 50MB.

Done when a recipient can open the file in a browser and see the board playing, without this app.

## 10. Correct the add-menu instructions

`README.md` tells people to right-click the canvas. The menu opens on double-click of empty space, and from the Add button. There is no right-click handler.

Done when the README matches the gesture.

## Leave these

Instagram and TikTok embeds, Monaco, GLSL, Three.js, grid snap, and accounts. YouTube, Vimeo, Lottie, Rive, and a live snippet already cover the product. Snap and a full code editor can follow once the board is recognizable, quiet, and safe outside one browser profile.
