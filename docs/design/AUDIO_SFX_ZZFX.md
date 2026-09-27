# Dirección sonora — ZzFX premium

Contrato vigente: revisión del 26-09-2026. Howler conserva exclusivamente la
música; todos los efectos aquí descritos se generan con ZzFXMicro 1.3.2
(MIT, aviso en `public/third-party-licenses/zzfx.txt`).

## Identidad y criterio de aceptación

Cada sonido debe comunicar **qué ocurre y cuándo**. El aviso anuncia; el
ataque empieza cuando la simulación entra en su fase activa. No basta con un
beep durante el telegraph y silencio durante un láser visible.

Paleta: impactos mecánicos breves, energía tonal con cuerpo y aire contenido.
Armas del jugador: ataques claros y resonancias consonantes; amenazas:
intervalos tensos, barridos descendentes y pulsación sostenida. El pulso amigo
tiene golpe expansivo limpio; el anillo hostil desciende con textura áspera.
UI: confirmaciones suaves y cortas; no usar los timbres de peligro.

ZzFX sintetiza recetas, no es una colección de grabaciones. Usar sus 21
parámetros reales. En 1.3.2 **filtro negativo = low-pass; positivo = high-pass**.
El filtrado positivo de las recetas anteriores eliminaba gran parte del cuerpo
tonal. El autor actual usa controles con nombre (`hz`, `hold`, `release`,
`lowpass`, `highpass`) que se traducen al tuple canónico.

## Construir un efecto nuevo

1. Definir el evento de simulación observable y las fases que necesita.
   Verificar el ataque real; no inferir daño desde partículas o temporizadores
   de pared. Si el enemigo no llega a atacar, no reproducir una descarga.
2. Diseñar hasta **tres capas**: cuerpo tonal, transitorio de impacto/aire y,
   sólo si aporta identidad, una resonancia retrasada entre 20 y 150 ms.
   Los helpers `tone`, `body`, `air` y `layer` viven en
   `src/content/audio/AudioCueDefinitions.ts`.
3. El cuerpo debe leerse en altavoz móvil (aproximadamente 130–800 Hz más
   armónicos); no depender sólo del subgrave. Reservar ruido y frecuencias
   agudas para acentos breves. Evitar paredes de ruido en disparos frecuentes.
4. Mantener las recetas actuales por debajo de 0,95 segundos; las más
   frecuentes son mucho más cortas. No alargar colas ni subir volumen para
   intentar que un efecto se perciba como mejor.
5. Asignar categoría, prioridad y cooldown. Los avisos estables no varían pitch;
   impactos/disparos permiten variación discreta de hasta ±2,5%.
6. Integrar fase de inicio/fin o secuencia en `AttackAudioFeedback`. Escoger
   explícitamente el campo de fase por tipo de enemigo: todos los campos del
   pool existen y los de otras familias suelen contener `inactive`.
7. Probarlo aislado, en la secuencia completa y mezclado con armas/impactos.
   Debe reconocerse también con Low, sin depender de calidad gráfica.
8. Actualizar la matriz y comprobar pausa, mute, volumen, reinicio y fase
   cancelada. Un fragmento o réplica debe sonar al aparecer, no en cada tick.

Ejemplo de composición existente: el láser combina cuerpo de 150 Hz, caída
tonal desde 1760 Hz y un acento de aire. Su aviso ascendente prepara el ataque;
el cuerpo pulsante durante el barrido comunica que sigue activo.

## Recetas de armas sci-fi: investigación y heurísticas

La investigación externa confirma que no existe una receta universal para
“láser”: el sonido debe comunicar el material/arma y su función. Se toma como
guía práctica, no como ley acústica, esta traducción al sistema de capas del
proyecto:

- **Disparo instantáneo:** transitorio corto al inicio + cuerpo tonal breve +
  caída de pitch durante la cola. El ataque y la caída ayudan a que se lea como
  un disparo energético, en vez de un tono sostenido genérico.
- **Rayo continuo:** separar carga, encendido, cuerpo mientras el rayo está
  activo y release. El cuerpo sostenido debe existir sólo durante la fase real
  del ataque; no convertir cada tick en una nueva descarga completa.
- **Identidad de armas:** conservar un cuerpo medio/grave audible en móvil y
  variar forma de onda, contorno de pitch, ritmo y acento agudo para distinguir
  rail, ráfaga, cadena, órbita y anillo. No subir agudos ni volumen como
  sustituto de identidad.
- **Capas:** empezar con transitorio, después cuerpo y añadir una cola/acento
  sólo si aporta lectura. Aquí se premixan en un buffer y se conserva el máximo
  de tres capas para no consumir voces extra.

Fuentes consultadas:

- [Editor/referencia oficial de ZzFX](https://github.com/KilledByAPixel/ZzFX/blob/master/index.html):
  controles de frecuencia, forma, envolvente, slide, pitch jump, repetición,
  modulación y visualización de onda; guía para usar parámetros que ZzFX ofrece
  realmente.
- [David Dumais Audio — How to Create Laser Gun Sound Effect Layers](https://www.daviddumaisaudio.com/how-to-create-laser-gun-sound-effect-layers/):
  parte del transitorio de impacto y modela la caída de pitch de la cola para
  lograr la lectura característica de disparo láser.
- [Easel — Energy Beam sound](https://easel.games/docs/learn/sounds/esfx/laser):
  ejemplo de envolvente sostenida mientras un beam permanece activo; útil para
  separar carga/ataque/cuerpo/final en el láser del juego.
- [r/sounddesign — consejos para sonidos de armas sci-fi](https://www.reddit.com/r/sounddesign/comments/1wocqyh/what_makes_a_good_sci_weapon_sound_guns/)
  y [r/Unity3D — capas para armas sci-fi](https://www.reddit.com/r/Unity3D/comments/g2gzdb):
  experiencias de comunidad que sugieren experimentar con caída rápida de
  pitch y contraste entre brillo agudo y golpe grave. Son heurísticas
  subjetivas, no especificaciones ni recetas para copiar literalmente.

## Cobertura

| Sistema | Comportamiento sonoro |
| --- | --- |
| Proyectil | Disparo base, Rail Lance y Pulse Volley con firmas distintas |
| Impactos | Impacto común, crítico, ruptura de enemigo, daño y escudo del player |
| Órbita / cadena | Contacto común, pulso orbital, descarga eléctrica y explosión Thunderhead |
| Búmeran | Lanzamiento, giro de retorno y pulso de retorno |
| Pulse Ring | Golpe en fase activa; Echo tiene regreso descendente; Compression suena en cada uno de sus tres frentes |
| Magnetic Charge | Lanzamiento, captura pulsante y detonación/colapso separados; Event Horizon mantiene captura y no inventa explosión final |
| Láser arena / boss / Prism | Carga, encendido, cuerpo sostenido durante actividad y caída al terminar el último haz |
| Arena | Avisos, anillos hostiles, corte angular y transformación |
| Enemigos | Embestidas Charger/Orbiter/Zigzag, púas, disparos reales de batería, armado y explosión de minas |
| Réplicas / splitter | Aparición agrupada, una vez por entidad del pool |
| Bosses | Entrada, aviso, ataques según su familia y derrota; admite las dos instancias |
| UI / progresión | Click, seleccionar, confirmar, volver, ajustes, compras, premios, nivel y entradas |

Los cuerpos de láser se agregan entre todos los emisores: varios haces no
multiplican el zumbido. Son granos finitos de ~0,2 s solicitados cada 0,16 s
mientras el estado está activo. No hay loops huérfanos; al terminar puede
quedar la cola corta del último grano. La captura magnética usa granos cada
0,26 s. Sus relojes sólo avanzan con la simulación.

## Arquitectura, mezcla y coste

- `ZzfxSynth.ts`: núcleo ZzFX puro y composición offline. Todas las capas se
  suman a **un AudioBuffer por cue**: un sonido compuesto ocupa una voz.
- `ZzfxSfxBackend.ts`: contexto ya desbloqueado, caché, límite y compresión.
  Precalienta un cue por oportunidad idle del menú/intro cuando el navegador
  ofrece `requestIdleCallback`; sin esa API genera al primer uso. Cancela el
  precalentamiento al destruirse. No descarga audio ni añade dependencias.
- `AttackAudioFeedback.ts`: observa snapshots existentes; coalesce sucesos del
  mismo tick, conserva identidad de entidades y resetea al cambiar de run/tramo.
  La simulación no importa audio.
- Ocho voces físicas máximo. Detalles/armas ocupan hasta seis; las amenazas
  pueden usar las plazas restantes. A saturación, una prioridad superior puede
  sustituir una voz de prioridad inferior. No sustituir señales de igual prioridad.
- Prioridad 0: detalles; 1: armas; 2: ataques/UI; 3: avisos principales,
  daño al player y grandes eventos. Cooldowns persisten si un sonido fue
  reproducido, no si su fuente falló al arrancar.
- Cada buffer se atenúa si excede pico 0,72 y tiene extremos suavizados.
  Un compresor sólo del bus SFX (umbral −9 dB, ratio 6, ataque 3 ms) controla
  superposiciones. No comprimir ni modificar la música.
- Pausa/background/anuncio detiene y desconecta las voces de combate; UI puede
  sonar en pausa. No se reproducen efectos acumulados al volver.
- UI y combate respetan el control persistente SFX y mute existentes.
- No se añade sonido a cada partícula ni un pickup XP inexistente.

## Audición reproducible

Con Vite local:
`http://127.0.0.1:5173/docs/audio/sound-lab.html`.

Incluye 48 efectos individuales y secuencias de láser, Echo, Compression,
Polar, embestida y combate bajo presión. Volumen inicial 60%; no inicia música.
Es una herramienta de desarrollo: no forma parte del menú ni del build Pages.

Para comprobar integración real:
`http://127.0.0.1:5173/?boss=1&debug=1&quality=low`.
Hacer un gesto sobre el canvas para desbloquear Web Audio. Probar también la
partida normal, las evoluciones y la pausa.

## Evidencia y pendientes — 26-09-2026

- Typecheck aprobado; suite completa 482/482. Se añadieron después dos casos
  extra de regresión; la suite de audio final pasó 17/17.
- Síntesis de las 48 recetas a 44.100 y 48.000 Hz: muestras finitas, señal no
  silenciosa, picos acotados, extremos suavizados y duración presupuestada.
- Pruebas de voces reservadas, expulsión por prioridad, caché, fallo de source,
  pausa/UI, limpieza, fases de enemigos/bosses, retorno de Echo, ráfagas de
  Compression, doble detonación Polar y minas que no explotan al limpiarse.
- Chromium local, desktop y viewport móvil: secuencia de presión con 53
  reproducciones audibles, máximo cinco simultáneas, cero restantes al parar
  y sin excepciones. En partida de boss se observaron encendido, sostenido,
  liberación y anillo hostil desde el flujo real.
- Caché PCM completa a 48 kHz: 2.299.388 bytes. Síntesis local de todas las
  recetas: ~172 ms total y ~10,8 ms máximo individual en esa muestra de PC.
  Es coste de preparación, no coste por reproducción ni una medición de FPS.
- Mezcla offline en Chromium de ocho cues fuertes simultáneos: pico 0,814
  y cero muestras saturadas. Es ese escenario concreto, no una garantía de
  volumen subjetivo o de cualquier futura receta.
- Pendiente: aprobación auditiva del usuario, altavoz/auriculares en móvil
  físico, fatiga tras partida larga y rendimiento de preparación en móvil.

## Entrega para Luna y siguientes iteraciones

La implementación está terminada; no hay código parcial pendiente. Antes de
retocar, leer este contrato y la entrada más reciente de CONTINUACION.md.
No rehacer el sintetizador ni duplicar señales en Game.

1. Pedir/leer el feedback auditivo del usuario: efecto concreto, dispositivo,
   volumen SFX y si falla aislado o sólo al mezclarlo en partida.
2. Reproducir primero en sound-lab y después en la ruta real del juego.
   Para láser verificar carga → encendido → sostenido → caída, incluidos
   Prism/boss y pausa a mitad del barrido.
3. Si la identidad sonora no convence, ajustar únicamente la receta en
   AudioCueDefinitions.ts: frecuencia, envolvente, capa o nivel. Mantener
   como máximo tres capas premixadas, una voz y los presupuestos vigentes.
4. Si falta un sonido, comprobar la fase real en AttackAudioFeedback.ts.
   No usar temporizadores de pared ni disparar por cada enemigo cada frame.
   Las minas retiradas por limpieza no deben sonar como explosiones.
5. Si desaparece bajo carga, revisar prioridad/cooldown antes de subir volumen.
   No aumentar el límite global de ocho voces. Howler sigue sólo para música.
6. Ejecutar typecheck y los tests de src/audio; para lifecycle/menú, los smokes
   de pausa/ajustes y entrada móvil. Una nueva fase requiere una regresión que
   demuestre que se oye al activarse y no se repite indebidamente.
7. Registrar por separado validación automática y aprobación auditiva humana.
   No declarar medido el rendimiento móvil con Chromium emulado.

Estado de publicación: esta revisión aún no tiene commit/push. El usuario
debe pedir su publicación cuando quiera probarla en Pages; el laboratorio de
audición se usa localmente con Vite.
