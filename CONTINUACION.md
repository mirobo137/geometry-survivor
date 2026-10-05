# Geometry Survivor — continuación operativa

Actualizado: 04-10-2026. Base Git de esta entrega: `d042357` en `main`.
El catálogo completo descrito aquí queda como cambios locales sin commit, push
o publicación. Este snapshot no reemplaza `PLAN_DESARROLLO.md` ni Git.

## Solicitud vigente — catálogo completo de recompensas

Piloto aprobado por el usuario. Implementadas **30 recompensas**: 10 naves
(incluye Asterion/Solstice), 10 cañones y 10 fondos. Los catálogos normales tienen
20 entradas por familia (10 base + 10 exclusivas), sin tab piloto.
Diez cañones con balas/estelas originales; varios gestos curvos, serpentinas,
hélices y vibración, sólo visuales. Contratos existentes de propulsor, cables,
recoil, pooling y fondos pintados/vapor conservados, sin cambiar balance.

Vista completa: `http://localhost:5173/?debug=1&reward-catalog=1`. Abre los
catálogos normales con recompensas desbloqueadas en memoria, equipables y
utilizables en batalla. No escribe al guardado real; volver a una URL sin los
parámetros recupera la partida real. Aviso temporal visible en Hangar, sin HUD
de diagnóstico tapando la prueba. Sólo local/Pages; portales ignoran la ruta.

Temporadas: 15 premios por fuente (Bitácora/Ruleta), un premio por semana UTC
desde 05-10-2026, repetir en 15 semanas. Bosses siguen rotando cada 3 semanas.
Premio actual enlaza a su fuente; inactivos no se venden. Propiedad/equipado
durables en su familia sin autoequipar al ganar; duplicados 250 NOVA semanal/
500 ruleta. Video y reintento mantienen el premio ofrecido al cruzar la semana.

58 derivados WebP nuevos: **1,463,696 B**; PNG maestros y prompts preservados,
sin importar masters al runtime. Medida final:
Pages **11,362,406 B**, Poki **11,362,252 B**, CrazyGames **11,362,258 B**,
todos bajo 15,000,000 B (margen Pages 3,637,594 B). Mapas local
**5,147,538 B**, fuera de Pages. Persiste el warning previo de chunk JS >500 KB.
Tipos, **758 unitarias / 134 archivos** y **20 smoke PC/móvil** correctos
(57.8 s), incluyendo premios/equipado de cañón y fondo, compra base, temporadas,
guardado, cuotas y concurrencia. Adicionalmente 11 smoke de carga inicial,
consolas y catálogo (41.8 s) correctos en PC/portrait/landscape. Verificación
final de batalla High PC / Low móvil: 2/2 (14.3 s), sin overlay de diagnóstico.
Se inspeccionaron
contact sheets de arte y de los diez kits bala/estela, modales y batalla.
Falta móvil físico, profiling prolongado y deploy remoto.
Contrato: [CATALOGO_RECOMPENSAS](docs/design/CATALOGO_RECOMPENSAS.md).

## Historial fechado — limpieza y diagnóstico anteriores

Última entrega local (04-10): GitHub Actions conserva por 30 días los source
maps del build `local` junto con JS/CSS; Pages publica `dist/pages` sin mapas,
sin borrar diagnósticos ni subir el límite de 15 MB. Medición actual: Pages
9,875,558 B; mapas 5,087,383 B; Poki 9,875,488 B; CrazyGames 9,875,494 B.
El diagnóstico conserva los vínculos sourceMappingURL; la copia pública los
retira junto con `.map`. Typecheck y 749 unitarias
/ 132 archivos pasan; los tres builds y el guard de tamaño pasan. Sin suite
browser, push ni deploy en GitHub todavía.

Se retiraron 57 SVG que no consumía producción (70,112 B): masters completos
antiguos de player/cañones, componentes de enemigos, tortuga SVG y escena SVG
del inicio. Las rutas de fallback que aún usa el juego permanecen; también los
dos fondos SVG guardados intencionalmente como referencia histórica. Las
pruebas estructurales ahora cubren los fallbacks activos. El ahorro es del
repositorio, no se suma al presupuesto publicado.

## Historial reciente — retos semanales y siguiente validación humana

Regla base de los duelos: el casco de los tres bosses causa daño por contacto en
cualquier fase/modo (detección barrida, cooldown 0.45 s). El perfil de ataques
es exclusivo de los retos y conserva los telegraphs; Fracture actualiza sus
proyectiles/minas durante el duelo. La prueba manual de dificultad, especialmente
en móvil, sigue pendiente.

Nuevo ajuste solicitado para el ensayo: Core Duel solamente bloquea el centro
con un anillo visible de radio 112; el casco del jugador queda fuera y la
barrera no causa daño. Pruebas enfocadas de geometría, ArenaModel, PlayerModel,
render, definición del evento y Game: 80/80 correctas. Typecheck pasó; repetir
la suite completa también pasó (751 pruebas / 133 archivos). Validar en pantalla
que la barrera suba la dificultad sin estorbar el paso alrededor, especialmente
en móvil, queda pendiente.

Últimos ajustes tras feedback: Core inicia y reintenta al sur del anillo, opuesto
al spawn del boss; los tres duelos eliminan Calibration y parten en Projectile
rango I con un solo emisor. La recuperación sube a 33% del valor base (antes
25%), dejando un ciclo todavía ≥1.45× más rápido que campaña; kits y telegraphs
se conservan. `typecheck` y suite completa: 754 pruebas / 133 archivos. Falta
confirmación visual y de game feel en navegador/móvil.

Ajuste solicitado para terminar de balancear Orbital Warden: únicamente las
réplicas del reto semanal mueren con dos impactos del Proyectil base (28 de
vida frente a 30 en campaña); Core Sentinel, Fracture Engine y el Warden de
campaña no cambian. Core Sentinel queda aprobado por el usuario; Fracture se
conserva sin cambios. `typecheck` pasó y la suite completa quedó en 755 pruebas
/ 133 archivos correctos. Falta comprobar el ritmo de Warden en pantalla/móvil.

Bitácora actualizada: siete objetivos generales se reciclan con metas mayores
y +25% de la recompensa base por rango; seis objetivos de actos/bosses de campaña
son únicos y se ocultan al cobrar. Terminar una run sólo deja el premio pendiente.
Cobro manual en Bitácora activa la siguiente meta desde cero, con pago durable
y lock entre pestañas; schema 13 conserva premios previos sin repagarlos.
Contrato: [BITACORA_OBJETIVOS](docs/design/BITACORA_OBJETIVOS.md).
Retos semanales actualizados localmente: Core Sentinel, Orbital Warden y Fracture
Engine son duelos sin impactos, aprobados por el usuario; ahora rotan en un ciclo
de tres semanas. Charger permanece fuera de la rotación semanal. Primer
impacto conectado falla el intento incluso si lo bloquea el escudo; las réplicas
y ataques de Warden siguen activos. Asterion es el premio principal; si ya se
posee, una edición distinta paga +250 NOVA sólo una vez. La práctica local no
guarda ni da premios. Aceptación humana sigue pendiente.
Validación final de Bitácora: tipado, 737 unitarias / 132 archivos y 10 smoke
PC/móvil (29.6s, incluye regresión de ruleta), correctos. Builds completos:
Local 14,939,834 bytes, Poki 9,869,389, CrazyGames 9,869,395. Margen local
60,166 bytes bajo 15 MB; warning de chunk JS previo conservado. Sin commit/push.

Catálogo exclusivo de retos/ruleta solicitado: diez naves, diez cañones y diez
fondos; contar Asterion y Solstice dentro de las diez naves (ocho naves nuevas).
La estimación de 28 derivados nuevos es 1.2–2.2 MB, frente a los 60,166 bytes
de margen de la medición anterior, que incluía source maps públicos. La nueva
copia Pages deja 5,124,442 B antes del tope de 15 MB; el lote estimado cabe en
el baseline actual, pero se medirá el build final antes de aprobarlo. No
cambiar calidad de arte ni borrar mapas. Ya existe un piloto visual local con
tres conceptos, pero aún no el lote de 28; Pages del piloto mide 9,982,039 B.
Estado anterior y presupuesto: [plan de retención](docs/design/RETENCION_EVENTOS_Y_RECOMPENSAS.md#puerta-de-presupuesto-para-cosmeticos-exclusivos).

Actualización de ruleta comprobada: 729 unitarias en 131 archivos y seis smoke
PC/móvil (21.2s); tipado y builds Local/Poki/CrazyGames correctos:
14,918,422 / 9,863,397 / 9,863,403 bytes. La probabilidad aumenta sólo con
premios guardados, no videos cancelados ni reintentos fallidos; conserva el
porcentaje al recargar. Schema 11 mantiene premios/cooldown e inicia la nueva
probabilidad en 1% porque no guardaba el conteo histórico. QA físico pendiente.

Entrega solicitada: iniciar la implementación del plan de retención. Se añadieron
localmente una Bitácora persistente, 13 familias de objetivos, resumen terminal, rotación
UTC de tres duelos semanales y evasión Charger de 60 segundos en práctica. La
recompensa piloto semanal es Asterion Courier. La solicitud posterior ya añadió
la **Ruleta diaria** junto a Retos y Bitácora: marco generado y Solstice Regent
exclusiva y diez ranuras NOVA; gratis cada 24 h y extra diario con video.
Ambos pueden entregar la skin: primer giro 1%, +1 punto por giro completado
hasta 20%, persistente sin reinicio diario ni al ganar. No compra de giros.
Las cifras son provisionales.

Al probar la rotación: en Inicio abrir **Retos y Bitácora**. Antes del ancla
2026-10-05 00:00 UTC sólo se permite practicar sin premio; al empezar la edición
aparece Core Sentinel. Cada lunes 00:00 UTC rotan Core Sentinel, Orbital Warden
y Fracture Engine; al terminar la tercera semana vuelve Core Sentinel.
Para probar hoy los tres duelos sin esperar la rotación, usar el servidor local
con `debug=1&retention-challenge=core-duel`, `warden-duel` o `fracture-duel`;
estas rutas no otorgan NOVA ni alteran el guardado.
El menú de resultado regresa a Bitácora. Una nave ganada no se equipa sola.
El duelo sólo permite la build fija de proyectiles; Warden conserva sus réplicas
y el kit completo. Charger no dispara, no recibe armas automáticas y el grupo
crece hasta cinco. La Bitácora sólo cuenta resultados normales, no abandonos ni
resultados de retos.

La migración actual es schema 9/10/11/12 → 13 y conserva el perfil anterior. El pago local se
confirma por lectura posterior; la ruleta usa Web Locks entre pestañas del mismo
origen y guarda antes de animar. No es guardado autoritativo ni entre dispositivos.
No equipa premios sin decisión del jugador. Local/Pages indica video simulado;
Poki/CrazyGames no simulan éxito. Revisión comercial de portal sigue pendiente.
Reglas, arquitectura, economía estimada y límites: [RULETA_DIARIA](docs/design/RULETA_DIARIA.md).

Comprobados tipado, suite unitaria y smoke enfocado PC/móvil de ruleta (guardado,
recarga, skin/equipo/Inicio/batalla, 320/390/844/1280px, dos pestañas y video
cancelado). Capturas de ruleta en `test-results`. Se corrigió XP que filtraban las réplicas en duelos semanales;
siguen atacando y recibiendo daño normalmente, sin oleadas comunes.
Para caber en presupuesto, runtime de naves/cañones y arsenal pasa a WebP
lossless con igualdad RGBA comprobada; PNG maestros conservados. Arte nuevo
60,690 bytes, ahorro directo 348,198 bytes. No quitar source maps ni elevar límite.
La aceptación visual, combate y móvil físico queda para el usuario. No iniciar
Vite, commit, push ni publicar automáticamente.

Entrega anterior a la probabilidad creciente: **724 unitarias / 131 archivos**, **11 smoke enfocados** PC/móvil
en 32.1s (seis de ruleta, dos de catálogo, dos de rotación de portada, uno de
Manta). Builds Local/Poki/CrazyGames: **14,915,355 / 9,862,552 / 9,862,558 bytes**,
incluyendo mapas debug en Local; margen Local 84,645 bytes. Advertencia conocida
de chunk JS >500kB, no de presupuesto total. No se ejecutó la suite browser
completa ni se midieron FPS/GPU en móvil físico. Servidor del usuario no reiniciado;
preview de QA efímero se cerró al terminar las pruebas.

## Entrega inmediatamente anterior — arte PNG de 16 naves militares

Se sustituyó el primer lote similar a SVG por **16 naves militares originales**
con el enfoque artístico del Tank aprobado: 13 enemigos
comunes y Core Sentinel, Orbital Warden y Fracture Engine. Tank reutiliza la
imagen aprobada; las otras 15 son nuevas y diferenciadas. Fracture Gunner tiene
la boca del cañón central y canal frontal despejado para su disparo real.
Catálogo, procedencia y prompts:
[src/assets/images/enemies](src/assets/images/enemies/README.md),
`scripts/enemy-image-sources.json` y `scripts/prepare-enemy-art.py`.

PNG maestros versionados de 128×128 / 224×224 (**621,078 bytes**); runtime
WebP transparente de 96×96 / 168×168 (**85,586 bytes**, calidad 55, alpha exacto).
El script usa originales disponibles o PNG versionados en otra PC. Full-frame
Lanczos sin trim/recolor; no hay dependencia de una carpeta privada al jugar.
Imports `?no-inline` evitan duplicación base64 en JS/source maps.
`EnemyRasterTextures` decodifica por Image y normaliza la resolución a 1.5:
frames lógicos 64×64 / 112×112, centro `(0,0)`, frente `-Y`, también al morir.
Cache compartida y SVG de respaldo. No cambian ataques, hitboxes, balance,
sprites/pools ni receta de muerte. Bosses conservan su entrada modular SVG y
ventana no atacante; sus entradas dedicadas siguen pendientes de diseño.

Verificados typecheck, **695 unitarias / 128 archivos** (reporte JSON en
`test-results/enemy-art-units.json`) y **96 casos browser** con el arte final
cargado, no fallback: fuentes/dimensiones, muerte, pausa/resize, saturación,
60 ciclos, reset de tramo y limpieza; cero errores JS/HTTP. Capturas en
`test-results/tank-defeat`. Último build Local/Poki/CrazyGames anterior a retención:
**14,997,754 / 10,073,008 / 10,073,014 bytes**. Margen Local **2,246 bytes**:
el prototipo de retención aún no se compiló y requiere volver a medir el tamaño;
no relajar el límite de 15 MB. No se ejecutó toda la suite browser ni se midieron
FPS/GPU en móvil físico.

La revisión humana en batalla/móvil de enemigos sigue pendiente. Galería en Vite 5173:
`/docs/visual/tank-defeat.html?quality=high` (selector de 16 familias, tamaño
real, pausa y muerte; `&enemy=fracture-gunner` selecciona al artillero).
Prueba en batalla: `/?fracture-drill=gunner&debug=1&quality=high`.
El servidor del usuario sigue disponible; no se reinició en esta entrega.
Las piezas SVG de entrada de bosses siguen en runtime; los masters de cuerpos
permanecen en el repositorio. Overdrive, aprobación humana del FX anterior y
prueba humana del Laboratorio conservan sus pendientes.

### Base implementada antes de los PNG — 03-10-2026

El usuario aprobó la muerte Tank y autorizó extenderla a todos los enemigos y
bosses. Las 13 familias comunes y tres bosses usan ruptura de 420 ms por cuatro
recortes de una sola fuente. Conserva pose (incluidas escala de hijos/réplicas,
orientación y entrada/punch) e identidad capturada antes de liberar/reciclar el
enemigo. Bosses reutilizan sus sprites; no superponen el colapso antiguo. Pool
común High 18×4 / Medium 12×4; Low/reduced-motion sin fragmentos, con
bloom/chispas según preset. Pausa/level-up congelan; victoria/transición dejan
terminar el efecto. No cambian ataques, HP, XP, guardado ni balance.

Evidencia de esa entrega anterior: typecheck, 689 unitarias / 127 archivos, 96
casos browser de las 16 familias con seis configuraciones, cero errores JS/HTTP
y builds Local/Poki/CrazyGames en 14,980,401 / 10,016,486 / 10,016,492 bytes.
No se certificaron FPS/GPU en teléfono físico. El diagnóstico de la muerte común
es `node scripts/qa-tank-defeat.mjs`; el rediseño militar volvió a ejecutarlo
con los 96 casos y texturas runtime finales (evidencia vigente arriba).

## Retención — implementación local actual, 04-10-2026

- Código: `src/content/retention/RetentionDefinitions.ts` define calendario UTC,
  tres retos semanales, 13 objetivos y pagos acotados; `RetentionActDirector` abre cada
  boss directamente.
- Rotación: Core sin impactos → Warden sin impactos → Fracture sin impactos →
  Chargers; impacto conectado incluye daño absorbido por escudo. Compensación:
  +250 NOVA por edición nueva si Asterion ya está desbloqueada, una vez por edición.
- Prácticas directas locales: `?debug=1&retention-challenge=core-duel`,
  `?debug=1&retention-challenge=warden-duel` y
  `?debug=1&retention-challenge=fracture-duel`; son rewardless y no persisten.
- El duelo Core Sentinel tiene barrera central física y aparece al sur de ella,
  opuesto al spawn norte del boss, evitando contacto al abrir la introducción.
- Combate: bosses conservan el `BossSystem` completo (incluidas réplicas y
  amenazas propias) sin oleadas comunes; se mantiene un proyectil fijo del
  jugador. Chargers: 60 s activos, crecimiento gradual a cinco, sin armas ni
  daño automático del jugador.
- UI: entrada opcional en Inicio, panel responsive con WebP de bosses/Chargers y
  Asterion; scroll móvil, carga diferida y resultado conectado a Bitácora.
- Save actual: schema 13 migra schemas 9–12 sin borrar datos previos. Progreso y
  recibos se limitan; pago confirmado por lectura posterior. localStorage no es
  servidor, antitrampas ni garantía entre dispositivos.
- Pruebas escritas en `RetentionDefinitions.test.ts`,
  `CombatSimulation.test.ts`, `TetheredAssets.test.ts` y `SaveStore.test.ts`.
  En la entrega de duelos: typecheck y 84 pruebas enfocadas pasaron; suite total,
  smoke y builds no se ejecutaron. Aceptación de PC/móvil queda para el usuario;
  no reiniciar Vite ni publicar.
- Pendiente: valores/balance provisionales, suite total, smoke/build y revisión
  visual/combate humana; publicación y ruleta real conservan puertas de portal.

## Retención — entrega documental anterior (histórica)

La guía previa describía sólo la propuesta futura; su estado «sin implementación»
ya fue superado. Consultar la sección actual de arriba y la
[guía canónica](docs/design/RETENCION_EVENTOS_Y_RECOMPENSAS.md). EX-09, prueba
humana del Laboratorio y aceptación móvil del catálogo siguen pendientes.

## Catálogo de diez — entrega anterior

Catálogo solicitado el 03-10-2026 completado localmente: **10 naves, 10 cañones,
10 fondos**. Nuevas naves Scarlet Corsair/Nautilus Ark; cañones Gyre Coil/Rift
Saw con balas de triple onda/vibración angular; fondos Archivo Silente,
Falla Lunar/Estela del Leviatán. Contrato de batalla y guardado existente,
sin cambios de balance ni reinicio de Vite. Guía y evidencia:
[CATALOGO_DIEZ](docs/design/CATALOGO_DIEZ.md), §22.20 del plan.

Build local + 624 unitarias/126 archivos y siete smoke PC/móvil correctos.
QA de los tres fondos Low/High correcto. Los WebP antiguos se regeneran
desde sus PNG intactos (Q82), ahorro 483,096 bytes. Artefactos completos:
local 14,964,288; Poki 10,012,364; CrazyGames 10,012,370 bytes. Mapas y límite
de 15 MB intactos. Margen local 35,712 bytes: revisar presupuesto antes de
otra ampliación. Siguiente paso: probar el arte y las trayectorias en local/
teléfono físico; después retomar planes pendientes por indicación del usuario.
No hacer commit/push automáticamente. El refinamiento siguiente es la entrega
anterior ya aprobada, no una tarea nueva.

Refinamiento solicitado por feedback: los ocho cañones crecen 25% (30×39)
en combate y Skins; thumbnail 98×44 conserva encuadre. Cables con curva cúbica,
holgura según distancia, controles amortiguados y puertos fijos del casco.
Ocho segmentos y dos buffers de puntos reutilizados (144 bytes), sin solver.
Vapor breve en la boca con el mismo atlas de 16 KiB: una bocanada por emisor
Low/Medium, dos en High, ninguna con movimiento reducido. Pool vigente
4/8/12 sprites (dos en reduced-motion); fade total <0.5 s. Se afinó tamaño/
opacidad tras revisar capturas para que se perciba mejor.

Verificado: build local con typecheck/suite unitaria, pruebas enfocadas tras
el ajuste de anclajes/vapor, builds de tres targets bajo 15 MB, cuatro smoke
de encuadre/pausa/resize/reinicio PC/móvil (14.5 s), veinte escenarios QA y
dos repeticiones finales de vapor PC/móvil. Capturas revisadas y cero errores JS.
En stress con/sin feedback: Low 11→12, High 12→13 draw calls (SwiftShader).
No son FPS físicos ni comparación con la versión antigua completa.
Artefactos finales: local 14,894,370 bytes con mapas; Poki 9,955,107;
CrazyGames 9,955,113. Margen local ~105 KB; warning previo JS >500 KB.
QA final: `node scripts/qa-cannon-feedback.mjs --vapor-only`, capturas/report
en `test-results/cannon-vapor/`; matriz completa en `test-results/cannon-feedback/`.
Siguiente acción: aceptación humana del tamaño/cables/vapor en local y móvil.
Guía vigente: [Naves PNG](docs/design/NAVES_PNG.md#respuesta-reactiva-de-cañones).
Sin commit/push ni reinicio del Vite del usuario.

## Respuesta de cañones: primera entrega

El usuario solicita una respuesta visual de cañones comparable a los propulsores.
Entregado localmente: retroceso inmediato/retorno suave por emisor, fogonazo
por cosmético y pulso de energía que recorre el cable visible en recuperación.
`CannonFeedbackView` copia el descriptor pooled de disparo y usa un atlas de
64×64 RGBA8 (16 KiB) con 2/6/8 sprites fijos según calidad; elimina el fogonazo
y sockets Bloomwake Graphics reconstruidos por frame. Cambios cosméticos:
cadencia, trayectoria, daño, evoluciones y guardado conservan sus contratos.
Guía para nuevos cañones/perfiles: [Respuesta reactiva](docs/design/NAVES_PNG.md#respuesta-reactiva-de-cañones).

Verificado: typecheck, suite completa de 126 archivos unitarios y tres builds;
26 pruebas enfocadas de player/feedback/cables/motores; cinco smoke enfocados
(1.2 min) cubren ocho parejas PNG, compra/selección, las doce evoluciones y
pausa/resize/reinicio PC/móvil. QA específico de 20 casos pasó: ocho cañones
Low/High, Medium, reduced-motion y stress; capturas revisadas, pool fijo/fuente
compartida y cero errores JS. En la misma escena stress pausada, con/sin la
nueva vista: Low 9→10 draw calls, High 10→11 (ANGLE/SwiftShader). Ese dato no
mide FPS ni GPU física. Prueba humana del feel y móvil físico pendientes.
Artefactos completos: local 14,888,843 bytes con mapas; Poki 9,953,914;
CrazyGames 9,953,920, bajo 15 MB. Margen local ~111 KB; warning previo JS >500 KB.
Capturas/report: `test-results/cannon-feedback/`; diagnóstico reproducible:
`node scripts/qa-cannon-feedback.mjs` tras build local y después de Playwright.
Probar `/?weapon-path=projectile&cannon=bloom&quality=high` y cambiar el ID de
cañón para comparar. Vite 5173 del usuario respondió HTTP 200 y se conservó;
los previews de prueba cierran su servidor/navegador. Sin commit/push/deploy.

## Propulsores: entrega anterior conservada

El usuario delega una mejora visual de coste mínimo. Entregado localmente:
propulsores reactivos para las ocho naves, conservando el casco PNG completo.
Crece el chorro al moverse y decae al detenerse, con puertos/paleta por nave.
Pool fijo 3/6/9 sprites según calidad y una textura RGBA8 de 8 KiB por vista;
sin partículas acumulativas, filtros ni cambios de gameplay. Se elimina la
estela Graphics anterior que se reconstruía antes de ocultarse con el PNG.
Contrato: [Propulsión](docs/design/NAVES_PNG.md#propulsión-reactiva).

Verificado: typecheck y suite unitaria del build local, builds local/Poki/
CrazyGames, cuatro smoke de nave PC/móvil (22.7 s) y los 13 casos del diagnóstico
`scripts/qa-propulsion.mjs` (ocho skins, Low/Medium, reduced-motion, stress).
Pausa, apagado al parar, pool fijo, fuente compartida y ausencia de errores JS
comprobados; capturas revisadas. En stress congelado aumentaron dos draw calls:
Low 9→11 y High 10→12. Chromium usó SwiftShader; los tiempos de render quedaron
en el ruido de resolución del reloj y no permiten afirmar un coste en ms/FPS.
No equivale a medición de GPU móvil física ni a toda la suite browser.
Artefactos: local 14,875,831 bytes con mapas; Poki 9,951,222; CrazyGames 9,951,228.
Todos bajo 15 MB; margen local ~124 KB. Warning previo JS >500 KB persiste.
Siguiente: probar moviéndose/parando en local y validar presencia visual en móvil.
Sin commit/push ni reinicio del Vite del usuario.

## Música: entrega anterior conservada

El usuario solicitó usar su música para todo el juego. Integración local del
03-10: `src/assets/audio/music/general-theme.mp3`, misma pista en loop para
Inicio/consolas/resumen (50%) y actos/Overdrive (20%), multiplicados por el
control musical persistente. Fade de 450 ms; menú/partida no reinician el seek.
No modifica los SFX ni el save. Pausa/background detiene audio; recuperar foco
retoma sólo pantallas no jugables, no reanuda una partida pausada.
Contrato/procedencia: [Música general](src/assets/audio/music/README.md).

Ajuste posterior del 03-10 por feedback del usuario: 50% menú / 20% partida.
Verificado con typecheck, 37 unitarias de audio/Game y cuatro smoke de música
PC/Pixel 5 emulado (24.5 s); build local correcto, 14,866,006 bytes con mapas.
No se repitió la suite completa ni los builds de portales para este cambio
de dos constantes; sigue pendiente audición humana de los nuevos niveles.

Original del usuario intacto fuera del repo: 8,788,430 bytes / 359.760 s
(el nombre dice 36.3s, pero dura casi seis minutos). Copia MP3 con pérdida a
32 kHz estéreo / 64 kbps: 2,878,892 bytes. Howler usa HTML5 Audio, no un buffer
Web Audio de seis minutos. Nada de MP3/AudioContext antes del primer gesto;
una pista/nodo musical y un contexto vivo compartido con SFX; sin timers
de reintento tras error. Prueba siguiente: aceptación auditiva del usuario de
compresión, volumen 20% en combate, fatiga/loop largo y móvil físico.
Verificar derechos comerciales antes de distribución; metadatos Suno no
equivalen a permiso. Sin commit/push/publicación autorizado.

Verificación de la integración inicial (70%/35%, antes del ajuste de volumen):
typecheck, 124 archivos / 607 unitarias verdes y tres builds;
14 smoke enfocados verdes (1.1 min) más dos RES-01 (7.7 s), desktop/Pixel 5
emulado: niveles nativos 0.70/0.35, slider/mute, posición continua, menú desde
pausa, blur/focus, red fallida/tardía, contexto suspendido y cero decodificación
Web Audio de música. Descarga inicial sigue bajo 5 MB. Chromium cancela tramos
bufferizados y sigue por otro Range: el smoke sólo excluye `net::ERR_ABORTED`
de esta pista HTML5; conserva errores reales/404 y todos los demás assets.
Artefactos completos: local 14,866,007 bytes con mapas, Poki 9,949,357 y
CrazyGames 9,949,363, bajo 15 MB; quedan ~134 KB de margen en local, por lo que
no añadir copias musicales ni subir bitrate sin revisar el presupuesto.
Warning previo JS >500 KB persiste. Suite browser completa, audición humana,
móvil físico, SDKs y deploy no ejecutados en esta ampliación.
Se conserva Vite 5173 del usuario (PID 1732), sin reiniciarlo ni duplicarlo:
148.6 MiB privados / 121.2 MiB RAM al chequeo (snapshot, no prueba de horas).
El preview temporal 4173/Chromium cierra al terminar cada grupo de pruebas.

Entrega anterior: personalizar Inicio con la nave equipada. Integración local
del 03-10: casco y nombre reales del catálogo, mismo PNG/proporción que Skins y
combate; cambia al equipar, comprar y recibir rewarded. No cambia al inspeccionar.
Al volver al menú/recargar lee `skins.selected`, sin otro save ni assets nuevos.
Un único casco DOM, carga finita y fallback SVG; sin nuevo loop/texturas Pixi.
Contrato vigente: [Inicio](src/assets/images/ui/home/README.md).
Prueba siguiente: cambiar nave en Skins y regresar a Inicio en PC/móvil.
Shaders/propulsión y derrota nueva siguen pendientes. Sin commit/push autorizado.
Validación de esta ampliación: `npm run build:local` correcto (typecheck y
unitarias), builds Poki/CrazyGames correctos y 18 smoke enfocados verdes en
1.1 min: ocho skins entre PC/móvil, inspección sin equipar, reload, compra,
rewarded, regreso desde combate, encuadre/rotación, carga lenta/fallida/tardía.
Capturas revisadas: `test-results/*Inicio-muestra*/home-violet.png` (PC) y
`home-obsidian.png` (móvil emulado). Sin regresión en los checks de animación.
Artefactos completos: local 11,986,224 bytes (con mapas), Poki 7,070,102 y
CrazyGames 7,070,108, bajo 15 MB. `survivor-core.png` queda conservado como
referencia, fuera del build; no se borraron assets. Persiste warning de chunk
JS >500 KB previo. Suite browser completa, móvil físico y deploy no ejecutados.
Se conserva el Vite del usuario en 5173 (PID 1732), sin reiniciarlo ni duplicarlo;
al cierre del chequeo: 139.6 MiB privados / 106 MiB RAM (snapshot, no prueba de horas).
El preview temporal 4173 y Chromium de las pruebas cerraron al terminar.

Entrega anterior del 03-10: balas/estelas PNG más vistosas y más tamaño de cañones en
combate y Skins. Entrega local: ocho paquetes originales (16 PNG, 86,229 bytes)
y cañones +20% visual (24×31.2, mismo pivote). Cabezas 36×18; Low conserva PNG
sin descargar/renderizar cintas. Medium/High reutilizan cuatro bandas del pool
existente y caché compartida, con fallback y material estable por disparo.
Evoluciones conservan sus cuerpos PNG propios. Contrato, prompts y rutas:
[Balas PNG](src/assets/fx/projectiles/README.md).
No se autorizaron commit/push/publicación, ni cambios de balance/economía/saves.

Prueba siguiente: aceptación humana del tamaño/presencia de cañón y balas en
Skins/combate, especialmente móvil físico. Ruta existente de revisión:
`/?weapon-path=projectile&debug=1&cannon=helix&quality=high` (cambiar `cannon`).
No borrar el arte vectorial de fallback, ni volver a cargar todo el catálogo
al iniciar. Shaders/propulsión siguen pendientes; nave equipada en Inicio abordada arriba.

Verificación del 03-10: typecheck, 124 archivos / 601 unitarias y builds local,
Poki y CrazyGames correctos; 14 smoke enfocados pasaron en 1.9 min (desktop/móvil:
encuadre, compra, carga lenta/fallida, pausa/resize y doce evoluciones).
Artefactos completos: local 12,244,958 bytes con mapas, Poki 7,329,924,
CrazyGames 7,329,930, todos bajo 15 MB. Persiste warning previo del chunk JS
>500 KB; no bloquea el build ni es una medición de rendimiento físico.

QA de materiales: las ocho recetas en Low/High renderizaron PNG reales sin
errores; 300 cabezas por pool, Low sin petición/capa de cola y High con 480
sprites de cinta. Stress adicional con 250 enemigos/300 balas mantuvo todos
esos límites, cero errores. Evidencia/capturas: `test-results/projectiles/`.
El headless usa ANGLE/SwiftShader (software); sus FPS bajos no aprueban el
presupuesto físico ni demuestran una regresión sin comparación anterior.
Se informa el resultado/límite en [Balas PNG](src/assets/fx/projectiles/README.md).
No se ejecutó la suite browser completa en esta entrega ni se probó móvil físico.
Servidor de revisión iniciado con Node 24.19.0/Vite 7.3.6 en
`http://127.0.0.1:5173/`. El diagnóstico cerró su preview y Chromium al finalizar;
se deja sólo el dev server del proyecto para revisión humana.

La auditoría de recursos y sus correcciones quedaron en `main` (`7df6c92`).
Entrada histórica: [auditoría de recursos](docs/audits/AUDITORIA_RECURSOS_2026-10-02.md).
Conservar su evidencia y límites; este incremento visual autorizado no cierra
las puertas de publicación/SDKs/i18n ni las pruebas humanas pendientes.
La [guía de ejecución](docs/PLAN_EJECUCION.md) contiene la cola vigente.

Seguimiento: [correcciones por ID y evidencia](docs/audits/CORRECCIONES_RECURSOS_2026-10-02.md).
Verificación del 02-10 (no repetir como medición de esta entrega): typecheck,
595 unitarias y tres builds correctos (~7,26 MB runtime por target;
local completo con mapas: ~12,16 MB). Suite browser completa: 89 correctas / 9,4 min,
exit 0, cierre automático sin ayuda. Diagnóstico de recursos: 6 escenarios,
20 recorridos + 60 modales + 10 reinicios, cero errores. Vite completó 601,9 s, RSS final ~152 MiB,
sin errores ni eventos dist; no certifica una sesión de horas.
SDKs reales e i18n completo siguen EX-09, no cerrados. Los anuncios simulados
ya no conceden recompensas fuera del target local. No sustituir prueba larga ni
aceptación humana con estos checks; sin publicar.

## Estado que no hay que reconstruir

- Actos I–III, seis familias de armas, evoluciones, Overdrive, NOVA y flujo
  rewarded local están implementados. La aceptación humana de actos/Overdrive
  fue registrada el 22-09 y el baseline de balance EX-02c el 28-09; son evidencia
  histórica, no una medición de memoria ni QA del checkout actual.
- Laboratorio V2: once ramas, cinco rangos, ofertas rotativas y Vitalidad
  rewarded, con guardado. El usuario aplazó las pruebas humanas visuales/táctiles
  el 29-09; siguen pendientes según [su contrato](docs/design/LABORATORIO_META_V2.md).
- Catálogo actual: ocho naves y ocho cañones PNG. Naves muestra sólo casco;
  Cañones muestra módulo/disparo/estela. Gameplay combina nave, dos módulos y
  cables. Ver [NAVES_PNG](docs/design/NAVES_PNG.md) y procedencia en sus READMEs.
- Inicio, cartas, actos, fondos y arsenal tienen arte raster además de SVG/
  Graphics. No asumir «todo es SVG» ni prometer menor memoria por ser PNG.
- Música: Howler; SFX: ZzFX, coordinados por `src/audio/AudioService.ts`.
- `src/main.ts` aún compone `LocalPlatform` en todos los targets. Tener bundles
  `local`, `poki` y `crazygames` no significa SDKs reales ni QA de portal: EX-09
  permanece pendiente.

## Node/Vite y memoria: evidencia separada

La referencia del repositorio es Node 24 LTS (`.node-version`: 24.19.0); CI usa
la rama 24. El watcher actual excluye `dist/**`, reportes y temporales.
[VITE_MEMORY](docs/performance/VITE_MEMORY.md) conserva el incidente de Node
22.14.0 y pruebas acotadas posteriores: no demuestra el disparador exacto del
episodio histórico de ~30 GB ni certifica estabilidad durante horas.

Memoria del servidor Node, heap de Chromium, caché de imágenes decodificadas y
texturas/GPU son medidas diferentes. Carga tardía no prueba por sí sola una fuga.
Usar el informe nuevo para resultados de esta auditoría, no copiar cifras de
sesiones anteriores como si acabaran de medirse. No asumir que un Vite histórico
sigue activo: comprobar procesos/puertos antes de iniciar o detener servidores.

## Puertas pendientes antes de publicación

1. Resolver los bloqueantes reproducibles del informe de recursos, en una
   entrega autorizada y con regresiones concretas.
2. Comprobar carga fría/caché, navegación repetida, reinicios y sesiones largas;
   medir memoria y descarga de forma separada del game feel.
3. Retomar la prueba humana del Laboratorio y del arte de la flota; perfil físico
   en teléfono modesto sigue sin demostrarse por un móvil potente o emulado.
4. EX-09: adaptadores reales separados, lifecycle/ads/save, presupuestos de
   descarga efectivos, texto internacionalizable y QA en Inspector/Preview.
5. Sólo entonces preparar artefactos/metadatos y una submission autorizada.

OD-F01 (`Asalto`, ritmo de Overdrive por puntos) es
[propuesta futura](docs/design/OVERDRIVE_RITMO_POR_PUNTOS.md), no modo existente.
Expedition fue eliminado; no crear guardado ni pantallas para esa propuesta antigua.

## Para retomar aquí o en otra PC

Leer `AGENTS.md` → este snapshot → [§22 del plan](PLAN_DESARROLLO.md#ejecucion-vigente)
→ [guía vigente](docs/PLAN_EJECUCION.md) → skill/contrato de la tarea elegida.
Comprobar `git status --short --branch`, `git log -5 --oneline`, `node --version`
y scripts actuales antes de trabajar. Conservar cambios ajenos.

Las pruebas actuales, warnings y límites de la sesión están en el informe de
auditoría. Los resultados antiguos están fechados en los contratos/archivos;
no prueban que la suite actual completa haya pasado. Registrar el próximo ID
exacto tras cada entrega. Commit/push/deploy requieren autorización vigente.

Índice documental: [docs/README.md](docs/README.md).
Historial íntegro recuperable: [sesiones anteriores](docs/archive/CONTINUACION_HASTA_2026-10-02.md).
No volver a pegar ese historial en el snapshot; añadir sólo el estado vigente
y enlazar evidencia de sesión cuando sea necesaria.
