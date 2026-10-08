A non-blocking notice, above every dialog (`z-toast`), polite to screen readers.

- On `raise` with a `line-ctl` border, `radius-xl`, `shadow-float`, sliding up 8px over `enter`. Title `body-strong` `ink-hi`, detail `label` `ink-lo`, an optional action underlined in `ink-hi`.
- Kinds: `success` (check icon), `error` (alert icon in `sig-texto`, the one place carmine says "failure", and it stays 6s), `info` (4s). Success stays 3.2s. At most four at once, bottom right.
- Replaced `alert()` and `confirm()`, which freeze the encoder mid-live.
