# OD-F01 — Ritmo por puntos en Overdrive

**Estado:** propuesta futura; ninguna regla de este documento está implementada.
**Dependencia:** cerrar EX-02c (balance de enemigos, armas y Laboratorio) antes de fijar cuotas.
**Ámbito:** solamente Overdrive. Campaña y Overdrive actual conservan sus reglas.

## Propósito y decisión de producto

Ofrecer en el selector de Overdrive dos ritmos: **Normal** (actual, opción por
defecto) y **Asalto** (opcional). Asalto permite que una build avanzada alcance
antes al boss si derrota enemigos con rapidez, pero debe llegar con una cantidad
de bajas y experiencia comparable a la que obtiene en Normal. Elegir el ritmo
al iniciar la run; mantenerlo durante todos los tramos. No exigir una compra ni
un nuevo desbloqueo además del acceso vigente a Overdrive. El poder permanente
del Laboratorio acelera al jugador por su efecto real en combate; no altera la
cuota de puntos de la etapa.

Hoy el boss entra por tiempo de tramo (260 s en I/II, 250 s en III), mientras
los spawns siguen intervalos por fase. La puntuación terminal actual equivale a
`kills`, e incluye bosses. Asalto añadirá **puntos de avance por tramo** sin
cambiar esa puntuación global, la XP ni la fórmula de NOVA por el mero hecho de
contar progreso. El objetivo no es acelerar el juego reproduciéndolo a más FPS
ni reducir el tiempo de reacción de los ataques.

## Regla de avance

- Una baja de enemigo normal procedente de la oleada vale **1 punto**. Los
  hijos del Splitter cuentan: son enemigos destructibles, dan XP y ya suman
  una baja en la puntuación actual. Bosses, réplicas del Warden, spawns de
  depuración y entidades retiradas en una transición no suman puntos.
- `puntosTramo` empieza en cero al entrar a cada tramo y deja de avanzar cuando
  se alcanza la cuota. `stats.kills` y el score terminal siguen acumulándose
  durante toda la run; nunca derivar `puntosTramo` restando totales al final.
- El boss queda **listo** cuando `puntosTramo >= cuotaTramo`. El tiempo de
  supervivencia no concede puntos ni activa el boss. Con cero bajas, el boss
  no aparece aunque pase la antigua marca de 4:20/4:10.
- Al alcanzar la cuota, bloquear la decisión una sola vez. Detener nuevos
  spawns normales durante la preparación, terminar avisos/ataques de arena ya
  iniciados y completar la transición de forma hasta el círculo seguro del
  boss. Entonces iniciar el encuentro con su intro/portal actual. Durante el
  encuentro, volver a la cadencia normal del tramo y a la política vigente de
  hazards del boss. La transición entre tramos, curación, build y encuentros
  dobles siguen el contrato de `PLAN_INFINITO.md`.
- No simular la llegada del boss adelantando `stageElapsedSeconds` a 250/260:
  ese reloj también gobierna arena, peligros y enemigos. Dar a `BossSystem` una
  señal explícita de encuentro listo sólo en Asalto; campaña y Normal conservan
  el disparador de tiempo existente.

Si un jugador no logra la cuota, los enemigos siguen entrando dentro de los
presupuestos actuales y puede usar **Retirarse y cobrar**. No añadir un tiempo
máximo que entregue el boss por esperar. Un watchdog debe detectar un fallo
real del spawner (ningún enemigo accesible durante un periodo prolongado) y
recuperar la población sin regalar puntos.

## Cómo se fija la cuota

**No asignar ahora un número de bajas.** Los reportes históricos del Acto I y
la NOVA final no miden las bajas en la entrada de cada boss de Overdrive con el
balance/Laboratorio definitivos. Primero registrar, en el perfil Normal, una
instantánea al iniciar cada intro: tramo, vuelta, semilla, bajas normales desde
su entrada, bajas totales, XP, nivel, vida, enemigos activos, tiempo real,
calidad y configuración de Laboratorio. Conservar agregados por tramo; no crear
un historial sin límite por enemigo. Una muestra corta de runs humanas y rutas
de depuración con semillas reproducibles basta para la primera calibración; los
atajos no son evidencia de tiempo humano ni otorgan progreso persistente.

Para un tramo con datos comparables:

```text
cuotaTramo = mediana(redondeada de bajas normales al comenzar el boss en Normal)
```

La cuota es fija para ese tramo y versión de balance; no crece con el nivel
del Laboratorio equipado, el tiempo sobrevivido ni la velocidad de la build.
Comparar también el **promedio** de bajas de ambos ritmos: la mediana evita
que una run extrema dicte la cuota inicial, pero el promedio debe terminar
siendo comparable, como pide el objetivo jugable.
Publicar las cuotas en datos de contenido versionados, no dispersas en el
engine. Medir por separado I/II/III, tramos 4–9 y al menos 10/13 para la mezcla
posterior. Para prototipos de tramos sin muestra puede usarse provisionalmente
la mediana de su familia principal multiplicada por el factor de presión de
la vuelta; desde el tramo 10, la mediana de la mezcla del tramo 10 ajustada
por la razón de presión entre vueltas. Esas extrapolaciones necesitan revisión
contra bajas reales, porque la vida creciente puede reducir la tasa de bajas.
No presentarlas como cuotas finales ni publicar Asalto si crean tramos que no
se pueden completar con una build viable.

## Aparición, composición y arena

Valor inicial **para probar**, no balance aprobado:

```text
intervaloAsalto = max(0,20 s; intervaloNormalDelTramo × 0,75)
```

El multiplicador de presión por vuelta del director actual sigue dentro de
`intervaloNormalDelTramo`; no se aplica dos veces. Este factor ofrece hasta
un tercio más oportunidades de spawn por segundo donde no se alcance el
mínimo técnico. Con pool o `activeCap` lleno se pospone el spawn, sin acumular
ráfagas. Mantener los 250 slots, reservas de bosses/réplicas, proyectiles y FX.
En vueltas profundas muchos intervalos ya rozan 0,20 s; allí Asalto no debe
forzar más entidades para prometer una aceleración artificial. La ventaja está
pensada sobre todo para el inicio y se calibra por los tiempos realmente
observados.

La selección de enemigos y los cambios de arena actuales usan segundos. En
Asalto, traducir **cada hito pre-boss** del perfil original a una fracción de
la cuota del tramo:

```text
umbralDePuntos(hito) = techo(cuotaTramo × segundoOriginalDelHito / segundoOriginalDelBoss)
```

Así se conserva el orden de incorporación de familias, expansiones y formas;
un boss temprano no omite la mitad del repertorio. El director puede calcular
un progreso virtual para elegir el tipo de enemigo, pero `ArenaModel` debe
encolar cambios y reproducir **cada aviso y cada morph con duración real**.
Si una explosión cruza varios umbrales en un tick, ejecutar cambios pendientes
en orden, sin superponer geometrías ni saltar avisos. Al llegar a la cuota,
resolver la cola necesaria y estabilizar el círculo antes de la intro.

Los peligros de arena mantienen cooldown, aviso, ataque y recuperación en
tiempo real. No pasarles el reloj virtual de puntos: un salto de progreso
podría cancelar o detonar avisos instantáneamente. Al quedar listo el boss,
no iniciar peligros pre-boss nuevos; terminar los ya anunciados. Los ataques
propios de enemigos y bosses permanecen regidos por sus estados actuales.
Con dos bosses se conserva la coordinación, arena circular y reserva actuales.

## Presentación, guardado y economía

- Mostrar en el HUD de Asalto una barra compacta `Puntos del tramo / Cuota`,
  además del tramo/vuelta. No confundirla con XP, bajas totales o NOVA. En
  Normal no añadir otro indicador.
- Seleccionar **Normal / Asalto** sólo al elegir Overdrive, con texto corto:
  «En Asalto, el boss llega al completar bajas; las oleadas entran más rápido».
  Mantener el selector legible en portrait. La ruta pública no requiere cambiar
  la URL; un parámetro de depuración con semilla permitirá probar cuotas.
- Separar récords por ritmo. Migrar el récord existente a Normal y crear Asalto
  vacío; no comparar mejor tiempo/tramos entre reglas distintas. Conservar el
  desbloqueo único de Overdrive.
- Liquidar NOVA una vez al morir o retirarse, con los topes actuales. La fórmula
  vigente es `bajas + piso(segundos / 30)`, con tope; Asalto no da un bonus
  automático. Durante EX-02c comparar NOVA por hora real y velocidad de compra
  del Laboratorio, además de NOVA por run, antes de decidir cualquier ajuste.

## Implementación futura y puerta de aceptación

1. Cerrar el balance/Laboratorio EX-02c; instrumentar instantáneas por tramo
   del perfil Normal. Fijar cuotas de contenido con esa evidencia.
2. Añadir una política `normal | asalto` a Overdrive (no un cuarto `ActId`),
   contador de puntos y origen de spawn en simulación. Mantener intactas las
   reglas de score/XP/campaña.
3. Componer intervalo rápido y selección por hitos en `OverdriveActDirector`;
   encolar los morphs en arena y separar el disparador del boss del reloj. Los
   hazards consumen `dt` real y respetan su arbitraje. Procesar los puntos
   ganados al final del tick de combate; la arena consume el hito pendiente en
   el siguiente tick para que daño y geometría no discrepen.
4. Integrar selector, HUD, récord separado y migración de save; añadir rutas
   debug reproducibles, por ejemplo `?debug=1&mode=overdrive&od-pace=assault&od-stage=1&seed=123`.
   Estos atajos no escriben NOVA, récords ni desbloqueos.
5. Validar con semillas fijas y runs humanas: sin boss por espera pasiva;
   boss al llegar a cuota; sin doble conteo de hijos; sin saltos de arena o
   avisos; encuentros dobles y transición con build intactos; pool/FX sin
   desbordes; campaña y Normal idénticos a su línea base.

**Objetivos de calibración, sujetos a medición:** en cada tramo comparable, la
mediana **y el promedio** de bajas normales al iniciar el boss en Asalto
quedan dentro de ±10% de Normal; la XP mediana también queda dentro de ese
rango y el nivel difiere a lo sumo en uno. Con Laboratorio avanzado,
la mediana de tiempo hasta el boss de los primeros tres tramos baja alrededor
de 20–30%. Si sólo baja el tiempo porque se suprimieron enemigos, cartas,
formas o avisos, la puerta falla. Revisar legibilidad y oportunidades de
evasión en desktop y móvil físico; medir frames y memoria en Low/Medium/High
sin asumir que más spawns son gratis. Si el intervalo mínimo o los `activeCap`
impiden acelerar las vueltas tardías, documentar el límite y ajustar las cuotas
con datos, sin ampliar pools automáticamente.
