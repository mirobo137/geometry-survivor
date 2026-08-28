---
name: geometry-survivor-svg
description: Disenar, generar, integrar y validar SVG code-first para la UI y los assets de Geometry Survivor. Usar cuando la IA deba crear iconos, formas, logos, hazards, FX, cartas o piezas visuales vectoriales; no sustituye las skills de gameplay ni de arquitectura.
metadata:
  short-description: SVG vectorial generado por codigo
---

# SVG code-first para Geometry Survivor

Trata cada SVG como codigo de produccion: determinista, revisable en diff, escalable, barato de renderizar y coherente con el lenguaje visual del juego. La IA debe poder crear, modificar y regenerar el asset desde una especificacion textual y geometrica sin depender de un editor grafico ni de un PNG intermedio.

## Cuando cargar esta skill

Cargala para crear o revisar:

- iconos de UI, botones, indicadores, barras, badges y cartas;
- player, enemigos, proyectiles, pickups, hazards, bosses, logos y decoracion;
- variantes de estado (normal, hover, pressed, disabled, selected, warning, critical);
- SVG inline en HTML/CSS, archivos `.svg` en `src/` o SVG convertido a textura/GraphicsContext de PixiJS;
- optimizacion, sanitizacion, accesibilidad, escalado o regresiones visuales de un SVG.

No la cargues como unica skill para reglas de combate, balance, arquitectura o imagenes raster. Combinala con `geometry-survivor-rendering` para la decision PixiJS y con `geometry-survivor-mobile-performance` cuando haya muchas instancias o animacion frecuente.

## Contexto obligatorio

Antes de generar un asset, lee:

1. `../../PLAN_DESARROLLO.md`, en especial el viewport logico, el pipeline SVG, los presupuestos y la Definition of Done;
2. `../../proyecto.md`, en especial el lenguaje visual y las reglas de UI/feedback;
3. `../../skills/geometry-survivor-rendering/SKILL.md` cuando el asset vaya a PixiJS;
4. `../../skills/geometry-survivor-mobile-performance/SKILL.md` si el asset se repite, se anima o se usa en movil.

Para detalles tecnicos selectivos, consulta:

- [references/asset-spec.md](references/asset-spec.md) para el contrato y las recetas geometricas;
- [references/pixi-pipeline.md](references/pixi-pipeline.md) para UI inline, textura, `GraphicsContext` y carga en Pixi;
- [references/validation.md](references/validation.md) para los gates de estructura, accesibilidad, responsive y rendimiento.

## Flujo code-first

### 1. Define el contrato antes del dibujo

Escribe una ficha breve para cada asset:

- `id` estable y prefijado por dominio (`ui-health`, `enemy-chaser`, `hazard-ring`);
- rol visual y capa de prioridad;
- tamaños de uso y numero maximo de instancias;
- `viewBox` y punto de anclaje logico;
- modo de integracion: DOM inline, textura Pixi o `GraphicsContext`;
- paleta/temas y estados que deben existir;
- si comunica gameplay, que señales no cromaticas lo acompañan;
- texto alternativo o `aria-hidden` cuando sea UI.

Si dos consumidores necesitan el mismo SVG, comparte el archivo o el contexto; no copies dos variantes sin una diferencia funcional documentada.

### 2. Construye la geometria con una coordenada estable

- Usa un `viewBox` entero, pequeño y descriptivo (por ejemplo `0 0 64 64` para un icono o `-32 -32 64 64` si el centro es el ancla).
- Trabaja en unidades logicas, no en `px`, `cm` o `mm`.
- Alinea a una rejilla y conserva simetria mediante coordenadas espejo o funciones generadoras, no por edicion manual repetida.
- Prefiere `circle`, `ellipse`, `rect`, `polygon`, `line` y `path` simple antes que una malla enorme de puntos.
- Usa `path` cuando aporte una silueta real, un agujero o una curva; no conviertas cada primitiva a path por costumbre.
- Define el orden de capas explicitamente: silueta, relleno, detalle, lectura de estado y acentos.
- Reserva espacio negativo suficiente para que el asset siga legible en el tamano minimo de uso.

### 3. Usa una raiz SVG predecible

Todo archivo debe conservar, salvo una razon documentada:

```xml
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 64 64"
     preserveAspectRatio="xMidYMid meet"
     role="img"
     aria-labelledby="asset-title asset-desc">
  <title id="asset-title">Nombre legible</title>
  <desc id="asset-desc">Descripcion breve de la funcion visual</desc>
  <!-- geometria -->
</svg>
```

Reglas de la raiz:

- `viewBox` es obligatorio; nunca lo elimines para ahorrar bytes.
- `preserveAspectRatio="xMidYMid meet"` es el default del juego cuando el contenido debe caber sin deformarse.
- No fijes `width`/`height` dentro de assets reutilizables; el consumidor decide el tamano.
- La UI inline puede usar `role="img"` y titulo; iconos puramente decorativos deben usar `aria-hidden="true"`.
- No incluyas `script`, handlers, `foreignObject`, `<image>`, URLs externas, fuentes remotas ni referencias a archivos que el build no controle.
- No uses `filter`, `mask` o `clipPath` complejos sin medir su coste y probar su soporte en el destino.

### 4. Haz que el color sea un token, no una dependencia oculta

- Para UI inline, prefiere `currentColor` o variables CSS del componente cuando el recoloreado sea requisito.
- Para texturas Pixi o assets que se cargan fuera del DOM, usa atributos de presentacion con colores explicitos o genera variantes de forma determinista; no dependas de CSS externo que Pixi no vera.
- Mantén relleno, contorno, grosor y opacidad separados para que la IA pueda cambiar un estado sin rehacer la geometria.
- Un peligro importante necesita al menos dos señales entre silueta, animacion, contraste, patron y color.
- No uses gradientes para resolver una silueta que funciona con dos tonos planos. Un gradiente debe justificar volumen, energia o profundidad.

### 5. Elige el modo de render correcto

| Caso | Implementacion preferida | Motivo |
| --- | --- | --- |
| Boton, icono, carta o HUD responsive | SVG inline en DOM/CSS | Accesibilidad, CSS y escalado sencillo |
| Asset estatico o repetido como sprite | SVG cargado como textura Pixi | Cache y menor coste por instancia |
| Forma simple repetida y recoloreable | `GraphicsContext` compartido | Se parsea una vez y se reutiliza |
| Path simple que cambia poco | `Graphics.svg()` | Conveniente para un numero pequeño de objetos |
| Centenares de entidades o FX | Textura/atlas y pool | Evita parsear SVG durante gameplay |

Nunca parsees un SVG complejo ni reconstruyas `Graphics` en cada frame. La simulacion emite estado; la presentacion decide como aplicar transform, tint, alpha o variante.

### 6. Anima transformaciones, no el XML completo

Para gameplay usa transformaciones de contenedor (`position`, `scale`, `rotation`), `alpha`, tint y una cantidad pequena de geometria preconstruida. Para FX vectoriales sencillos son validos `stroke-dashoffset`, escalado radial y fade, pero deben poder apagarse en Low y respetar la pausa.

Evita animar atributos que obliguen a reparsar un SVG complejo. No uses blur/glow por entidad; reserva filtros para una capa de FX pequena y medible. Si una animacion no aporta lectura, elimínala.

## Convenciones de codigo y archivos

- Guarda fuentes reutilizables en una carpeta de assets SVG del proyecto y conserva nombres en kebab-case.
- Para cada asset compartido, considera un registro tipado con `id`, `file`, `viewBox`, `anchor`, `renderMode`, `maxInstances` y `states`.
- Usa archivos `.svg` para piezas medianas/grandes. Usa strings SVG inline solo para iconos pequeños y generadores parametrizados que realmente necesiten valores dinamicos.
- Si un generador produce SVG, mantenlo puro: entradas tipadas, salida determinista, sin estado global ni acceso al DOM.
- Prefija IDs de `defs` con el id del asset (`hazard-ring-gradient`) para que dos SVG inline no colisionen.
- No conviertas texto de UI a paths: el texto debe seguir siendo HTML o `Text` de Pixi para poder localizarlo y cambiarlo.
- No introduzcas un sistema de iconos, un optimizador o una dependencia nueva solo por un asset. Primero demuestra un segundo consumidor o una necesidad de validacion repetida.

## Reglas de responsive y plataforma

- El SVG no puede asumir una pantalla concreta: `viewBox` y ancla son logicos; el viewport del juego sigue siendo 1280×720 y el contenedor decide la escala.
- Prueba cada pieza en el tamano minimo, en 16:9, en un movil estrecho y con safe areas.
- Los botones tactiles deben mantener un hit-area suficiente aunque el dibujo sea pequeno; separa hit-area de decoracion.
- No dependas de hover para comunicar una accion en movil.
- Los archivos deben funcionar con `base: './'` en GitHub Pages y no usar rutas absolutas a `/assets`.
- No cargues recursos externos: el build debe poder funcionar sin red adicional en Poki/CrazyGames.

## Definition of Done para un SVG

Un SVG se entrega solo cuando:

- tiene contrato, `viewBox`, ancla, estados y modo de render documentados;
- no contiene raster embebido, scripts, referencias externas ni IDs ambiguos;
- conserva legibilidad y jerarquia en tamano minimo y maximo;
- se integra con rutas relativas y no rompe el build local/Poki/CrazyGames;
- tiene una prueba estructural o un checklist automatizable cuando sea compartido;
- se ha medido el coste si se repite o se anima;
- el diff contiene codigo comprensible, no una exportacion opaca de editor;
- la validacion incluye typecheck/tests/build y una comprobacion visual en fondo oscuro y claro cuando aplique.

## Formato de entrega de la IA

Al terminar una tarea SVG, reporta brevemente:

1. assets creados o modificados y su contrato;
2. modo de render elegido y por que;
3. estados, tokens y decisiones de accesibilidad;
4. riesgos de parseo, filtros, IDs o rendimiento;
5. validaciones ejecutadas y cualquier inspeccion visual que no haya sido posible hacer.

La IA debe dejar el SVG y cualquier generador en el repositorio, no solo pegar una imagen en la conversacion.

## Ficha de diseno para personajes top-down

La ficha siguiente es obligatoria antes de generar un player, enemigo o boss. Evita que el modelo salte directamente a un XML correcto pero sin identidad:

```md
id: enemy-turtle
rol: enemigo comun / perseguidor
lectura: criatura lenta, resistente, avanza hacia el jugador
ancla: centro de masa (0, 0)
orientacion: cabeza hacia -Y; la direccion de movimiento se resuelve con rotacion runtime
silueta: caparazon ancho, cuatro patas visibles, cabeza adelantada y cola corta
proporciones: caparazon 70 %, cabeza 25 %, extremidades 15 % fuera del caparazon
identidad: placas poligonales en el caparazon
paleta: cuerpo, contorno, detalle y senal de estado
presupuesto: 8-20 primitivas, sin filtros
pruebas: silueta negra y color en 32/48/64/96 px, fondo oscuro y claro
```

### Reglas top-down

- La silueta se lee radialmente: cabeza, cola y extremidades deben sobrevivir aunque el asset se vea desde arriba y se reduzca.
- La orientacion base debe ser estable; el runtime rota el contenedor segun velocidad o ataque, nunca se regeneran SVG por entidad.
- El centro del `viewBox` coincide con el centro de masa y con el ancla de colision. No uses padding invisible para compensar una pose.
- La cabeza o el elemento funcional debe adelantarse al cuerpo. Si el enemigo no tiene cabeza, usa una punta, nucleo o placa direccional inequivoca.
- Las extremidades se solapan con la masa principal, pero cada una debe conservar al menos un borde visible a 32 px.
- El estado peligroso no depende solo del color: anade contorno, patron, escala, postura o ritmo de animacion.

### Revision de diseno antes de integrar

Califica cada asset de 0 a 2 en cinco criterios: reconocimiento por silueta, personalidad, lectura de funcion, legibilidad minima y coherencia de familia. Un total menor de 8 obliga a volver a proporciones o silueta; anadir detalles no compensa una puntuacion baja.

La evidencia minima de un personaje es: el SVG fuente, su ficha de contrato, una prueba estructural, una vista de silueta plana y una inspeccion en el modo de render elegido. La galeria de variantes solo se crea cuando ya existe un segundo consumidor real.

### Orientacion y piezas animables

Todo personaje top-down debe declarar un frente base en la ficha (por ejemplo, cabeza hacia `-Y`) y una regla de orientacion runtime. Si recibe velocidad `(vx, vy)`, el contenedor gira con `atan2(vy, vx) + offsetFrente`; no se crean variantes SVG para cada direccion ni se invierte manualmente la silueta.

Cuando la criatura tenga extremidades o una cabeza expresiva, separa solo las piezas que tengan un movimiento legible: normalmente cuerpo/caparazon, patas delanteras, patas traseras y cabeza. Todas deben compartir el mismo `viewBox`, ancla y escala. El runtime las convierte en texturas una vez y anima `rotation`, `position` o `scale` con una amplitud pequena (aproximadamente 1–3 % para respiracion y hasta 0.1–0.2 rad para una marcha sutil). La animacion se detiene o congela en pausa y no debe cambiar colisiones.

En Pixi, compartir `viewBox` no garantiza por si solo que las texturas queden alineadas: `renderer.generateTexture()` recorta por defecto cada `Graphics` a sus limites visibles. Toda composicion modular debe pasar un `frame` explicito igual al `viewBox` comun al rasterizar cada pieza. Los `Sprite` usan entonces la misma ancla; no compenses el recorte con offsets manuales ni padding visible dentro del SVG.

La prueba de orientacion debe cubrir al menos frente, lateral, giro de 180 grados y velocidad cero. La prueba de piezas debe confirmar que la marcha usa transformaciones sobre texturas cacheadas, no reconstruccion de XML ni nuevas asignaciones por frame.
