# EX-06c — resultado del Acto I e intermisión segura

## Intención

Después de derrotar a Core Sentinel, dejar claro que se completó el Acto I,
acreditar su resultado final exactamente una vez y no prometer un Acto II antes
de que exista uno jugable. La intermisión es una frontera de lifecycle, no una
Expedition parcial.

## Contrato implementado

- `GameState` añade `act-intermission`, alcanzable únicamente desde `victory`.
  No ejecuta simulación, puede reiniciar una run o volver a `menu`, y no revive.
- `Game` mantiene la liquidación idempotente de EX-01. La victoria se acredita
  antes de abrir el resumen; una salida al menú invalida callbacks rewarded
  tardíos sin alterar el saldo ya pagado.
- `GameOverOverlay` recibe datos de presentación, no reglas: muestra **Acto I ·
  Radial superado**, explica que la NOVA se acreditó una vez y ofrece `Repetir
  Acto I` y, cuando existe menú, `Volver al menú`.
- No hay `Continuar`, desbloqueo de Angular, bonus fijo adicional, persistencia
  de build ni snapshot de Expedition. El doble de NOVA conserva el contrato
  terminal existente y no constituye una segunda recompensa de acto.

## Evidencia automática — 10-09-2026

| Comprobación | Resultado |
| --- | --- |
| `npx vitest run src/app/GameState.test.ts src/app/Game.test.ts` | 19/19 correcto |
| `npm run typecheck` | correcto |
| `npm test` | 81 archivos / 276 pruebas correctas |
| builds `local`, `poki`, `crazygames` | targets generados correctamente |
| `npx playwright test --reporter=line` | 24/24 correcto, 2.8 min |

El runner emitió avisos de `NO_COLOR`/`FORCE_COLOR`; no son fallos de producto.
La verificación aislada de Vite confirmó el warning conocido: el chunk principal
local es 675.77 kB minificado / 186.27 kB gzip (Poki y CrazyGames: 675.73 kB /
186.23 kB gzip). Sigue pendiente de una tarea de presupuesto independiente.

## Validación humana requerida para EX-06d

Completar diez runs del Acto I actualizado entre desktop y móvil. Debe haber al
menos una victoria con boss en cada plataforma disponible para comprobar la
intermisión; las demás runs pueden terminar en derrota si reflejan la presión
real. En las runs donde se llegue al boss, confirmar:

1. Tras el boss se lee que Radial terminó y que la NOVA se acreditó una sola vez.
2. `Repetir Acto I` comienza limpio, sin build, boss ni recompensa anterior.
3. `Volver al menú` restaura el menú y una nueva partida empieza limpia.
4. No aparece ni se espera un botón `Continuar` o un Acto II inexistente.
5. El pulso radial sigue siendo comprensible y sus dos refugios resultan cómodos
   con la presión real de enemigos y láseres.

Anotar por cada run plataforma, calidad, resultado, si se entendió el pulso y
cualquier daño que se sintiera inevitable. Esto valida EX-06d; no reemplaza la
pasada cuantitativa de HP/daño de EX-02c.

No usar esa prueba para modificar HP, daño, laboratorio ni recompensas: esas
decisiones siguen concentradas en EX-02c.
