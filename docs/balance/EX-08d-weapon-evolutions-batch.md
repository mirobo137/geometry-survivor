# EX-08d - lote completo de evoluciones de armas

Fecha: 2026-09-14  
Estado histórico: implementación v1; feedback humano posterior obliga a rediseño.

**Prevalece [EX-08-R](../design/EVOLUCIONES_V2.md):** solo la pareja Projectile
está aprobada. Las diez rutas restantes tienen contrato v2 planificado, aún no
implementado. Este documento conserva evidencia de v1 y accesos existentes;
sus métricas automáticas no aprueban utilidad, arte ni seguridad de v2.

## Decision de entrega

La solicitud vigente autoriza probar todas las evoluciones una por una sin
esperar a cerrar la validacion humana de cada arma base. Esto sustituye, para
este lote, la antigua secuencia documental de abrir una sola ruta por entrega.
No cambia el balance diferido de EX-02c ni convierte las evoluciones en cartas
gratuitas: cada ruta sigue siendo una eleccion real de nivel 7 y mantiene el
maximo global de tres armas activas.

El pool de evoluciones esta separado del pool normal. Cada familia ofrece
exactamente dos cartas mutuamente excluyentes y cada carta puede aplicarse una
sola vez. La oferta usa el overlay real de level-up, cambia a layout de dos
cartas, muestra `EVOLUCION`, y no muestra reroll rewarded para evitar que una
tercera alternativa rompa la decision.

## Rutas implementadas

| Familia | Ruta A | Ruta B | Cambio de juego |
| --- | --- | --- | --- |
| Projectile / Pulse Cannon | `rail_lance` | `pulse_volley` | Perforacion pesada hasta 5 objetivos frente a abanico estrecho de 3 proyectiles. |
| Prism Aegis / Orbit | `solar_crown` | `graviton_halo` | Mas alcance y dano frente a pulsos periodicos de control. |
| Chain Lightning | `closed_circuit` | `thunderhead` | Retorno condicionado al borde frente a explosiones retardadas por objetivo. |
| Vector Boomerang | `twin_comet` | `singularity_return` | Dos piezas opuestas frente a pulso de captura al regresar. |
| Pulse Ring | `echo_shock` | `compression_wave` | Segunda onda con ledger de dos golpes frente a atraccion previa e impacto pesado. |
| Magnetic Charge | `event_horizon` | `polar_collapse` | Ventana/radio/fuerza de control frente a segunda contraccion con dano parcial. |

Los valores authored y los limites de balance siguen en
`PLAN_DESARROLLO.md` §16.4-§16.5. Las evoluciones no agregan entidades fuera de
los pools existentes, respetan el cooldown por objetivo donde hay dano
persistente y no aplican knockback a bosses.

## Accesos directos

Todos requieren `debug=1`. El acceso prepara la familia base cuando hace falta,
abre directamente la oferta de nivel 7 con sus dos cartas y, al elegir una,
continua una run real con enemigos, arena y hazards del Acto II.

### Projectile / Pulse Cannon

- `/?evolution=rail-lance&debug=1&quality=high`
- `/?evolution=pulse-volley&debug=1&quality=high`

### Prism Aegis / Orbit

- `/?evolution=solar-crown&debug=1&quality=high`
- `/?evolution=graviton-halo&debug=1&quality=high`

### Chain Lightning

- `/?evolution=closed-circuit&debug=1&quality=high`
- `/?evolution=thunderhead&debug=1&quality=high`

### Vector Boomerang

- `/?evolution=twin-comet&debug=1&quality=high`
- `/?evolution=singularity-return&debug=1&quality=high`

### Pulse Ring

- `/?evolution=echo-shock&debug=1&quality=high`
- `/?evolution=compression-wave&debug=1&quality=high`

### Magnetic Charge

- `/?evolution=event-horizon&debug=1&quality=high`
- `/?evolution=polar-collapse&debug=1&quality=high`

Se puede sustituir `high` por `low`. Low conserva el verbo critico y la
telemetria principal; High anade capas decorativas sin alterar la simulacion.

## Laboratorio de prueba aislada

La ruta anterior conserva la oferta de dos cartas y sirve para comprobar la
decision dentro del flujo real. Para probar una evolucion concreta sin tener
que esperar al nivel 7, agrega `scenario`:

- `/?evolution=<slug>&scenario=single&debug=1&quality=high`: aplica la evolucion
  indicada desde el inicio y crea un objetivo durable. No aparece el overlay;
  la partida empieza directamente para leer trayectoria, cadencia, impacto y
  estado posterior.
- `/?evolution=<slug>&scenario=mass&debug=1&quality=high`: aplica la evolucion
  indicada y crea 56 objetivos durables en tres anillos concentricos. Sirve para
  comprobar cobertura, priorizacion, repeticion por objetivo, acumulacion de
  impactos y legibilidad cuando hay muchos blancos.

`<slug>` acepta los doce valores de la tabla: `rail-lance`, `pulse-volley`,
`solar-crown`, `graviton-halo`, `closed-circuit`, `thunderhead`, `twin-comet`,
`singularity-return`, `echo-shock`, `compression-wave`, `event-horizon` y
`polar-collapse`. Cambia `quality=high` por `quality=low` para comparar la
jerarquia de lectura. El panel debug muestra `mode: evolution-single` o
`mode: evolution-mass` y `enemies: 1/250` o `enemies: 56/250`.

Estos dos escenarios son un laboratorio determinista: desactivan hazards y
boss, congelan los objetivos y usan vida alta para que la evolucion se pueda
observar. La masa no sustituye la validacion de una run real; despues de
aprobar el verbo visual y la cobertura, usa la ruta de oferta normal para
comprobar movimiento, presion y balance.

## Validacion automatica realizada

- `npm test -- --run`: 97 archivos, 379 tests, todos correctos.
- `npm run build:local`: typecheck, suite completa y build Vite local correctos.
- La suite cubre elegibilidad, exclusion mutua, aplicacion unica, cooldowns,
  pools, ledger por objetivo, trayectoria, retorno, pulsos, explosiones y
  render de las evoluciones.
- El smoke browser tambien cubre las 12 rutas en `scenario=single` y las 12 en
  `scenario=mass`, incluyendo el conteo de objetivos del panel debug.
- El warning conocido del bundle principal mayor de 500 kB permanece visible;
  esta separado del alcance de EX-08.

## Checklist humano al volver

Para cada familia, abrir una ruta y elegir la carta que se quiera probar:

1. Confirmar que se ven dos cartas y no aparece reroll.
2. Elegir una ruta y comprobar su verbo en combate durante al menos un minuto.
3. Confirmar que la ruta alternativa ya no aparece en la misma run.
4. Repetir en Low y High; comprobar que Low conserva lectura de dano.
5. Probar primero en PC y luego en movil: Rail Lance/Volley, Orbit, Chain,
   Boomerang, Pulse Ring y Magnetic Charge.
6. Registrar si una ruta domina dano, control o seguridad; no ajustar vida de
   enemigos ni dano general durante esta pasada.

La aprobacion humana de este lote es la puerta siguiente. Si una ruta falla,
se corrige esa familia sin reabrir las otras y se conserva la misma semilla y
el mismo escenario para comparar.
