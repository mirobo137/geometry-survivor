# Geometry Survivor — estado y continuación

> Snapshot operativo: 03-09-2026.
>
> Estado funcional auditado desde el último commit publicado y las correcciones acumuladas de las sesiones anteriores.
>
> Este archivo sirve para retomar el trabajo en otra sesión o con otro agente. No reemplaza las fuentes de verdad: solicitud actual del usuario → `PLAN_DESARROLLO.md` → `proyecto.md` → skills → código/tests.

## 1. Cómo retomar correctamente

1. Abrir este directorio como raíz del proyecto para que el agente reciba `AGENTS.md`.
2. Leer `AGENTS.md`, este snapshot y la skill mínima aplicable.
3. Para arquitectura, boss, plataformas o cambios de alcance, leer completos `PLAN_DESARROLLO.md` y `proyecto.md`.
4. Ejecutar `git status --short` y conservar cualquier cambio que no pertenezca a la tarea.
5. Ejecutar `npm run typecheck` y `npm test` antes de modificar una frontera importante.
6. No asumir que este snapshot sigue vigente si el código o el plan tienen cambios posteriores.

Codex/GPT y Grok deben aplicar las mismas decisiones. Las skills canónicas viven en `skills/`; `.grok/skills/` contiene únicamente adaptadores de descubrimiento.

## 2. Objetivo del producto que no debe cambiarse silenciosamente

- Survivor web geométrico, mobile-first y portrait como orientación primaria.
- Jugable también en PC, tablet y landscape sin cambiar reglas ni conceder ventaja por tamaño de pantalla.
- Destinos separados: GitHub Pages/local, Poki y CrazyGames.
- Run objetivo del vertical slice: 5–6 minutos.
- Control de movimiento con un dedo, mouse-drag y teclado; ataques automáticos.
- Arena viva como gancho: expansiones, resonancia, borde y hazards relacionados.
- XP acreditada directamente al derrotar enemigos. No existen gemas físicas de experiencia.
- Assets visuales creados por IA mediante código. SVG es el master preferido para UI/assets, aunque las masas repetidas pueden convertirse a textura/atlas en runtime por rendimiento.
- Sin dependencias externas, analítica, backend o SDK comercial hasta que la fase correspondiente lo justifique.

## 3. Estado ejecutable actual

URL publicada:

```text
https://mirobo137.github.io/geometry-survivor/
```

Atajos que pueden escribirse después de la URL base:

```text
?debug=1
?stress=1
?boss=1
?skin=cyan|violet|amber|emerald
?background=deep-space|ion-storm|solar-drift|crystal-field
?quality=low|medium|high
?profile=1
?baseline=1
?spike=rendering
?spike=audio
```

`?boss=1` es el atajo de desarrollo para probar el encuentro sin jugar los 4:20 previos: inicia el reloj en el umbral oficial, coloca la arena en su estado de late game y muestra el panel técnico. La URL normal no cambia. También puede combinarse con `&debug=1` aunque el panel ya se muestra automáticamente.

Stack y calidad confirmada:

- TypeScript estricto, Vite y PixiJS 8.20.0.
- Build target ES2018 para compatibilidad móvil.
- Timestep fijo de 60 Hz; presentación desacoplada del ritmo de simulación.
- Viewport lógico 720×1280 en portrait y 1280×720 en landscape.
- Pool de 250 enemigos y 300 proyectiles con spatial grid.
- CI construye `dist/local`, ejecuta Playwright/Chromium sobre ese artefacto, construye Poki y CrazyGames, y sólo entonces despliega GitHub Pages.
- Builds separados `local`, `poki` y `crazygames`.
- Última auditoría local: typecheck correcto, 139 tests unitarios/integración en 53 archivos y 9 smoke tests de Playwright pasando en Chromium (7 desktop + 2 Pixel 5 emulados).

Mediciones manuales aportadas desde Android Chrome:

- Spike de 500 entidades: aproximadamente 60 FPS en Sprite, GraphicsContext compartido y pool; p95 de 16.80 ms.
- Audio: `AudioContext` running y latencia base de 3.0 ms.
- Audio integrado: el usuario confirma música, efectos, pausa, reanudación, volumen y silencio funcionando correctamente en móvil.
- Stress de 250 enemigos + 300 proyectiles: estable alrededor de 60 FPS quieto, con picos reportados de 120 FPS al mover.
- El usuario confirma que el modo stress corre correctamente en móvil y PC, y que las partidas completas siguen pudiendo terminarse.
- Una run móvil llegó al boss de 4:20 y descubrió `Unable to convert color 4294430586`; la causa era un color de ocho dígitos en el telegraph de barrido. Quedó corregido con una paleta RGB validada por test. Falta repetir el encuentro en el build publicado.
- Falta registrar modelo exacto del teléfono y preset de calidad cuando éstos existan.

## 4. Funcionalidad implementada

### Base, móvil y rendimiento

- Shell responsive sin obligación de girar el teléfono.
- Pointer Events con fallback touch, teclado WASD/ZQSD/flechas y mapping por viewport.
- Pausa al perder foco o visibilidad, limpieza de input y reanudación explícita.
- Errores de arranque visibles en la página.
- Spikes reproducibles de rendering y Web Audio.

### Simulación y combate

- Jugador con velocidad, vida, armadura, invulnerabilidad, escudo recargable y
  límite circular.
- Chaser, Fast, Tank y variante Elite data-driven.
- Elite determinista desde 2:00.
- Projectile, Orbit y Chain Lightning con críticos deterministas.
- Pooling, targeting, spatial grid, colisiones, daño, muerte y XP directa.
- Preset `?stress=1` mantiene ambos pools en capacidad.
- Preset `?boss=1` inicia una run de prueba en el umbral del boss sin cambiar la URL normal ni el balance del encuentro.

### Progresión y arena

- Level-up pausado con tres cartas táctiles.
- Quince mejoras tipadas/data-driven.
- Dos expansiones de arena: 1:00 y 3:00, con radio intermedio y pulso de resonancia.
- Curva de spawn con seis fases de contenido entre 0:00 y 5:00.
- Laser desde aproximadamente 0:45 con `telegraph → attack → recovery`, un impacto por activación y escape perpendicular.

### Presentación

- Sprites/texturas reutilizadas para entidades repetidas.
- Graphics para arena, resonancia, Chain Lightning y Laser.
- HUD de tiempo, vida, XP, bajas y nivel.
- Overlays DOM responsive para level-up y pausa.
- Panel debug con FPS, viewport, pools, armas, nivel, pausa, arena y resonancia.

### Audio

- `src/audio/AudioService.ts` mantiene Web Audio fuera de la simulación y crea el contexto sólo después de la primera interacción.
- `WebAudioService` reproduce una música procedural discreta, cues de daño/level-up/victoria y pausa/reanuda junto con el lifecycle del juego.
- El usuario validó manualmente que el spike de audio suena; su volumen de prueba es deliberadamente bajo y la música integrada todavía requiere validación en móvil real.

## 5. Resultado de la auditoría de modularidad

### Lo que sí cumple

- `src/simulation/` no importa PixiJS, DOM, audio ni SDKs.
- `src/content/` contiene definiciones tipadas para enemigos, armas, upgrades, hazards y dificultad.
- El renderer observa estado; no decide daño, XP, drops ni dificultad.
- El resize cambia presentación, no simulación.
- `MovementVector` evita que `PlayerModel` dependa de `InputManager`.
- `LocalPlatform` mantiene el SDK fuera del gameplay.
- Las reglas críticas se prueban sin levantar Pixi.
- Añadir una variante común de enemigo o ajustar balance permanece localizado.

### Riesgos antes de seguir creciendo

No son fallos actuales, pero ya son puntos de concentración reales:

1. `src/simulation/combat/CombatWeaponSystem.ts` tiene alrededor de 310 líneas y mantiene Projectile, Orbit y Chain detrás de una frontera única; el benchmark se extrajo a `StressCombatScenario.ts` porque es un escenario de validación distinto. `CombatSimulation.ts` coordina Laser, run, derrotas, XP y eventos.
2. `src/main.ts` tiene alrededor de 99 líneas y queda como bootstrap; `src/app/Game.ts` tiene alrededor de 331 líneas y coordina lifecycle, loop, pausa, level-up, HUD, game-over/victoria y persistencia sin implementar sistemas completos. Se mantiene como orquestador cohesivo; se extraerá una responsabilidad sólo cuando exista un segundo consumidor real.
3. `src/presentation/PixiGameView.ts` tiene alrededor de 95 líneas y ahora es una fachada; arena, entidades, armas, hazards y jugador viven en vistas Pixi separadas.
4. `CombatRenderState` ya evita que `PixiGameView` reciba la clase completa de combate; incluye un snapshot de boss con fase, salud, barrido y anillo y contratos reducidos de solo lectura para arrays de enemigos, proyectiles, órbitas y cadenas. Los sistemas de simulación ya exponen reset explícito para reinicio in-place.
5. `UpgradeApplier` ya retiró la aplicación de efectos de `main.ts` y controla stacks/prerrequisitos; un efecto nuevo todavía requiere modificar ese módulo tipado.
6. `PlatformAdapter` ahora compone `PlatformLifecycle`, `AdService`, `SaveStore` y `AudioService`; el resumen de game-over ya actualiza la mejor marca, pero falta conectar ajustes a una UI.
7. Los textos visibles están hardcodeados en español. Falta i18n con inglés como fallback.
8. La skill SVG ya tiene dos assets master de UI (`pause.svg` y `settings.svg`) con validación estructural; faltan las familias visuales de player, enemigos y hazards.
9. `tests/browser/game.smoke.spec.ts` ejecuta Playwright sobre `dist/local`: carga, teclado/pointer, pausa/reanudación, matriz de resize, level-up, persistencia local, context loss y consola/red. `tests/browser/mobile.smoke.spec.ts` cubre un drag touch emulado en portrait Pixel 5. El fallback de storage bloqueado, el constructor Web Audio fallido y el lifecycle de audio tienen cobertura unitaria; la validación manual en móvil real sigue pendiente.

Conclusión: las fronteras principales son correctas y la consolidación avanza; presentación y runtime ya tienen fachadas separadas, y quedan por cerrar snapshots/UI secundarios, ajustes persistentes y el balance final de la run. `GameState`, `BossSystem` y los modelos de simulación ya permiten terminar, mostrar victoria y reiniciar una run in-place sin recargar ni perder la mejor marca. El boss usa contenido tipado, patrones telegraphed y un snapshot de render; las cartas numéricas ya muestran un preview runtime `antes → después` sin aplicar el efecto, `LocalSaveStore` ya cubre schema v1, migración y fallback en memoria, y la plataforma local separa lifecycle/anuncios.

## 6. Próximo hito recomendado: cerrar la puerta de Fase 5

Objetivo: validar una run completa de 5–6 minutos con boss, victoria, reinicio y balance legible sin cambiar las fronteras modulares.

Orden recomendado:

1. Usar `src/app/GameState.ts` en todos los estados de gameplay; el contrato de fin/victoria/reinicio ya está integrado en `Game` y cubierto por tests.
2. `src/app/Game.ts` ya coordina la run; mantenerlo como orquestador de lifecycle/loop, no como contenedor de sistemas.
3. Mantener `src/simulation/progression/UpgradeApplier.ts` como punto único de aplicación; límites y prerrequisitos de cartas ya están data-driven.
4. Mantener `CombatWeaponSystem` como frontera única mientras no haya un segundo consumidor; el stress ya vive en `StressCombatScenario` y, si una cuarta arma o regla transversal lo exige, separar Projectile/Orbit/Chain con contratos pequeños. `EnemySystem` cubre ciclo de vida, movimiento, contacto y spatial grid; `EnemySpawnDefinitions` posee la mezcla temporal.
5. Mantener `PixiGameView` como fachada pequeña; `ArenaView`, `CombatEntitiesView`, `WeaponView`, `HazardView` y `PlayerView` ya separan la representación por responsabilidad.
6. Completar snapshots mínimos de presentación; `CombatRenderState` ya incluye el boss. `UpgradePreview` y `SaveStore` son contratos adicionales ya aislados.
7. Mantener tests de transiciones de estado, pausa, level-up, game over y reinicio; después ejecutar typecheck, suite, tres builds y smoke móvil.

Límites de este refactor:

- no cambiar balance, timings, apariencia ni controles salvo corrección comprobada;
- no crear ECS, bus global, service locator ni infraestructura especulativa;
- no añadir dependencias;
- no añadir un segundo boss ni una fase narrativa;
- conservar las URLs de spike/stress y los formatos actuales de build.

Puerta del hito:

- comportamiento observable equivalente;
- ninguna importación inversa hacia Pixi/DOM/SDK desde simulación;
- los coordinadores dejan de crecer como managers universales;
- 88 tests unitarios/integración y 8 browser smoke pasan; existen pruebas de estados, aplicación, enemigos, cartas, guardado, resumen, reset, boss, colores, paths Pixi, audio (incluido constructor fallido), SVG, pantalla de inicio, acceso rápido de boss, context loss y touch emulado;
- `local`, `poki` y `crazygames` construyen correctamente;
- pausa, cartas, Laser, elite y expansiones siguen funcionando en móvil.

## 7. Trabajo pendiente por fase

### Fase 3 — casi cerrada, pendiente de validación manual

- Ajustes persistentes conectados a la UI de pausa: música, efectos y silencio; la mejor marca ya se actualiza desde game-over.
- Pausa manual, continuar y reinicio desde pausa cubiertos por smoke browser.
- Validar manualmente dos builds que se sientan diferentes; la evidencia del usuario confirma que las decisiones importan, pero todavía no documenta dos rutas de build comparables.

### Fase 4 — implementada, pendiente de puerta humana

- ✅ El usuario confirma que las mecánicas generales funcionan y que el balance inicial es adecuado.
- Confirmar en móvil que el Laser se entiende tras verlo una vez.
- Confirmar que el camping no domina.
- Confirmar que elite, densidad y Laser no producen daño inevitable.
- Ajustar timings y presión con runs completas, no sólo unit tests.
- Verificar manualmente primera y segunda expansión con resonancia.

### Fase 5 — parcial, boss implementado

- Boss con dos patrones: barrido/línea telegraphed y anillo con huecos seguros ya implementado.
- El boss se desplaza en una órbita determinista, lenta y acotada dentro de la arena; radio y velocidad viven en contenido, no en Pixi.
- ✅ Varias runs normales de 5–6 minutos fueron completadas manualmente; el usuario confirma que el balance inicial y las decisiones de build funcionan.
- El atajo `?boss=1` fue probado manualmente por el usuario; el smoke browser confirma además su aparición y la secuencia de barrido/anillo.
- Game over por muerte, resumen, mejor marca, victoria y reinicio in-place ya están implementados.
- Primer balance integral y diez runs internas sin softlock: todavía falta registrar el número exacto de runs y sus resultados.

### Fase 6 — parcialmente implementada

- Lenguaje visual definitivo.
- ✅ Primer pipeline SVG master code-first para UI: iconos `pause.svg` y `settings.svg` inline, recoloreables y validados.
- ✅ AudioService real con música procedural, cues básicos, volumen separado, desbloqueo diferido y pausa/reanudación; audio integrado validado manualmente.
- ⬜ Música final/asset externo opcional, límites de voces refinados y mezcla definitiva; la UI de ajustes del prototipo ya está conectada.
- Hit feedback, shake presupuestado, hit stop, trails y partículas.
- Presets Low/Medium/High sin cambiar gameplay.

### Fase 7 — parcial

- Ya existen responsive, pausa de lifecycle y stress inicial.
- ✅ Context loss está cubierto en browser smoke; el fallback ante storage bloqueado está cubierto por tests unitarios.
- ✅ La matriz completa de resize está cubierta por browser smoke.
- Faltan validación manual móvil y profiling CPU/GPU/GC.
- Falta decidir adaptive quality con datos reales.

## 7.1 Evidencia manual actual

- ✅ La rotación funciona.
- ✅ El usuario completó varias runs normales hasta el final.
- ✅ El boss fue probado y derrotado.
- ✅ El balance inicial y el peso de las decisiones se perciben correctos para el primer nivel.
- ⬜ Falta registrar número exacto de runs, dispositivo, navegador, calidad y FPS.
- ✅ Context loss ya tiene smoke browser; el fallback de storage bloqueado ya tiene test unitario.
- ✅ El usuario validó que el spike de Web Audio reproduce sonido; el volumen bajo queda registrado como comportamiento actual de prueba.
- ⬜ Falta completar en móvil context loss, storage bloqueado y background/foreground; el usuario ya validó audio integrado, pausa, volumen y silencio.
- El aspecto amateur y la falta de juice quedan conscientemente aplazados a la Fase 6; no bloquean la validación funcional actual.

### Fase 8 — pendiente

- Adaptadores reales Poki y CrazyGames.
- Lifecycle, anuncios y guardado específicos.
- Poki Inspector y CrazyGames Preview Tool.
- Validación con adblock, anuncios ausentes y storage fallido.

### Fase 9 — posterior

- Producción adicional de contenido sólo después de superar las puertas anteriores.

## 8. Prueba manual corta desde móvil

En la URL normal:

1. comprobar movimiento portrait y landscape;
2. abrir una carta y confirmar que la simulación se detiene;
3. cambiar de aplicación/pestaña y volver; debe aparecer “Continuar”;
4. alrededor de 0:45, observar aviso amarillo y Laser rojo;
5. alrededor de 1:00, observar primera expansión/resonancia;
6. después de 2:00, identificar el elite rosa/octagonal;
7. alrededor de 3:00, observar segunda expansión/resonancia;
8. alrededor de 4:20, confirmar que aparece un solo boss con barra de vida, se mueve por su órbita y no muestra el error de color corregido;
9. observar el aviso del barrido y, después, el anillo con un hueco cian seguro;
10. derrotar al boss, confirmar el resumen de Victoria y reiniciar sin recarga;
11. confirmar que HUD y cartas no se cortan ni generan scroll.

En `?stress=1`:

1. confirmar `250/250` enemigos y `300/300` proyectiles;
2. mover durante al menos un minuto;
3. comprobar que pausa/reanudación no duplica entidades ni acelera la simulación;
4. registrar modelo, navegador, FPS aproximado y cualquier congelamiento.

En `?boss=1`:

1. confirmar que el HUD inicia alrededor de `4:20` y que aparece un solo boss;
2. probar el movimiento orbital, el telegraph del barrido y el anillo con hueco seguro;
3. comprobar que la línea del boss no aparece conectada accidentalmente con el origen;
4. derrotar al boss si se desea validar Victoria, resumen y reinicio in-place.

## 9. Comandos de validación

```bash
npm ci
npx playwright install chromium
npm run typecheck
npm test
npm run validate
npm run test:browser
npm run build:poki
npm run build:crazygames
```

`npm run validate` ya incluye typecheck, tests y build local. `npm run test:browser` vuelve a construir `dist/local` y ejecuta Playwright en Chromium. No declarar una puerta manual superada sólo porque estos comandos pasen.

## 10. Archivos clave

- `AGENTS.md`: reglas neutrales para agentes y routing de skills.
- `PLAN_DESARROLLO.md`: alcance, decisiones, fases y puertas.
- `proyecto.md`: visión y principios de largo plazo.
- `src/simulation/enemies/EnemySystem.ts`: ciclo de vida, movimiento, contacto, spawn y consultas espaciales de enemigos.
- `src/content/run/EnemySpawnDefinitions.ts`: mezcla temporal de enemigos en perfiles tipados, separada del engine.
- `src/simulation/combat/CombatWeaponSystem.ts`: Projectile, Orbit y Chain Lightning; frontera preparada para futuras armas.
- `src/simulation/combat/StressCombatScenario.ts`: benchmark reproducible que reutiliza el pool de proyectiles de producción.
- `src/simulation/combat/CombatSimulation.ts`: coordinador de run/laser/eventos/XP; mantiene la composición sin lógica de armas.
- `src/presentation/PixiGameView.ts`: fachada de render; delega en vistas Pixi por responsabilidad.
- `src/presentation/pixi/`: vistas de arena, entidades, armas, hazards, jugador y fábrica de texturas.
- `src/app/Game.ts`: orquestador de lifecycle, loop, pausa, level-up, HUD y plataforma.
- `src/content/audio/MusicDefinitions.ts`: frase procedural versionada como contenido, separada del adaptador Web Audio.
- `src/app/RunSummary.ts` y `src/ui/GameOverOverlay.ts`: snapshot y representación del fin de run.
- `reset()` en `ArenaModel`, `PlayerModel`, `CombatSimulation`, pools, Laser y progresión: reinicio in-place sin reasignar sistemas.
- `src/content/bosses/BossDefinition.ts`, `src/simulation/bosses/BossSystem.ts` y `src/presentation/pixi/BossView.ts`: datos, reglas, movimiento y representación separadas del boss; `BossVisualTokens.ts` mantiene su paleta RGB comprobable.
- `src/main.ts`: composition root y bootstrap de Pixi/spikes.
- `src/content/`: configuración data-driven.
- `src/simulation/hazards/LaserHazard.ts`: patrón de referencia para hazard puro y testeable.
- `skills/geometry-survivor-svg/`: contrato code-first para futuros SVG.
- `docs/performance/F0_SPIKES.md`: mediciones y protocolo de rendimiento.

## 11. Evidencia pendiente, no asumir

- El usuario reporta varias runs manuales completas de 5–6 minutos; falta registrar el número exacto y sus resultados.
- Laser, elite, segunda expansión, boss y curva reciente tienen pruebas automáticas; el browser smoke ya cubre carga, input, pausa, level-up, storage local, consola/red, la matriz de resize y el acceso rápido al boss con sus dos patrones. El atajo y varias runs completas también fueron probados manualmente por el usuario; falta registrar el número exacto de runs y sus resultados.
- No hay evidencia de Poki Inspector o CrazyGames Preview porque los SDK aún no están integrados.
- No existen resultados manuales en móvil de context loss, storage bloqueado ni una run completa registrada con dispositivo y FPS; audio integrado, pausa, volumen y silencio ya fueron validados por el usuario.
- La diversión, claridad y balance no pueden declararse aprobados sólo con tests.

## 12. Registro de sesión — auditoría de modularidad

Fecha: 28-08-2026.

Estado al cerrar esta sesión:

- `main` permanece sincronizado con `origin/main`; las sesiones de audio/pausa y SVG quedan registradas en commits de cierre identificables.
- La base sigue respetando la separación `content → simulation → snapshot → presentation`, con plataforma aislada mediante puertos/adaptadores.
- No se encontraron imports prohibidos desde `simulation`/`content` hacia Pixi, DOM, UI, plataforma, audio o SDKs.
- No se encontraron ciclos de dependencias en `src`.
- TypeScript estricto, `npm run validate`, `npm run build:poki` y `npm run build:crazygames` pasan; última suite: 88 tests en 31 archivos y 8 smoke tests browser.
- Los adaptadores `.grok/skills/` siguen apuntando a las skills canónicas de `skills/`; Grok 4.6 y GPT/Codex deben recibir las mismas reglas mediante `AGENTS.md`.
- El modelo de partida vigente es una run con objetivo: sobrevivir hasta el boss y derrotarlo alrededor de 4:20. La victoria es intencional; un modo infinito queda para una fase posterior.

Estado y pendientes prioritarios:

1. En `src/app/Game.ts`, `finishRun()` ya crea el resumen con `createRunSummary(outcome, ...)`; `src/app/Game.test.ts` confirma que una victoria llega al overlay como `victory`.
2. El arco seguro del boss ya inicia cada segmento con `beginPath()`: esto evita la diagonal que PixiJS producía al heredar `(0,0)` después de dibujar el círculo. `src/presentation/pixi/BossView.test.ts` cubre arcos normales y wrap-around. Repetir en móvil el encuentro publicado y comprobar que no aparece la diagonal, además de movimiento orbital, telegraphs, derrota y texto “Victoria”.
3. Browser smoke en CI completado con Playwright/Chromium: carga, teclado/pointer, pausa, level-up, persistencia local, context loss, consola/red, matriz de resize y drag touch emulado se ejecutan sobre `dist/local` antes del deploy. Audio integrado tiene regresiones unitarias, incluido constructor rechazado; lifecycle y storage bloqueado en móvil real siguen siendo una comprobación manual.
4. Los hallazgos de concentración se abordaron sin fragmentación especulativa: stress está en `StressCombatScenario`, la selección temporal está en `EnemySpawnDefinitions` y el contrato de render no expone campos mutables de gameplay. `CombatWeaponSystem` y `Game` conservan fronteras cohesivas con umbral explícito para futuras extracciones.

Limitaciones de esta sesión:

- El smoke automatizado se ejecutó localmente en Chromium: 7 escenarios correctos (6 desktop y 1 Pixel 5 emulado) sin errores de consola/red. Esto no sustituye la verificación visual ni el lifecycle de audio/storage en un móvil físico.
- Se modificaron `src/audio/AudioService.ts`, `src/simulation/enemies/EnemySystem.ts`, `src/simulation/combat/CombatRenderState.ts` y `src/simulation/combat/CombatWeaponSystem.ts`; se añadieron `EnemySpawnDefinitions`, `StressCombatScenario` y el smoke touch móvil. El audio degrada a silencio si el navegador rechaza la construcción, y la documentación/README incluye la instalación reproducible de Chromium.

Para retomar en otra PC:

1. Abrir `C:\PROYECTOS\pruebas_geo` como raíz y leer `AGENTS.md` y este archivo.
2. Ejecutar `git status --short --branch`, `npm run typecheck` y `npm test`.
3. Ejecutar `npm run test:browser`, `npm run build:poki` y `npm run build:crazygames`.
4. Publicar en `main` y repetir la URL normal de GitHub Pages para la run completa; usar `?boss=1` para repetir el encuentro corregido sin esperar 4:20.

## 13. Continuación — audio y pausa manual

Fecha: 28-08-2026.

Implementado en esta sesión:

- `#pause-toggle` ofrece pausa directa con un objetivo táctil amplio y se oculta durante level-up, pausa o fin de run;
- `PauseOverlay` añade continuar, configuración de música/SFX/silencio y reinicio seguro desde pausa;
- `GameState.restartFromPause()` impide reinicios accidentales desde estados terminales o transitorios;
- los cambios de audio se aplican al `WebAudioService` y se guardan con el schema existente de `SaveStore`;
- la música procedural usa un patrón de ocho pasos con bajo, melodía y armonía, sin archivos remotos ni dependencia npm;
- smoke browser: 88 tests unitarios/integración y 8 escenarios browser (incluido Pixel 5 emulado) pasan.

Decisión de assets/librerías: se revisaron ZzFX/ZzFXM y Kenney Sci-Fi Sounds. Se mantienen como candidatos documentados, pero no se incorporan aún para respetar el presupuesto, el requisito de builds autocontenidos y la regla de no añadir dependencias para una utilidad pequeña. El usuario validó auditivamente el audio integrado; antes de cerrar Fase 6 queda decidir si una pista local comprimida justifica su peso.

Para retomar: abrir pausa en la URL publicada, desplegar “Configuración”, cambiar música/SFX/silencio, reanudar y recargar para comprobar persistencia. El botón “Reiniciar partida” debe devolver la run a `00:00` sin recarga.

## 14. Continuación — SVG UI

Fecha: 28-08-2026.

- `src/assets/svg/ui/pause.svg` y `settings.svg` son masters code-first de 24×24, inline, recoloreables con `currentColor` y sin filtros ni recursos externos;
- `main.ts` los monta en los botones existentes; el hit-area y la etiqueta accesible siguen siendo HTML;
- `SvgAssets.test.ts` valida `viewBox`, `preserveAspectRatio`, IDs prefijados y ausencia de scripts, raster, handlers o URLs externas;
- smoke browser confirma que ambos iconos aparecen junto con pausa, configuración, persistencia y touch emulado.

El siguiente bloque visual puede reutilizar este contrato para un asset de player o enemigo; no se parsearán SVG nuevos por frame ni se modificarán reglas de simulación.

## 15. Continuación — audio Howler + ZzFX

Fecha: 28-08-2026.

- `AudioManager` sustituye al adaptador procedural temporizado como fachada de audio y sigue cumpliendo el contrato `AudioService` que usa `Game`;
- la música se reproduce con `HowlerMusicBackend`: instancia la pista sólo en el primer gesto de usuario, mantiene una única pista looping y conserva su estado al pausar, reanudar o reiniciar;
- mientras no exista una composición licenciada, `PrototypeMusicSource` genera una pista WAV local en memoria. No hay request de red ni asset externo; la sustitución futura debe aportar `WebM/Opus` + `MP3` locales;
- `ZzfxSfxBackend` toma el `AudioContext` ya desbloqueado por Howler y produce efectos desde recetas contenidas en `AudioCueDefinitions`. Tiene límite de ocho voces y cooldown por cue; `enemy-defeated` ya usa esa ruta sin tocar la simulación;
- las dependencias `howler`, `zzfx` y `@types/howler` se fijaron en `package-lock.json`. La adaptación local de ZzFX evita importar su entrypoint directamente porque éste construye un contexto de audio al cargarlo, algo incompatible con el desbloqueo móvil diferido;
- antes de cerrar el hito, desplegar en GitHub Pages y comprobar en móvil: primer gesto, pausa/reanudar, reiniciar, mute, cambio de volúmenes y volver desde segundo plano. Si el navegador rechaza audio, la run debe seguir silenciosa y sin error de consola.

## 16. Continuacion — primer enemigo SVG

Fecha: 28-08-2026.

- se amplio la skill SVG con una ficha obligatoria de diseno, reglas top-down y una rubrica de reconocimiento antes de generar XML;
- `src/assets/svg/enemies/turtle/turtle.svg` es el primer master code-first de personaje: viewBox centrado, piezas semanticas, silueta reconocible y 12 primitivas sin filtros;
- `CombatEntitiesView` convierte el master a una textura Pixi una sola vez y la comparte en el pool. El chaser conserva sus radios, velocidad y colisiones de simulacion;
- `SvgEnemyAssets.test.ts` cubre el contrato estructural y el limite geometrico; la inspeccion raster en fondo oscuro/claro confirmo lectura a 32/96/384 px;
- antes de convertir la tortuga en diseno definitivo, probar la URL publicada en movil y observarla durante gameplay real con enemigos, UI y hazards simultaneos. Si funciona, continuar con player y luego las familias fast/tank/elite respetando siluetas distintas.

## 17. Continuacion — orientacion y animacion de personajes

Fecha: 28-08-2026.

- `EnemyState` expone velocidad visual (`vx`, `vy`) calculada en simulacion, sin importar Pixi ni cambiar reglas de combate;
- `TurtleVisual` compone cuatro texturas SVG alineadas, conserva la pose neutra con cabeza hacia `-Y` y orienta el contenedor con `atan2(vy, vx) + PI/2`. La marcha balancea patas por pares, hace bob de cabeza y una respiracion de 0.8 %, todo mediante transforms cacheados;
- el orden de composicion queda fijado como patas traseras, patas delanteras, caparazon y cabeza, para que las patas delanteras no se dibujen encima del caparazon;
- las piezas se crean de forma diferida por ranura del pool al primer `chaser` y luego se reutilizan; al cambiar de especie se limpia la posicion padre para evitar offsets heredados;
- el tiempo de presentacion avanza solo mientras la simulacion esta jugando, por lo que la animacion queda congelada durante pausa, level-up y game over;
- `TurtleVisual.test.ts` cubre frente, direccion y velocidad cero; `SvgEnemyAssets.test.ts` mantiene el contrato estructural de las piezas;
- la tortuga sigue siendo el patron de revision: silueta, direccion, piezas, amplitud, lectura a 32 px y rendimiento antes de crear player o nuevas familias de enemigos.

## 18. Continuacion — frame comun para piezas SVG

Fecha: 28-08-2026.

- la prueba movil revelo que Pixi recortaba cada pieza de la tortuga a sus limites visibles, cambiando su centro aunque todas compartieran `viewBox`;
- `SvgTextureFactory` exige un frame logico explicito al rasterizar y la tortuga usa `(-32, -32, 64, 64)` para master, caparazon, patas y cabeza;
- la regla canonica queda en la skill SVG: un personaje modular comparte `viewBox`, frame de textura, ancla y escala; no se corrige el recorte con offsets manuales dentro del dibujo;
- `SvgTextureFactory.test.ts` protege el frame y el ancla para futuras criaturas;
- una captura del render Pixi en Pixel 5 emulado confirmo tortugas completas y orientadas hacia el jugador desde varios lados de la arena.

## 19. Continuacion - organizacion por personaje y cartas SVG

Fecha: 28-08-2026.

- La estructura por dominio queda establecida: `src/assets/svg/enemies/<id>/`
  contiene los masters y pruebas del asset; `src/presentation/pixi/enemies/<id>/`
  contiene su compositor y animacion; `src/assets/svg/characters/<id>/` y
  `src/presentation/pixi/characters/<id>/` siguen el mismo contrato para player
  y futuros personajes. Cada carpeta tiene un README corto con su responsabilidad.
- `src/ui/level-up/LevelUpOverlay.ts` ya vive junto a
  `UpgradeCardVisual.ts`; la UI no decide dano, XP, rareza ni progresion. El
  mapa visual por `UpgradeId` permite agregar cartas sin duplicar markup ni
  tocar la simulacion.
- `src/assets/svg/ui/level-up/card-frame.svg` define el marco escalable por
  variables CSS y `icons.svg` es un sprite de seis simbolos referenciados con
  `<use>`. El texto y la zona tactil siguen siendo botones HTML accesibles.
- `LevelUpSvgAssets.test.ts` valida viewBox, `preserveAspectRatio`, IDs
  prefijados y ausencia de raster, filtros, scripts, handlers o URLs externas;
  `UpgradeCardVisual.test.ts` exige cobertura visual para cada upgrade existente.
- La estrategia responsive esta documentada: tres cartas en desktop, una
  columna en portrait, safe-area y reduced-motion. El resize solo cambia
  presentacion y no modifica la simulacion.

Verificacion de esta continuacion: typecheck, suite unitaria, smoke browser y
builds local/Poki/CrazyGames completados; el commit `9045c6e` esta publicado en
`main`.

## 20. Continuacion - feedback premium de cartas

Fecha: 28-08-2026.

- `LevelUpCardInteraction.ts` fija los eventos semanticos `focus`, `blur`,
  `press` y `select`, sin exponer Pixi a la UI ni mezclar reglas de progresion.
- `LevelUpOverlay` conserva botones HTML/SVG accesibles, aplica una confirmacion
  de 220 ms, marca la opcion elegida con `aria-pressed` y atenúa las restantes.
- `LevelUpFxView` agrega aura, aura interior, anillo, rayos y una rafaga de 24
  sprites reutilizados. El efecto se ancla en espacio logico, tiene reloj propio
  durante la pausa, respeta `prefers-reduced-motion` y no intercepta input.
- El resize solo vuelve a sincronizar anclas. No se anadio `pixi-filters`: se
  validara un glow filtrado unicamente como spike con presupuestos Low/High.
- La captura automatizada de Pixel 5 confirma foco y seleccion; la prueba tactil
  fisica del usuario sigue siendo la ultima comprobacion de sensacion y legibilidad.

Archivos principales: `src/ui/level-up/LevelUpOverlay.ts`,
`src/ui/level-up/LevelUpCardInteraction.ts`,
`src/presentation/pixi/ui/level-up/LevelUpFxView.ts`,
`src/app/Game.ts` y `src/presentation/viewport/ViewportTransform.ts`.

## 21. Continuacion - pantalla de inicio premium

Fecha: 28-08-2026.

- `GameState` admite la fase `menu`; la simulacion no avanza y el input no se
  conecta hasta que el usuario pulsa `JUGAR`. El atajo `?boss=1` conserva el
  arranque directo para pruebas.
- `src/ui/StartScreen.ts` controla la vista DOM, el CTA, ajustes de audio y la
  mejor marca. `JUGAR` desbloquea Howler/ZzFX dentro del gesto movil y activa
  input, HUD, lifecycle y musica en una unica transicion.
- `src/assets/svg/ui/start/mark.svg` define el nucleo/orbitas como master
  vectorial code-first; la pantalla combina gradientes, rejilla, safe-area y
  animacion CSS ligera. No se usa un segundo canvas ni una segunda simulacion.
- Niveles y skins aparecen como botones deshabilitados con `data-feature`
  (`level-select`, `skins`), listos para consumidores futuros sin tocar el
  engine ni duplicar el menu.
- La captura desktop y portrait confirma que el panel, CTA y acciones caben sin
  scroll inesperado; el usuario debe validar en su movil la respuesta tactil y
  el desbloqueo de audio desde la URL publicada.

El spike de FX de cartas queda conscientemente abierto: el plan conserva el
baseline actual y una matriz para comparar glow aditivo, `GlowFilter` y
`ParticleContainer` con mediciones antes de elevar el presupuesto visual.

## 22. Continuación — escena SVG dinámica de presentación

Fecha: 31-08-2026.

- `src/assets/svg/ui/start/hero-scene.svg` añade una escena ambiental
  vectorial code-first con órbitas, rayos, nodos, barridos, fragmentos y un
  núcleo central. Usa `viewBox="0 0 1200 900"`, no contiene raster, scripts,
  recursos externos, filtros ni máscaras complejas, y todos sus IDs usan el
  prefijo `ui-start-hero-`.
- `StartScreen` monta la escena una sola vez en `#start-scene`; permanece
  decorativa (`aria-hidden` y `pointer-events: none`) mientras el texto, foco y
  hit-area continúan siendo HTML accesible.
- CSS anima únicamente transformaciones, opacidad y `stroke-dashoffset` en
  ciclos lentos: órbitas, pulsos de nodos, barridos de luz, respiración del
  núcleo y una pasada de brillo sobre el panel. No se reconstruye el XML ni se
  crea un segundo canvas o una segunda simulación.
- `prefers-reduced-motion` detiene las animaciones y reduce la opacidad de la
  escena; portrait, landscape y safe-area conservan el CTA y el layout de
  acciones.
- `StartSvgAssets.test.ts` valida el contrato del nuevo master y el smoke de
  navegador confirma que la escena está montada antes de jugar. La inspección
  visual en 1280×720 y 390×844 no mostró solapamiento del panel, scroll
  inesperado ni pérdida de legibilidad.
- `npm run typecheck`, `npm test` (89 tests), `npm run test:browser` (8 smoke),
  y builds local/Poki/CrazyGames quedan como puertas antes de publicar.

La próxima mejora visual debe medirse en el teléfono de referencia. Sólo si la
escena SVG/CSS resulta insuficiente se abrirá un spike Pixi separado con un
pool pequeño de partículas; no se añadirá `pixi-filters` ni una textura
recalculada por frame sin evidencia de coste y beneficio.

## 24. Continuación — marco cromático del panel inicial

Fecha: 31-08-2026.

- El borde exterior de `.start-screen-panel` anima `border-color` en un ciclo
  lento cyan → violeta → dorado → mint → cyan, con 14 segundos por vuelta.
- La línea interna (`::before`) usa el mismo recorrido con un desfase de 2.5
  segundos para crear profundidad sin añadir filtros ni capas grandes.
- `prefers-reduced-motion` detiene ambos ciclos y conserva el color base cyan.
- El efecto sólo pinta dos bordes pequeños; no toca el fondo, el canvas, la
  simulación ni el input. Los builds local/Poki/CrazyGames y los 89 tests pasan.

## 23. Continuación — estabilización de la escena en móviles

Fecha: 31-08-2026.

- La pantalla y `#start-scene` permanecen visibles durante toda la ejecución;
  la revisión local confirmó que no hay un cambio de fase ni un `display:none`
  intermitente.
- La causa más probable del parpadeo observado en ciertos GPU móviles era la
  combinación de rotaciones de grupos SVG grandes, gradientes desplazados y
  varias superficies compuestas mientras el panel usa `backdrop-filter`.
- La animación se ajustó para mantener la escena estable: el grid y los
  desplazamientos de capas grandes son estáticos; las órbitas usan
  `stroke-dashoffset`, las luces usan opacidad y sólo los nodos pequeños
  conservan un pulso de escala. El efecto visual dinámico se mantiene sin
  reconstruir el SVG.
- Las capas de luz ya no llegan a opacidad cero en el reinicio del ciclo; así
  se evita un destello de apagado/encendido que podía parecer una desaparición.
- La inspección local en portrait (390×844) a 0, 3, 6 y 9 segundos conservó el
  panel, el CTA y el SVG; typecheck y la suite de 89 tests deben repetirse
  antes de publicar este ajuste. La validación final requiere volver a abrir
  la URL publicada en el móvil de referencia.
- Tras el ajuste, `npm run typecheck`, `npm test` (89 tests) y los builds
  `local`, `poki` y `crazygames` son correctos. El escenario browser específico
  de menú llegó a ejecutar su aserción completa, aunque el runner local dejó
  vivo el servidor de preview al cerrar y se detuvo manualmente; no reportó
  errores de aplicación.

## 25. Continuación — plan de juice visual mobile-first

Fecha: 31-08-2026.

La siguiente iteración visual queda definida en `PLAN_DESARROLLO.md` §15.6.
No se implementan todavía efectos nuevos en esta sesión; se fija el orden para
que cada cambio pueda probarse en GitHub Pages desde el móvil y pueda revertirse
sin tocar la simulación.

- El lenguaje visual vigente (geometría limpia, neón cyan/violeta/mint/dorado,
  contraste alto y animación breve) se convierte en tokens compartidos por UI,
  player, enemigos, hazards y FX.
- Se crearán un `FxPool`, recetas `ImpactFX`, `DamageNumberView` y
  `HealthBarView` en presentación Pixi. La simulación sólo emitirá eventos; no
  importará Pixi, DOM ni audio.
- El player será modular (`shadow`, `outer-ring`, `body`, `core`, armas y
  accent), con dos skins de prueba sin estadísticas ni reglas propias.
- Los impactos usarán flash, scale-punch y recoil visual; las muertes comunes
  harán fade/shrink y las criaturas modulares podrán desarmarse en fragmentos
  cacheados. El boss y la muerte del player tendrán secuencias breves propias.
- Los números de daño se agruparán y limitarán; las mini barras sólo aparecerán
  en objetivos dañados recientemente y elites/tanks, nunca sobre cientos de
  enemigos de forma permanente.
- Low/Medium/High controlarán partículas, trails, glow, texto y barras sin
  cambiar telegraphs, controles ni gameplay. `prefers-reduced-motion` elimina
  movimiento y fragmentos, pero conserva la información esencial.
- Orden de trabajo: tokens/contratos → player y daño recibido → impacto/muerte
  de chaser → tank/elite/boss → números/barras → muerte del player → skins →
  comparación de presets en `?stress=1`.
- La puerta de la fase exige 60 FPS objetivo, al menos 30 FPS jugables bajo
  stress, legibilidad del player y hazards, ausencia de efectos huérfanos en
  pausa/resize/restart y validación de los tres builds.

## 26. Continuación — primera implementación de juice y player

Fecha: 31-08-2026.

- `VisualTokens.ts` centraliza skins, colores y presupuestos de FX; no hay
  colores duplicados en `PlayerView` ni límites dispersos en el compositor.
- El player dejó de ser dos círculos: ahora usa un master SVG y seis piezas
  cacheadas (sombra, anillo, emisores, cuerpo, núcleo y acentos) con la misma
  caja lógica. `PlayerView` soporta orientación por movimiento, pulso idle,
  recoil y flash/compresión visual al recibir daño.
- `FxPool` reutiliza sprites y mantiene una capacidad fija. `ImpactFxView`
  dibuja el anillo y las partículas del primer impacto del player; respeta
  `prefers-reduced-motion`, pausa y descarte por presupuesto.
- La variante `?skin=violet` permite comparar la segunda paleta en Pages; el
  parámetro opcional `?quality=low|medium|high` reduce o aumenta el presupuesto del
  primer recipe. La URL normal sigue usando `cyan`/`medium`.
- La simulación continúa sin imports de Pixi/DOM/audio. `Game` sólo reenvía el
  evento de daño aceptado a la fachada de presentación; no cambia vida,
  invulnerabilidad, XP, colisiones ni timestep.
- Validación: typecheck correcto, 95 tests unitarios/integración, builds local,
  Poki y CrazyGames correctos y los 8 smoke browser (incluido Pixel 5 touch)
  correctos. Pendiente: inspección visual manual en el teléfono publicado.

## 27. Continuación — locker de skins cosméticas

Fecha: 31-08-2026.

- El botón `#start-skins` del menú principal ya está habilitado y abre una
  escena completa de locker dentro del mismo panel. Incluye volver al menú,
  preview grande, colección, estado equipada/bloqueada y acción de adquirir o
  equipar.
- `src/content/visual/SkinDefinitions.ts` es el catálogo único de contenido:
  Núcleo Aurora (`cyan`) se entrega de inicio y Prisma Violeta (`violet`) se
  adquiere gratis como flujo de demostración. Añadir otra skin requiere ampliar
  el tipo, la paleta y una definición, no duplicar la pantalla.
- `src/ui/skins/SkinSelectPanel.ts` contiene la administración DOM y los
  botones accesibles; `SkinPreviewSvg.ts` genera un preview vectorial pequeño
  por código. El jugador real sigue usando sus piezas SVG cacheadas de Pixi.
- `SaveStore` está en schema v2 y migra guardados v1. Persiste
  `skins.selected` y `skins.unlocked`, fuerza cyan como fallback seguro y
  garantiza que nunca se equipe una skin no adquirida.
- `Game` toma la selección guardada al iniciar y `PixiGameView.setPlayerSkin`
  actualiza la vista en vivo. Las skins son cosméticas: no cambian simulación,
  daño, vida, velocidad, colisiones, XP ni balance. `?skin=cyan|violet` sigue
  disponible como override de desarrollo.
- El layout usa HTML/SVG, safe-area, portrait y landscape; no crea un canvas,
  filtro ni textura por tarjeta. `prefers-reduced-motion` elimina el levitado
  del preview y conserva la información y el foco.

Validación de la sesión: typecheck correcto, 97 tests unitarios/integración,
build local correcto y 8 smoke browser (desktop + Pixel 5 touch) correctos,
incluyendo abrir el locker, adquirir/equipar violeta y comprobar el guardado.
Pendiente para el móvil real: revisar escala de texto y sensación táctil en la
URL publicada. La economía meta, costes, inventario amplio y skins con ventajas
siguen fuera de alcance hasta definir esa progresión.

## 28. Continuación — firmas visuales y desplazamiento del locker

Fecha: 31-08-2026.

- El locker ahora contiene cuatro skins con identidad geométrica propia:
  Aurora Strider (`cyan`), Eclipse Prism (`violet`), Solar Bastion (`amber`) y
  Verdant Vector (`emerald`). Ya no son variantes basadas solamente en color.
- `SkinSignatureSvg.ts` genera una pieza vectorial adicional por skin:
  órbitas segmentadas, fragmentos cristalinos, corona solar o aspas orgánicas.
  Todas comparten `viewBox="-32 -32 64 64"`, frame y ancla; se rasterizan una
  vez por skin y se reutilizan en Pixi.
- `PlayerView` compone la firma encima de la sombra y la anima con rotación y
  pulso de baja amplitud según tokens. El preview SVG del locker añade casco,
  emisores, núcleo, detalle interno y firma periférica; CSS anima cada familia
  sin filtros ni canvas secundario.
- El panel usa cuatro tarjetas y permite scroll vertical en portrait. Se
  habilitó `touch-action: pan-y` sólo en el overlay/panel; el canvas de juego
  conserva su gesto `none`.
- La prueba browser de Pixel 5 verifica que `scrollHeight` supera la altura
  visible y que `scrollTop` cambia. También se mantiene la prueba de adquirir y
  equipar la skin violeta y persistir la selección.

Validación actual: typecheck correcto, 98 tests unitarios/integración, builds
local/Poki/CrazyGames generados y smoke browser ampliado a 9 escenarios (7
desktop y 2 Pixel 5), incluido el desplazamiento del locker. Sólo queda la
revisión visual en el teléfono físico; `prefers-reduced-motion` conserva la
lectura y elimina las animaciones decorativas.

## 29. Continuación — corrección de parpadeo del locker móvil

Fecha: 01-09-2026.

- La auditoría encontró repintado excesivo al reconstruir las cuatro tarjetas
  y sus SVG cada vez que se elegía una skin. `SkinSelectPanel` ahora monta las
  tarjetas una vez y actualiza estado, clases, ARIA y texto sin destruir los
  nodos ni reiniciar todas las animaciones.
- `StartScreen` marca el root con `is-skins-mode`. En viewport de hasta 60rem,
  ese modo congela las animaciones del fondo, los grupos SVG de la escena, el
  marco del panel y las cuatro miniaturas. El preview grande de la skin
  equipada conserva una animación de baja intensidad (levitación, opacidad y
  dash), sin rotaciones/escala de grupos SVG. Se mantienen gradientes,
  contraste, scroll y controles; el menú principal conserva su movimiento en
  escritorio.
- El preview equipado y la cabecera quedan fijos como una celda congelada; el
  único scroll es `#start-skin-cards`, que se reinicia al abrir el locker. Así
  la elección permanece visible mientras se comparan las skins.
- La congelación es un preset de estabilidad para GPU móvil, no una regla de
  gameplay ni una segunda escena. Un futuro spike con dispositivo real puede
  reactivar una animación aislada si las mediciones lo permiten.

Validación de esta sesión: typecheck correcto, 98 tests unitarios/integración y
9 smoke browser (incluido Pixel 5) correctos. El smoke móvil comprueba que el
modo locker congela panel, atmósfera y miniaturas, mantiene sólo la animación
suave del preview equipado y conserva el desplazamiento vertical.

## 30. Continuación — feedback pooled de impactos y derrotas enemigas

Fecha: 01-09-2026.

- `EnemyImpactFxView` añade un anillo expansivo y fragmentos geométricos con
  capacidad fija para impactos y derrotas. Los colores salen del catálogo de
  enemigos; los fragmentos son presentación y nunca colisionan ni conceden XP.
- `CombatEntitiesView` detecta una caída de vida entre frames para disparar el
  impacto y aplica un scale-punch de 4.5% durante 120 ms. La derrota se dispara
  desde el evento `enemyDefeated` de `Game`, por lo que no se pierde cuando un
  slot pooled se libera y se reutiliza en el mismo tick.
- `PixiGameView` mantiene la frontera: recibe el evento, actualiza la vista y
  avanza/limpia el FX junto con el resto de la presentación. `resetPresentation`
  borra pools y snapshots para que reiniciar no produzca muertes fantasma.
- El preset `prefers-reduced-motion` conserva el anillo informativo y descarta
  fragmentos. La capacidad sigue limitada por `FxQuality`; no se crean nodos
  DOM, texturas SVG por impacto ni cambios en simulación, daño, XP o timestep.

Validación de esta sesión: typecheck correcto, 99 tests unitarios/integración,
smoke browser normal y móvil correctos, y builds local/Poki/CrazyGames generados.
Quedan pendientes para las siguientes puertas: números de daño agrupados,
mini-barras recientes y la secuencia especial de muerte del boss/player.

## 31. Continuacion — anclaje de tortuga y polvo de impacto

Fecha: 01-09-2026.

- Se corrigio el salto lateral de la tortuga al recibir dano. No era una
  reconstruccion de SVG: el `scale-punch` del padre escalaba la posicion mundial
  de las piezas desde el origen. La regla queda fijada: la ranura pooled posee
  la posicion mundial y `TurtleVisual` usa espacio `local` al integrarse en
  combate. Previews aislados pueden seguir usando espacio `world`.
- `EnemyImpactFxView` reemplaza las chispas del impacto normal por polvo breve
  con textura circular cacheada. Reutiliza el mismo `FxPool`, sin crear sprites
  ni texturas durante gameplay: 3/4/5 motas Low/Medium/High, nacen en el borde
  visible de la silueta (incluida la tortuga SVG), conservan velocidad de rafaga
  y tienen tamano legible en portrait movil. El descarte al llenarse el pool se
  mantiene. Los fragmentos de derrota son geometricos; el desarme de las cuatro
  piezas SVG de la tortuga aun no esta implementado.
- `FxPool` conserva escala, alpha y textura iniciales por slot, por lo que una
  misma capacidad fija puede servir recetas cacheadas distintas sin allocations
  en la ruta caliente. El cambio continua siendo solo de presentacion y
  respeta `prefers-reduced-motion`.

Validacion de esta sesion: typecheck correcto, 101 pruebas
unitarias/integracion, 9 smoke browser (incluido movil) y builds
local/Poki/CrazyGames correctos.

## 33. Continuacion — cierre visual de player y boss

Fecha: 01-09-2026.

- `PlayerView` conserva sus piezas SVG cacheadas y, al morir, separa armas,
  cuerpo, core y acento mediante transforms durante 0.9 s mientras se desvanece.
- `TerminalFxView` reutiliza un pool acotado para un anillo/burst de siete piezas
  del player, una capa gris semitransparente y un cierre mas amplio del boss. El
  panel de resumen deja ver el tono y la periferia de la explosion sin esperar a
  terminar la animacion ni bloquear reinicio.
- `AudioCueDefinitions` incorpora `player-defeated`: una receta ZzFX grave y
  descendente de 0.9 s con cooldown propio, usando el mismo contexto compartido.
- `Game` solo dispara las recetas desde los eventos ya existentes; la simulacion
  y los contratos de victoria/game-over permanecen sin cambios.

Validacion de esta sesion: typecheck correcto, 105 pruebas
unitarias/integracion, 9 smoke browser (incluido movil) y builds
local/Poki/CrazyGames correctos.

## 32. Continuacion — numeros de dano y mini-barras acotadas

Fecha: 01-09-2026.

- `DamageNumberView` mantiene un pool fijo de `Text` Pixi: Low no emite texto,
  Medium/High reservan 16/24 slots. Agrupa golpes de la misma ranura durante
  80 ms, asciende brevemente y descarta nuevos textos al llenarse, sin DOM ni
  cambios de simulacion.
- `HealthBarView` redibuja una unica geometria compartida con limite 8/16/24.
  Tanks y elites tienen prioridad permanente; chasers/fast aparecen solo un
  segundo despues de recibir dano. El boss conserva exclusivamente su HUD.
- `CombatEntitiesView` es el unico consumidor: ya detectaba el delta de vida
  para el impacto, por lo que reusa esa observacion para ambas vistas y las
  limpia al reiniciar. Ninguna de las nuevas vistas decide dano, XP, colisiones
  o dificultad.

Validacion de esta sesion: typecheck correcto, 104 pruebas
unitarias/integracion, 9 smoke browser (incluido movil) y builds
local/Poki/CrazyGames correctos.

## 34. Continuacion - muerte del jugador visible y resumen diferido

Fecha: 01-09-2026.

- La derrota del jugador conserva las piezas SVG de `PlayerView` y las separa
  durante 2.2 s. La posicion de la ranura no cambia: solo se aplican transforms
  de presentacion a armas, cuerpo, core, acento, anillo y firma.
- `TerminalFxView` amplia el cierre del player con 10 fragmentos del pool,
  velocidades radiales, arrastre suave y anillo de 3.4 radios. Un `Graphics`
  gris overscan cubre la zona visible completa en portrait y landscape; el boss
  mantiene su receta mas corta y discreta. El tono gris permanece durante la
  ventana completa de 3 s aunque la separacion del player termina a los 2.2 s.
- La receta ZzFX `player-defeated` continua siendo opcional y rate-limited. No se
  crean contextos ni nodos de audio durante la muerte y el fallo de audio no
  bloquea la run.
- `Game.finishRun` guarda el resultado inmediatamente, pero abre el overlay
  despues de 3 s. El timer se limpia en `resetRunState` y `shutdown`, y verifica
  que la fase siga terminal antes de tomar foco.

Validacion de esta sesion: typecheck correcto, 105 pruebas unitarias/integracion,
9 smoke browser (desktop + Pixel 5) y builds local/Poki/CrazyGames correctos.
En movil real hay que comprobar que el efecto se percibe completo antes del
resumen; la puerta humana sigue siendo mantener 60 FPS y que el boton de
reinicio aparezca tras el cierre visual.

## 35. Continuacion - secuencia especial de derrota del boss

Fecha: 01-09-2026.

- `TerminalFxView` conserva el burst del pool, pero ahora el boss tiene una
  lectura propia de colapso: dos anillos se separan, el nucleo se comprime y
  dos fragmentos de energia se abren antes de desaparecer.
- La receta dura 1.2 s y sigue debajo del modal diferido de 3 s. No retiene la
  simulacion, no altera el resultado de victoria y no crea una segunda entidad
  de gameplay.
- Cada arco o circulo inicia su subpath de forma explicita; el efecto usa solo
  tres `Graphics` reutilizados (ring, collapse y core) y el pool acotado de
  fragmentos. `prefers-reduced-motion` conserva anillos y elimina particulas.

Validacion pendiente de esta iteracion: comprobar en `?boss=1` que el boss se
desplace, se derrote y deje ver la secuencia completa antes del resumen, ademas
de repetir typecheck, tests, smoke browser y los tres builds.

## 36. Continuacion - feedback de disparo y estelas

Fecha: 01-09-2026.

- `PlayerView` agrega recoil local de los emisores y un destello geometrico de
  90 ms. `Game` usa el contador de disparos de `CombatSimulation` y colapsa
  multiples disparos en un solo pulso por frame para no saturar el player ni el
  bus de audio.
- `AudioCueDefinitions` incorpora `player-shot` con cooldown de 80 ms. Howler y
  ZzFX siguen detras de `AudioService`; el cue falla de forma silenciosa si el
  contexto no fue desbloqueado.
- `ProjectileTrailView` dibuja estelas cortas con una `Graphics` reutilizada:
  Low 0, Medium 64 y High 120 segmentos maximos. Las ranuras se marcan activas
  para evitar lineas fantasma al reciclar un proyectil y `reset()` limpia todo.
- `CombatEntitiesView` conserva la jerarquia de capas: estela bajo enemigos y
  sobre el sprite del proyectil. No se crean nodos ni texturas durante el loop.

Validacion de esta iteracion: typecheck correcto, 108 pruebas
unitarias/integracion, 9 smoke browser (desktop + Pixel 5) y builds
local/Poki/CrazyGames correctos. Pendiente humano: comprobar en el movil real
el destello/recoil/trail, especialmente con `?stress=1`, y registrar FPS.

## 37. Continuacion - origen exacto y carta Doble canon

Fecha: 01-09-2026.

- `WeaponDefinitions` define las dos anclas logicas del arma en el mismo marco
  64x64 de los SVG. `CombatWeaponSystem` rota esas anclas con la direccion del
  objetivo y coloca el proyectil en el origen, no en el centro del player.
- La configuracion base alterna los emisores izquierdo/derecho. El nuevo
  `twin_emitters` es una mejora data-driven de una sola acumulacion: genera dos
  proyectiles, registra una mascara de bocas y conserva un solo burst de audio.
- `ShotRenderState` es estable y pooled: incluye secuencia, direccion, mascara
  y origen de cada boca. `PlayerView` usa el mismo descriptor para orientar
  temporalmente el arma y dibujar uno o dos destellos exactamente donde nace
  cada bala.
- El stress reutiliza la misma transformacion y `Game` condensa el feedback por
  frame para no saturar audio/GPU. No se agregan nodos ni objetos por disparo.

Validacion de esta iteracion: typecheck correcto, 110 pruebas
unitarias/integracion y carta incluida en el mapa visual. Pendiente humano:
comprobar en movil la alternancia, la alineacion bala/destello y la carta Doble
canon durante `?stress=1`, ademas de repetir smoke browser y los tres builds.

## 38. Continuacion - investigacion de canones y skins de proyectil

Fecha: 01-09-2026.

La siguiente ampliacion visual esta aprobada como cosmetic-only. Los SVG seran
masters rasterizados una vez a texturas compartidas; las balas seguiran siendo
sprites reutilizados y sus estelas tendran recetas pooled. La ruta curva sera
un arco visual del trail, no una curva de la posicion simulada. Humo y glow
deben tener limites por calidad: Low sin trail/filtro, Medium con pocos
segmentos y High con un glow pequeno. Pixi advierte que los filtros cuestan
GPU y que no se debe reconstruir `Graphics` constantemente.

El commit `7beb11e` ya deja la frontera necesaria para comenzar: anclas de
emisor compartidas, disparo alternado, carta `twin_emitters`, origen exacto y
`ShotRenderState` estable. El siguiente consumidor sera un
`ProjectileSkinDefinition` data-driven con variantes de cuerpo, estela y color;
no debe cambiar dano, cadencia, velocidad, colision ni trayectoria logica.

Orden de continuacion: variantes SVG de canon manteniendo el frame `64x64`,
definiciones de bala, pool de presentacion, locker de skins de bala y medicion
en `?stress=1`. La puerta humana es comprobar en movil que la bala y el
destello coinciden y que Low/Medium/High mantienen 60 FPS.

## 39. Continuacion - locker de canones, balas y estelas

Fecha: 01-09-2026.

- `CannonSkinDefinitions` declara cuatro paquetes completos: `basic`, `curve`,
  `smoke` y `rainbow`. Cada uno referencia una silueta SVG de canon, una bala
  SVG y una receta de estela; el contenido no altera reglas de combate.
- `SaveStore` sube el schema a v3 y migra partidas antiguas agregando
  `cannonSkins` con `basic` equipado. La seleccion y adquisicion demo se guarda
  igual que las skins del cuerpo.
- El locker ahora tiene pestañas Nucleo / Canones y balas. El panel de canones
  mantiene una sola preview SVG animada con disparos constantes; las tarjetas
  usan thumbnails estaticos para no animar cuatro escenas a la vez. En movil la
  coleccion conserva su scroll independiente.
- `PlayerView` usa texturas de canon independientes y `CombatEntitiesView`
  cambia las texturas pooled de proyectil. `ProjectileTrailView` cambia entre
  linea, arco visual, humo y franjas arcoiris sin crear objetos en el loop.
- La variante curva es solo una forma visual del trail; origen, velocidad,
  colision, dano y trayectoria logica permanecen intactos.

Validacion: typecheck correcto, 45 archivos y 116 pruebas, smoke desktop y
Pixel 5 incluyendo ambas pestañas, y builds local/Poki/CrazyGames correctos.
Pendiente humano: abrir la URL publicada, adquirir cada paquete, comprobar la
preview continua y confirmar que el proyectil coincide con el destello en una
run movil. `debug.log` local no forma parte del commit.

## 40. Continuacion - desarme visual de tortuga

Fecha: 01-09-2026.

- `TurtleDefeatFxView` mantiene un pool de copias de las cuatro piezas SVG ya
  cacheadas de la tortuga. En Medium/High usa 4/6 slots; Low y
  `prefers-reduced-motion` no emiten fragmentos modulares.
- Al morir un `chaser`, `CombatEntitiesView` inicia una copia visual de 360 ms
  que abre patas, caparazon y cabeza desde el mismo frame comun. La entidad
  logica se puede liberar y reciclar inmediatamente: no se retiene su slot ni
  se alteran dano, XP, colisiones o movimiento.
- La copia se ubica sobre la capa de enemigos y debajo de barras/numeros; se
  limpia con `reset()` y no crea texturas, SVG ni nodos durante el loop.
- Queda pendiente probar en movil real que el desarme se perciba junto al polvo
  sin tapar la arena. Tank y Elite siguen usando el burst generico hasta tener
  arte modular propio.

## 41. Continuacion - masters SVG de Fast, Tank y Elite

Fecha: 01-09-2026.

- `fast/fast.svg`, `tank/tank.svg` y `elite/elite.svg` reemplazan los
  `Graphics` provisionales del pool de enemigos. Comparten `viewBox` y ancla
  con la tortuga, son masters auto-contenidos y se rasterizan una vez como
  texturas Pixi reutilizadas.
- Las tres familias tienen una lectura propia a escala pequeña: punta/aletas
  para velocidad, placas/cuña para resistencia y corona/nucleo para prioridad.
  Ninguna modifica radio de colision, vida, velocidad, XP o spawn.
- `SvgEnemyAssets.test.ts` valida estructura, prefijos, ausencia de recursos
  externos/filtros y presupuesto de primitivas. El siguiente paso visual para
Tank y Elite es separar sus masters en piezas reales solo cuando se conecte
su desarme pooled; no volver a efectos genericos temporales.

## 42. Continuacion - naves modulares y arco visual de proyectiles

Fecha: 01-09-2026.

- El `chaser` dejo de renderizarse como tortuga: ahora usa una nave scout de
  cuatro piezas (`rear`, `wings`, `hull` y `cockpit`). Los SVG de la tortuga y
  sus pruebas se conservan como base de diseno y referencia historica.
- Fast, Tank y Elite tambien se componen con cuatro piezas cacheadas. Cada
  familia tiene un perfil de movimiento sutil: motores pulsantes, alas/placas
  con sway, respiracion del casco y bob de cabina. La direccion continua
  viniendo del vector de movimiento y las transformaciones son locales.
- `EnemyDefeatFxView` reemplaza el desarme exclusivo de la tortuga por un pool
  comun para las cuatro naves. La separacion dura 420 ms y no retiene la
  entidad de simulacion ni cambia radio, dano, XP, colisiones o reciclaje.
- `ProjectileTrailView` ahora usa sprites preasignados en lugar de limpiar y
  reconstruir `Graphics` cada frame. Las estelas son mas largas y visibles en
  Medium/High; Low continua sin trail.
- El paquete `curve` produce un arco visual temporal de 10 unidades: el sprite
  y la estela se separan suavemente de la linea, alternan el lado por emisor y
  convergen de nuevo. La posicion logica de colision sigue recta para que la
  skin no se convierta en ventaja de gameplay.

Validacion de esta iteracion: typecheck correcto, 125 pruebas en 49 archivos,
smoke browser 9/9 y builds local, Poki y CrazyGames correctos. Queda como
puerta manual medir FPS/CPU/GPU en un movil real bajo `?stress=1` y revisar la
legibilidad de naves, separacion de piezas y estelas en Medium/High; esa puerta
no puede medirse desde este entorno.

## 43. Continuacion - game feel inicial y profiling - 01-09-2026

- Se auditaron los `Graphics` que dibujan formas independientes y cada arco,
  circulo, rectangulo o segmento reinicia su subpath con `beginPath()` o
  `moveTo()` explicito. Esto protege contra diagonales heredadas entre figuras.
- `ScreenFxView` agrega un shake determinista y limitado por calidad. Los
  impactos normales no mueven la camara en hordas; Tank/Elite, dano del player,
  expansion, cadena y derrota tienen impulsos acotados. `Game` aplica
  micro-hit-stop solo a golpes relevantes, conservando input y sin cambiar
  dano, colisiones, cadencia ni trayectoria logica.
- `PlayerView` ahora deriva velocidad desde snapshots consecutivos para aplicar
  tilt local, respuesta elastica y dos trazos de motor en Medium/High. Low no
  crea ese trail y todas las piezas siguen siendo presentacion.
- Los enemigos muestran flash de impacto sobre el casco. Chain Lightning tiene
  doble trazo y un nodo de impacto pooled por salto; Laser tiene carga radial y
  pulsos de ataque/recuperacion; la expansion de arena emite un shockwave
  reutilizado y conserva la resonancia existente.
- `?profile=1` habilita `FrameProfiler`: mantiene 240 muestras sin allocations
  por frame y expone promedio, p95, maximo, frames largos y heap JS cuando el
  navegador lo ofrece. No sustituye profiling de CPU/GPU/GC en telefono real.

Validacion de esta iteracion: typecheck correcto, 130 pruebas en 52 archivos,
smoke browser 9/9 y builds local, Poki y CrazyGames correctos. Queda como
puerta manual medir en un movil fisico con `?stress=1&profile=1`: registrar
dispositivo, navegador, preset, FPS/p95, legibilidad y consumo.

## 44. Continuacion - atmosferas, locker de fondos y HUD de gameplay - 02-09-2026

El usuario confirma que el modo stress funciona correctamente en movil y PC, y
que las runs completas siguen siendo terminables. La siguiente capa visual
resuelve el fondo plano sin tocar simulacion, combate ni balance:

- `BackgroundView` usa un unico `Graphics` estatico detras de la arena. Cada
  tema se dibuja solo al equiparlo o al cambiar portrait/landscape; no parsea
  SVG, no descarga imagenes y no reconstruye geometria durante el ticker.
- Hay cuatro atmosferas seleccionables: `deep-space`, `ion-storm`,
  `solar-drift` y `crystal-field`. El preset limita las estrellas a 12/24/34
  en Low/Medium/High. La arena conserva una opacidad dominante para que el
  fondo aporte profundidad sin competir con player, boss o telegraphs.
- El locker suma la pestaña `Fondos` junto a `Nucleo` y `Canones y balas`.
  La seleccion se persiste mediante schema v4 y mantiene `deep-space` como
  fallback seguro para partidas guardadas anteriores. `?background=` queda
  disponible como atajo de desarrollo.
- Se eliminaron del mundo de gameplay el titulo `GEOMETRY SURVIVOR` y la
  instruccion inferior. La identidad queda en el menu y el HUD conserva solo
  informacion de la run.

La puerta automatica de esta iteracion es typecheck, suite, smoke desktop y
mobile, build local y builds de plataforma. La puerta manual posterior es
comparar las cuatro atmosferas en movil real, revisar contraste y confirmar
que Low mantenga legibilidad y rendimiento.

## 45. Continuacion - protecciones para dispositivos modestos y profiler

Fecha: 02-09-2026.

- El resultado estable del stress en el telefono de referencia valida ese
  dispositivo, pero no sustituye una medicion en hardware modesto. Las naves
  mantienen sus cuatro piezas SVG en Medium/High; en Low solo renderizan el
  casco. La entidad, colision, telegraph y simulacion siguen presentes: se
  omiten exclusivamente piezas decorativas, flash y movimiento secundario.
- `EnemyDefeatFxView` deja de crear un array temporal por derrota al asignar
  directamente las cuatro texturas cacheadas de la familia al slot pooled.
- `FrameProfiler` conserva sus muestras sin allocations por frame, pero ahora
  calcula promedio/p95/maximo y heap como maximo cada 500 ms. Cuando no esta
  activado devuelve un snapshot constante y no consulta memoria en cada frame.
- Se retiran las clases Pixi obsoletas de la tortuga. Sus SVG y pruebas de
  contrato permanecen como referencia historica; el runtime comun usa
  `EnemyShipVisual` y `EnemyDefeatFxView` para las cuatro familias.

Puerta humana pendiente: ejecutar `?stress=1&quality=low&profile=1` en un
telefono menos potente, mover durante un minuto y registrar modelo, navegador,
FPS/p95 y cualquier congelamiento. Medium/High siguen siendo el objetivo
visual; Low es el modo de seguridad, no un cambio de gameplay.

## 46. Continuacion - tolerancia del smoke en runner compartido

Fecha: 02-09-2026.

- El registro de CI confirma que Vite termina correctamente (`built in 4.45s`).
  El fallo posterior estaba en Playwright: dos smoke tests agotaron el limite
  global de 30 s mientras Chromium headless esperaba el canvas tras resize.
- El log local del navegador muestra `GPU stall due to ReadPixels` al crear
  texturas WebGL. Es una demora del backend headless al rasterizar los masters
  SVG durante varios boots, no una excepcion del runtime ni un error de Pages.
- `playwright.config.ts` usa ahora 60 s por escenario y 10 s por asercion. Las
  condiciones verificadas no cambian; solo se evita abortar una prueba valida
  por la variacion de carga del runner compartido.

Validacion previa: typecheck, suite (131 tests), build local y builds de
Poki/CrazyGames en verde. Los escenarios desktop y mobile ejecutados por
separado pasan; CI debe repetir la matriz completa con el nuevo margen.

## 47. Continuacion - primeras pasivas de progresion

Fecha: 02-09-2026.

- `longshot_projectiles` sale del catalogo activo: la arena actual concentra
  el combate cerca del jugador y la velocidad del proyectil no aporta una
  decision perceptible durante la primera run.
- `resonant_core` suma 12% de experiencia por acumulacion, hasta 3; el bonus
  se aplica al derrotar y conserva los decimales antes de que
  `LevelProgression` sincronice la experiencia mostrada.
- `regenerative_reactor` suma 2% de vida maxima cada 5 segundos, hasta 3;
  `PlayerModel` realiza los pulsos, evita sobrecurar y reinicia su temporizador
  al reiniciar la run.
- `vampiric_core` suma 1% de vida maxima por derrota aceptada, hasta 3. El
  disparador se limita a una curacion cada 0.25 segundos para que una oleada
  densa no cree una recuperacion infinita. No depende de la vida del enemigo.
- Las tres cartas usan `UpgradeApplier`, previews numericos con porcentaje e
  iconos SVG nuevos (`experience`, `repair`, `vampirism`). No se creo un
  manager global ni se introdujeron imports de Pixi/DOM en simulacion.
- La definicion activa queda en 13 mejoras: pasivas y rutas de armas siguen en
  un catalogo tipado, con limites y prerequisitos data-driven.

Validacion automatica de esta iteracion: typecheck correcto, 52 archivos de
test y 135 pruebas pasando, incluidas curacion por pulso, vampirismo,
experiencia bonificada, limites y previews. Pendiente humano: probar en
movil una subida de nivel con cada carta, verificar que la barra de vida haga
visible la recuperacion y confirmar que la experiencia acelera sin adelantar
demasiado el primer nivel.

## 48. Continuacion - pasivas defensivas y critico

Fecha: 02-09-2026.

- El HUD redondea el XP hacia abajo con `formatExperience`; la simulacion
  conserva decimales para que el bonus de experiencia no pierda precision.
- `critical_impact` suma 10% de probabilidad por acumulacion, hasta 3, y
  aplica multiplicador fijo 2x a Projectile, Orbit y Chain Lightning. El azar
  usa una semilla propia de simulacion y se reinicia con la run, por lo que no
  depende del framerate ni de Pixi.
- `recharging_shield` conserva una carga que bloquea un paquete de dano y se
  recarga en 10 segundos. La carga protege contacto, Laser y boss; mientras se
  recompone expone un progreso 0..1 para la vista.
- Se retira `phase_shift`: su desplazamiento se solapaba con el escudo y no
  aportaba una decision suficientemente distinta durante la primera run.
- La presentacion mantiene un aura protectora cyan alrededor del jugador. Al
  bloquear desaparece la carga completa, muestra un pulso dorado de impacto y
  vuelve a llenarse de forma radial hasta recuperar el escudo.
- El catalogo activo queda en 15 mejoras y conserva `UpgradeApplier` como
  unico punto de aplicacion, con previews porcentuales para experiencia,
  regeneracion, vampirismo y critico.

Validacion automatica: `npm run typecheck` correcto; suite unitaria con 53
archivos y 139 pruebas pasando; builds `local`, `poki` y `crazygames` en verde.
El smoke Playwright ejecuto los 9 escenarios desktop/mobile correctamente; el
proceso deja vivo el servidor de preview en este runner compartido y hubo que
terminarlo despues de imprimir los nueve `ok`, sin fallos de asercion.

Puerta humana: comprobar en movil que el XP ya no satura el HUD, que el escudo
absorbe un impacto, desaparece visualmente y vuelve a llenarse durante 10
segundos, y que los criticos se perciben sin volver dominante la carta.

## 49. Continuacion - escudo visual y retirada de fase

Fecha: 02-09-2026.

- Se retira por completo `phase_shift`: desaparece del catalogo activo, sus
  tipos, icono SVG, aplicador y pruebas. El pool queda en 15 mejoras.
- `recharging_shield` conserva una unica carga, bloquea el siguiente paquete
  de dano y se rearma tras 10 segundos. `PlayerModel.shieldChargeProgress`
  expone una fraccion determinista 0..1 sin introducir estado de Pixi en la
  simulacion.
- `PlayerView` dibuja un aura cyan persistente con arco radial de carga; al
  bloquear, el aura queda vacia y aparece un pulso dorado con fragmentos. El
  arco se recompone durante la recarga y recupera un anillo completo al 100%.
- La fachada `PixiGameView` y `Game` solo transportan el progreso y el evento;
  las reglas siguen en `PlayerModel` y la carta sigue aplicandose únicamente
  desde `UpgradeApplier`.

Validacion automatica cerrada: typecheck correcto, suite con 53 archivos y 139
pruebas pasando, builds `local`, `poki` y `crazygames` en verde, y los 9 smoke
tests desktop/mobile completados sin aserciones fallidas (el servidor de
preview se mantuvo vivo al terminar y se cerro manualmente). Puerta humana:
comprobar el aura llena, el vaciado al recibir un impacto bloqueado y la
recomposicion gradual en un telefono real.

## 50. Continuacion - economia NOVA y laboratorio meta - 02-09-2026

El usuario confirma que el preset Low/High ya fue probado en su movil de
referencia y decide avanzar con contenido meta antes de producir mas armas o
niveles.

- Se crea la moneda blanda unica **NOVA**. Su emblema vive en
  `src/assets/svg/ui/nova.svg` y se reutiliza en menu, laboratorio, compras de
  cosmeticos y resumen de run. Es un SVG autocontenido, sin raster, filtros ni
  referencias externas; los textos cercanos mantienen la lectura accesible.
- `EconomyDefinitions` concentra nombre, simbolo, formato y recompensa. Cada
  run entrega `max(1, bajas + floor(segundos/30))` NOVA, con limite por run y
  sin decimales visibles.
- El save pasa a schema v5 con `wallet.nova` y `metaUpgrades.levels`; las
  partidas v1-v4 migran a cero NOVA y niveles vacios sin perder ajustes,
  mejores ni loadouts.
- Las cuatro skins de nucleo y canones usan precios data-driven de 250/600/1200
  NOVA segun rareza; los fondos usan 150/350/700. La compra se bloquea si no
  hay saldo y las apariencias siguen sin alterar gameplay.
- El menu principal incorpora `Mejoras` y `MetaProgressionPanel`. Las dos
  primeras mejoras permanentes son `weapon_damage` (+5% por nivel, 5 niveles)
  y `weapon_cadence` (-3% intervalo, 5 niveles). Los modificadores se aplican
  al comenzar o reiniciar la run y se separan de las cartas temporales.
- Las armas nuevas, niveles y monetizacion real quedan intencionalmente fuera
  de esta entrega. Los anuncios mantienen como siguiente frontera los puntos
  de game over/reinicio y rewarded opcional, aislados por adaptadores de
  plataforma.

Validacion automatica de esta iteracion: typecheck correcto, 56 archivos y 145
pruebas unitarias pasando, build local correcto y smoke browser desktop/mobile
9/9 sin fallos de consola. Pendiente manual: abrir el Laboratorio en Pages,
terminar una run para acumular NOVA, comprar una skin y una mejora, recargar y
confirmar que cartera, loadout y niveles permanecen.

## 51. Continuación - estabilización y plan maestro de expansión - 03-09-2026

Se revisaron los cambios realizados con Grok y la investigación de futuro. La
dirección aprobada no reemplaza el vertical slice: lo convierte en Acto I de
una estructura Quick Act / Expedition / Overdrive. La sección 16 de
`PLAN_DESARROLLO.md` es ahora el orden canónico para el trabajo futuro.

Hallazgos corregidos en esta sesión:

- `BackgroundView` actualiza `baseScale` y escala de nebulosas ya existentes al
  cambiar el viewport; una prueba reproduce el cambio 1280→640.
- Los 18 SVG guardados accidentalmente como Windows-1252 fueron convertidos a
  UTF-8. Las pruebas de cañones y player rechazan el carácter de reemplazo para
  impedir otra corrupción silenciosa.
- Los glows de proyectil quedan presupuestados por calidad: Low 0, Medium 64 y
  High 120; los proyectiles restantes siguen visibles sin duplicar hasta 300
  sprites de glow.
- `debug.log` sale del repositorio y queda ignorado. Sus mensajes `ReadPixels`
  provenían de Chromium headless y no demostraban por sí mismos un fallo del
  juego.
- El bundle conserva su warning visible. No se oculta aumentando el límite:
  debe medirse y dividirse por consumidores reales antes de sumar actos y
  galerías.

Decisiones fijadas:

- Prioridad inmediata: validar NOVA/Laboratorio v1 en Pages y medir su poder
  combinado; el objetivo meta es 10–15% de ventaja efectiva máxima.
- Después se crea un contrato rewarded tipado y un simulador local. Los SDK
  reales llegan sólo cuando success/error/cancel/timeout sean seguros.
- Los únicos placements aprobados son revive, reroll, double NOVA y un
  cosmético destacado con alternativa NOVA. Todos requieren pulsación expresa;
  no habrá anuncios automáticos con la decisión actual.
- Poki y CrazyGames conservan bundles/adaptadores separados. GitHub Pages nunca
  pretende validar sus SDK reales.

- Antes de añadir Vector Boomerang se extraen scheduler y behaviors desde
  `CombatWeaponSystem`; la cuarta arma es el caso real que justifica hacerlo.
- El arsenal futuro queda en Projectile, Orbit, Chain, Vector Boomerang, Pulse
  Ring y Resonant Aura, cada uno con dos evoluciones mutuamente excluyentes y
  presupuestos de DPS/cobertura detallados en el plan.
- Acto I es Radial, Acto II Angular y Acto III Fracture. Expedition conserva la
  build; Calibration permite empezar directamente en actos desbloqueados;
  Overdrive es opcional y se implementa al final.

Documentación oficial consultada el 03-09-2026: PokiSDK HTML5, CrazyGames Video
Ads, Advertisement Requirements y Game Events. La integración debe conceder
premio únicamente con `true`/`adFinished`, restaurar audio/UI/lifecycle en todo
fallo y ocultar rewarded durante CrazyGames Basic Launch.

Validación automática de la entrega: typecheck correcto; 56 archivos y 154
tests pasando; SVG completos en UTF-8 válido; builds local, Poki y CrazyGames
correctos. Los 9 smoke desktop/mobile reportaron `ok`, incluido resize y touch.
El proceso Playwright todavía permanece vivo después de imprimir los resultados
en este host Windows y se termina manualmente; se conserva como deuda del
runner, no como fallo de una aserción del juego. El bundle principal queda en
aproximadamente 555.3 kB minificado / 156.7 kB gzip y mantiene el warning de
500 kB para vigilar crecimiento.

Próximo paso después de publicar este commit:

1. probar en Pages la rotación y cambio de tamaño con fondos Medium/High;
2. terminar una run, comprobar cobro NOVA, comprar/equipar un cosmético y
   recargar;
3. comprar un nivel del Laboratorio, reiniciar y confirmar que se aplica;
4. registrar cualquier parpadeo, texto corrupto o caída con
   `?stress=1&profile=1`;
5. con esa puerta humana aprobada, implementar primero el contrato rewarded
   local, no los SDK reales ni una arma nueva.

## 52. Inicio de prioridad 2 - rewarded local - 04-09-2026

La prioridad 2 comenzo con un contrato rewarded local, sin red ni SDK externo.
`AdService` reemplaza el anuncio generico por placements tipados (`revive`,
`reroll`, `double-nova`, `cosmetic-unlock`) y resultados seguros
(`rewarded`, `dismissed`, `unavailable`, `error`).

`RewardedAdController` serializa solicitudes y `RewardedOfferLedger` aplica
idempotencia por run: una cancelacion o error se puede reintentar, un exito no
se consume dos veces y una respuesta tardia de otra run no altera el saldo.
El resumen de partida ya ofrece `double-nova` solo tras comprobar disponibilidad
y con pulsacion expresa; el saldo sigue limitado a `MAX_NOVA`.

En Pages se pueden simular estados con `?ad=success` (por defecto),
`?ad=dismissed`, `?ad=unavailable`, `?ad=error` y `?ad=timeout`. El revive
queda cableado como segundo consumidor: una sola vez por run, unicamente tras
muerte, con 35% de vida y dos segundos de invulnerabilidad; no reinicia XP,
bajas, arena ni build. Reroll, cosmetico y los adaptadores reales de
Poki/CrazyGames quedan como siguientes incrementos, despues de aprobar la
matriz local en movil.

## 53. Reroll rewarded local - 04-09-2026

El level-up ahora muestra una oferta opcional de reroll cuando existen tres
alternativas validas. El resultado es determinista, excluye las cartas que ya
se estaban mostrando y no consume el nivel pendiente. La oferta se consume
una sola vez por run (equivalente al Acto I actual); una cancelacion, falta de
inventario o error deja activas las cartas originales y permite reintentar.

Mientras el anuncio esta pendiente se bloquean las cartas y el CTA para evitar
doble input. El simulador sigue sin SDK externo y usa los mismos parametros
`?ad=success`, `?ad=dismissed`, `?ad=unavailable`, `?ad=error` y `?ad=timeout`.

## 54. Cosmetic unlock rewarded local - 04-09-2026

El locker tiene una oferta unica y contextual en la franja `OFERTA DESTACADA ·
REWARDED`. La pestaña activa elige el primer cosmetico bloqueado de su catalogo:
nucleo, paquete de cañones/balas o fondo. La oferta informa el nombre y el
precio NOVA alternativo; no cambia daño, fisica, cadencia, colisiones ni reglas.

El resultado `rewarded` desbloquea y equipa el objeto de forma idempotente y lo
persiste mediante `SaveStore`. Cancelacion, error o falta de inventario no
conceden el objeto y dejan visible la alternativa de compra cuando corresponde.
Mientras la solicitud esta pendiente se bloquea el CTA, y un token de vista
ignora respuestas tardias si el usuario cierra el locker o empieza la partida.

La disponibilidad se consulta antes de abrir el menu. En Pages se prueba con
`?ad=success` (por defecto) o `?ad=unavailable`; las rutas de cancelacion/error
comparten el contrato local ya validado en revive, double-NOVA y reroll. Los
adaptadores reales de Poki/CrazyGames siguen pendientes de la puerta de SDK.

Validacion de esta iteracion: typecheck correcto, 59 archivos y 170 tests
unitarios/integracion, 11 smoke desktop/mobile y builds `local`, `poki` y
`crazygames` correctos. El warning del bundle de aproximadamente 572 kB
minificado sigue visible por decision del plan.

## 55. Linea base reproducible del Acto I - 04-09-2026

Se implemento el instrumento de medicion de la prioridad 3 sin tocar las
reglas de la run. `?baseline=1` activa el profiler, el panel de debug y un
panel local de reporte. Cada run terminada registra tiempo total, primera
subida, llegada del boss, causa de muerte (contacto, laser o boss), cartas
elegidas, NOVA, maximos de enemigos/proyectiles/FX y frame medio/p95. El
registro vive en memoria y en `localStorage` bajo una clave separada del save,
queda limitado a las ultimas diez runs y puede copiarse o borrarse desde Pages.

Los eventos de dano ahora incluyen una fuente tipada; esto solo mejora la
observabilidad y no cambia la cantidad ni el momento del dano. El contador FX
consume exclusivamente contadores ya acotados de los pools de presentacion.
La vista normal no muestra el panel ni crea overhead de medicion salvo que se
use el flag.

Validacion automatica: typecheck correcto, 60 archivos y 174 pruebas unitarias
pasando, y 12 smoke desktop/mobile en verde (incluido `?baseline=1`). Falta la
puerta humana: registrar diez runs en el mismo telefono, anotando navegador,
preset de calidad y cualquier observacion de balance o rendimiento. No se
considera congelada la linea base hasta completar ese registro.

Prueba movil corta:

1. abrir `https://mirobo137.github.io/geometry-survivor/?baseline=1`;
2. jugar y terminar una run; el panel debe cambiar de `0/10` a `1/10`;
3. repetir hasta diez runs sin borrar los datos;
4. pulsar `Copiar reporte` y conservar el texto junto con modelo del telefono,
   navegador y calidad;
5. si se quiere descartar una sesion de prueba, pulsar `Borrar datos`.
