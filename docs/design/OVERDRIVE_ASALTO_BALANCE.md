# Overdrive Asalto — plan de balance inicial

Este documento registra el diagnóstico y la propuesta para hacer más llevadero
el inicio de Asalto sin rebajar su identidad de caos continuo. **Es un plan de
trabajo, no un balance ya aprobado ni implementado.** La única cola de tareas
vigente está en [PLAN_DESARROLLO.md](../../PLAN_DESARROLLO.md); este documento
detalla su tarea de Asalto.

## Objetivo y límites

- Reducir el muro de enemigos resistentes al comienzo y evitar cadenas de
  pantallas de nivel que interrumpan la acción.
- Conservar las bajas como motor de la cuota y de la experiencia: no conceder
  XP por esperar, moverse sin combatir o sobrevivir sin bajas.
- No modificar Overdrive Normal, los valores globales de enemigos ni la curva
  de progresión de campaña.
- Conservar la cuota de arranque de 100 bajas comunes por jefe, la vida ×1 del
  primer encuentro y la subida de vida de spawns posteriores ×2, ×3, ×4 y ×5.
  Este plan no cambia la vida de entidades que ya están vivas ni pausa las
  oleadas durante un jefe.
- No añadir datos persistentes de telemetría ni servicios externos. La lectura
  temporal de balance debe estar disponible en el navegador de Pages.

## Diagnóstico del código actual

Verificado en `OverdriveAssaultDirector`, `OverdriveAssaultDefinitions`,
`EnemyDefinitions`, `CombatSimulation`, `LevelProgression` y `Game`:

1. El director elige con semilla entre los doce enemigos comunes de los tres
   actos desde el primer spawn. No hay fase de introducción ni pesos por
   dificultad; las selecciones del roster son uniformes por aparición.
2. Asalto ya comienza en multiplicador de vida ×1. El muro pre-jefe, por tanto,
   procede de la composición de enemigos y el ritmo inicial, no del escalado
   ×2 del primer jefe.
3. El intervalo de spawn empieza en `0.75 ×` el intervalo radial (un 25 % menos
   de intervalo, aproximadamente un 33 % más de apariciones por minuto), sujeto
   al piso compartido de `0.20 s`.
4. Las definiciones de los enemigos dan de 1 a 8 XP. Ejemplos de vida base
   efectiva en los actos que usan el multiplicador `1.2`: Chaser ≈37.4 HP / 1
   XP, Elite 158.4 HP / 8 XP, Thorn Bastion 148 HP / 8 XP y Rift Miner 92 HP /
   7 XP. Hay mucha variación en tiempo de eliminación y XP por baja.
5. Si cada tipo de spawn contribuyera por igual a las bajas, el promedio sería
   `57 / 12 = 4.75 XP` por baja: unas 475 XP por las 100 bajas comunes del
   primer jefe, antes de mejoras de XP. Es una **expectativa matemática de la
   mezcla de spawns**, no una medición de kills reales: los enemigos resistentes
   pueden acumularse y cambiar la mezcla que el jugador consigue derrotar.
   Derrotar un jefe concede además la XP definida para boss (40 base), aunque
   no sume a la cuota de bajas comunes.
6. La curva global actual cruza umbrales acumulados de `8, 20, 36, 56, 80, 108,
   140, 176, 216, 260, 308, 360, 416, 476...`. Si se alcanzan 475 XP antes del
   primer jefe, se llega al nivel 14 y se acumulan 13 subidas desde nivel 1.
   La carta de ganar experiencia puede elevar todavía más la cifra.
7. `LevelProgression` conserva todas las subidas pendientes. Tras elegir una
   carta, `Game` vuelve a abrir la selección inmediatamente si queda otra
   pendiente; no se pierde XP, pero puede no haber combate entre varias pausas.
8. El HP multiplicado de Asalto no multiplica por sí mismo la XP por baja. Esta
   diferencia también debe observarse después de los tiers ×2–×5: aumentar XP
   automáticamente en la misma proporción que el HP no está aprobado y podría
   volver a acelerar demasiado los niveles.

## Propuesta de ajuste, en orden

### 1. Medir el ritmo real sin depender de consola

Antes de cerrar valores, la pantalla temporal de diagnóstico debe poder mostrar
en teléfono: segundos y bajas hasta la primera carta; elecciones acumuladas y
XP hasta el primer jefe; tiempo entre las primeras cartas; pico de
`pendingLevelUps`; bajas por familia; tier de vida y calidad gráfica. No guardar
estos datos en el perfil ni liquidar récords/recompensas en la ruta diagnóstica.

Capturar primero partidas del build actual. Usar el mismo teléfono, navegador,
calidad, equipamiento y nivel del Laboratorio para cada comparación. Registrar
el commit y distinguir dato visto en Pages de expectativa calculada aquí.

### 2. Suavizar composición y cadencia de la apertura

Probar una rampa guiada por el progreso de la cuota actual, no sólo por reloj:

- `0–25` bajas: privilegiar familias de menor tiempo de eliminación y limitar
  la frecuencia de los anclajes de mucha vida; conservar alguna variedad
  avanzada para que Asalto no parezca una oleada tutorial.
- `26–60` bajas: aumentar gradualmente el peso de amenazas medias y avanzadas.
- `61–100` bajas: llegar a la mezcla completa; mantenerla durante los jefes y
  después de ellos.

Los cortes son una hipótesis inicial. Clasificar por tiempo de eliminación y
amenaza observados, no sólo por el nombre del acto. No apilar varios enemigos
de alto tiempo de eliminación al principio. Probar además si la cadencia puede
arrancar en `1.0 ×` la radial y alcanzar `0.75 ×` hacia la mitad/final de la
cuota. Mantener el mismo piso, pools y regla de no acumular ráfagas. La rampa no
debe impedir que el jugador alcance el jefe de forma natural.

### 3. Dar a Asalto una pauta de XP propia

No tocar `LevelProgression` global ni las recompensas de enemigos de campaña.
Introducir, si los datos confirman el exceso, un perfil exclusivamente de
Asalto que ajuste la XP efectiva antes de sincronizar el progreso; la carta de
XP sigue funcionando como bono dentro de ese perfil.

**Ensayo inicial, no valor final:** probar un factor de XP Asalto de `0.35`, y
`0.40` si la primera carta llega demasiado tarde. Con la mezcla uniforme
actual, 475 XP esperadas se convertirían en unas 166–190 XP, aproximadamente
7–8 subidas en la curva existente antes de contar variación del roster y
bonos elegidos. La distribución de apertura propuesta cambiará el promedio,
así que recalcular con las bajas observadas; no dar por balanceado el factor
sólo por esta multiplicación.

La primera carta debe seguir llegando a tiempo para ayudar a estabilizar la
apertura. Si un factor escalar retrasa demasiado esa primera elección pero aún
produce cadenas más adelante, evaluar una curva de XP específica de Asalto que
mantenga la primera meta cerca de la actual y abra gradualmente los intervalos
posteriores. No compensar suprimiendo niveles ni descartando XP pendiente.

Si, después de calibrar la XP, todavía se producen varias aperturas
consecutivas de cartas por bajas agrupadas (por ejemplo, hijos del Splitter),
considerar una presentación continua de las elecciones pendientes. Debe
preservar una recompensa por cada nivel y no reanudar/pausar varias veces por
animaciones intermedias; no reducir la cantidad de elecciones ganadas.

## Validación y aceptación

Pruebas deterministas sin Pixi:

- selección del roster por semilla en cada banda de cuota, límites de bandas y
  acceso a las doce familias antes de cerrar una cuota;
- mismo conteo de bajas elegibles y el primer jefe en 100; bosses y réplicas no
  cuentan, los hijos destructibles del Splitter sí;
- el factor/perfil de XP afecta Asalto únicamente, incluye sus fuentes reales
  de XP, funciona junto con la carta de XP y no cambia Normal/campaña;
- umbrales cruzados, XP fraccionaria acumulada y colas pendientes no pierden
  subidas;
- después de cada jefe, sólo los spawns posteriores reciben el nuevo ×2–×5;
  la vida de entidades vivas sigue constante.

Comparación humana en móvil, primero con el baseline actual y luego con el
candidato, en tres o más runs comparables:

- tiempo/bajas hasta la primera carta y hasta el primer jefe;
- cartas elegidas y XP al momento del primer jefe;
- separación entre cartas y cantidad de veces que el juego fuerza selecciones
  consecutivas sin una ventana perceptible de combate;
- cantidad de enemigos avanzados acumulados, bajas por familia, muertes del
  jugador y saturación visible de la arena;
- repetir la observación después del primer jefe en ×2 y ×3 para detectar si la
  vida escalada vuelve demasiado lento el avance por tiempo.

Objetivo piloto: alrededor de 7–8 elecciones antes del primer jefe, con la
primera carta suficientemente temprana y sin cadenas de pausas. Comparar
también con Overdrive Normal bajo el mismo Laboratorio; este objetivo no se
considera aprobado hasta ver las capturas/datos reales. El tiempo del jefe no
debe cambiar de forma perjudicial, la cuota sigue siendo de 100 y Normal debe
quedar idéntico. Ajustar un solo parámetro por iteración para identificar qué
resolvió o empeoró el problema.

Al retomarlo en casa, continuar desde la sección D de `PLAN_DESARROLLO.md` y
usar este documento como referencia de diagnóstico, hipótesis y aceptación; no
crear otra cola de tareas. No presentar CI verde como prueba de balance.
