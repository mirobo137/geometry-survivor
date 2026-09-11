# Pulso radial premium — Pulse Crest

Aplicar junto a [EFECTOS_PREMIUM.md](EFECTOS_PREMIUM.md),
[ARENA_FX_PREMIUM.md](ARENA_FX_PREMIUM.md) y las skills de rendering y
mobile-performance. La implementación vive en `RadialPulseView`; el radio,
la dirección, la fase y el daño siguen siendo autoridad de
`RadialPulseHazard`.

## Intención

La onda activa no debe parecer un anillo coloreado. Debe leerse como una pieza
de energía que se desplaza por la arena: una carcasa oscura que separa el
peligro del fondo, una banda de material, un núcleo caliente y dientes que
explican si el pulso va hacia fuera o hacia dentro. El aviso continúa siendo
discontinuo y ambiguo; sólo la fase `active` revela el cuerpo que hace daño.

La dirección se comunica con geometría, no sólo con color:

- outward: dientes y filo caliente orientados hacia el borde, cyan;
- inward: dientes y filo caliente orientados hacia el centro, violeta;
- recovery: riel roto y débil, sin cuerpo sólido ni apariencia de hitbox activa.

No se pinta un bolsillo seguro opaco. En esos espacios deben seguir viéndose
player, enemigos y otros hazards.

## Receta de Pulse Crest

| Fase | Capas | Contrato visual |
| --- | --- | --- |
| Telegraph | rail discontinuo, guía oscura, núcleo y marcadores | carga legible; no hace daño ni revela el desplazamiento final |
| Active | carcasa tinta, armadura azul gris, manto cromático, cuerpo de energía, filo caliente, dientes | siempre visible mientras daña; radio exacto de simulación |
| Recovery | riel segmentado, base tinta y filo débil | disipación cuadrática; no parece amenaza activa |

La banda conserva el ancho authored como referencia de gameplay. La carcasa y
los dientes son decoración de contraste y no amplían la colisión. El núcleo
caliente ocupa poco ancho; no convertir toda la onda en una franja blanca.

## Construcción y movimiento

1. Construir el paquete de paths una vez cuando cambia `state.sequence`, usando
   `max(startRadius, endRadius)` como radio local de referencia.
2. Animar el viaje con `band.scale` y `activeMarkers.scale` respecto a ese radio;
   la simulación sigue entregando `state.radius` en cada render.
3. Aplicar una rotación ornamental mínima y determinista a los dientes; no usar
   reloj de pared, aleatoriedad ni una segunda trayectoria de gameplay.
4. Cada arco independiente comienza con `beginPath()` y cada diente termina
   con `closePath()`. Nunca confiar en el punto activo de PixiJS 8.
5. Ocultar inmediatamente el cuerpo al entrar en `recovery`; sólo permanece el
   residuo con `(1 - progress)^2`.

## Presupuesto

La jerarquía usa 10 `Graphics` persistentes y 2 `Container` internos: cinco
para el material activo, uno para aviso, uno para núcleo, dos para marcadores y
uno para recovery. No se crean objetos, texturas, filtros ni paths durante los
frames del viaje. `clear()` sólo ocurre al construir un nuevo `sequence` o al
resetear la vista.

Low conserva carcasa, cuerpo, núcleo, dirección, aviso y recovery. Reduce los
dientes a cuatro; Medium usa seis y High ocho. Reduced motion elimina la
rotación ornamental y mantiene la banda autoritativa visible.

No añadir partículas ilimitadas, blur, sacudida por frame ni una zona segura
rellena. Si la onda se pierde, corregir silueta, contraste y jerarquía antes de
agregar capas.

## Procedimiento para Luna y futuros agentes

1. Leer `RadialPulseHazard`, `EX-06b-radial-pulse.md` y esta receta antes de
   tocar la vista. No mover daño, tiempos, refugios ni arbitraje.
2. Inspeccionar primero un frame `active` a tamaño real sobre fondo oscuro y
   claro. Deben distinguirse carcasa, cuerpo y filo sin sobreexposición.
3. Verificar ambas direcciones, la transición telegraph → active → recovery,
   pausa (`state` congelado), reset y una nueva secuencia.
4. Comprobar saturación y Low/High; Low no puede perder la lectura del peligro.
5. Capturar la galería real con
   `node docs/visual/capture-radial-pulse.mjs` y después jugar una run con
   enemigos y lásers. La captura no sustituye la aprobación en móvil físico.

Referencia: `docs/visual/radial-pulse-reference.html`.
