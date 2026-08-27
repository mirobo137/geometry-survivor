# Geometry Survivor — estado y continuación

> Snapshot operativo: 27-08-2026.
>
> Estado funcional auditado desde el commit `6966a55` (`fix: stabilize boss rendering and movement`) y la consolidación arquitectónica en curso.
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
?spike=rendering
?spike=audio
```

Stack y calidad confirmada:

- TypeScript estricto, Vite y PixiJS 8.20.0.
- Build target ES2018 para compatibilidad móvil.
- Timestep fijo de 60 Hz; presentación desacoplada del ritmo de simulación.
- Viewport lógico 720×1280 en portrait y 1280×720 en landscape.
- Pool de 250 enemigos y 300 proyectiles con spatial grid.
- CI despliega `dist/local` en GitHub Pages sólo si pasa `npm run validate`.
- Builds separados `local`, `poki` y `crazygames`.
- Última auditoría local: typecheck correcto y 65 tests pasando en 17 archivos.

Mediciones manuales aportadas desde Android Chrome:

- Spike de 500 entidades: aproximadamente 60 FPS en Sprite, GraphicsContext compartido y pool; p95 de 16.80 ms.
- Audio: `AudioContext` running y latencia base de 3.0 ms.
- Stress de 250 enemigos + 300 proyectiles: estable alrededor de 60 FPS quieto, con picos reportados de 120 FPS al mover.
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

- Jugador con velocidad, vida, armadura, invulnerabilidad y límite circular.
- Chaser, Fast, Tank y variante Elite data-driven.
- Elite determinista desde 2:00.
- Projectile, Orbit y Chain Lightning.
- Pooling, targeting, spatial grid, colisiones, daño, muerte y XP directa.
- Preset `?stress=1` mantiene ambos pools en capacidad.

### Progresión y arena

- Level-up pausado con tres cartas táctiles.
- Diez mejoras tipadas/data-driven.
- Dos expansiones de arena: 1:00 y 3:00, con radio intermedio y pulso de resonancia.
- Curva de spawn con seis fases de contenido entre 0:00 y 5:00.
- Laser desde aproximadamente 0:45 con `telegraph → attack → recovery`, un impacto por activación y escape perpendicular.

### Presentación

- Sprites/texturas reutilizadas para entidades repetidas.
- Graphics para arena, resonancia, Chain Lightning y Laser.
- HUD de tiempo, vida, XP, bajas y nivel.
- Overlays DOM responsive para level-up y pausa.
- Panel debug con FPS, viewport, pools, armas, nivel, pausa, arena y resonancia.

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

1. `src/simulation/combat/CombatWeaponSystem.ts` tiene alrededor de 271 líneas y agrupa Projectile, Orbit, Chain y stress; `CombatSimulation.ts` se redujo a unas 179 líneas y coordina Laser, run, derrotas, XP y eventos.
2. `src/main.ts` tiene alrededor de 94 líneas y queda como bootstrap; `src/app/Game.ts` tiene alrededor de 290 líneas y coordina lifecycle, loop, pausa, level-up, HUD, game-over/victoria y persistencia sin implementar sistemas completos.
3. `src/presentation/PixiGameView.ts` tiene alrededor de 88 líneas y ahora es una fachada; arena, entidades, armas, hazards y jugador viven en vistas Pixi separadas de 17–77 líneas.
4. `CombatRenderState` ya evita que `PixiGameView` reciba la clase completa de combate; ahora incluye un snapshot de boss con fase, salud, barrido y anillo. Los sistemas de simulación ya exponen reset explícito para reinicio in-place.
5. `UpgradeApplier` ya retiró la aplicación de efectos de `main.ts` y controla stacks/prerrequisitos; un efecto nuevo todavía requiere modificar ese módulo tipado.
6. `PlatformAdapter` ahora compone `PlatformLifecycle`, `AdService` y `SaveStore`; el resumen de game-over ya actualiza la mejor marca, pero falta conectar ajustes a una UI.
7. Los textos visibles están hardcodeados en español. Falta i18n con inglés como fallback.
8. Existe la skill SVG, pero todavía no hay assets SVG master ni validación SVG dentro del build.
9. Hay unit/integration tests, pero todavía no Playwright/browser smoke para consola, resize, pausa, level-up y storage.

Conclusión: las fronteras principales son correctas y la consolidación avanza; presentación y runtime ya tienen fachadas separadas, y quedan por cerrar snapshots/UI secundarios, ajustes persistentes y el balance final de la run. `GameState`, `BossSystem` y los modelos de simulación ya permiten terminar, mostrar victoria y reiniciar una run in-place sin recargar ni perder la mejor marca. El boss usa contenido tipado, patrones telegraphed y un snapshot de render; las cartas numéricas ya muestran un preview runtime `antes → después` sin aplicar el efecto, `LocalSaveStore` ya cubre schema v1, migración y fallback en memoria, y la plataforma local separa lifecycle/anuncios.

## 6. Próximo hito recomendado: cerrar la puerta de Fase 5

Objetivo: validar una run completa de 5–6 minutos con boss, victoria, reinicio y balance legible sin cambiar las fronteras modulares.

Orden recomendado:

1. Usar `src/app/GameState.ts` en todos los estados de gameplay; el contrato de fin/victoria/reinicio ya está integrado en `Game` y cubierto por tests.
2. `src/app/Game.ts` ya coordina la run; mantenerlo como orquestador de lifecycle/loop, no como contenedor de sistemas.
3. Mantener `src/simulation/progression/UpgradeApplier.ts` como punto único de aplicación; límites y prerrequisitos de cartas ya están data-driven.
4. Mantener `CombatWeaponSystem` como frontera única mientras no haya un segundo consumidor; si una cuarta arma o una regla transversal lo exige, separar Projectile/Orbit/Chain con contratos pequeños.
   `EnemySystem` ya cubre enemigos, spawn, movimiento, contacto y spatial grid.
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
- 65 tests existentes siguen pasando y existen tests nuevos de estados/aplicación/enemigos/cartas/guardado/resumen/reset/boss/colores;
- `local`, `poki` y `crazygames` construyen correctamente;
- pausa, cartas, Laser, elite y expansiones siguen funcionando en móvil.

## 7. Trabajo pendiente por fase

### Fase 3 — todavía abierta

- Conectar los ajustes persistentes a una UI de configuración; la mejor marca ya se actualiza desde game-over.
- Validar manualmente dos builds que se sientan diferentes.

### Fase 4 — implementada, pendiente de puerta humana

- Confirmar en móvil que el Laser se entiende tras verlo una vez.
- Confirmar que el camping no domina.
- Confirmar que elite, densidad y Laser no producen daño inevitable.
- Ajustar timings y presión con runs completas, no sólo unit tests.
- Verificar manualmente primera y segunda expansión con resonancia.

### Fase 5 — parcial, boss implementado

- Boss con dos patrones: barrido/línea telegraphed y anillo con huecos seguros ya implementado.
- El boss se desplaza en una órbita determinista, lenta y acotada dentro de la arena; radio y velocidad viven en contenido, no en Pixi.
- Run reproducible completa de 5–6 minutos, pendiente de validación manual y balance.
- Game over por muerte, resumen, mejor marca, victoria y reinicio in-place ya están implementados.
- Primer balance integral y diez runs internas sin softlock.

### Fase 6 — sin implementar

- Lenguaje visual definitivo.
- SVG master code-first para UI/assets y pipeline de validación.
- AudioService real, música/SFX, límites de voces y recuperación de contexto.
- Hit feedback, shake presupuestado, hit stop, trails y partículas.
- Presets Low/Medium/High sin cambiar gameplay.

### Fase 7 — parcial

- Ya existen responsive, pausa de lifecycle y stress inicial.
- Faltan context loss, storage fallido, matriz completa de resize y profiling CPU/GPU/GC.
- Falta decidir adaptive quality con datos reales.

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

## 9. Comandos de validación

```bash
npm ci
npm run typecheck
npm test
npm run validate
npm run build:poki
npm run build:crazygames
```

`npm run validate` ya incluye typecheck, tests y build local. No declarar una puerta manual superada sólo porque estos comandos pasen.

## 10. Archivos clave

- `AGENTS.md`: reglas neutrales para agentes y routing de skills.
- `PLAN_DESARROLLO.md`: alcance, decisiones, fases y puertas.
- `proyecto.md`: visión y principios de largo plazo.
- `src/simulation/enemies/EnemySystem.ts`: ciclo de vida, movimiento, contacto, spawn y consultas espaciales de enemigos.
- `src/simulation/combat/CombatWeaponSystem.ts`: Projectile, Orbit, Chain Lightning y stress; frontera preparada para futuras armas.
- `src/simulation/combat/CombatSimulation.ts`: coordinador de run/laser/eventos/XP; mantiene la composición sin lógica de armas.
- `src/presentation/PixiGameView.ts`: fachada de render; delega en vistas Pixi por responsabilidad.
- `src/presentation/pixi/`: vistas de arena, entidades, armas, hazards, jugador y fábrica de texturas.
- `src/app/Game.ts`: orquestador de lifecycle, loop, pausa, level-up, HUD y plataforma.
- `src/app/RunSummary.ts` y `src/ui/GameOverOverlay.ts`: snapshot y representación del fin de run.
- `reset()` en `ArenaModel`, `PlayerModel`, `CombatSimulation`, pools, Laser y progresión: reinicio in-place sin reasignar sistemas.
- `src/content/bosses/BossDefinition.ts`, `src/simulation/bosses/BossSystem.ts` y `src/presentation/pixi/BossView.ts`: datos, reglas, movimiento y representación separadas del boss; `BossVisualTokens.ts` mantiene su paleta RGB comprobable.
- `src/main.ts`: composition root y bootstrap de Pixi/spikes.
- `src/content/`: configuración data-driven.
- `src/simulation/hazards/LaserHazard.ts`: patrón de referencia para hazard puro y testeable.
- `skills/geometry-survivor-svg/`: contrato code-first para futuros SVG.
- `docs/performance/F0_SPIKES.md`: mediciones y protocolo de rendimiento.

## 11. Evidencia pendiente, no asumir

- No se ha documentado todavía una run manual completa de 5–6 minutos.
- Laser, elite, segunda expansión, boss y curva reciente tienen pruebas automáticas; el boss ya fue alcanzado en móvil, pero falta repetir el encuentro con la corrección publicada y completar el smoke final.
- No hay evidencia de Poki Inspector o CrazyGames Preview porque los SDK aún no están integrados.
- No existen resultados de browser smoke automatizado, context loss o storage fallido.
- La diversión, claridad y balance no pueden declararse aprobados sólo con tests.

## 12. Registro de sesión — auditoría de modularidad

Fecha: 27-08-2026.

Estado al cerrar esta sesión:

- `main` está limpio y sincronizado con `origin/main`.
- La base sigue respetando la separación `content → simulation → snapshot → presentation`, con plataforma aislada mediante puertos/adaptadores.
- No se encontraron imports prohibidos desde `simulation`/`content` hacia Pixi, DOM, UI, plataforma, audio o SDKs.
- No se encontraron ciclos de dependencias en `src`.
- TypeScript estricto, `npm run validate`, `npm run build:poki` y `npm run build:crazygames` pasan; última suite: 65 tests en 17 archivos.
- Los adaptadores `.grok/skills/` siguen apuntando a las skills canónicas de `skills/`; Grok 4.6 y GPT/Codex deben recibir las mismas reglas mediante `AGENTS.md`.
- El modelo de partida vigente es una run con objetivo: sobrevivir hasta el boss y derrotarlo alrededor de 4:20. La victoria es intencional; un modo infinito queda para una fase posterior.

Pendiente prioritario detectado por la auditoría:

1. En `src/app/Game.ts`, `finishRun()` crea el resumen con `game-over` incluso cuando recibe `victory`. Corregirlo a `createRunSummary(outcome, ...)` y añadir una prueba de integración que confirme el resumen de victoria.
2. Después de esa corrección, repetir en móvil el encuentro del boss publicado: comprobar movimiento orbital, telegraphs, derrota y texto “Victoria”.
3. Añadir browser smoke en CI para carga, resize, pausa, level-up, storage y consola; el crash de color del boss demostró que los tests de simulación/build no sustituyen esa capa.
4. Antes de una cuarta arma, evaluar separar `CombatWeaponSystem`; antes de ampliar variantes, mover la selección temporal de enemigos de `EnemySystem` a contenido/director.

Limitaciones de esta sesión:

- No hubo navegador conectado en el entorno del agente, por lo que no se pudo ejecutar smoke visual local.
- No se modificó el código de producción durante la auditoría; el fallo de `finishRun()` permanece pendiente de autorización/implementación.

Para retomar en otra PC:

1. Abrir `C:\PROYECTOS\pruebas_geo` como raíz y leer `AGENTS.md` y este archivo.
2. Ejecutar `git status --short --branch`, `npm run typecheck` y `npm test`.
3. Corregir primero el resultado `victory` y cubrirlo con test; luego ejecutar `npm run validate` y los dos builds de plataforma.
4. Publicar en `main` y repetir la misma URL de GitHub Pages, sin parámetros adicionales.
