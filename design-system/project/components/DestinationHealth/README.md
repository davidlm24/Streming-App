One row per destination while on air: signal bars on the ramp, the live numbers in mono, and the state in a word. Intentional addition.

- Columns: platform mark, name (`body-strong`), a five-bar signal (filled `ink-hi`, empty `chart-5`), bitrate, fps, dropped frames, latency, all `measure` tabular and right-aligned, then the state word.
- States: `stable` ("estável", `ink-lo`); `unstable` ("instável", `ink-hi`, two or three bars); `down` ("caiu", `ink-hi`, alert icon, no bars); `reconnecting` (spinner, `aria-busy`); `off` ("desligado"). Never green, amber or red: red is the air, and health is said by value and a word.
- `DestinationHealthTable` adds the column header. Lives in the Destinos tool panel and, summarised, in the studio bar ("Canais: 3 de 4 prontos").
