# Overdrive Asalto — ensayo de balance inicial

Este documento registra el diagnóstico y el ensayo implementado para hacer más
llevadero el inicio de Asalto sin rebajar su identidad de caos continuo. **Es
experimental y requiere validación humana en móvil; no es un balance aprobado.**
La única cola vigente está en [PLAN_DESARROLLO.md](../../PLAN_DESARROLLO.md);
este documento detalla su tarea de Asalto.

## Objetivo y límites

- Reducir el muro de enemigos resistentes al comienzo y evitar cadenas de
  pantallas de nivel que interrumpan la acción. El jugador reportó que la mezcla
  completa desde el inicio incluye enemigos difíciles con mucha XP y puede
  producir subidas consecutivas; todavía no hay mediciones de partidas.
- Conservar las bajas como motor de la cuota y de la experiencia: no conceder
  XP por esperar, moverse sin combatir o sobrevivir sin bajas.
- No modificar Overdrive Normal, los valores globales de enemigos ni la curva
  de progresión de campaña.
- Conservar la cuota de 100 bajas comunes por jefe y aumentar la vida por
  encuentro: ×0.25, ×0.5, ×1, ×2, ×3, ×4… No hay tope de diseño en ×5. Las
  entidades ya vivas conservan la vida con que aparecieron. El runtime conserva
  un límite técnico de seguridad.
- No añadir datos persistentes de telemetría ni servicios externos. La lectura
  temporal de balance debe estar disponible en el navegador de Pages.

## Diagnóstico del código actual

Verificado en `OverdriveAssaultDirector`, `OverdriveAssaultDefinitions`,
`EnemyDefinitions`, `CombatSimulation`, `LevelProgression` y `Game`:

1. El director elige con semilla entre los doce enemigos comunes de los tres
   actos desde el primer spawn. No hay fase de introducción ni pesos por
   dificultad; las selecciones del roster son uniformes por aparición.
2. Antes de este ensayo Asalto comenzaba en ×1. El jugador reportó que la mezcla
   completa incluye enemigos difíciles con recompensa alta de XP; aún no hay
   telemetría que cuantifique cuánto aporta cada causa.
3. La cadencia vigente usa una base de `0.90 ×` el intervalo radial y, con el
   campo vacío, reduce como máximo otro 10% el intervalo de esa base hasta que
   haya ocho enemigos comunes. La versión anterior llegaba a `0.12 s`; en
   partida el jugador reportó que esa presión se sentía excesiva.
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
   140, 176, 216, 260, 308, 360, 416, 476...`. Sin el ajuste, 475 XP antes del
   primer boss producirían 13 subidas desde nivel 1; en el ensayo, la expectativa
   uniforme sería 237.5 XP por cuota antes de bonos. La carta de XP puede elevar
   esa cifra.
7. `LevelProgression` conserva todas las subidas pendientes. Tras elegir una
   carta, `Game` vuelve a abrir la selección inmediatamente si queda otra
   pendiente; no se pierde XP, pero puede no haber combate entre varias pausas.
8. La vida escalada no multiplica la XP. En este ensayo, la XP común se reduce a
   la mitad hasta vencer el primer boss y luego vuelve al valor normal; no sube
   automáticamente junto con los tiers de vida posteriores.

## Ensayo implementado (sólo Overdrive Asalto)

- Se conserva la mezcla uniforme de los doce enemigos, los ataques de boss y
  la cuota de 100 bajas comunes por encuentro.
- La cadencia usa un intervalo base `0.90 ×` radial. Con cero enemigos comunes
  vivos, el intervalo se reduce como máximo otro 10% frente a esa base, y
  vuelve linealmente a la base al llegar a ocho enemigos comunes. El piso
  compartido es `0.20 s`. Bosses y réplicas no cuentan para densidad; los hijos
  del Splitter sí. El conteo usa el pool existente sin crear arrays y se
  actualiza tras cada aparición exitosa. El acumulador se acota a un intervalo
  más el tick actual para evitar ráfagas instantáneas al limpiar una arena
  saturada. Las reservas de bosses, límites por familia y capacidad global se
  conservan. Sin efecto del piso, el intervalo mínimo es `0.81 ×` radial (hasta
  unas 23.5% más de spawns que Radial), frente al ritmo extremo previo.
- En cada encuentro, enemigos y boss usan la secuencia de vida `×0.25`, `×0.5`,
  `×1`, `×2`, `×3`, `×4`… El tier avanza al derrotar al boss. Cada 100 bajas
  comunes habilitan el siguiente encuentro; no hay un tope de diseño en `×5`.
  Sólo aplica el límite técnico global de seguridad numérica.
- Enemigos ya vivos mantienen la vida con la que aparecieron. El nuevo tier
  afecta futuros spawns y el siguiente boss.
- Hasta derrotar al primer boss, la XP de enemigos comunes se multiplica por
  `0.5`; se mantiene el bono de XP de la run y la XP de boss no cambia. Después
  del primer boss, las bajas comunes vuelven a dar XP normal. La XP se calcula
  al derrotar al enemigo.
- No se alteran campaña, Overdrive Normal, definiciones globales de enemigos,
  ataques de bosses ni regla de cuota.

### Oleadas caóticas — retiradas tras prueba humana

La primera propuesta añadía un grupo homogéneo y una pausa breve al spawn
normal. El jugador reportó en partida que la presión resultante era excesiva;
se retiraron los incidentes completos, incluidos telegraph, grupos extra y
supresión temporal del flujo normal. Asalto vuelve a generar enemigos sólo por
su roster normal, la cuota de bajas del boss permanece independiente y no hay
bonos de oleada.

En la misma iteración se moderó la adaptación de cadencia: el intervalo base
pasó de `0.75 ×` a `0.90 ×` Radial y el campo despejado sólo reduce el intervalo
otro 10% como máximo, regresando a la base con ocho enemigos comunes vivos.
Es un valor provisional para volver a probar, no un balance aprobado.

Con el promedio teórico de `4.75 XP` por baja, el factor `0.5` equivaldría a
`237.5 XP` para las primeras 100 bajas, antes de bonos. Es una referencia
matemática, no una medición: los enemigos tienen distinto tiempo de eliminación
y la mezcla de bajas reales puede diferir.

## Arena variable de Asalto

La arena reutiliza las siete formas existentes. El ciclo es círculo → hexágono
→ cuadrado → rombo → rectángulo horizontal → octágono → rectángulo vertical
→ círculo, y se repite indefinidamente con una lista fija de siete transiciones.
Cada transformación concluye a los 45 s de la anterior: 2 s de contorno de aviso
y 1.25 s de morph. La primera advertencia comienza a los 41.75 s. El reloj de
arena se detiene con la simulación al pausar o elegir cartas; ningún encuentro
de boss ni su cola bloquea el ciclo y no se reinicia la run para cambiar de forma.

En Asalto, los bosses reciben el borde interpolado de la arena. Se conserva
un margen de 24 unidades además del radio del casco. Orbital conserva sus tres
patrones: la carga se acorta al llegar a una pared manteniendo su dirección,
la curva se adapta al radio disponible en cada ángulo, y las réplicas aparecen
y permanecen dentro del borde con margen de 30 unidades o su radio si es mayor.
Los avisos de curva/carga y de réplicas usan esas mismas coordenadas.
Los callers de campaña y Overdrive Normal conservan su contrato circular actual.

Validar formas y reinicio, límites de casco/réplicas en todas las formas y durante
un morph, correspondencia de avisos y movimientos, y cambios con boss activo o
en cola. La presión añadida necesita aprobación en partida y móvil físico.

## Prueba humana pendiente

Comparar baseline y ensayo en el mismo teléfono, navegador, calidad,
equipamiento y nivel del Laboratorio; registrar commit y semilla cuando esté
disponible. Observar segundos y bajas hasta la primera carta y el primer boss,
XP/cartas al boss, separación entre elecciones, pico de niveles pendientes,
familias derrotadas/acumuladas, muertes y saturación de arena. Separar datos
observados de expectativas.

Confirmar que el inicio se siente más accesible, sin quitarle identidad al
primer boss; que no se encadenen pausas de nivel de forma molesta y que el
escalado posterior permita seguir jugando un tiempo. No fijar por adelantado un
número de elecciones como criterio. Si se requiere otra iteración, cambiar un
solo parámetro y no descartar XP ni elecciones ganadas.

En la nueva prueba, confirmar que no se inyectan oleadas ni aparece una pausa o
aviso de evento; observar si el flujo común y la cadencia moderada reducen la
saturación, sobre todo cuando el campo queda despejado, sin volver demasiado
tranquilos los encuentros con boss.

## Validación y aceptación

Pruebas deterministas sin Pixi:

- selección determinista del roster y acceso a las doce familias;
- cadencia continua, máximo 10% de reducción adicional del intervalo con el
  campo vacío, retorno al baseline con ocho enemigos, piso compartido de 0.20 s
  y ausencia de ráfagas por tiempo acumulado;
  bosses y réplicas excluidos del conteo, pools y reservas conservados;
- mismo conteo de bajas elegibles y el primer jefe en 100; bosses y réplicas no
  cuentan, los hijos destructibles del Splitter sí;
- secuencia `×0.25→×0.5→×1→×2→×3…` sin tope authored de ×5 y aplicada al
  siguiente boss/spawns tras derrotar un boss;
- XP común `×0.5` hasta vencer el primer boss, luego `×1`; XP de boss intacta,
  bono de XP compatible y sin cambios en Normal/campaña;
- umbrales cruzados, XP fraccionaria acumulada y colas pendientes no pierden
  subidas;
- después de cada boss, siguiente boss/spawns usan el tier posterior y la vida
  de entidades vivas sigue constante.
- no existe sistema de incidente, telegraph, supresión del spawn ni grupo
  añadido; la cuota del boss sigue dependiendo sólo de bajas comunes normales.

Comparación humana en móvil, con baseline y ensayo bajo condiciones comparables:

- tiempo/bajas hasta la primera carta y hasta el primer jefe;
- cartas elegidas y XP al momento del primer jefe;
- separación entre cartas y cantidad de veces que el juego fuerza selecciones
  consecutivas sin una ventana perceptible de combate;
- cantidad de enemigos avanzados acumulados, bajas por familia, muertes del
  jugador y saturación visible de la arena;
- repetir la observación en tiers posteriores para comprobar que el escalado
  deja avanzar por cada cuota sin volver imposible la partida demasiado pronto.

No hay un objetivo previo de cantidad de elecciones. Comparar también con
Overdrive Normal bajo el mismo Laboratorio; el ensayo requiere revisión humana
en móvil. La cuota sigue en 100 y Normal debe quedar idéntico. Ajustar un solo
parámetro por iteración para identificar qué resolvió o empeoró el problema.

Al retomarlo en casa, continuar desde la sección D de `PLAN_DESARROLLO.md` y
usar este documento como referencia de diagnóstico, hipótesis y aceptación; no
crear otra cola de tareas. No presentar CI verde como prueba de balance.
