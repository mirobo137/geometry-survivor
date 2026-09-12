# EX-07c — Pulse Ring base

Estado: **APROBADO como parte del Acto II integrado — 12-09-2026**. Sus valores
de daño continúan provisionales hasta EX-02c.

Pulse Ring es el primer hazard de la familia Angular. No es una segunda onda
radial disfrazada: el jugador debe leer una banda que atraviesa la arena y una
abertura que gira durante el estado dañino.

## Contrato de simulación

- `telegraph → active → recovery`; la abertura existe desde el telegraph para
  que haya una respuesta observable antes de recibir daño.
- La banda alterna recorrido `outward`/`inward`.
- La abertura usa sectores authored, tiene un ángulo central y gira durante
  `active`; no se genera con aleatoriedad por frame.
- La colisión combina radio barrido y sector seguro. El cast puede dañar una
  sola vez aunque el jugador permanezca atrapado.
- El empuje es radial, de velocidad limitada y siempre vuelve a pasar por el
  clamp de `ArenaBoundary`; no teletransporta ni expulsa al jugador.
- El boss bloquea el inicio de una onda futura. Este drill no crea boss,
  enemigos, XP, NOVA ni una recompensa de acto.
- `damage`, vida y resistencia siguen siendo provisionales por EX-02c.

La fuente de verdad de parámetros es
`src/content/hazards/PulseRingDefinition.ts`. El comportamiento puro vive en
`src/simulation/hazards/PulseRingHazard.ts`; la vista reutiliza la receta
premium de `RadialPulseView` y abre físicamente el anillo alrededor del sector
seguro, sin pintar una falsa superficie segura.

## Prueba reproducible

```text
?pulse=1&debug=1&quality=low
?pulse=1&debug=1&quality=medium
?pulse=1&debug=1&quality=high
```

Durante `telegraph`, identifica el arco corto con las dos terminaciones
luminosas. Cuando la banda entra en `active`, ese arco es la respuesta segura
y rota; la banda restante sí hace daño y puede empujar levemente. Comprueba
que la recuperación deja sólo residuo y que no hay enemigos ni disparos.

## Puerta humana

Cerrada mediante la validación de la composición completa del Acto II: sector
seguro comprensible, abertura seguible, empuje legible y ausencia de daño
inevitable reportado. La aprobación no congela el valor numérico del daño.

## Siguiente trabajo

El hazard ya está integrado en EX-07e. El siguiente bloque del plan es EX-08;
su calibración numérica final permanece agrupada en EX-02c.
