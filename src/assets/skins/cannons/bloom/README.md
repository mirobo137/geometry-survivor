# Bloomwake · ficha híbrida

- **Rol:** paquete cosmético de cañón; no cambia daño, velocidad, colisión ni selección de objetivos.
- **Identidad:** emisor floral de cristal SVG, proyectil semilla SVG y estela de pétalos PNG.
- **Frente:** el cañón apunta hacia `-Y`; el runtime rota el par de emisores con el jugador.
- **PNG:** `bloom-trail.png`, RGBA 128×128, una textura compartida por el pool. Se carga de forma diferida sólo al equipar Bloomwake en Medium/High; Low desactiva las estelas para proteger el presupuesto.
- **Fallback:** si el PNG no decodifica, la receta `bloom` usa la misma estela procedural y el SVG del proyectil sigue siendo visible.
- **Fuente:** imagen generada con el prompt de estela floral translúcida definido en `docs/design/ARTE_HIBRIDO.md`; se eliminó el fondo blanco y se redujo a 128 px.
- **Validación:** comprobar alpha, request único en High, cero request inicial y cero request en Low; inspeccionar menú y partida en fondo oscuro.

## Revisión del cañón: guía reproducible para Luna y otros agentes

Problema anterior: las placas ocupaban el centro del jugador, pero la boca
estaba en el slot lateral. Eso producía un círculo flotante y placas solapadas
con el casco. Un círculo en la coordenada correcta no demuestra buen ensamblaje.

**Verbo:** dos pétalos de porcelana nacarada envuelven una recámara de energía.
Referencia: Manta para material orgánico; Helix para raíz, cavidad y boca
integrada. No copiar la silueta de aletas de Manta ni los rails de Helix.

Se compararon tres estrategias de masa: tubo largo (demasiado próximo a Basic),
flor radial (oculta la dirección) y cáliz lateral de dos pétalos (elegido por
unir montura y boca con una muesca reconocible). Esta elección de diseño no
equivale a una aprobación humana de tres prototipos visuales.

- Frame común `-32 -32 64 64`, ancla central; slots `(-27,-11)` y `(27,-11)`.
  La montura nace cerca de `(±10,3)` y solapa bajo el casco. La masa principal
  se extiende hacia su slot lateral, nunca sobre el centro del jugador.
- Orden: montura → soporte → pétalo superior → cara nacarada → pétalo inferior
  → retorno oscuro → recámara → canal → collar → boca → núcleo pequeño.
- 11 primitivas por lado / 22 por master, dos sprites de cañón existentes.
  SVG cacheado en texturas de frame explícito; ningún filtro ni objeto nuevo
  por frame. El PNG sigue perteneciendo a la estela, no a la porcelana del cañón.
- Derecha es reflejo exacto de izquierda: paths con `scale(-1 1)`, círculos con
  X positiva explícita para conservar el contrato de slots y sus tests.
- Material: plano marfil cálido, retorno verde azulado, recámara azul oscuro,
  collar dorado y núcleo menta. Blanco sólo en el núcleo y plano superior;
  no aplicar borde blanco grueso a todo ni tint del casco sobre el cañón.
- UI y Pixi consumen los mismos dos archivos de `CannonSvgMarkup.ts`.
  Actualizar master y piezas juntos, incluyendo atributos y orden, no sólo paths.
- Retroceso, apuntado, pausa y muerte usan el compositor existente. Low mantiene
  el cañón completo; Medium/High permiten la estela PNG. El fallo de carga en
  estos presets conserva ribbon procedural. No aumentar pools ni resolución.

Para continuar: modificar primero masas/solapes, revisar la galería
`docs/visual/fleet-reference.html` en 32/64/128 px, oscuro/claro/gris/silueta,
y después comprobar locker y partida. No sustituir esta ficha por instrucciones
privadas dependientes del modelo. La guía general es `docs/design/ARTE_HIBRIDO.md`.
