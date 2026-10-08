A stream key or invite link, masked by default, with reveal and copy. Intentional addition for ingest (OBS, vMix) and guest invites.

- The consumer supplies `value` and a `label`. The field is read-only, mono, masked with bullets; "Mostrar chave" (a text action beside the label) reveals it; "Copiar" (ghost button) copies and says "Copiado" for 1.6s with `aria-live`.
- Keys are never shown by default, never logged, and never rendered in a URL. Rotating a key is a danger action in a confirmation dialog.
