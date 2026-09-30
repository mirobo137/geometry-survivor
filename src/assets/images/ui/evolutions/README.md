# Registro histórico del piloto UI: evoluciones de Proyectil

> Esta ficha conserva las decisiones y validaciones de la primera entrega,
> Rail Lance/Pulse Volley. El usuario autorizó después ampliar el mismo sistema
> a todo el catálogo: 6 armas base, 12 evoluciones y 11 mejoras no armadas.
> La asociación vigente, inventario, carga y guía de mantenimiento están en
> [`cards/README.md`](../cards/README.md). Las frases de este registro que
> marcan la ampliación como pendiente describen únicamente el estado histórico
> del piloto, no el estado actual.

Fecha: 29-09-2026. Primera entrega de la opción «UI ilustrada».
Marco general: [estudio de arte](../../../../../docs/design/ESTUDIO_ARTE_GENERADO.md)
y [arte híbrido](../../../../../docs/design/ARTE_HIBRIDO.md).

## Dirección y alcance

Se eligió ilustrar el mecanismo y la función del arma, frente a un emblema
geométrico o una escena completa de batalla. El primero cambia demasiado poco
respecto al catálogo SVG; una escena completa dificulta leer la elección.
Rail Lance presenta una masa larga y una trayectoria precisa; Pulse Volley,
una masa ancha con tres salidas y proyectiles en abanico. Cerámica, metal oscuro,
luz dorada/cyan y fondo espacial conservan identidad común. Son ilustraciones
de la carta, no nuevas skins de naves ni fuentes de colisión.

Las imágenes no contienen texto ni marcos. Título, descripción, icono pequeño,
categoría y llamada a elegir se dibujan en DOM. Los originales son opacos,
intencionadamente sobre azul oscuro; no se requieren recorte ni alpha.

## Recursos de producción y procedencia

Generador integrado de imágenes de Codex, sin CLI/API adicional.
Originales RGB24: 1774×887 cada uno. IDs de generación:

- Rail Lance: exec-6f581247-67d5-4f6c-a0c3-3e7ffb4a0ebb.
- Pulse Volley: exec-b94c7a10-4d74-47f5-a5dc-9e380d391d93.

Los originales quedan en la biblioteca del host; las copias WebP de producción
están versionadas aquí y no dependen de rutas privadas o del PC que las generó.
Conversión determinista con ffmpeg/libwebp, sin repintar el contenido:

```text
ffmpeg -i ORIGINAL.png -vf scale=768:384 -c:v libwebp -quality 88 -compression_level 6 DESTINO.webp
```

| Archivo | Tamaño | Bytes |
| --- | --- | ---: |
| rail-lance.webp | 768×384 | 53,988 |
| pulse-volley.webp | 768×384 | 65,042 |
| Total | dos fuentes | 119,030 |

La resolución permite una ilustración protagonista en escritorio y móvil,
no sólo un icono pequeño. Base RGBA8 calculada: 1.125 MiB por imagen,
2.25 MiB juntas. No es memoria total medida del navegador/GPU. No se crean
texturas Pixi, filtros, partículas, atlas ni un loop de animación para este piloto.

## Integración y carga

`UpgradeCardVisual.ts` declara una ilustración opcional para los dos IDs.
`LevelUpOverlay.ts` crea sus imágenes al abrir esa oferta; importar una URL
no descarga el WebP. El navegador administra caché y decodificación.
Se retiran los nodos al reemplazar la oferta. Imágenes estáticas en todas
las calidades y reduced-motion; foco/selección conservan el contrato existente.
Una carga fallida devuelve la carta al icono SVG y mantiene texto y elección.
No se modifican progresión, ofrecimientos, estadísticas ni persistencia.

Las cartas usan altura de contenido y scroll en pantallas cortas. Una captura
inicial en 320×568 mostró compresión de texto; se corrigió el row-sizing del
overlay únicamente cuando existe arte ilustrado.

## Prueba directa y comparación

Con Vite en el puerto 5173:

- Ilustradas: http://localhost:5173/?evolution=rail-lance&debug=1&quality=low
- SVG: http://localhost:5173/?evolution=rail-lance&debug=1&quality=low&card-art=svg

Ambas rutas existentes abren las mismas dos evoluciones de Proyectil.
El parámetro `card-art=svg` sólo cambia presentación; no cambia seed,
elección ni combate. Sin ese parámetro las dos cartas ilustradas también
aparecen al evolucionar Proyectil en una partida normal.
Estos accesos debug siguen las restricciones de recompensa del juego.
Los rangos base y las otras diez evoluciones mantienen el catálogo visual actual.

## Comprobaciones

Pasaron typecheck y 515 pruebas unitarias. Builds local, Poki y CrazyGames
compilan con el config loader runner; la carga bundle de config local sufrió
el error de permisos de OneDrive ya registrado. Continúa la advertencia
preexistente de chunk principal >500 kB.
El smoke dirigido de selección de las dos evoluciones y la revisión visual
se registran en CONTINUACION.md.

`node docs/visual/capture-evolution-art.mjs` prueba contra preview 4173;
admite otra URL como argumento. Captura 1280×720, 390×844, 320×568, 640×360
y 1280×360;
verifica las imágenes decodificadas, ausencia de overflow/solapamiento de
contenido, scroll/elección, baseline SVG sin requests raster y fallback
tras abortar una imagen. Capturas ignoradas: test-results/evolution-art/.

Pendiente: juicio artístico y tacto del usuario en móvil físico. No se midieron
FPS nuevos ni se ejecutó QA de SDK en portales; la compilación no los certifica.
Las pruebas humanas del Laboratorio continúan aplazadas.

## Prompts completos

### Rail Lance

Use case: stylized-concept. Asset type: final painted hero illustration for a sci-fi survivor game's evolution choice card, NOT a UI mockup. Landscape composition roughly 2:1. Premium hand-painted 3D-stylized game illustration: sculpted gunmetal, pale ceramic beveled armor, precise luminous energy channels, strong large silhouette, beautiful controlled cinematic lighting, restrained fine details, readable at small card size. Midnight navy space backdrop, subtle directional dust, edges fall smoothly into almost-black navy. Keep the weapon and energy demonstration within the central 75 percent of the frame so it survives mobile cropping. One coherent subject, no humans, no text, no letters, no logo, no card border, no UI, no watermark. This is illustration only; do not draw a complete game screenshot. Subject: RAIL LANCE, a precise electromagnetic evolution that sends one long penetrating energy lance through several enemies in a straight line. Show one exquisite elongated rail emitter floating in three-quarter view, its twin gold metal rail guides parallel along a single barrel, ivory ceramic housing, amber reactor and restrained ice-blue inlays. The emitter occupies lower-left-to-center; one intense narrow golden-white lance shoots diagonally towards the upper-right and pierces three small dim faceted target fragments aligned along its path, with controlled sparks. The entire composition feels surgical, powerful, long-range and focused. Palette: warm gold/ivory energy against navy, never a screen-filling explosion. Visually distinct from multi-shot fan weapons.

### Pulse Volley

Use case: stylized-concept. Asset type: final painted hero illustration for a sci-fi survivor game's evolution choice card, NOT a UI mockup. Landscape composition roughly 2:1. Premium hand-painted 3D-stylized game illustration: sculpted gunmetal, pale ceramic beveled armor, precise luminous energy channels, strong large silhouette, beautiful controlled cinematic lighting, restrained fine details, readable at small card size. Midnight navy space backdrop, subtle directional dust, edges fall smoothly into almost-black navy. Keep the weapon and energy demonstration within the central 75 percent of the frame so it survives mobile cropping. One coherent subject, no humans, no text, no letters, no logo, no card border, no UI, no watermark. This is illustration only; do not draw a complete game screenshot. Subject: PULSE VOLLEY, a projectile evolution for rapid repeated volleys that spread across groups. Show one exquisite compact broad energy emitter floating in three-quarter view, with a cluster of three clearly separated cyan reactor channels in pale ceramic and gunmetal armor. Three discrete bright turquoise plasma bolts in a sweeping fan leave the emitter towards the upper-right, with two shorter offset trailing volleys to imply rhythmic repeated shots, controlled luminous curved wakes and tiny particles. The emitter occupies lower-left-to-center and is short, broad and layered rather than a long rifle. The entire composition feels agile, rhythmic and wide coverage. Palette: turquoise/ice-blue with subtle violet edge lights against navy, no yellow beam, no single continuous laser. Visually distinct from a straight penetrating rail lance.
