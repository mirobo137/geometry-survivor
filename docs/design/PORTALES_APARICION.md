# Portales de aparición — contrato visual

La aparición debe leerse como una llegada desde otra capa, no como un hazard.
El portal no tiene hitbox, no modifica spawn, daño, velocidad ni colisiones.
Los enemigos normales aparecen al mismo tiempo que el portal; el casco crece y
gana opacidad durante 0,26 s. El portal se disipa en 0,48 s.

## Bosses

Core Sentinel, Orbital Warden y Fracture Engine ya tenían una fase `intro` de
1,2 / 1,1 / 1,3 s respectivamente. Durante ella no comienzan ataques. La vista
ahora presenta un portal mayor y ensambla las cuatro texturas existentes
(`rear`, `wings`, `hull`, `cockpit`) desde cuatro direcciones hasta su pose
normal. En Low se conserva el casco completo con aparición gradual; con
`prefers-reduced-motion` no viajan las piezas. Dos bosses simultáneos tienen dos
portales independientes.

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
