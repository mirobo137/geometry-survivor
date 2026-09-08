# EX-03c — perfil de stress pendiente

Estado: evidencia PC cuantitativa y Samsung S25+ cualitativa recibidas; métricas móviles opcionales pendientes
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

## Registro recibido: PC — 07-09-2026

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
La duración exacta de cada sesión y el navegador aún deben anotarse.

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
validado cuantitativamente en PC y cualitativamente en S25+; quedan pendientes
las métricas numéricas del teléfono, duración exacta, navegador y observaciones
de legibilidad sostenida si se desea cerrar la evidencia con el máximo rigor.

La condición de dedos gruesos de EX-03b ya fue resuelta fuera de esta medición:
el selector persistente `relative-touch` permite mover por desplazamiento del
gesto sin mantener el dedo sobre el player. La matriz browser móvil valida su
selección y aplicación; este documento no sustituye el reporte numérico de
`?baseline=1` ni los metadatos que todavía faltan para cerrar EX-03 completo.
