# EX-08a — Pulse Ring de jugador

Estado: **AUTOMÁTICO OK; validación humana pendiente**.

Esta es la primera arma faltante implementada después del cierre de la
composición del Acto II. No es la evolución `Echo Shock` ni la evolución
`Compression Wave`; ambas quedan para una entrega posterior y mutuamente
excluyente.

## Contrato authored provisional

| Parámetro | Valor | Propósito |
| --- | ---: | --- |
| Daño | 26 | un impacto por enemigo y cast |
| Cooldown | 3.8 s | arma de control, no limpieza continua |
| Telegraph | 0.65 s | comunica origen y compromiso |
| Ataque | 0.75 s | onda expansiva con cruce barrido |
| Recovery | 0.35 s | residuo visual sin daño |
| Radio inicial | 30 u | descarga nace alrededor del origen capturado |
| Radio final | 200 u | alcanza la formación cercana sin llenar la pantalla |
| Ancho | 28 u | banda legible, aún evadible |
| Empuje | 10 u por impacto, limitado a 24 u | libera espacio sin convertirlo en stun |

Los números son baseline de contenido y no cierran EX-02c. No se modificó la
vida, daño, resistencia ni spawn final de ningún enemigo.

## Simulación

`PulseRingWeaponBehavior` captura `(originX, originY)` cuando se dispara,
recorre `telegraph → active → recovery` y resuelve colisión por un intervalo
radial barrido entre el radio anterior y el actual. Un ledger de cast y
generación evita repetir daño a un enemigo o confundir un slot reciclado. Los
enemigos vivos reciben empuje radial; bosses no se desplazan.

El arma se desbloquea con la carta `pulse_ring`, respeta el límite vigente de
tres armas activas y se reinicia con la run. La tarjeta tiene icono `pulse`
en el sprite SVG premium de level-up. El scheduler no acumula cooldown mientras
la carta está bloqueada.

## Drill reproducible

`/?weapon=pulse-ring&debug=1&quality=high`

El drill crea siete chasers estáticos en radios de 68–184 u, desactiva el
proyectil automático y deja el hazard de Acto II inactivo. El primer cast se
ve aproximadamente después de 1.6 s y se repite con la cadencia acelerada del
drill. La URL `?pulse=1` conserva el significado anterior: hazard enemigo.

## Evidencia automática

- `PulseRingWeaponBehavior.test.ts`: origen capturado, cruce, daño único,
  empuje y reset.
- `CombatSimulation.test.ts`: drill aislado con arma real, siete blancos y
  hazards normales inactivos.
- `UpgradeApplier.test.ts`: carta, límite de una copia y catálogo de arma.
- `WeaponView.test.ts`: integración de la vista sin romper las capas actuales.
- `tests/browser/game.smoke.spec.ts`: boot del drill High y captura de canvas.

La validación humana queda pendiente: comprobar lectura de telegraph/activo/
recovery en PC y móvil, Low/High, que el empuje sea agradable y que no tape al
player ni a los hazards del Acto II. Comparar más tarde contra el nivel 7 base;
no ajustar daño definitivo durante esta ficha.
