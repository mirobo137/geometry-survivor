# Flota enemiga — arte militar de una imagen

Rediseño autorizado el 04-10-2026 tras aprobar el concepto de Tank.
Sustituye el primer lote derivado de los SVG: **13 enemigos y 3 bosses**
originales, amenazantes y con el acabado artístico de las skins.
Un cuerpo completo por nave, sin cambiar IDs, balance, ataques o muerte.
Las entradas particulares de bosses siguen pendientes.

## Identidad del catálogo

Cámara cenital ortográfica, frente `-Y`, ancla central y frame cuadrado.
Una textura compartida por familia; los detalles están pintados, no son
capas, filtros, shaders o geometría nueva durante la partida.

La comparación de masas fue conceptual, no tres renders por enemigo:
aguja para velocidad, bastión para resistencia y casco abierto/segmentado
para especialistas. Se rechazó repetir el mismo triángulo o anillo para todo.

| ID | Verbo y construcción elegida | Material / acento |
| --- | --- | --- |
| chaser | Perseguir: cazador compacto de alas en garras | Acero y rojo / naranja |
| fast | Alcanzar: aguja bifurcada, estabilizadores y motores longitudinales | Bronce / ámbar |
| tank | Resistir: acorazado de hombros anchos y reactor hundido | Titanio y metal oscuro / violeta |
| elite | Amenazar: cazador ancho de alas afiladas | Cerámica vino y metal oscuro / magenta |
| orbiter | Curvar: herradura abierta de alas largas | Acero y cobalto / azul |
| charger | Embestir: ariete reforzado con motores grandes | Cobre y acero quemado / ámbar |
| splitter | Dividir: dos cascos unidos por un puente | Acero e índigo / violeta |
| prism-weaver | Tejer: tres brazos emisores conectados | Teal y latón / turquesa |
| warden-replica | Escoltar: tridente corto de la familia Warden | Acero claro y navy / cian |
| fracture-gunner | Disparar: artillería en U con recámara central | Acero azul y cargadores de cobre / cian |
| thorn-bastion | Defender: blindaje radial dentado | Cobre oscuro y hierro / coral |
| zigzag-reaver | Cortar: casco asimétrico y motores escalonados | Oliva / amarillo |
| rift-miner | Sembrar: minador en H con depósitos y compuertas | Titanio y violeta / lavanda |
| core-sentinel | Custodiar: fortaleza radial de reactor protegido | Titanio y púrpura / cian |
| orbital-warden | Desplegar: portanaves de tres brazos y bahías de réplicas | Acero y latón / cian |
| fracture-engine | Asediar: máquina industrial de mandíbulas y hornos | Metal oscuro y titanio / coral |

Fracture Gunner dispara físicamente desde `(state.x,state.y)`.
El nuevo cañón está en el eje central, con abertura luminosa aproximadamente
en el centro del frame y un canal frontal vacío. Ya no se representa un
cañón lateral. El objetivo capturado, la orientación, daño, spread y cadencia
no cambian. La muerte mantiene la ruptura y descarga de reactor aprobadas.

## Generación y regeneración

[enemy-image-sources.json](../../../../scripts/enemy-image-sources.json)
registra prompts completos, originales, conceptos y tamaños. Quince cuerpos
nuevos se generaron con **imagegen integrado**, usando el Tank aprobado como
referencia de acabado, no SVG como molde de forma. Warden también toma su
nueva réplica como referencia de familia. Tank reutiliza el concepto aprobado;
su texto es un brief de regeneración, no una transcripción del primer prompt.
Originales: PNG 1254×1254 con alpha, conservados en la carpeta de generación.

Los **16 PNG maestros de inspección y 16 WebP runtime** están versionados aquí.
El juego no referencia carpetas privadas. `scripts/prepare-enemy-art.py`
prefiere el original cuando existe y usa el PNG versionado en otro equipo.
Derivación mecánica con Pillow existente: Lanczos sobre el frame entero, sin
trim, recolor, pintar alpha ni añadir elementos. No instala dependencias runtime.

## Píxeles y tamaño de combate

- PNG de inspección: **128×128 / 224×224**, RGBA8, **621,078 bytes** en total.
  Se conservan como fuentes locales versionadas; no se importan en dist.
- Descarga: WebP **96×96 / 168×168**, calidad 55, método 6, alpha exacto.
  Total **85,586 bytes**. Cubre el DPR máximo actual de 1.5; se comprueba que
  su alpha decodificado coincida exactamente con el derivado sin compresión.
- Mundo: **64×64 / 112×112**. `Texture.from({resource,resolution})` normaliza
  la resolución a 1.5, también para las vistas de fragmentos. No agranda cascos,
  hitboxes o la separación al morir.
- Imports `?no-inline` evitan duplicar base64 en JS/source maps.
- RGBA8 runtime calculado: **817,920 bytes (~799 KiB)** para 16 fuentes, sin
  overhead, mipmaps ni fallbacks. No es una medición GPU ni promesa de FPS.
- Mismos sprites por enemigo y pools de muerte/FX, sin filtros nuevos.

Image/decode preceden a Texture.from. Error de red/decode o imagen no cuadrada
conserva el SVG de respaldo. Cache por familia y sesión; las vistas liberan
subtexturas con `destroy(false)`, nunca la fuente compartida.
Bosses conservan su entrada modular SVG y luego muestran el nuevo cuerpo.
El cambio visual entre entrada antigua y casco nuevo es un pendiente conocido:
este lote no rediseña entradas ni ventanas de ataque.

## Evidencia y revisión humana

Typecheck y **695 unitarias / 128 archivos** correctos. Seis tests nuevos cubren caché,
resolución fraccional, errores, entorno sin navegador y archivos/alpha.

`node scripts/qa-tank-defeat.mjs`: **96 casos con el arte runtime final**
(16 familias × PC High/Medium/Low, portrait High/Low y movimiento reducido).
La prueba exige imágenes cargadas, no el fallback; comprueba dimensiones,
fuentes compartidas, muerte, pausa, resize, saturación, 60 ciclos y limpieza.
Cero errores JS/HTTP. Capturas en test-results/tank-defeat.

Builds Local/Poki/CrazyGames: **14,997,754 / 10,073,008 / 10,073,014 bytes**.
Límite de 15 MB y mapas de desarrollo intactos. **Margen Local: 2,246 bytes**;
revisar presupuesto antes de otra ampliación. Warning previo JS >500 KB permanece.

Galería: `/docs/visual/tank-defeat.html?quality=high`. Selector de 16 familias,
ampliación/tamaño real, pausa y muerte; `&enemy=fracture-gunner` abre el artillero.
Pendientes: aprobación humana en batalla/móvil físico y entradas de bosses.
Sin commit, push o deploy; retención, Overdrive y Laboratorio no se modifican.
