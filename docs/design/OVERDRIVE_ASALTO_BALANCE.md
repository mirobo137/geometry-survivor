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
  entidades ya vivas conservan la vida con que aparecieron y las oleadas no se
  pausan durante un jefe. El runtime conserva un límite técnico de seguridad.
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

- Se conserva la mezcla uniforme de los doce enemigos, la cadencia `0.75 ×`
  radial, los ataques de boss y la cuota de 100 bajas comunes por encuentro.
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
  cadencia, ataques de bosses ni regla de cuota.

Con el promedio teórico de `4.75 XP` por baja, el factor `0.5` equivaldría a
`237.5 XP` para las primeras 100 bajas, antes de bonos. Es una referencia
matemática, no una medición: los enemigos tienen distinto tiempo de eliminación
y la mezcla de bajas reales puede diferir.

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

## Validación y aceptación

Pruebas deterministas sin Pixi:

- selección determinista del roster y acceso a las doce familias;
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
