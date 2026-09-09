# Arte híbrido: identidad y coste verificable

Decisión de producto, 09-09-2026. Entrada canónica: PLAN_DESARROLLO.md §8.
Aplicable a Luna, Codex, Grok y cualquier agente con herramientas de repositorio.
Referencia implementada: [Manta Veil](../../src/assets/skins/manta/README.md).
Para cañones, consultar [Bloomwake](../../src/assets/skins/cannons/bloom/README.md):
ensamblaje lateral, slots de boca, pétalos nacarados y límites del paquete híbrido.
El híbrido puede combinar cañón SVG y estela PNG; no obliga a añadir un bitmap
a cada componente cuando planos vectoriales ya resuelven su material.

## Qué aporta cada medio

| Recurso | Fuente preferida | Durante la partida |
|---|---|---|
| UI, iconos, marcos, texto adaptable | SVG + HTML/CSS | DOM accesible; texto fuera del dibujo |
| Casco modular, anclas, piezas geométricas | SVG editable | Texturas cacheadas y transforms |
| Porcelana, humo, material orgánico, superficies pintadas | PNG transparente generado/dibujado | Sprites con textura compartida |
| Telegraphs, trazos y formas dinámicas simples | Graphics/geometría | Geometría acotada |

PNG no implica más nitidez ni menos coste universalmente. Dos sprites con la
misma resolución y modo de mezcla cuestan aproximadamente lo mismo si proceden
de PNG o de SVG rasterizado. El ahorro de parseo es de carga, no una ganancia de
FPS garantizada. Añadir capas suma trabajo; sustituir capas puede reducirlo.
La calidad depende de composición, tamaño efectivo, materiales y movimiento.

Memoria base RGBA8 = ancho × alto × 4 bytes, sin mipmaps ni overhead. Tres PNG
256×256 representan 768 KiB; dos sprites que comparten UNO usan 256 KiB de
imagen base, más sus objetos. Peso del archivo y memoria GPU son presupuestos
diferentes. No inferir FPS de estos cálculos; medir frame time y solapamiento.

## Antes de generar: identidad obligatoria

Escribir verbo visual, silueta, material, movimiento y acento luminoso.
Comparar tres masas diferentes, elegir una y registrar por qué. Una variante
que sólo cambia el color o añade un halo a un casco conocido se devuelve a
diseño. Comparar la silueta negra con el catálogo y revisar 32/64/128 px.

Declarar frente, centro de masa, frame lógico, tamaño máximo en pantalla,
orden de capas, pivotes, solapes y piezas de muerte. La apariencia no modifica
colisión, daño ni puntos de salida de los cañones. Los cañones siguen siendo
un cosmético independiente. Pintar sólo materiales sobre una silueta mediocre
no cumple el encargo de identidad.

## Generación con IA disponible

1. Elegir un consumidor real donde el bitmap aporte material/volumen difícil
   de expresar económicamente con código. Generar sólo esa pieza o conjunto
   coherente, no una lámina publicitaria para usar como sprite.
2. Usar la herramienta de imágenes disponible en el host. En Codex, consultar
   la skill imagegen y usar el generador integrado; pedir transparencia real.
   La capacidad pertenece al host, no al nombre del modelo. Si Luna no tiene
   herramienta de imágenes, reutiliza el asset aprobado y su contrato; para
   arte nuevo comunica esa falta de capacidad. Nunca fingir un PNG generado,
   envolver SVG en un archivo .png ni iniciar una API de pago sin autorización.
3. Prompt con: uso en juego, cámara ortográfica, frente, pieza exacta, raíz,
   materiales, iluminación local, silueta, padding y prohibiciones de texto,
   suelo, perspectiva y fondo pintado. Guardar prompt y procedencia.
4. Inspeccionar imagen original. Verificar alpha real (no basta extensión PNG
   ni ver un damero), bordes sobre claro/oscuro, ausencia de halo recortado y
   lectura pequeña. Rechazar perspectiva o piezas que no encajen en el ancla.
5. Preparar derivado a resolución de uso, conservar alpha, medir bytes. No
   asumir que la salida del generador ya es ligera. Comparar PNG/WebP sólo si
   compensa; no instalar dependencias por un supuesto ahorro.
6. Guardar el derivado final dentro del repositorio y la ficha al lado. No
   referenciar carpetas privadas de generación desde el juego. Un original
   local opcional no sustituye al recurso versionado que deben usar otros PCs.

## Integración consciente

- SVG master permanece puro: sin imágenes raster embebidas. El compositor
  DOM puede combinar HTML img y SVG hermanos; Pixi combina sprites.
- Compartir URL, dimensiones lógicas y pivotes entre menú y partida. Revisar
  ambas representaciones: no mostrar una skin publicitaria diferente del juego.
- Cargar el PNG al equipar o al necesitar la preview; HTML img puede usar lazy.
  Las miniaturas visibles necesitan el recurso, aunque no estén seleccionadas.
  Distinguir la caché de descarga del navegador de una textura creada en Pixi.
- Texture.from(URL) NO descarga una imagen en Pixi v8. Cargar con Image/Assets
  y pasar un recurso ya cargado. Cachear, tolerar error y no adjuntar objetos
  después de destruir la vista. Documentar quién posee y libera la textura.
- Animar position/rotation/scale/alpha sobre piezas reutilizadas. Separar
  sólo lo que tenga un movimiento visible o despiece útil; evitar filtros por
  pieza, XML reconstruido por frame y partículas permanentes innecesarias.
- Toda skin conserva su identidad en Low. No ocultar una aleta fundamental
  por preset; reducir antes efectos decorativos. Los límites se fijan por
  recurso y no obligan a añadir tres PNG a cada futura skin.
- Catálogo estático, sólo preview seleccionada animada; reduced-motion y
  paneles ocultos detienen movimiento DOM. La partida usa el reloj existente
  que se congela en pausa y avanza durante muerte.
- Si hay texturas independientes reutilizadas por muchas skins, considerar
  atlas después de medir. Dos sprites no requieren una infraestructura nueva.

## Entrega obligatoria para el siguiente agente

Ficha junto al asset: id, concepto, referencia y diferencias, prompt completo,
procedencia, tamaño original/final, bytes, alpha, frame/pivote, piezas, capas,
presets, ownership/carga, fallback, animación, muerte y consumidores.
Registrar en CONTINUACION.md lo implementado, cómo probar sin escribir URLs
largas, validaciones automáticas y lo pendiente de aprobación humana.

Pruebas: selección/adquisición y persistencia; carga fallida; cambio de skin;
recursos compartidos; orientación, pausa, daño, muerte/reinicio; resize;
capturas de menú y partida Low/High. Typecheck, tests, tres builds y smoke de
Pages. El perfil de un PC o móvil potente no certifica un móvil modesto.

## Investigación y límites de las fuentes

- [PixiJS SVG](https://pixijs.com/8.x/guides/components/assets/svg): diferencia
  textura rasterizada y geometría; pérdida de escalabilidad al rasterizar.
- [PixiJS Textures](https://pixijs.com/8.x/guides/components/textures): fuentes,
  reutilización y ciclo de carga. Memoria de imagen y objetos no son lo mismo.
- [PixiJS v8 migration](https://pixijs.com/8.x/guides/migrations/v8): carga
  explícita antes de Texture.from y cambios de ParticleContainer.
- [Unity 2D workflow](https://docs.unity3d.com/6000.1/Documentation/Manual/2d-game-creation-wokflow.html):
  composición con sprites y organización en atlas.
- [web.dev image performance](https://web.dev/learn/performance/image-performance):
  tamaño transferido, compresión y selección de formato.

Estas fuentes respaldan las técnicas de producción; no prueban que PNG sea
siempre superior, ni que una skin concreta ya se vea premium para el usuario.
