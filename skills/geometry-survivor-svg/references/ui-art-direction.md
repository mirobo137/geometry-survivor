# UI premium — consola de navegación

Dirección para cualquier agente que construya SVG, cartas, botones, HUD o
pantallas de Geometry Survivor. Rutas relativas a la raíz del repositorio.
La biblioteca de naves aprobada fija material y acabado; la UI añade una
exigencia: reconocer una acción antes de observar su decoración.

## Referencias ejecutables y estado

- Lámina: `docs/visual/ui-reference.html`, con Vite dev. Usa el overlay real,
  sus textos y los mismos SVG del juego. Incluye comparación anterior/nueva,
  los once iconos y muestras pequeñas de controles.
- Iconos de cartas: `src/assets/svg/ui/level-up/premium-icons.svg`.
- Marco: `src/assets/svg/ui/level-up/premium-card-frame.svg`.
- Emblema: `src/assets/svg/ui/start/mark.svg`; controles: `ui/pause.svg` y
  `ui/settings.svg` bajo la misma carpeta de assets.
- `icons.svg` y `card-frame.svg` son referencia anterior para comparación,
  no una segunda familia activa. El consumidor es `LevelUpOverlay.ts`.
- La aprobación humana de las seis skins/cañones no se extiende automáticamente
  a esta UI. Este lote es candidato de dirección pendiente de revisión humana.

## Gramática: placa, cavidad, instrumento

La UI se siente parte de la nave: chasis azul casi negro, placa de acero,
bisel superior izquierdo, retorno inferior derecho oscuro, núcleo de energía
pequeño. El contenedor sostiene la información; el icono explica su función.

Proporción orientativa de una tarjeta: 75% superficie tranquila, 20% estructura
y texto, 5% acento luminoso. No se exige medir píxeles: sirve para detectar
marcos que compiten con las opciones. El blanco se reserva para lectura y
reflejos pequeños, nunca para todos los bordes a la vez.

Orden de construcción:

1. Escribir verbo y tamaño real: «proteger, icono de carta de 48 px».
2. Resolver silueta en un color: escudo para protección, nodos conectados para
   cadena, proyectil alargado para disparo. No usar hexágonos para todo.
3. Construir la cara principal y deducir un bisel de SUS vértices. Ejemplo:
   en core, el borde `24,3 → 42,13` vuelve por `35,17 → 24,11`.
   Eso produce espesor; varios contornos concéntricos no lo sustituyen.
4. Insertar cavidad oscura antes del acento. En core: pozo hexagonal de 20×24,
   reactor de 12×14; la separación se sigue leyendo a 32 px.
5. Añadir sólo detalles que aclaran acción o ensamblaje. Revisar en gris y a
   tamaño mínimo antes de añadir otro path.
6. Colocar texto HTML y probar el estado más largo, foco y móvil estrecho.

## Contratos por categoría

| Categoría | Construcción | Tamaño de uso / límite inicial de fuente |
| --- | --- | --- |
| Control (pausa, ajustes, volver, cerrar, audio) | Símbolo universal, un bisel opcional, sin escena interior | 20–24 px; frame 24; 2–6 primitivas, ≤2 KiB |
| Icono de carta / mejora | Silueta + metal + cavidad + acento, una metáfora principal | 32–64 px; frame 48; 4–8 primitivas, ≤2 KiB por símbolo |
| Moneda / badge | Mantener silueta NOVA y distinguir estado por texto/marca | 16–32 px; conservar frame existente; ≤8 primitivas |
| Emblema principal | Reactor con estructura orbital secundaria; lectura propia | 96–144 px; frame existente 144; ≤20 primitivas, ≤5 KiB |
| Marco de carta | Bisel amplio, superficie quieta y acento localizado | Frame existente 320×260; ≤12 primitivas, ≤3 KiB |
| Panel / diálogo | Superficie CSS responsive; esquinas SVG opcionales | ≤4 adornos SVG por panel; texto y controles en HTML |
| HUD / barra | Carril oscuro, progreso claro, número/etiqueta | CSS o vista existente; SVG sólo en extremos o icono |

Son presupuestos de autoría, no mediciones de GPU. Contar también comandos de
path: no ocultar cientos de segmentos en una sola primitiva. Las fuentes del
lote no añaden filtros, máscaras, gradientes ni texturas. No añadir dependencias.

### Material y tokens

Los iconos usan `currentColor` como energía/categoría; metal `#d1e2ec`, reflejo
`#eef8ff`, placa `#17283b`, pozo `#060d19`. Estos atributos explícitos pertenecen
al master SVG; no dispersar otra paleta equivalente en estilos individuales.
Si se introduce generación temática, centralizarla sólo con consumidores reales.

Las cartas YA consumen `--card-accent`, `--card-line`, `--card-surface` en
`styles.css`. Reutilizarlos. No copiar allí colores de skins para señalar una
ventaja inexistente. Color de categoría no significa rareza ni nivel comprado.
La UI clara de la lámina comprueba separación del asset; los paneles del juego
siguen oscuros, no se promete un tema claro completo.

### Diferenciar funciones cercanas

- Armor: placa segmentada y cheurones; Shield: campo continuo y núcleo protegido.
- Speed: empuje y trazos horizontales; Critical: fractura angular y rayos de impacto.
- Repair: corazón mecánico y cruz; Vampirism: cristal de extracción puntiagudo.
- Projectile: punta y cuerpo longitudinal; Chain: varios nodos enlazados.
- Cartas de una misma familia pueden compartir icono si título y preview
  explican la diferencia. Si se pide diferenciarlas, diseñar doble emisor o
  ráfaga propios, no recolorear el mismo proyectil como única señal.

## Contenedores y adaptación

El marco existente usa `preserveAspectRatio="none"` porque en móvil la carta
pasa de vertical a horizontal. Sólo debe contener facetas amplias: nada de
círculos, tornillos, texto o emblemas que se deformen. El acento lineal usa
`vector-effect="non-scaling-stroke"`. El icono independiente conserva `meet`.
Para paneles de proporción arbitraria usar CSS y esquinas de tamaño fijo;
no reutilizar el marco entero estirado en una barra o un modal muy alto.

La decoración tiene `pointer-events: none`; el botón real recibe input.
El área táctil objetivo es al menos 44×44 CSS px aunque el icono mida 20 px.
No recortar foco ni texto con clip-path. Nunca convertir texto a paths.
Probar 320/390 px de ancho, landscape bajo, texto largo y zoom de navegador.

## Estados: el acabado incluye comportamiento

| Estado | Señal requerida | Tratamiento visual sugerido |
| --- | --- | --- |
| Normal | Acción y precio legibles | Placa quieta, bisel y un acento |
| Hover | Opcional para puntero preciso | Elevar 2–4 px, 120–160 ms |
| Focus | Contorno visible fuera del marco | Outline 2–3 px sin depender de hover |
| Pressed | Respuesta inmediata | Desplazar 1 px; sin cambiar layout |
| Selected / equipado | Marca o texto y atributo semántico | Acento más firme, check o «Equipado» |
| Disabled | Razón o condición legible | Botón disabled; no borrar el precio por opacidad |
| Pending | Acción bloqueada y mensaje | Etiqueta de espera, sin doble envío |
| Error / éxito | Texto explícito | Símbolo + color; no sólo parpadeo |

Un botón de vídeo debe seguir diciendo que es un anuncio y su recompensa.
No convertirlo en el único CTA brillante ni ocultar la salida normal. Decoración
y escala no pueden cambiar el significado de comprar, equipar, volver o revivir.

Low conserva TODAS las caras, símbolos y textos. Reducir movimiento ornamental,
nunca simplificar un icono a un punto. Preferir UI estática: no nuevos bucles,
blur, filtros por tarjeta ni modificación de SVG en cada frame. Reducir movimiento
con `prefers-reduced-motion`; pausar decoración al ocultar la pantalla. No
prometer coste cero: perfilar antes de añadir animación persistente.

## Reutilización y accesibilidad

Un sprite de símbolos montado una vez, referencias locales con `<use>`;
mantener los IDs `ui-upgrade-icon-*`. No insertar dos sprites con esos IDs en
el mismo documento. Los marcos repetidos no llevan IDs. Si otro asset con IDs
debe repetirse, crear símbolo único o prefijar todos los IDs y sus referencias
por instancia; un prefijo por archivo no basta.

Los iconos decorativos llevan `aria-hidden`; el texto HTML del botón explica
la acción. No introducir nodos SVG enfocados. Usar atributos nativos de botón,
`aria-pressed` para toggles reales, texto de estado para equipado/bloqueado.
Conservar las etiquetas existentes y la fuente real de stats/preview.

## Cómo extender toda la UI sin perder dirección

Trabajar la familia pedida con su consumidor real y revisar junto al lote de
referencia. Orden sugerido para una migración completa:

1. Cartas: marco, iconos, títulos, preview y estados de elección.
2. Menú: emblema, jugar, secundarios, volver y controles pequeños.
3. Locker y Laboratorio: tabs, equipado, bloqueo, precio, compra y máximo.
4. Pausa, resultados y rewarded: jerarquía de salidas y feedback.
5. HUD: lectura en combate, safe areas, barras y alertas.

Este lote implementa once iconos de cartas, marco, emblema y pausa/ajustes.
El resto del orden es guía para encargos futuros, no una migración ya hecha.
Conservar la próxima tarea EX documentada; arte no cierra balance ni plataformas.

## Puerta visual y encargo reutilizable

Ejecutar la lámina con fuentes reales, tomar capturas oscuro/claro y móvil,
inspeccionar 24/32/48/64 px, todos los iconos y estados de controles. Probar el
overlay real con texto y preview; un catálogo de iconos solos no demuestra
legibilidad de cartas. Rechazar si desaparece la función al reducir, si todos
los objetos son hexágonos, si todo brilla o si el contenedor domina al texto.
Tests estructurales protegen IDs, símbolos, límites y recursos externos.
Después typecheck, builds y smoke pertinente. Registrar lo medido y dejar la
aprobación artística al usuario; una puntuación propia no sustituye sus ojos.

Encargo para el siguiente agente:

> Lee esta guía y abre ui-reference.html. Diseña [elemento] para [función y
> tamaño]. Declara referencia de material, silueta distintiva y consumidor.
> Construye placa/bisel/cavidad/acento dentro del presupuesto de su categoría.
> Conserva texto, accesibilidad y estados reales. Integra la misma fuente en
> catálogo y componente, verifica en tamaño mínimo y móvil, entrega capturas
> y diferencias observadas. No asumas aprobación humana por pasar tests.
