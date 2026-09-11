# EX-03c — perfil de stress pendiente

Estado: CERRADO por evidencia PC cuantitativa y validación cualitativa Samsung S25+
Objetivo: comparar el escenario de stress en Low, Medium y High sin confundir
el p95 rolling del instrumento con p95 de toda la run ni con una medición de GPU.

## Procedimiento para mañana

Usar el mismo build/commit y el mismo dispositivo cuando se comparen calidades.
Abrir cada variante con:

```text
?stress=1&profile=1&quality=low
?stress=1&profile=1&quality=medium
?stress=1&profile=1&quality=high
```

Para cada sesión:

1. Anotar dispositivo, navegador, calidad y hora.
2. Dejar correr una ventana de observación comparable y registrar la duración
   exacta; no presentar una instantánea como duración de run.
3. Copiar o capturar el panel debug con frame medio, p95 rolling, máximo y
   conteos reales.
4. Registrar si los conteos realmente mantuvieron activos enemigos,
   proyectiles y FX; no escribir un presupuesto teórico.
5. Comprobar legibilidad del player, enemigos, lasers, boss y UI, además de
   input, audio, pausa y retorno de background si la sesión lo permite.

## Tabla de captura

| Calidad | Dispositivo/navegador | Duración | Frame medio | p95 rolling | Frame máximo | Max enemigos | Max proyectiles | Max FX | Legibilidad / incidencias |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Low | PC media, navegador pendiente | pendiente | ≈16.67 ms (derivado de FPS) | 16.80 ms | 17.00 ms | 250/250 | 300/300 | no expuesto | sin incidencia visual reportada |
| Medium | PC media, navegador pendiente | pendiente | ≈16.70 ms (derivado de FPS) | 16.80 ms | 16.80 ms | 250/250 | 300/300 | no expuesto | sin incidencia visual reportada |
| High | PC media, navegador pendiente | pendiente | ≈16.67 ms (derivado de FPS) | 16.80 ms | 16.90 ms | 250/250 | 300/300 | no expuesto | sin incidencia visual reportada |

## Registro recibido: PC — 07-09-2026 (`profile=1`)

Hardware declarado: RTX 4060 Ti, Ryzen 7 y 32 GB de RAM. Las tres capturas
usan landscape, lógico `1280x720`, viewport `1302x890`, escala `1.02` y DPR
`1.00`. El preset mantuvo `250/250` enemigos y `300/300` proyectiles.

| Calidad | FPS | p95 | Máximo | Long frames | Heap | Estado de armas |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Low | 59.99 | 16.80 ms | 17.00 ms | 2 | 24.2 MB | Orbit `0/6`, Chain locked |
| Medium | 59.88 | 16.80 ms | 16.80 ms | 3 | 29.0 MB | Orbit `0/6`, Chain locked |
| High | 59.98 | 16.80 ms | 16.90 ms | 1 | 33.2 MB | Orbit `0/6`, Chain locked |

Lectura: el stress de PC queda estable alrededor de 60 FPS en las tres
calidades. Los `longFrames` se registran porque forman parte del panel, aunque
los máximos observados se mantienen cerca de 17 ms y no sugieren stutter
perceptible. La memoria aumenta con la calidad, pero no hay evidencia de fuga en
estas capturas aisladas.

El preset no activa Orbit ni Chain Lightning y el panel no expone un conteo de
FX en estas capturas; por tanto, esta evidencia valida la carga máxima de
enemigos/proyectiles del escenario, pero no el coste de los nuevos FX premium.
El usuario confirmó posteriormente que las pruebas de PC se hicieron en Chrome
y Edge, y las del Samsung S25+ en Chrome. La última sesión duró 5 minutos.
La versión exacta de cada navegador y el sistema operativo no fueron copiados
al reporte, por lo que quedan como metadatos opcionales.

## Registro complementario: PC — 10-09-2026 (`profile=off`)

Hardware declarado para estas capturas: RTX 4060 Ti, Ryzen 7 y 32 GB de RAM.
Las tres capturas usan landscape, lógico `1280x720`, viewport `1302x890`,
escala `1.02` y DPR `1.00`. El escenario conserva `250/250` enemigos y
`300/300` proyectiles, con Orbit `0/6`, Chain locked y boss inactive.

| Calidad | FPS mostrado | Frame p95 | Frame máximo | Long frames | Heap |
| --- | ---: | ---: | ---: | ---: | ---: |
| Low | 59.99 | n/a (`profile=off`) | n/a (`profile=off`) | n/a (`profile=off`) | n/a (`profile=off`) |
| Medium | 60.00 | n/a (`profile=off`) | n/a (`profile=off`) | n/a (`profile=off`) | n/a (`profile=off`) |
| High | 60.00 | n/a (`profile=off`) | n/a (`profile=off`) | n/a (`profile=off`) | n/a (`profile=off`) |

Lectura: esta matriz confirma que el escenario de stress mantiene entre 59.99
y 60.00 FPS en las tres calidades en este PC. Al estar `profile=off`, no mide
p95, frame máximo, frames largos ni heap; por eso complementa, pero no
sustituye, la captura histórica con `profile=1`. El panel tampoco identifica
sistema operativo, versiones de navegador ni la duración de esa captura
concreta. Esos metadatos quedan como mejora de trazabilidad, no como bloqueo:
el usuario confirmó que la build era correcta y que la caída real máxima
observada fue de 56 FPS.

## Registro cualitativo: Samsung S25+

El usuario confirma que el juego también corre bien en el Samsung S25+ durante
las pruebas realizadas. Esta confirmación sirve como evidencia manual de que no
se observaron problemas prácticos de rendimiento, control o estabilidad en ese
dispositivo.

No se recibieron capturas ni valores de FPS, p95, frame máximo, heap, duración
o conteos del panel del teléfono. Por eso este registro no inventa métricas y
no sustituye la matriz numérica de PC; queda clasificado como validación móvil
cualitativa.

## Comparación humana

Responder después de las tres sesiones:

- ¿El player sigue visible con muchos enemigos y FX?
- ¿Los telegraphs de laser y boss conservan contraste?
- ¿La órbita, Chain Lightning y proyectiles se distinguen entre calidades?
- ¿Hay stutter, calentamiento o input perdido?
- ¿Qué calidad recomendarías por defecto en el Samsung S25+?
- ¿Qué ocurre en el móvil de menor gama probado?

Los datos de PC sirven como comparación y el Samsung S25+ tiene confirmación
manual positiva, pero no permiten generalizar a todos los móviles. EX-03c queda
validado cuantitativamente en PC y cualitativamente en S25+. Las métricas
numéricas del teléfono y los metadatos exactos pueden añadirse si se desea una
auditoría más exhaustiva.

La condición de dedos gruesos de EX-03b ya fue resuelta fuera de esta medición:
el selector persistente `relative-touch` permite mover por desplazamiento del
gesto sin mantener el dedo sobre el player. La matriz browser móvil valida su
selección y aplicación. El reporte numérico de `?baseline=1` y la confirmación
del usuario completan la puerta EX-03; los metadatos restantes son opcionales.

## Cierre de EX-03c — 10-09-2026

El usuario confirma que la build quedó correcta, que las compras, revive, reroll
y duplicar NOVA funcionan correctamente, y que la cifra de 16 FPS fue un error
del reporte. La caída máxima real observada fue de 56 FPS. La evidencia PC
cuantitativa y la validación cualitativa del Samsung S25+ son suficientes para
cerrar EX-03c; no se atribuyen métricas de p95 al teléfono sin una captura
`profile=1`.
