interface Drawable {
  draw: (time: number, onSecond?: () => void) => void;
}

/**
 * The high-level Rive runtime has no playback-speed setter. Scale the timestamps
 * passed into its draw loop so 0.5x / 2x change how fast the artboard advances.
 */
export function bindPlaybackRate(target: object, getRate: () => number): () => void {
  const runtime = target as Drawable;
  const original = runtime.draw.bind(runtime);
  let lastReal = 0;
  let synthetic = 0;
  runtime.draw = (time: number, onSecond?: () => void) => {
    if (!lastReal) {
      lastReal = time;
      synthetic = time;
    } else {
      const delta = time - lastReal;
      lastReal = time;
      synthetic += delta * getRate();
    }
    original(synthetic, onSecond);
  };
  return () => {
    runtime.draw = original;
  };
}
