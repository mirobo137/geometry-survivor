# Pipeline SVG con PixiJS 8

Lee esta referencia cuando el SVG vaya a formar parte del render de PixiJS.

## Matriz de integracion

### UI HTML/CSS

Usa SVG inline cuando se necesiten `currentColor`, CSS, accesibilidad, focus y responsive del DOM. Mantén el texto fuera del SVG salvo logos o marcas que deban ser una silueta.

### Textura Pixi

Usa `Assets.load('assets/foo.svg')` y crea un `Sprite` cuando el asset sea estatico, se repita o se beneficie de cache. Define una resolucion de carga si se necesita nitidez a un tamaño concreto; no confundas resolucion de textura con el `viewBox` logico.

Si varias piezas SVG forman un personaje y se rasterizan con `renderer.generateTexture()`, pasa en todas `frame: new Rectangle(viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight)`. Sin ese frame Pixi usa los limites visibles de cada `Graphics`, cada textura obtiene un centro distinto y la composicion se colapsa aunque los archivos declaren el mismo `viewBox`.

### GraphicsContext

Usa `GraphicsContext` para una forma SVG simple que se comparte entre muchas instancias y necesita tint o variaciones de transform. El contexto debe construirse una vez y ser propiedad clara de la capa de presentacion.

### Graphics.svg

Usa `Graphics.svg()` para un numero pequeño de formas estaticas o un spike. No lo conviertas en el camino de cada enemigo o proyectil sin una medicion de frame time y memoria.

## Reglas de carga

- Usa rutas relativas compatibles con Vite `base: './'`.
- Carga de forma asincrona antes de entrar en la escena que necesita el asset o muestra un fallback vectorial simple.
- Aprovecha el cache de `Assets`; no hagas fetch manual por entidad.
- Mantén un owner de recursos y destruye texturas/contextos cuando una escena o bundle deje de existir.
- No generes una textura desde el mismo SVG cada frame para cambiar color: usa tint, variantes pequeñas o `GraphicsContext`.

## Compatibilidad

Pixi puede triangular paths SVG complejos. Agujeros, auto-intersecciones, filtros, clipping profundo y strokes no convencionales pueden dar resultados distintos al navegador. Para esas piezas:

1. abre el SVG en navegador y en Pixi;
2. simplifica la geometria o separa capas;
3. considera textura si es estatico;
4. deja una prueba visual o un screenshot de referencia.

## Presupuesto practico

- Parseo: una vez por asset/contexto, nunca dentro de `update`.
- Instancias: define `maxInstances` y usa pool si supera decenas.
- FX: limita filtros, gradientes animados y paths con miles de nodos.
- Memoria: mide el tamaño de textura despues de rasterizar; un SVG pequeño puede generar una textura grande.
- Low: reduce halos, trails y variantes, no la silueta ni el telegraph de gameplay.

## Fuentes oficiales

- [PixiJS Assets](https://pixijs.com/8.x/guides/components/assets)
- [PixiJS SVGs](https://pixijs.com/8.x/guides/components/assets/svg)
- [PixiJS Graphics y SVG](https://pixijs.com/8.x/guides/components/scene-objects/graphics)
