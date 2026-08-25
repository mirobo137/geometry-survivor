# Validacion de SVG

Usa solo las comprobaciones que correspondan al asset; no conviertas una pieza pequeña en una auditoria desproporcionada.

## Checklist estructural

- XML/SVG parsea sin errores.
- Existe `xmlns` y un `viewBox` valido con ancho/alto positivos.
- No hay `script`, handlers, `foreignObject`, `<image>` ni referencias externas.
- No hay IDs duplicados dentro de un SVG inline ni IDs genericos que colisionen entre assets.
- Todos los `url(#...)` apuntan a un ID existente.
- `width`/`height` no fuerzan una relacion de aspecto no deseada.
- El asset no depende de fuentes, CSS o filtros que el consumidor no carga.

## Checklist visual

Prueba en:

- fondo oscuro y claro;
- tamaño minimo de uso y una escala grande;
- 16:9 y viewport movil estrecho;
- estado normal y cada estado interactivo;
- screenshot del navegador y, si va a Pixi, screenshot del render Pixi.

Comprueba silueta, ancla, padding, alineacion, contraste, lectura a distancia y que la senal de gameplay no dependa solo del color.

## Checklist de accesibilidad UI

- Icono informativo: `title`/`desc` o etiqueta equivalente.
- Icono decorativo: `aria-hidden="true"` y texto accesible en el boton si hace falta.
- No conviertas texto funcional a outlines.
- El componente padre debe ofrecer focus visible y un hit-area tactil suficiente.
- Una animacion no debe ser la unica forma de entender el estado y debe poder reducirse/apagarse.

## Checklist de rendimiento

- Cuenta nodos, paths, filtros, gradientes y referencias.
- Mide parseo, frame time y memoria cuando el asset se repite o se anima.
- Reutiliza texturas/contexts; no reconstruyas XML ni Graphics por frame.
- Compara fuente y optimizado visualmente. Si un optimizador elimina `viewBox`, titulo, desc o IDs referenciados, corrige la configuracion.
- Conserva un SVG legible como fuente; la minificacion es un artefacto, no la fuente de verdad.

## Optimización segura

SVGO es opcional y debe configurarse por proyecto. Usa el preset por defecto como punto de partida, pero conserva `viewBox`, accesibilidad e IDs referenciados. No habilites `removeViewBox` o `removeTitle` solo para ganar bytes. Prefiere `prefixIds` cuando varios SVG se insertan inline.

Fuentes:

- [SVG 2: viewBox y coordenadas](https://www.w3.org/TR/SVG2/coords.html)
- [MDN: preserveAspectRatio](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/preserveAspectRatio)
- [SVGO README y configuracion](https://github.com/svg/svgo/blob/main/README.md)
