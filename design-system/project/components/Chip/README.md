A destination with its state, clickable: the readiness line on the Painel.

- 36px pill, tonal: `panel` fill with `shadow-ctl` and no outline, name in `ink-hi`, platform mark on the left in `ink-lo`, hover `raise`.
- `state "ready"` shows a tick; `"pending"` an alert icon and the word (`stateLabel`: "sem chave", "sem servidor", "desligado", "não conectado"), always in the name's ink. The `aria-label` carries the whole phrase ("YouTube Principal: pronto"). Clicking a pending chip opens that destination's form at the missing field.
- `add` is the only dashed chip: "Conectar canal". A pending item never reads as an empty slot.
- Chips wrap with `chip-gap` between them (`ChipRow`).
