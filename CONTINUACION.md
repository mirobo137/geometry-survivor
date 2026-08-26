# Geometry Survivor — estado y continuación

> Snapshot operativo: 26-08-2026.
>
> Estado funcional auditado desde el commit `10a892f` (`feat: add arena resonance and difficulty phases`).
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
- Última auditoría local: typecheck correcto y 35 tests pasando en 10 archivos.

Mediciones manuales aportadas desde Android Chrome:

- Spike de 500 entidades: aproximadamente 60 FPS en Sprite, GraphicsContext compartido y pool; p95 de 16.80 ms.
- Audio: `AudioContext` running y latencia base de 3.0 ms.
- Stress de 250 enemigos + 300 proyectiles: estable alrededor de 60 FPS quieto, con picos reportados de 120 FPS al mover.
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

1. `src/simulation/combat/CombatSimulation.ts` tiene alrededor de 443 líneas y coordina spawn, enemigos, grid, tres armas, proyectiles, derrotas y eventos.
2. `src/main.ts` tiene alrededor de 263 líneas y coordina bootstrap, resize, lifecycle, loop, pausa, level-up, upgrades, HUD y plataforma.
3. `src/presentation/PixiGameView.ts` tiene alrededor de 243 líneas y representa arena, jugador, enemigos, armas y hazards.
4. `PixiGameView` recibe `CombatSimulation` completo en lugar de snapshots/contratos de render pequeños.
5. La aplicación de efectos de upgrades vive en `main.ts`; los valores están data-driven, pero un efecto nuevo todavía modifica el composition root.
6. `PlatformAdapter` aún mezcla lifecycle y anuncios; faltan los contratos separados de guardado previstos en el plan.
7. Los textos visibles están hardcodeados en español. Falta i18n con inglés como fallback.
8. Existe la skill SVG, pero todavía no hay assets SVG master ni validación SVG dentro del build.
9. Hay unit/integration tests, pero todavía no Playwright/browser smoke para consola, resize, pausa, level-up y storage.

Conclusión: las fronteras principales son correctas, pero la modularidad interna debe consolidarse ahora, antes del boss, game over y más armas.

## 6. Próximo hito recomendado: consolidación arquitectónica

Objetivo: preparar boss, fin de run y guardado sin cambiar el comportamiento jugable actual.

Orden recomendado:

1. Crear un estado de aplicación tipado con al menos `PLAYING`, `LEVEL_UP`, `PAUSED`, `GAME_OVER` y `VICTORY`.
2. Extraer del `main.ts` la coordinación de la run hacia `src/app/Game.ts` o una composición equivalente con consumidor real.
3. Extraer la aplicación de upgrades a un módulo de progresión que reciba `PlayerModel` y los sistemas de armas necesarios.
4. Dividir responsabilidades existentes de `CombatSimulation` sin rediseñar datos ni colisiones:
   - enemigos/spawn;
   - armas/proyectiles;
   - coordinación de eventos y stats.
5. Dividir `PixiGameView` en vistas existentes —arena, entidades, armas y hazards— manteniendo una fachada pequeña para `main`/`Game`.
6. Definir snapshots mínimos de presentación en vez de entregar el coordinador completo al renderer.
7. Añadir tests de transiciones de estado, pausa, level-up, game over y reinicio.
8. Ejecutar typecheck, toda la suite y los tres builds; después realizar smoke móvil para demostrar paridad.

Límites de este refactor:

- no cambiar balance, timings, apariencia ni controles salvo corrección comprobada;
- no crear ECS, bus global, service locator ni infraestructura especulativa;
- no añadir dependencias;
- no implementar el boss dentro del mismo cambio;
- conservar las URLs de spike/stress y los formatos actuales de build.

Puerta del hito:

- comportamiento observable equivalente;
- ninguna importación inversa hacia Pixi/DOM/SDK desde simulación;
- los coordinadores dejan de crecer como managers universales;
- 35 tests existentes siguen pasando y existen tests nuevos de estados;
- `local`, `poki` y `crazygames` construyen correctamente;
- pausa, cartas, Laser, elite y expansiones siguen funcionando en móvil.

## 7. Trabajo pendiente por fase

### Fase 3 — todavía abierta

- Guardado versionado de ajustes y mejor marca.
- Separar `PlatformLifecycle`, `AdService` y `SaveStore`.
- Evitar ofrecer adquisiciones ya obtenidas o mejoras que alcanzaron su límite.
- Evitar que una carta produzca un no-op, especialmente Chain ya desbloqueada u Orbit al máximo.
- Mostrar `antes → después` cuando una carta modifica una cifra.
- Validar manualmente dos builds que se sientan diferentes.

### Fase 4 — implementada, pendiente de puerta humana

- Confirmar en móvil que el Laser se entiende tras verlo una vez.
- Confirmar que el camping no domina.
- Confirmar que elite, densidad y Laser no producen daño inevitable.
- Ajustar timings y presión con runs completas, no sólo unit tests.
- Verificar manualmente primera y segunda expansión con resonancia.

### Fase 5 — sin implementar

- Boss con dos patrones: barrido/línea telegraphed y anillo con huecos seguros.
- Run reproducible completa de 5–6 minutos.
- Game over, victoria, resumen, mejor resultado y reinicio rápido.
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
8. confirmar que HUD y cartas no se cortan ni generan scroll.

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
- `src/main.ts`: composition root actual; siguiente candidato a extracción.
- `src/simulation/combat/CombatSimulation.ts`: coordinador de combate actual; siguiente candidato a división.
- `src/presentation/PixiGameView.ts`: fachada de render actual; siguiente candidato a división.
- `src/content/`: configuración data-driven.
- `src/simulation/hazards/LaserHazard.ts`: patrón de referencia para hazard puro y testeable.
- `skills/geometry-survivor-svg/`: contrato code-first para futuros SVG.
- `docs/performance/F0_SPIKES.md`: mediciones y protocolo de rendimiento.

## 11. Evidencia pendiente, no asumir

- No se ha documentado todavía una run manual completa de 5–6 minutos.
- Laser, elite, segunda expansión y curva reciente tienen pruebas automáticas, pero falta registrar su smoke manual final en móvil.
- No hay evidencia de Poki Inspector o CrazyGames Preview porque los SDK aún no están integrados.
- No existen resultados de browser smoke automatizado, context loss o storage fallido.
- La diversión, claridad y balance no pueden declararse aprobados sólo con tests.

