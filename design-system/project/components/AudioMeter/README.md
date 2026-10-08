The microphone level from the stream itself: a segmented bar, the peak held one second, and the reading in dB.

- 96px × 8px (`meter-h`), square, on `well`, segments every 6px with a 1px gap in `surface`. Graduated by value, not hue: `ink-lo` below −12 dBFS, `ink-hi` above (`db`). The peak is a 2px `ink-hi` line. The reading ("−25 dB") is `measure` `ink-lo`; "—" when muted or silent.
- Writes straight to the DOM each frame in the product; never `Math.random`. Red never enters the meter: it is the air.
