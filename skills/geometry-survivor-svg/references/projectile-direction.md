# Proyectiles: cabeza luminosa, trayectoria y estela

Referencia ejecutable: `docs/visual/projectile-reference.html` (Vite local).
Usa los SVG y el compositor Pixi de producción. `capture-projectiles.mjs`
genera capturas oscuras/claras y comprueba el juego Low/High. No usar una
animación de catálogo como prueba de comportamiento dentro del juego.

## Contrato de arte

- Los seis `projectile-*.svg` se registran en `CannonSvgMarkup.ts` y se
  comparten entre UI y Pixi. Frame fijo `-16 -16 32 32`, ancla central, frente +X.
- Cinco primitivas por fuente actual: aura tenue, cuerpo, faceta, núcleo y
  retorno. Energía blanca localizada en el centro; evitar contorno blanco
  grueso alrededor de todo el proyectil. Silueta alargada y trasera afinada.
- Basic: pulso dorado; Curve: aguja lunar violeta; Smoke: ascua cálida;
  Rainbow: lanza con faceta rosa; Lattice: cápsula de resonancia rosada;
  Helix: lanza cian con núcleo dorado y retorno afinado.
- Conservar contraste a tamaño real (32 px de frame), no sólo ampliado.
  Low conserva la cabeza completa y la curva. Los cañones siguen independientes.

## Estela de producción

`ProjectileTrailTexture.ts` hornea una única fuente RGBA blanca 128×32,
16 KiB teóricos, al crear la vista Medium/High. Cuatro subtexturas comparten
esa fuente. Alpha longitudinal creciente hacia la cabeza, anchura creciente
y suavizado transversal producen punta y desvanecimiento sin blur.

`ProjectileTrailView` coloca las cuatro bandas siguiendo muestras de edad de
la misma trayectoria que usa la cabeza. Nunca reiniciar el degradado en cada
banda: provoca cuentas separadas en lugar de una cinta continua. No usar
`Texture.WHITE` estirada para una cola o partículas cuadradas de humo.

Longitud = min(distancia recorrida desde nacimiento, velocidad × 0,14 s,
64 unidades). No dibujar cola antes de la boca al nacer. El orden de capas
pone estelas detrás de cabezas. Smoke ensancha la cinta a 11 unidades;
Curve usa 6, las demás 8. Spectrum reparte color en las cuatro bandas;
Lattice alterna rosa y azul pálido. No son emisores extra de partículas.

Se reutilizan cuatro sprites por proyectil admitido y los límites FX existentes.
Low mantiene cero estelas y no crea esta textura. Reinicio/cambio de paquete
limpia la continuidad; destruir la raíz libera las vistas y su fuente una vez.
No asignar arrays, texturas ni geometría nueva dentro del render por disparo.

## Curva: causa de la regresión y regla

Antes: seno de 10 px extendido sobre 2,5 segundos de TTL. Un impacto cercano
terminaba el proyectil antes de que su trayectoria mostrase curvatura suficiente.
La preview inventaba un recorrido diferente y ocultaba esa limitación.

Ahora: desplazamiento lateral de 14 × sin²(πt/T), con T = min(0,32 s, TTL
inicial). Alternar signo por boca. Posición y derivada son continuas al salir
y regresar; después de T, offset y velocidad lateral son cero. La rotación
de la bala usa la tangente, y la estela evalúa edades anteriores con esa misma
función. La preview muestrea la función compartida (su reproducción es más lenta).

Es un arco cosmético de salida, NO homing ni garantía de llegar visualmente
a un enemigo concreto: colisiones y daño continúan en la línea de simulación.
No ampliar la desviación más de 14 px para aparentar seguimiento. Si un futuro
proyectil debe rodear obstáculos, perseguir blancos o colisionar sobre una curva,
necesita contrato de gameplay y trayectoria autoritativa compartida por colisión
y render; una skin no puede conceder esa ventaja.

Helix es una segunda receta, deliberadamente distinta: `11 × sin(2πt/T) ×
sin(πt/T)`, con `T = min(0,46 s, TTL inicial)`. Produce dos lóbulos de signo
opuesto (una S corta), vuelve a cero al terminar y su derivada analítica se usa
para orientar la cabeza. Alterna el sentido por boca, no persigue objetivos y
no modifica la línea de colisión. La estela y la preview muestrean exactamente
esta función; no se debe dibujar una curva aproximada sólo en el catálogo.

## Base visual aprobada y regla de extensión

La inspección humana del usuario aprobó los seis proyectiles actuales
(`basic`, `curve`, `smoke`, `rainbow`, `lattice`, `helix`) y sus seis cañones
como referencia de presentación premium. Las futuras balas y armas deben
partir de esta biblioteca visual y mantener su nivel de acabado, pero no
repetir una variante existente.

Antes de crear una variante nueva, declarar qué proyectil/cañón existente es
la referencia más cercana y cambiar de forma intencional al menos su silueta,
paleta, distribución de planos, firma de energía o receta de trayectoria. Un
recolor, una escala o una curva aproximada no cuenta como diseño nuevo. La
referencia no autoriza más sprites, filtros, geometría por frame ni cambios de
daño, targeting, cadencia o colisión.

## Puerta para extensiones

1. Definir cabeza, cola, paleta, frente, tamaño y si la curva es cosmética o física.
2. Reusar registro y compositor; conservar frames, slots y presupuestos.
3. Probar nacimiento, máximo arco, retorno, tangente, alternancia, cambio de
   paquete, reset y liberación del recurso. Revisar TTL corto y disparos cercanos.
4. Capturar en Pixi, oscuro/claro, Low/High y gameplay; verificar transparencia,
   ausencia de cortes y que la cola toca la cabeza.
5. Typecheck, tests, builds aislados y smoke. Medir stress físico antes de afirmar
   rendimiento móvil: límites y memoria teórica no equivalen a un benchmark.
