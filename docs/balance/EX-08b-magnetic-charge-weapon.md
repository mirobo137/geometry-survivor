# EX-08b - Magnetic Charge de jugador

Estado: implementada como reemplazo uno por uno de Resonant Aura; validación
humana pendiente.

## Fantasía y contrato

Magnetic Charge es una bomba magnética remota. El player no apunta a un enemigo
ni necesita que exista uno: cada lanzamiento captura un destino dentro de la
frontera, viaja hasta él, atrae enemigos comunes y detona durante una ventana
corta en una banda anular. El centro de la detonación es seguro para que el
player pueda leer la geometría y tomar una decisión de posicionamiento.

El contrato base actual es:

| Campo | Valor inicial | Regla |
| --- | ---: | --- |
| daño | 18 | provisional; no cerrar balance aquí |
| cooldown | 5.2 s | un cast activo como máximo |
| viaje | 0.42 s | destino capturado al lanzar |
| atracción | 1.0 s | sólo enemigos no boss |
| detonación | 1.3 s | banda con ticks por objetivo |
| recuperación | 0.36 s | residuo visual, sin daño |
| radio de atracción | 180 u | no atraviesa la frontera |
| fuerza de atracción | 135 u/s | no mueve bosses |
| radio interior | 62 u | centro seguro |
| radio exterior | 148 u | límite exterior de daño |
| cooldown por objetivo | 0.32 s | evita burst accidental por frame |
| distancia de lanzamiento | 190–255 u | se clampa a la arena |

Estos valores son baseline authored, no balance final de EX-02c.

## Fases y simulación

`MagneticChargeBehavior` es puro y no importa Pixi. Mantiene una sola instancia,
usa `SpatialGrid`, `Float32Array` para cooldown/generación por slot y un RNG
seeded para que el drill sea reproducible.

1. `travel`: toma origen y destino; la carga se desplaza con smoothstep.
2. `attract`: el destino queda fijo; los enemigos comunes cercanos reciben una
   velocidad limitada hacia el centro. Un boss conserva posición y velocidad.
3. `detonate`: se consulta la banda annular; el centro y el exterior quedan
   seguros. Cada objetivo recibe daño sólo cuando vence su cooldown.
4. `recovery`: termina la lectura visual y vuelve a cooldown/idle.

El destino siempre usa `clampPointToArena` y un radio de cuerpo conservador.
La vista consume `CombatRenderState.magneticCharge`; nunca decide daño, fuerza,
colisiones ni selección de objetivos.

## Acceso de prueba

Abrir:

`/?weapon=magnetic-charge&debug=1&quality=high`

También existe `quality=low`. El drill crea ocho blancos estáticos en varias
distancias, apaga otras armas y hazards, y muestra:

- `mode: magnetic-charge-drill`;
- `magnetic: travel|attract|detonate|recovery | x,y`;
- `enemies: 8/250`.

La prueba debe comprobar que la carga aparece aunque no haya blancos, que el
viaje no sigue enemigos, que la atracción acerca sólo enemigos comunes, que el
centro no recibe daño y que el reset permite comenzar otra carga.

## Evoluciones bloqueadas

No se implementan hasta la aprobación humana de la base en PC/móvil y Low/High.
Son rutas mutuamente excluyentes y conservan un solo cast activo.

### Event Horizon (`event_horizon`)

Ruta de control. La carga sostiene el campo durante más tiempo, aumenta radio y
fuerza de atracción, reduce algo el daño y alarga el cooldown. El objetivo es
preparar una zona de convergencia, no convertirla en un imán permanente.

Valores de diseño iniciales para la futura ficha: atracción +35%, radio +12%,
daño -10%, cooldown +20%. La forma final se decide tras medir cobertura y
seguridad contra la build de nivel 7.

### Polar Collapse (`polar_collapse`)

Ruta ofensiva. Reduce la ventana de atracción y añade un segundo pulso de
contracción/expansión dentro del mismo evento, con daño parcial. El cooldown
aumenta para limitar el burst y el centro permanece seguro.

Valores de diseño iniciales para la futura ficha: atracción 0.65 s, segundo
pulso al 55–60% del daño y cooldown +25%. Debe validarse que no supere el techo
de single-target ni convierta el control en daño inevitable.

## Definition of Done

- catálogo activo, carta y límite de tres armas actualizados;
- behavior puro con fases, destino clamped, atracción sin boss y banda con
  cooldown por objetivo;
- vista premium diferenciada de Pulse Ring y del hazard radial;
- Low conserva la baliza, núcleo y banda de daño;
- pruebas unitarias, typecheck, build local y smoke dirigido verdes;
- validación humana pendiente antes de desbloquear cualquiera de las dos rutas.
