# Logos

The PwStreamer mark: a hexagon frame around a play glyph with two radar arcs, copied from `src/components/PwStreamLogo.tsx`.

- `pwstreamer-mark.svg`: the shell version. Frame stroke and play glyph in the brand gradient (`brand-grad-from` → `brand-grad-mid` → `brand-grad-to`, isoluminant), the dark hexagon fill, the blue arc and the pink arc at 60%, and the dashed inner circle. In the product the circle pings once per second (`animate-ping`) and the mark has a 12px blue glow; this file is still.
- `pwstreamer-mark-mono.svg`: the console version. One ink only, `n-96` (#F0F5F9) baked in because `<img>` cannot inherit colour; on a light ground use the React `Logo` with `monochrome` instead, which draws in `currentColor`. No gradient, no glow, no circle.
- The wordmark is set in type, not a file: "Pw" in `ink-hi` and "Streamer" clipped to the gradient, Poppins 900, tracking −0.025em, with "ONLINE STUDIO" below in `wordmark-tag`. In the console the whole word is `ink-hi`. Use the `Logo` component.

Rules: never redraw the mark, never put the gradient anywhere else, never scale below 24px, and never place the gradient version on the studio surface.
