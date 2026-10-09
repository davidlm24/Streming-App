One message of the unified chat: the platform mark, the author, the time in mono, the text, and the actions on hover. Intentional addition over the studio's chat list.

- Mark in `ink-lo`, author `body-strong` `ink-hi`, time `measure` `ink-lo` on the right, text `body` `ink` with `text-wrap: pretty`. Rows separated by `line`; each new one enters 6px up over 250ms.
- `pinned`: the row sits on `panel` with "Fixado no programa" and the pin icon; the same text goes to the stage as the pinned comment. `flagged`: the moderation note in `ink-hi` with the alert icon and "Liberar"; the text drops to `ink-lo`. Never red.
- Actions (pin, "⋯" with Responder, Ocultar, Banir autor in `sig-texto`) appear on hover or focus. Virtualised in the product.
- `viewer`: the same row on the public page, without the actions and the moderation note; a flagged message simply does not reach viewers. The composer below it is `ChatComposer` with the viewer's own name.
