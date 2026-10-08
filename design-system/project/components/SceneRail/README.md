The console's left rail: the scenes, and below a line, the transition.

- 240px wide, `line` on the right. "Cenas" in `label` `ink-lo`. Each scene is a 56px `radius-xl` row: name in `body` `ink-hi`, the state word below in `label` ("preview", "programa", "programa e preview", "sem tela compartilhada"). The one in preview rises to `raise` (`aria-current`); the one on program has its word in `ink-hi` 500. Hover `panel`.
- The row's height is fixed so a cut never moves the list under the pointer. Choosing a scene sends it to preview, never straight to program.
- Children (the `TransitionKeys`) render under "Transição" after a `line`.
