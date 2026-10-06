# Portales de aparición — contrato visual

La aparición debe leerse como una llegada desde otra capa, no como un hazard.
El portal no tiene hitbox, no modifica spawn, daño, velocidad ni colisiones.
Los enemigos normales aparecen al mismo tiempo que el portal; el casco crece y
gana opacidad durante 0,26 s. El portal se disipa en 0,48 s.

## Bosses

Core Sentinel, Orbital Warden y Fracture Engine ya tenían una fase `intro` de
1,2 / 1,1 / 1,3 s respectivamente. Durante ella no comienzan ataques. La vista
presenta desde el inicio el cuerpo completo raster (SVG completo sólo como
fallback de carga), sin ensamblaje. Segunda propuesta del 05-10-2026: anticipación
durante el primer 22% de la intro, emergencia hasta el 62%, rebote amortiguado
y asentamiento durante el resto. Core emerge frontalmente desde una apertura
dorada; Orbital llega girando desde una apertura azul inclinada; Fracture
atraviesa una brecha vertical cálida, recuperando el ancho de su casco.
El cuerpo permanece centrado en su posición lógica. Al emerger dispara una
onda visual expansiva; la brecha se contrae y desvanece hasta el final.
Se retiraron los ecos de naves de la primera propuesta.

Cada slot de boss tiene dos Graphics adicionales (halo y onda), construidos
una vez y animados sólo por transforms/alpha; el halo tiene 16 trazos en
Medium/High y 8 en Low. Son cuatro Graphics en total para dos bosses simultáneos.
Sus contextos pertenecen a los Graphics y siguen la destrucción del árbol de
la vista. No se crean partículas, imágenes ni filtros adicionales.
Movimiento reducido conserva el casco fijo y un fade, sin onda ni rotación.
Las curvas dependen del progreso de intro existente, no del reloj de pared.
Dos bosses simultáneos conservan portales y animaciones independientes.
Cambio comprobado el 05-10-2026 con typecheck, suite unitaria completa (758
tests / 134 archivos), build development y smoke Chromium del boss Core
Sentinel. Revisión visual en móvil físico y aprobación estética siguen
pendientes; la evidencia histórica del final de este documento no valida esta
entrada nueva.

## Representación y presupuesto

- Una textura geométrica se rasteriza una vez con Pixi al crear la vista: no
  hay PNG adicional que descargar, filtro, shader ni reconstrucción por spawn.
- Sprites persistentes: 6 normales en Low, 10 en Medium, 14 en High, más 2 para
  bosses. El coste de la textura es del orden de 112×112 píxeles RGBA, antes de
  los detalles internos del renderer; no es una medición de memoria GPU.
- Al saturarse el pool, se descarta únicamente el portal decorativo. El enemigo
  sigue apareciendo sin retraso ni escala de entrada falsa.
- El viewport lógico decide qué nacimientos normales merecen un portal. Esto
  evita gastar slots en entidades lejanas fuera de pantalla, sobre todo en
  portrait. Los bosses no dependen de esa selección.
- `reset()` apaga todos los portales, incluido el cambio de tramo en Infinito.

La jerarquía visual es portal detrás de nave; arena, telegraphs y ataques
conservan prioridad. Las pruebas cubren saturación, reciclaje, pares de bosses,
viewport portrait y ausencia de ataque durante la fase intro. La calidad
estética y FPS reales aún requieren una run humana en móvil. El build local y
cinco smoke browser dirigidos pasaron en escritorio y Pixel 5 emulado; estas
pruebas no son un benchmark físico de rendimiento.
