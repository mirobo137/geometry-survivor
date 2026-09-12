# EX-07d — hazard angular y Orbital Warden

**Estado:** automático OK; validación humana pendiente. El consumidor de campaña,
selector/gating, recompensa y transición I→II siguen reservados para EX-07e.
Los valores numéricos son authored de prueba y no cierran EX-02c.

## Intención

EX-07d añade el segundo verbo espacial de Acto II: **alinear y seguir una
ventana que gira**. Pulse Ring ya enseña una banda radial con abertura; este
hazard añade una hoja sectorial que se compromete en un sector, gira durante el
daño y sólo recorre un arco acotado. Orbital Warden compone esa lectura con una
familia completa de patrones: riel rotatorio, embestida fija, recorrido curvo,
dos réplicas destructibles y corredor seguro móvil.

La respuesta segura no depende de adivinar: durante `telegraph` se ve el sector
comprometido y el sentido de desplazamiento; durante `active` el jugador puede
salir por cualquier lado fuera de la hoja o cruzar detrás de su recorrido. El
hazard aplica como máximo un impacto por cast. No hay homing, empuje ni daño
desde la presentación.

Orbital Warden añade locomoción ambiental de baja amplitud durante `intro`,
`sweep`, `ring` y `recovery`. Esa deriva es determinista, no sigue al jugador y
se ancla al endpoint real de Charge/Curve. Charge y Curve congelan su origen
durante el aviso y, una vez comprometidos, no se cancelan porque el jugador ya
ocupe la ruta; esa ocupación produce el daño normal de la trayectoria y debe
seguir siendo evadible antes o durante el cruce.

## Contrato authored

| Parámetro | Hazard angular | Orbital Warden |
| --- | ---: | ---: |
| telegraph | 0.85 s en drill / 0.90 s base | 0.95 s riel; 0.92 s charge; 0.86 s curve; 0.78 s replicas; 0.90 s ring |
| active | 1.55 s en drill | 1.20 s riel; 0.72 s charge; 1.12 s curve; 0.55 s replicas; 1.45 s ring |
| recovery | 0.55 s en drill / 0.60 s base | 0.90 s |
| ancho / apertura | ±0.22 rad | 30 px charge/curve; ±0.62 rad de corredor ring |
| recorrido angular | 0.92 rad, alterna sentido | 0.78 rad/s riel; 1.54 rad/s curve; 0.34 rad/s corredor |
| replicas | — | 2, destructibles, sin división |
| daño | 22 | 24 por cast de hazard/boss; balance final diferido |

Los identificadores y valores viven en `AngularSweepDefinition.ts` y
`BossDefinition.ts`; la simulación sólo consume snapshots. `BossSystem` sigue
siendo la interfaz compartida: `sweepAngularSpeed` y `ringAngularSpeed` son cero
para Core Sentinel, así que el Acto I no cambia.

## Drills reproducibles

```text
http://localhost:5173/?angular=1&debug=1&quality=low
http://localhost:5173/?angular=1&debug=1&quality=medium
http://localhost:5173/?angular=1&debug=1&quality=high

http://localhost:5173/?warden=1&debug=1&quality=low
http://localhost:5173/?warden=1&debug=1&quality=medium
http://localhost:5173/?warden=1&debug=1&quality=high
```

`angular` muestra únicamente la hoja y al jugador. `warden` muestra el boss,
su barra, el hazard angular y el ciclo completo de Orbital Warden; el boss
conserva autofire para que las réplicas puedan destruirse durante la prueba.
Los avisos de Charge, Curve y Replicas congelan su origen, luego el ataque
activo se ejecuta y vuelve a recovery antes de iniciar el siguiente patrón.
Ninguno crea oleadas normales, NOVA, XP, selección de actos ni save de campaña.
El debug identifica `angular-sweep-drill` o `warden-drill`, la fase y el ángulo
actual.

## Dirección visual

`AngularSweepView` usa una composición sectorial propia: base tinta, manto
metálico, cuerpo coral, núcleo marfil y dos bordes que delimitan la hoja. El
aviso dibuja una cámara de calibración apenas translúcida, rieles segmentados,
remates físicos, emisor de origen y chevrones tangenciales de dirección; no
rellena la zona segura ni convierte la longitud en una hitbox falsa. Durante
`active` la hoja se rota mediante el contenedor, y en `recovery` se conserva un
residuo discontinuo que desaparece.

La geometría se crea una vez por secuencia/radio. No hay filtros, blur, texturas
por entidad, parseo SVG ni `clear()` por frame. Low mantiene la hoja, su borde,
el aviso y la respuesta; High sólo suma chevrones. Cada arco, línea y sector
empieza su propio `beginPath()`, respetando la regla PixiJS de subpaths.

Orbital Warden tiene ahora una familia visual propia en
`src/assets/svg/enemies/boss/orbital-warden*.svg`: ciudadela facetada,
aletas orbitales, rieles dorados y reactor diamante. `BossShipVisual` mantiene
la asamblea cacheada, cambia la familia por `bossId` y conserva el master
completo en Low. Las réplicas usan cuatro piezas propias a escala miniatura y
el renderer común; al morir reciben el mismo FX desacoplable de la flota.

`BossView` aplica la receta premium por verbo: Charge usa riel segmentado y
nariz direccional, Curve usa arco limitado con rieles y nariz tangencial, y
Replicas usa marcadores rombo/crosshair sin líneas engañosas de alcance. La
guía completa para futuras iteraciones está en
[`ACTO_II_BOSS_FAMILY_PREMIUM.md`](../design/ACTO_II_BOSS_FAMILY_PREMIUM.md).

## Evidencia automática

- `npm run typecheck`: correcto.
- Validación dirigida: 8 archivos y 46 pruebas verdes inicialmente; tras las
  regresiones de identidad y telegraph, queda en 49/49 dirigida. La puerta
  completa queda en 90 archivos y 321 pruebas verdes, con typecheck y build
  Vite correctos.
- `npx vite build --mode development`: correcto; 949 módulos transformados.
- Smoke browser dirigido a los dos drills: 2/2 correcto en Chromium desktop.
- Capturas reales inspeccionadas en `test-results/` para hoja angular y Warden
  Low. La captura headless no es benchmark de FPS.

## Puerta humana pendiente

Probar ambos drills en desktop y móvil, Low/High: entender el sector sin texto
externo, reaccionar antes de `active`, distinguir Charge/Curve/Replicas, seguir
el movimiento sin que el origen cambie durante el aviso, destruir las dos
réplicas y verificar que sus colisiones sean reales. También comprobar que el
boss y sus avisos no ocultan al player ni convierten un rastro decorativo en
hitbox. Después probar una composición Angular real con Orbiter, Charger,
Splitter, Pulse Ring y Warden antes de habilitar EX-07e. No modificar todavía
vida, daño, spawn ni las ocho runs pendientes de EX-06d.
