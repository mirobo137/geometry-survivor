# Geometry Survivor — reporte de línea base Acto I v1

Fecha de recepción: 2026-09-10  
Fuente: salida copiada desde el panel `?baseline=1` por el usuario.  
Alcance: 10 runs completadas de la línea base del Acto I v1.

## Estado de la evidencia

El reporte confirma que las diez runs ya fueron ejecutadas: 8 terminaron en
victoria y 2 en game-over. La línea `Run en curso: si` corresponde a una
undécima run iniciada al momento de copiar el reporte; no forma parte de la
muestra y no obliga a repetir ninguna de las diez anteriores.

La evidencia numérica permite avanzar el registro de EX-03, pero todavía no
cierra la puerta por completo porque el texto copiado no incluye el contexto
de ejecución (commit, sistema operativo, navegador y dispositivo exactos) ni
aclara la anomalía de FPS descrita más abajo.

## Resumen calculado

| Métrica | Resultado |
| --- | ---: |
| Runs completadas | 10 |
| Victorias | 8 (80 %) |
| Game-over | 2 (20 %) |
| Runs que llegaron al boss | 8 |
| Tiempo medio de las victorias | 04:25.5 |
| Tiempo medio de todas las runs | 04:02.4 |
| Primera subida | 00:09 en las 10 runs |
| Inicio del boss | 04:20 en las 8 victorias |
| NOVA total | 4,317 |
| NOVA media | 431.7 |
| Máximo de enemigos observado | 23 |
| Máximo de proyectiles observado | 20 |
| Máximo de FX observado | 52 |

La distribución de calidad en esta muestra es: medium 4 runs (#1–#4), low 1
run (#5) y high 5 runs (#6–#10).

## Anomalía de telemetría

Las runs #6–#9 reportan `FPS medio 16.67` y simultáneamente `frame medio
16.67 ms` con `p95 16.80 ms`. Un frame medio de 16.67 ms corresponde
aproximadamente a 60 FPS, por lo que esos cuatro valores de FPS no deben
usarse como evidencia de una caída a 16 FPS. Las runs #1–#5 y #10 reportan
59.97 FPS con el mismo orden de magnitud de frame time.

Esto queda marcado como inconsistencia de captura o de versión del reporte,
no como un diagnóstico de rendimiento. Para cerrar EX-03 se debe confirmar el
commit/build con el que se copió la salida y, si es posible, volver a copiar
únicamente la fila de las runs #6–#9 desde el mismo build. No hace falta
repetir las diez runs por esta anomalía.

## Contexto aún pendiente

Completar en `docs/balance/EX-03b-human-observations.md`:

```text
Commit probado:
Modelo exacto:
Sistema operativo:
Navegador y versión:
Dispositivo de esta captura:
Calidades y número de runs por calidad: medium 4 / low 1 / high 5
Meta equipada:
Revive usado (run/cantidad):
Reroll usado (run/cantidad):
¿Se compró algún nivel durante las diez runs?: no / aclarar
¿Se cambió balance o build base entre runs?: no / aclarar
¿La anomalía de FPS #6–#9 proviene del mismo build?:
```

## Addendum de cierre — 10-09-2026

El usuario completó el contexto posterior: las pruebas se realizaron en PC con
Chrome y Edge, y en Samsung S25+ con Chrome. La build quedó correcta, la última
sesión duró 5 minutos y las compras, revive, reroll y duplicar NOVA funcionan
correctamente. También confirmó que el valor de 16 FPS de las runs #6–#9 fue
un error del reporte; la caída real máxima observada fue de 56 FPS.

Este anexo resuelve la anomalía y completa la evidencia funcional de EX-03. El
commit exacto, las versiones de navegador/sistema operativo y métricas
numéricas del S25+ no fueron copiados y quedan como metadatos opcionales.

El usuario ya había reportado pruebas cualitativas positivas en PC y Samsung
S25+; ese contexto se conserva en el documento humano, pero no se atribuye
automáticamente a esta captura porque el panel no incluye el dispositivo.

## Reporte íntegro recibido

```text
Geometry Survivor | Linea base Acto I v1
Runs completadas: 10/10
Run en curso: si
  calidad medium | primera subida -- | boss --
  maximos enemigos 2 | proyectiles 2 | FX 8
  elecciones --

#1 victory | tiempo 04:30 | calidad medium
  subida 00:09 | boss 04:20 | causa boss-defeated
  NOVA 484 | max enemigos 15 | proyectiles 9 | FX 52
  FPS medio 59.97 | frame medio 16.67 ms | p95 16.80 ms
  cartas twin_emitters, orbit_blade, orbit_blade, orbit_blade, orbit_blade, resonant_core, resonant_core, resonant_core, critical_impact, critical_impact, critical_impact, orbit_reach, orbit_reach, focused_projectiles, focused_projectiles, focused_projectiles, orbit_blade, orbit_blade, rapid_projectiles, rapid_projectiles, chain_lightning, vampiric_core, recharging_shield, vampiric_core, vampiric_core, orbit_reach

#2 victory | tiempo 04:59 | calidad medium
  subida 00:09 | boss 04:20 | causa boss-defeated
  NOVA 574 | max enemigos 23 | proyectiles 3 | FX 32
  FPS medio 59.97 | frame medio 16.67 ms | p95 16.80 ms
  cartas focused_projectiles, focused_projectiles, reinforced_core, reinforced_core, chain_lightning, regenerative_reactor, regenerative_reactor, regenerative_reactor, recharging_shield, chain_overload, chain_overload, chain_overload, chain_overload, chain_overload, hardened_shell, focused_projectiles, reinforced_core, reinforced_core, reinforced_core, rapid_projectiles, rapid_projectiles, rapid_projectiles, vampiric_core, chain_overload, chain_overload

#3 game-over | tiempo 02:06 | calidad medium
  subida 00:09 | boss -- | causa contact
  NOVA 161 | max enemigos 12 | proyectiles 3 | FX 22
  FPS medio 59.97 | frame medio 16.67 ms | p95 16.80 ms
  cartas swift_step, reinforced_core, orbit_blade, orbit_blade, orbit_blade, resonant_core, resonant_core, resonant_core, critical_impact

#4 victory | tiempo 04:23 | calidad medium
  subida 00:09 | boss 04:20 | causa boss-defeated
  NOVA 463 | max enemigos 17 | proyectiles 6 | FX 21
  FPS medio 59.97 | frame medio 16.67 ms | p95 16.80 ms
  cartas focused_projectiles, focused_projectiles, reinforced_core, reinforced_core, rapid_projectiles, rapid_projectiles, rapid_projectiles, vampiric_core, critical_impact, critical_impact, critical_impact, recharging_shield, focused_projectiles, focused_projectiles, focused_projectiles, focused_projectiles, focused_projectiles, reinforced_core, reinforced_core, rapid_projectiles, regenerative_reactor, resonant_core

#5 victory | tiempo 04:25 | calidad low
  subida 00:09 | boss 04:20 | causa boss-defeated
  NOVA 472 | max enemigos 13 | proyectiles 20 | FX 21
  FPS medio 59.97 | frame medio 16.67 ms | p95 16.80 ms
  cartas twin_emitters, focused_projectiles, chain_lightning, rapid_projectiles, rapid_projectiles, rapid_projectiles, rapid_projectiles, vampiric_core, vampiric_core, critical_impact, chain_overload, chain_overload, chain_overload, chain_overload, focused_projectiles, focused_projectiles, reinforced_core, resonant_core, resonant_core, resonant_core, critical_impact, vampiric_core

#6 victory | tiempo 04:29 | calidad high
  subida 00:09 | boss 04:20 | causa boss-defeated
  NOVA 485 | max enemigos 14 | proyectiles 19 | FX 47
  FPS medio 16.67 | frame medio 16.67 ms | p95 16.80 ms
  cartas twin_emitters, focused_projectiles, chain_lightning, rapid_projectiles, rapid_projectiles, rapid_projectiles, rapid_projectiles, vampiric_core, vampiric_core, critical_impact, chain_overload, chain_overload, chain_overload, chain_overload, hardened_shell, focused_projectiles, reinforced_core, orbit_blade, orbit_blade, resonant_core, vampiric_core, critical_impact, critical_impact

#7 victory | tiempo 04:26 | calidad high
  subida 00:09 | boss 04:20 | causa boss-defeated
  NOVA 476 | max enemigos 14 | proyectiles 18 | FX 45
  FPS medio 16.67 | frame medio 16.67 ms | p95 16.80 ms
  cartas focused_projectiles, twin_emitters, chain_lightning, orbit_blade, rapid_projectiles, rapid_projectiles, rapid_projectiles, vampiric_core, critical_impact, recharging_shield, chain_overload, chain_overload, chain_overload, hardened_shell, focused_projectiles, focused_projectiles, orbit_blade, rapid_projectiles, resonant_core, orbit_blade, vampiric_core, vampiric_core

#8 victory | tiempo 04:25 | calidad high
  subida 00:09 | boss 04:20 | causa boss-defeated
  NOVA 472 | max enemigos 13 | proyectiles 19 | FX 43
  FPS medio 16.67 | frame medio 16.67 ms | p95 16.80 ms
  cartas twin_emitters, focused_projectiles, chain_lightning, rapid_projectiles, rapid_projectiles, rapid_projectiles, rapid_projectiles, vampiric_core, critical_impact, vampiric_core, chain_overload, chain_overload, chain_overload, chain_overload, focused_projectiles, focused_projectiles, focused_projectiles, orbit_blade, orbit_blade, orbit_blade, vampiric_core, critical_impact

#9 victory | tiempo 04:27 | calidad high
  subida 00:09 | boss 04:20 | causa boss-defeated
  NOVA 478 | max enemigos 13 | proyectiles 18 | FX 49
  FPS medio 16.67 | frame medio 16.67 ms | p95 16.80 ms
  cartas twin_emitters, focused_projectiles, chain_lightning, rapid_projectiles, rapid_projectiles, rapid_projectiles, rapid_projectiles, vampiric_core, critical_impact, critical_impact, chain_overload, chain_overload, chain_overload, chain_overload, focused_projectiles, focused_projectiles, reinforced_core, resonant_core, resonant_core, regenerative_reactor, resonant_core, vampiric_core, vampiric_core

#10 game-over | tiempo 02:54 | calidad high
  subida 00:09 | boss -- | causa contact
  NOVA 252 | max enemigos 13 | proyectiles 3 | FX 35
  FPS medio 59.97 | frame medio 16.67 ms | p95 16.80 ms
  cartas swift_step, focused_projectiles, reinforced_core, chain_lightning, resonant_core, resonant_core, resonant_core, critical_impact, vampiric_core, critical_impact, chain_overload, chain_overload, chain_overload, chain_overload, swift_step, swift_step
```
