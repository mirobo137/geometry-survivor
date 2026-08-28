# UI SVG masters

These are code-first source assets. They are inserted inline in the DOM so
`currentColor` follows the button state and the hit-area remains an HTML
control.

| Asset | Consumer | ViewBox | Render mode | Max instances |
| --- | --- | --- | --- | --- |
| `pause.svg` | direct pause button | `0 0 24 24` | inline DOM | 1 |
| `settings.svg` | pause settings toggle | `0 0 24 24` | inline DOM | 1 |

Both icons are decorative inside labelled buttons (`aria-hidden="true"`), use
prefixed deterministic IDs, contain no external resources or filters, and
remain legible on the dark UI at mobile scale.
