The console's tray: microphone with the real meter, camera, screen, guides, and what is not yet possible, in words.

- `surface` with a `line` above, 8px gaps. Each control is a ghost `Button` with `aria-pressed`: on rises to `raise` + `ink-hi`, off sits in `well` + `ink-lo`; the icon and the word say the state ("Microfone mudo", "Câmera desligada"). On phones the word goes to screen readers and the control is a 44px square.
- A device picker is a chevron `Menu` glued to the control's right (`radius-xl` on the outer corner only), opening upward with the device in use ticked.
- The right-hand note says what is absent ("Transmitir para os canais ainda não está no ar.") instead of a disabled control.
