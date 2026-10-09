The overlay primitive: dialog semantics, focus trap, Esc, scrim click, scroll lock and focus return.

- Panel on `surface` with a `line` hairline, `radius-3xl`, `shadow-float`, entering with `enter` + 95% zoom; scrim `scrim` with a 3px blur at `z-scrim`, panel at `z-modal`.
- Sizes: `sm` (confirmations), `md` (`modal-md`, a short form), `lg` (`modal-lg`, a list), `xl` (`modal-xl`, master-detail). Header: optional icon, `title` h2, `description` p, the close button. Footer: ghost "Cancelar" then the verb button, 10px apart.
- `dismissible false` for destructive flows; `busy` while saving disables close, Esc and the scrim. The title never follows the inner selection: the verb goes on the button.
- A confirmation of something irreversible uses the `danger` button and focuses "Cancelar".
