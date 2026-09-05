# Dirección por familias — flota, player, cañones y fondos

Complementa `ship-art-direction.md`; no duplica sus reglas de paths, planos o
frame. Rutas de este documento relativas a la raíz del repositorio. Aplicar el
mismo contrato con cualquier modelo: el nombre del modelo no es una decisión
artística ni una razón para cambiar arquitectura.

## Punto de entrada y alcance

- Referencia comparativa viva: `docs/visual/fleet-reference.html`, con Vite dev.
- Tank aprobado por el usuario como dirección; no equivale a aprobación humana
  de todas las propuestas posteriores ni a un perfil de rendimiento físico.
- La solicitud del 05-09 autoriza este lote concreto de familias. La regla
  habitual sigue siendo una familia por entrega, salvo lote explícito del usuario.
- No modificar radios, balance, slots de disparo, economía, duración, save ni
  las puertas EX al hacer arte. No añadir un ataque porque la nave parezca armada.
- Preservar la tortuga histórica y el ejemplo Tank. No usar el boss como plantilla
  para cada enemigo ni añadir detalle al Tank para compensar diferencias de estilo.

## Enemigos: cuatro roles, no cuatro recolores

| Familia / verbo | Construcción que debe mantenerse | Qué evitar |
| --- | --- | --- |
| Chaser / perseguir | Proa en flecha, alas cortas continuas, dos salidas traseras; cabina pequeña adelantada | Hombros de tanque o corona de mando |
| Fast / perforar | Fuselaje de aguja, alas retrasadas y muescas profundas; núcleo longitudinal | Ensanchar el cuerpo hasta perder velocidad visual |
| Tank / resistir | Proa truncada, hombros de blindaje, reactor empotrado; referencia aprobada | Alas afiladas que lo confundan con Fast |
| Elite / dominar | Corona abierta de tres puntas, placas laterales separadas y reactor central | Escalar simplemente Chaser o fabricar cañones funcionales inexistentes |

Se conserva el lenguaje de siluetas de los roles existentes y se desarrolla su
ensamblaje. No se presenta este lote como una exploración humana aprobada de
tres alternativas por familia. Para una familia NUEVA, hacer esa exploración
según la guía general antes de producir piezas definitivas.

Orden obligatorio: `rear → wings → hull → cockpit`, frame `-32 -32 64 64`,
ancla `(0,0)`, frente `-Y`. El enemigo rota por velocidad, no por regeneración.
Los subgrupos de una pieza se expresan como varios subpaths cerrados; el bisel
comparte vértices con su placa. Los IDs nombran función: `leading-bevel`,
`reactor-well`, `lit-plane`; no IDs opacos de exportador.

La vida y la muerte reutilizan las mismas cuatro texturas. No crear fragmentos
por cada tornillo: `EnemyDefeatFxView` ya limita y recicla cuatro piezas. Low usa
el master completo en un sprite; Medium/High usan cuatro más el flash existente
cuando hay impacto. No confundir sprites asignados en el pool con visibles.
Al cambiar familia o hacer reset, restaurar las texturas, no sólo el nombre.

Presupuesto de estas cuatro familias: hasta 24 primitivas por master. Fuentes
actuales: Chaser 14, Fast 12, Tank 23, Elite 14. No llenar el cupo por obligación.
Cuatro piezas y un flat de 64×64 por familia: 320 KiB RGBA teóricos entre todas,
sin contar alineación del backend ni overhead. Son texturas compartidas, no por
enemigo. La prueba compara primitivas completas y orden entre master y piezas.

## Boss: arquitectura de mando, no un enemigo común ampliado

Fuente: `src/assets/svg/enemies/boss/`; consumidor: `BossShipVisual.ts`.

- Verbo: una ciudadela que encierra un reactor. Hombros abiertos, puente arriba,
  coraza de varios planos y pozo oscuro alrededor de energía cian localizada.
- Frame común `-56 -56 112 112`, centro `(0,0)`; radio de simulación permanece 48.
  Padding explícito evita recortes; no usarlo para desplazar la nave o escalar
  artificialmente la colisión. Su cara principal se mantiene hacia `-Y`.
- 21 primitivas actuales, techo 28 para ESTE boss. Cinco texturas compartidas
  112×112 (cuatro piezas y flat): 245 KiB RGBA teóricos, no memoria GPU medida.
- Una sola instancia fuera del pool de 250. High/Medium: cuatro sprites; Low:
  uno con el master completo. No multiplicar el coste del boss por el pool.
- Movimiento de maquinaria: rear ±0.45 unidades, hombros ±0.9% en X, núcleo
  ±1.2% de escala. No hacerlo aletear ni rotar toda la nave sin función.
- La muerte separa cuatro grupos durante 1.2 s; Low contrae y desvanece el
  compuesto. Consumir `bossDefeated`, NO esperar `enemyDefeated`: son eventos
  diferentes. Avanzar el despiece con el reloj terminal, también tras victoria.
- Mantener `BossView` como dueño de telegraphs y barra; `TerminalFxView` conserva
  su remate. No crear otro reloj de fases, ni una explosión que tape el aviso.

La anticipación mecánica por fase sigue siendo otra tarea VIS-01. El movimiento
de este asset es ambiental, no anuncia un ataque. No cerrar toda VIS-01 porque
ya exista la ciudadela.

## Skins: identidad del casco sin secuestrar el armamento

| Skin | Masa / núcleo | Firma que se conserva |
| --- | --- | --- |
| Cyan | Casco compacto facetado / reactor octagonal | Órbita y marcas cardinales |
| Violet | Rombo longitudinal / cristal en diamante | Esquinas abiertas y prismas |
| Amber | Proa ancha con soportes traseros / cámara hexagonal | Corona solar |
| Emerald | Casco estrecho con aletas separadas / núcleo de huso | Cuchillas orbitales |
| Obsidian | Placas oscuras de relevo / faro hexagonal rosa | Cuásar cardinal y retícula rota |

Fuentes: `characters/player/`; registro compartido `PlayerHullSvg.ts`.

1. Dibujar `body`, `core`, `ring` en el MISMO frame 64×64. No fusionar los
   cañones al casco ni introducir estadísticas por skin.
2. Para body/core usar valores grises explícitos: chasis oscuro, plano medio,
   cara clara y bisel blanco. Pixi multiplica esos valores por `PLAYER_SKINS`.
   Un tint oscuro sobre una textura ya oscura pierde todo el volumen: revisar
   el producto de ambos, no sólo el SVG blanco visto en el editor.
3. Construir el core dentro de una cavidad; no pintar toda la nave de blanco.
   En la escala real el jugador debe seguir localizable entre enemigos.
4. UI y runtime importan `PLAYER_HULL_SVG`. `tintPlayerSvgMarkup` reproduce el
   producto RGB para DOM; no mantener una segunda nave dibujada en la UI.
   La preview de casco no incluye cañones y tiene etiqueta accesible.
5. La firma sale de `SkinSignatureSvg.ts` en ambos consumidores. Mantenerla
   dentro del frame incluyendo strokes (el grupo actual usa escala 0.82).
   No arreglar clipping agrandando texturas o DPR para una sola skin.
6. Low conserva cuerpo, core, ring y cañones. Sólo hay un player; no merece
   amputar su identidad para ahorrar dos sprites. FX/trails mantienen sus límites.
7. Techo 24 primitivas por master de casco, no 24 por cada pequeño detalle.
   El catálogo estático no anima todas las tarjetas; movimiento sólo en preview
   seleccionada y respetando controles/accesibilidad existentes.

Los SVG grises master son fuentes de ensamblaje, no muestras de color final.
Para aprobar arte usar la preview tintada y Pixi, nunca sólo el master gris.

## Cañones: mecanismo, boca y ruta de salida

Fuente y registro único: `assets/svg/cannons/CannonSvgMarkup.ts`. La UI ya toma
las mismas piezas que Pixi. Hay cinco estilos, NO cinco armas nuevas:

- Basic: tubo y rail, cara superior clara, recámara oscura.
- Curve: aguja y horquilla; conservar el canal longitudinal.
- Smoke: cuerpo grueso y collar de combustión; mayor boca que Curve.
- Rainbow: prisma con bandas cromáticas acotadas; no volver blanco todo el tubo.
- Lattice: emisor oscuro angular, collar rosa y halo de retícula; la geometría
  debe seguir siendo legible aunque la estela se apague en Low.

Frame 64×64; boca izquierda `(-27,-11)`, derecha `(27,-11)`. No mover el centro
de los círculos de muzzle para lograr una composición más bonita: su posición
se contrasta con `PROJECTILE_MUZZLE_OFFSETS`. Reflejar geometría en X, no a ojo.
Preservar margen para stroke al llegar al borde. Recoil transforma la pieza;
no desplaza silenciosamente el origen que decidió la simulación.

Construcción: mount oscuro → barrel medio → canal → bisel superior y retorno
inferior → boca oscura → energía localizada. Usar diferencia de área/valor,
no un stroke blanco grueso en todos los bordes. Actual: 9 primitivas por lado;
techo 12 por lado / 24 por master. No se añaden sprites ni filtros.

Los cañones son de color explícito y tint blanco en runtime: cambiar la skin
no cambia su paleta. Proyectil, curva, estela y boca son contratos independientes;
una mejora SVG no autoriza tocar su daño ni volver homing un disparo cosmético.

## Fondos: composición primero, partículas después

Consumidor real: `BackgroundView.ts`; colores y IDs: `BackgroundDefinitions.ts`.
No imponer SVG si unas formas estáticas de Graphics resuelven mejor el fondo.

| Tema | Composición permanente que Low conserva |
| --- | --- |
| Deep space | Campo vacío con constelación alta y masas suaves opuestas |
| Ion storm | Corrientes anchas diagonales, nunca rayos que parezcan peligros |
| Solar drift | Foco descentrado arriba a la derecha y órbitas abiertas tenues |
| Crystal field | Cuatro facetas periféricas; no una retícula encima del combate |

- El centro es espacio de lectura, no otro protagonista. Evitar igual brillo
  en fondo, XP/FX y telegraphs. Las facetas de fondo no tienen contorno de enemigo.
- Base y patrón se dibujan sólo al cambiar tema/viewport. Cada arco o curva
  independiente inicia `beginPath()`; nunca confiar en el cursor heredado.
- Atmósfera: textura 128×128 con 32 discos concéntricos alpha horneados UNA vez,
  compartida por 2/2/3 sprites Low/Medium/High. No blur/shader por frame. No es
  coste cero: medir fill-rate antes de aumentar superficie o solapamientos.
- Low: dos nubes estáticas, 12 estrellas, cero partículas ambientales y sin
  actualización de movimiento. Medium: 24 estrellas/10 partículas; High: 34/18.
- La variación de tema cambia colocación y motivos, no sólo un color. Reutilizar
  sprites al cambiar tema y resize; no crear nuevos recursos por frame.
- Arena mantiene borde y prioridad; opacidad decorativa actual 0.84 para dejar
  pasar parte del ambiente. No reducirla más sin comprobar todos los telegraphs.
- La tarjeta CSS del menú es indicativa de tema, NO una captura exacta. La lámina
  de desarrollo usa el compositor real para aprobación y comparación Low/High.

## Secuencia de entrega y puerta para el siguiente agente

1. Leer la solicitud actual, §22 del plan y la ficha de categoría anterior.
2. Identificar el asset exacto y sus consumidores. Explicar qué cambia y qué
   se conserva. No reconstruir toda la flota por un ajuste de una nave.
3. Aplicar planos/espacios de `ship-art-direction.md`; crear piezas y actualizar
   el master en el mismo cambio. Ninguna dependencia o parser nuevo.
4. Ejecutar typecheck/tests y abrir la lámina en oscuro, claro, grises y silueta.
   Comparar 32/64/128 px del frame y después tamaño real en partida.
5. Ejecutar `node docs/visual/capture-reference.mjs` con Vite dev en 5173:
   verifica 15 assets, IDs únicos, vistas y fondos. Capturas en test-results,
   nunca importarlas como texturas del juego ni versionarlas como fuente.
6. Builds local/Poki/CrazyGames y smoke. Las capturas `art-low-*`/`art-high-*`
   provienen del juego, no del SVG DOM. No confundir foto con benchmark.
7. Probar manualmente `?boss=1`, `?stress=1`, pausa, muerte y restart; en móvil
   físico medir el MISMO escenario Low/High. Registrar aparato, DPR y tiempos.
8. Informar APROBADO AUTOMÁTICO / PENDIENTE HUMANO por separado. No cerrar
   VIS completos ni adelantar EX sólo porque el arte compile. Continuar desde
   `CONTINUACION.md`, sin depender de memoria de un modelo.
