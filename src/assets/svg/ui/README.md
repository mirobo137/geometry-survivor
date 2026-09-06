# UI SVG masters

These are code-first source assets. They are inserted inline in the DOM so
`currentColor` follows the button state and the hit-area remains an HTML
control.

| Asset | Consumer | ViewBox | Render mode | Max instances |
| --- | --- | --- | --- | --- |
| `pause.svg` | direct pause button | `0 0 24 24` | inline DOM | 1 |
| `settings.svg` | pause settings toggle | `0 0 24 24` | inline DOM | 1 |
| `pause-icons.svg` | pause action/audio symbol sprite | `0 0 24 24` | one inline sprite + `<use>` | 1 |
| `pause-panel-frame.svg` | pause modal structural frame | `0 0 640 520` | inline DOM, decorative | 1 |
| `start/mark.svg` | start screen visual mark | `-72 -72 144 144` | inline DOM | 1 |
| `start/hero-scene.svg` | ambient start screen scene | `0 0 1200 900` | inline DOM, decorative | 1 |
| `level-up/card-frame.svg` | frame for each upgrade card | `0 0 320 260` | inline DOM | 3 |
| `level-up/icons.svg` | shared upgrade icon sprite | `0 0 48 48` | inline DOM + `<use>` | 1 |

Both icons are decorative inside labelled buttons (`aria-hidden="true"`), use
prefixed deterministic IDs, contain no external resources or filters, and
remain legible on the dark UI at mobile scale.

The start screen scene is mounted once behind the panel. Its orbit, node and
sweep groups are animated by CSS transforms, opacity and dash offsets; the SVG
source is never rebuilt during a frame. See `start/README.md` for the asset
contracts and responsive clipping rule.

The level-up menu keeps the same contract: geometry is SVG, while copy and the
touch target are native HTML. The frame stretches with `preserveAspectRatio="none"`
because it is a decorative nine-zone-like border; the icon sprite preserves its
aspect ratio and is mounted once. Card tone, focus, hover and reduced-motion
states are CSS concerns, so a new visual variant does not require changing the
simulation or duplicating SVG markup.

The pause screen follows the same split. `pause-panel-frame.svg` is a broad,
ID-free structural frame that may stretch with the panel; `pause-icons.svg` is
mounted once and its six symbols are referenced locally with `<use>`. The
overlay remains a native HTML surface: button labels, sliders, outputs and the
checkbox carry the meaning and input behavior.
# Dirección premium vigente

Consultar [la guía de UI](../../../../skills/geometry-survivor-svg/references/ui-art-direction.md)
y `docs/visual/ui-reference.html`. Las cartas consumen `premium-icons.svg` y
`premium-card-frame.svg`; las fuentes anteriores se conservan para comparación.
