# Chain Lightning — Arc Relay

## Propósito

`ChainBehavior` sigue siendo la única autoridad del disparo. Decide el primer objetivo, los saltos, el radio, el daño y la vida de cada segmento. La capa Pixi solo representa `ChainSegmentState` (`x1/y1 → x2/y2`, activo y `lifeSeconds`); este efecto no cambia balance, selección ni frecuencia.

El objetivo visual es que el jugador lea una transferencia de energía entre nodos, no una línea genérica dibujada de enemigo a enemigo.

## Receta visual aprobada

Cada segmento se llama **Arc Relay** y se compone de:

1. Un underlay índigo oscuro, ancho y translúcido: separa el rayo del fondo sin usar filtros.
2. Un cuerpo violeta: da identidad al arma y conserva contraste en fondos oscuros.
3. Una capa cian más estrecha: marca el recorrido activo.
4. Un núcleo blanco fino: mantiene la lectura del peligro aun con muchos enemigos.
5. Dos quiebres deterministas: el tramo sale del origen real, pasa por dos puntos desplazados perpendicularmente y llega al destino real. El signo alterna por segmento para que una cadena no parezca una escalera repetida.
6. Nodos dorados en los quiebres: comunican que la energía se está transfiriendo.
7. Un módulo hexagonal en el objetivo: confirma el impacto y hace que cada salto tenga destino.
8. Un rombo dorado móvil durante Medium/High: recorre el segmento según `lifeSeconds`, dando sensación de viaje sin introducir un reloj paralelo.

La ruta siempre debe usar `beginPath().moveTo(origen)` y terminar en `destino`. Nunca se debe conectar un segmento al path anterior ni dejar el inicio en el primer quiebre: eso produce saltos visuales y líneas “a la nada”.

## Tiempo y estados

`alpha = clamp(lifeSeconds / segmentLifetimeSeconds, 0, 1)` controla cuerpo, nodos, impacto y pulso. El segmento aparece fuerte al transferirse y se desvanece con la misma vida que ya usa simulación. El pulso usa `travel = 1 - alpha`; no crea daño, cooldown ni una segunda simulación.

Los impactos y pulsos son objetos persistentes creados una sola vez, con un máximo igual a `chainLightning.maxTargets`. En cada frame solo se actualizan posición, rotación, escala, alpha y visibilidad.

## Calidad y rendimiento

- **Low:** mantiene underlay, cuerpo, núcleo y módulo de destino; oculta el pulso y los detalles transversales de High.
- **Medium:** añade el pulso móvil para reforzar la dirección del salto.
- **High:** añade el marcador transversal en el primer quiebre y conserva todas las capas.

El efecto usa una `Graphics` persistente, seis sprites persistentes como máximo (tres módulos de destino y tres pulsos) y texturas cacheadas. No usa filtros, blur, partículas libres, SVG parseado por frame ni objetos/arreglos temporales dentro del render caliente. Cada capa del rayo se dibuja con un path independiente.

## Reglas para futuras cadenas

- No volver a dibujar una recta única como efecto final.
- No modificar `ChainBehavior` desde `WeaponView`.
- No añadir aleatoriedad por frame: los quiebres deben ser deterministas y estables durante la vida del segmento.
- Mantener una silueta legible en Low y probar sobre fondo oscuro y claro.
- Si se agrega otra variante, cambiar una sola firma visual (paleta, número de quiebres o forma del nodo), sin repetir exactamente Arc Relay.
- La validación mínima es `WeaponView.test.ts`, captura de referencia en escritorio/móvil y una partida real con tres saltos consecutivos.

## Archivos de referencia

- Implementación: `src/presentation/pixi/WeaponView.ts`
- Contrato de simulación: `src/simulation/combat/ChainBehavior.ts`
- Pruebas: `src/presentation/pixi/WeaponView.test.ts`
- Captura visual: `docs/visual/chain-reference.html` y `docs/visual/capture-chain.mjs`
