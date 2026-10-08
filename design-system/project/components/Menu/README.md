Secondary actions behind a "⋯" trigger, so each list row keeps one visible action.

- WAI-ARIA menu button: arrows move, Home/End jump, Esc closes and returns focus to the trigger, clicking outside closes. Choosing an item returns focus to the trigger before the action runs.
- The popover sits on `raise` with a `line` border and `shadow-menu`, `radius-xl`, items `radius-lg`, hover `panel`. A destructive item (`danger`) is set in `sig-texto`.
- `header` pins a line above the items (name and e-mail in the account menu). `side "up"` for triggers at the foot of the screen (the tray). `align "left"` for triggers at the left edge. `trigger` replaces the "⋯" (the avatar, a chevron).
