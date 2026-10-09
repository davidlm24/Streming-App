An on/off switch (`role="switch"`) whose "on" is full ink, not the brand colour.

- 40 × 24px pill, 16px thumb with `shadow-ctl`, sliding on the strong ease-out curve. Off: `panel` track, `line-ctl` border, `ink-lo` thumb. On: `ink-hi` track, `bg` thumb. The state lives in `aria-checked` and the thumb position, never in colour alone.
- `busy`: saving; the switch stays put at 45% with `aria-busy` and `aria-disabled` (not `disabled`, so keyboard focus is kept) until the database confirms.
- `SwitchRow` pairs it with a title and description in a list row with a `line` divider (notification settings, "Transmitir para YouTube").
