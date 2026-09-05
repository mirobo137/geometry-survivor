# Guía de ejecución — Geometry Survivor

Fecha: 04-09-2026. Referencia de código: `a3d0ccd`.

## 1. Para qué sirve y cómo empezar

Esta guía desarrolla [PLAN_DESARROLLO.md, §22](../PLAN_DESARROLLO.md#ejecucion-vigente).
El alcance y los valores aprobados siguen en su **§16 PLAN MAESTRO REVISADO**.
No sustituye las skills ni autoriza cambios de producto por conveniencia técnica.

En cada sesión:

1. Leer `AGENTS.md`, la cabecera operativa de `CONTINUACION.md`, §22 y la ficha
   que corresponda. Leer completas las skills del dominio y sus referencias
   requeridas. Para arquitectura importante, leer plan y visión completos.
2. Revisar `git status --short`, `git log -5 --oneline` y los módulos/tests de
   la ficha. Si el código avanzó, actualizar el estado con evidencia; no rehacerlo.
3. Elegir **una sola subtarea** de la primera EX habilitada. Anunciar ID,
   resultado esperado, archivos previstos y exclusiones antes de editar.
4. Implementar y verificar esa unidad. No mezclar balance, arte y SDK en un diff.
5. Registrar evidencia y próximo ID exacto en `CONTINUACION.md`. Distinguir
   implementación, validación automática, validación humana y publicación.

Una petición de revisar/planear sólo autoriza documentación y diagnóstico.
Para implementar, debe existir una solicitud de cambio/continuación. Un bloqueo
humano no se salva inventando resultados ni habilitando la siguiente feature.

### Estados que se pueden declarar

| Estado | Significado |
| --- | --- |
| PENDIENTE | no implementado o no comprobado |
| EN CURSO | una subtarea concreta abierta |
| AUTOMÁTICO OK | comandos y aserciones pertinentes pasaron, con evidencia |
| ESPERA HUMANA | faltan dispositivo, prueba jugable o decisión indicada |
| CERRADO | aceptación automática y humana aplicable satisfecha |
| PROPUESTA | no implementar sin aprobación explícita |

No usar «terminado» para una tarea con una puerta requerida pendiente.
Nombres de archivo nuevos en esta guía son destinos propuestos: primero buscar
un módulo equivalente. No crear registros, managers o carpetas vacías por adelantado.

## 2. Mapa de avance y dependencias

| ID | Prioridad del plan | Entrega | Estado al redactar |
| --- | --- | --- | --- |
| EX-00 | 0 | comprobar estabilización y punto de partida | correcciones documentadas; no rehacer |
| EX-01 | 1–2 | cierre económico y revive sin doble cobro | PRÓXIMA; requiere tests de integración |
| EX-02 | 1 | Laboratorio medido y acotado | discrepancia código/objetivo pendiente |
| EX-03 | 2–3 | matriz rewarded local y diez runs comparables | instrumentos existen; puerta humana pendiente |
| EX-04 | 4 | conservar extracción de armas | implementada en `a3d0ccd`; no extraer otra vez |
| EX-05 | 5 | Vector Boomerang base y entrada segura al arsenal | pendiente, depende de EX-01 a EX-04 |
| EX-06 | 6 | Acto I Radial y contrato de actos | pendiente, depende de EX-05 |
| EX-07 | 7 | Acto II Angular y Calibration | pendiente, depende de EX-06 |
| EX-08 | 7/9 | niveles/evoluciones, una ruta por entrega | acompaña el acto que consume cada ruta |
| EX-09 | 8 | adaptadores reales y QA por portal | pendiente, después de EX-07 |
| EX-10 | 9 | Acto III Fracture | pendiente, después de EX-09 |
| EX-11 | 10 | Overdrive y producción | pendiente, después de EX-10 |

EX-08 es una ficha transversal, no permiso para adelantar todas las evoluciones.
Los identificadores EX no reemplazan el orden de prioridades del plan.

## 3. Fichas inmediatas

### EX-00 — Verificar estabilización, sin reabrir el proyecto

- **Entrada:** checkout actual y estado Git preservado.
- **Leer:** `BackgroundView.ts`, `VisualTokens.ts`, tests asociados, `.gitignore`,
  `package.json`, workflow de deploy y §51–56 de `CONTINUACION.md`.
- **Acción:** comprobar que resize de nebulosas, UTF-8 y caps de glow siguen
  cubiertos. Registrar comandos disponibles y evidencia previa con su fecha.
- **Salida:** lista de regresiones reproducidas, o confirmación de que no se
  requiere implementación aquí. Sin refactor global ni cambio de dependencias.
- **Límite:** el warning de chunk no equivale al peso inicial comprimido; no
  ocultarlo elevando el umbral. El workflow leído no demuestra por sí solo que
  exista una puerta dura de tamaño: verificarla antes de certificar producción.

### EX-01 — Cierre económico de una misma run

**Intención:** revivir no debe volver a pagar el progreso ya cobrado ni permitir
duplicar recompensas. Cierra un riesgo de prioridades 1–2, no crea monetización.

**Módulos:** `src/app/Game.ts`, `RunSummary.ts`, `GameState.ts`, sus tests,
`src/platform/RewardedOfferLedger.ts`, `src/platform/save/SaveStore.ts`,
`src/ui/GameOverOverlay.ts`, `src/debug/BaselineRunRecorder.ts` y tests.

**Evidencia de entrada:** `finishRun()` calcula y acredita la recompensa al
entrar al terminal; revive conserva estadísticas y permite volver a terminar.
Esta revisión estática exige una prueba de secuencia, no se etiqueta como fallo
reproducido hasta ejecutar la aserción.

Subtareas, en orden:

1. **EX-01a, caracterización:** testear muerte → revive exitoso → muerte/victoria
   con estadísticas crecientes; registrar saldo, recompensa base y número de
   registros baseline. Añadir doble-NOVA → intento de revive, callbacks repetidos,
   callback de run anterior, reload terminal y restart.
2. **EX-01b, corrección mínima si falla:** aplicar §16.7: resolver la posibilidad
   de revive antes de liquidar el resultado definitivo. El jugador puede
   terminar/cobrar sin anuncio. Double-NOVA pertenece al resumen definitivo;
   una run liquidada no vuelve a revivir. Cancelar/error no concede recompensa
   y conserva la salida normal. Si esta secuencia requiere cambiar un contrato,
   describirlo antes de editar; no introducir backend ni guardar una run activa.
3. **EX-01c, regresión:** guardar saldo/desbloqueos de forma idempotente,
   comprobar reload y restauración de audio/input. El ledger en memoria no
   demuestra por sí solo idempotencia después de recargar. Un cierre definitivo
   genera un único registro baseline; un intento revivible no cuenta como otra run.

**Aceptación:** con saldo inicial S y recompensa final R, sin bonus el saldo
final es `min(MAX_NOVA, S + R)`; con un double-NOVA válido es
`min(MAX_NOVA, S + 2*R)`. No se suma nuevamente el resultado provisional previo
al revive. Compra/cosméticos no forman parte de este test. Revive conserva
build, reloj y XP, otorga 35% HP y 2 s de protección, una vez por run.

**No hacer:** cambiar precios, porcentajes meta, timers visuales, daño del boss,
SDKs o la dificultad para facilitar la prueba. Reutilizar reloj falso y mocks
existentes. Si todos los casos ya pasan, documentarlo y no refactorizar.

### EX-02 — Laboratorio: medir antes de ajustar

**Entrada:** EX-01 sin fallos de saldo/save. Skills gameplay + validation;
architecture sólo si aparece una frontera compartida necesaria.

**Módulos:** `src/content/meta/PermanentUpgradeDefinitions.ts`,
`src/simulation/combat/CombatWeaponSystem.ts`, `ProjectileBehavior.ts`,
`OrbitBehavior.ts`, `ChainBehavior.ts`, `src/ui/meta/MetaProgressionPanel.ts`.

1. **EX-02a:** caracterizar meta 0 y máxima con idéntica semilla, posición,
   duración y cartas. Escenarios: objetivo único, grupo disperso y grupo denso.
   Medir daño aplicado por arma, golpes, tiempo de eliminación y cooldown mínimo.
   Mantener también un blanco con HP suficiente para observar DPS sostenido.
2. **EX-02b:** resolver la diferencia entre descripción general y bonus que
   actualmente recibe sólo Projectile. Seguir el daño general acotado de §16.6;
   no extender los porcentajes actuales a todas las armas sin recalibrar.
   Cadencia debe tener una semántica explícita por arma (disparo o tick), sin
   acelerar rotación ni duplicar aplicación. Fórmula y preview usan una fuente.
3. **EX-02c:** ajustar porcentajes, conservando IDs, cinco niveles y compras
   existentes salvo decisión explícita distinta. Como candidato de ensayo,
   probar +1.5% daño/nivel y −1% intervalo/nivel: `1.075/0.95 ≈ 1.132` antes
   de caps/cartas. Es una hipótesis de calibración, no aceptación automática.
4. **EX-02d:** guardar resultado y casos en `docs/balance/` al producir evidencia
   real. Comparar también cartas que acerquen cooldown/tick a su mínimo.

**Aceptación:** ventaja efectiva dentro del máximo objetivo 10–15% del plan
(sin forzar un mínimo en escenarios donde una mejora no aporta). Las mejoras
son monotónicas, el nivel máximo no rompe límites y el save conserva propiedad,
saldo y niveles. Explicar las diferencias entre DPS teórico, aplicado y tiempo
de eliminación; no reducir todo a una fórmula aislada.

**No hacer:** borrar saves, regalar/reembolsar NOVA sin decisión, cambiar precios
o añadir vida, crítico, vampirismo, XP o escudo permanentes. Si conservar compras
requiere una política nueva de compensación, pedir esa decisión.

### EX-03 — Cerrar evidencia local y baseline humano

**Entrada:** build candidato posterior a EX-02; no mezclar datos de balances
anteriores. Módulos existentes: `LocalAdService`, `RewardedAdController`,
`RewardedOfferLedger`, `BaselineRunRecorder`, `BaselinePanel`, `FrameProfiler`.

1. **EX-03a:** matriz por placement de éxito, cancelación, unavailable, error,
   timeout, doble clic, callback repetido/tardío, cierre de vista y retorno de
   background. Comprobar saldo, CTA normal, audio, input y estado pausado.
   Verificar alternativa NOVA de reroll requerida por §16.7; si falta, registrar
   e implementar aquí con débito idempotente, no inventar precio silenciosamente.
2. **EX-03b:** registrar diez runs normales en un mismo teléfono/navegador/preset
   con `?baseline=1`; sin `?boss=1` ni stress. Adjuntar commit, modelo, navegador,
   calidad, meta equipada, uso de revive/reroll y observaciones por run. No
   comprar niveles ni cambiar balance entre las diez. Conservar reporte anterior
   antes de borrar datos; no borrar el save del jugador para crear una prueba.
3. **EX-03c:** sesión separada con `?stress=1&profile=1&quality=low`, y comparación
   Medium/High. Registrar conteos reales, duración, legibilidad y frame times.
   No afirmar «150 FX probados» si el escenario no los mantiene realmente activos.

**Salida:** reporte en `docs/balance/` y perfil en `docs/performance/` con datos
reales, no tablas rellenadas con valores objetivo. El instrumento actual usa
p95 de una ventana rolling: etiquetarlo así, no como p95 de toda la run ni GPU.
Si hace falta otro agregado, añadirlo como subtarea de instrumentación probada.

**Puerta:** diez runs sin softlock/pérdida de progreso/daño inevitable observado;
dos builds cambian el recorrido; controles y amenazas se entienden. El autor
puede validar balance, pero para comprensión inicial pedir además una sesión
de alguien nuevo, anotada aparte. Un fallo humano se reproduce y corrige antes
de congelar la nueva línea base. Sin teléfono/reporte: ESPERA HUMANA; no inventar.

### EX-04 — Conservar lo ya extraído

`WeaponScheduler`, `ProjectileBehavior`, `OrbitBehavior` y `ChainBehavior` ya
existen. Verificar sus tests y fachada; no volver a extraerlos. El scheduler
actual tiene callbacks concretos: no asumir que existe un registry genérico.
Sólo ampliar lo necesario al entrar Boomerang. No crear behaviors de Aura/Pulse
ni un ECS antes de tener su consumidor.

## 4. Arsenal y actos: ejecución por incrementos

### EX-05 — Vector Boomerang, primero una pieza base

**Entrada:** EX-01–04 cerrados. Skills gameplay + rendering + mobile-performance
+ validation; SVG para crear el asset, architecture para extender contratos.

**Responsabilidades:** definición en `src/content/weapons/`; trayectoria y hits
en `src/simulation/combat/BoomerangBehavior.ts` (nuevo consumidor); scheduling
en `WeaponScheduler`; snapshots readonly en `CombatRenderState`; visual pooled
en `src/presentation/pixi/`; cartas por `UpgradeDefinitions`/`UpgradeApplier`.

1. **EX-05a, ficha numérica:** antes de producción cerrar DEC-01 (apartado 7).
   Anotar rango, velocidad, retorno, daño, radio, cooldown, TTL y capacidad. No
   derivar colisiones de la skin Arc Needle ni alterar esa skin para simularlo.
2. **EX-05b, simulación aislada:** salida hacia target y regreso al player móvil,
   una pieza; máximo un hit por enemigo en salida y otro en regreso. Ledger de
   hits debe distinguir encarnaciones de un slot enemigo reciclado. Limpiar
   estado al reset/liberar. Cubrir target muerto, ausencia de target, player
   muerto, captura al regresar, TTL, borde y pool lleno. Definir colisión
   barrida para no saltar enemigos entre pasos; broad-phase usa la grid actual.
3. **EX-05c, representación:** sprite orientado con velocidad real, trail corto
   por calidad y señal de regreso clara. No XML, texturas ni arrays nuevos por
   frame/cast. Pausa/restart limpian FX y trayectoria. Cosméticos no cambian hits.
4. **EX-05d, selección:** hacer cumplir máximo tres armas antes de exponer la
   cuarta. Si hay tres equipadas, no ofrecer una cuarta adquisición; upgrades
   de las equipadas siguen válidos. No expulsar un arma automáticamente. Si el
   catálogo queda corto, resolver el fallback de cartas sin opciones inválidas.
5. **EX-05e, prueba:** casos seeded de blanco único/horda dispersa/densa, player
   quieto/en movimiento y rendimiento de combinaciones de tres armas. Comparar
   igual número de ticks bajo render 30/60/144 Hz. Una run móvil y una PC.

**Aceptación:** mover al player cambia útilmente la alineación de regreso;
colisión y visual coinciden; no hay tercer hit por fase, bloqueos ni crecimiento
de pools. La variante base entra al catálogo sólo tras las puertas previas.
Twin Comet y Singularity Return son entregas separadas bajo EX-08.

### EX-06 — Acto I Radial: formalizar y luego diferenciar

**Módulos de entrada:** `ArenaModel`, `DifficultyDefinitions`, `BossDefinition`,
`BossSystem`, `CombatSimulation`, `GameState`, `Game`, save y resúmenes.

1. **EX-06a:** introducir `ActDefinition` con un único consumidor Radial que
   reproduce exactamente tiempos, spawns y boss actuales. Test de equivalencia
   por semilla antes de añadir la nueva regla. No crear actos vacíos en el menú.
2. **EX-06b:** especificar/probar un pulso radial conforme a DEC-02: una amenaza
   nueva, respuesta posible y arbitraje con Laser/boss. Usar fases explícitas y
   evitar ataques superpuestos que cierren toda salida. No añadir enemigos aquí.
3. **EX-06c:** resultado de acto, recompensa única y estado de intermisión.
   Mientras no exista Acto II jugable, mostrar terminar/victoria sin un botón
   Continuar roto. No guardar una expedición parcialmente restaurable.
4. **EX-06d:** comprobar regla entendida después de verla, builds y diez runs
   del acto nuevo. Ajustar duración hacia Quick Act sólo en una tarea de balance
   explícita, comparando con baseline; no recortar el reloj incidentalmente.

**Salida:** acto corto que enseña distancia/centro/borde y tiene victoria clara.

### EX-07 — Acto II Angular, sin producir todo a la vez

1. **EX-07a:** tres plantillas Calibration por entrada directa, authored y
   probadas. Respetan armas desbloqueadas, máximo tres y no conceden NOVA extra.
   Expedition conserva la build; Quick Act inicia la plantilla sin estado previo.
2. **EX-07b:** una familia enemiga angular primero; ficha de comportamiento,
   silueta, telegraph, stats y cap antes de implementar. Incorporar Orbiter,
   Charger y Splitter sucesivamente, no como tres cambios simultáneos. Un
   Splitter respeta capacidad total y tiene profundidad de división acotada.
3. **EX-07c:** Pulse Ring base y después sus rutas mediante EX-08. Test de un
   hit por onda y target, radio barrido, empuje limitado y boss inmóvil por empuje.
4. **EX-07d:** un hazard angular y Orbital Warden con patrones especificados en
   DEC-02; interfaz de boss compartida sólo donde el segundo boss lo necesita.
5. **EX-07e:** I→II, terminar sin derrota, recompensa/desbloqueo único, reroll
   una vez por acto frente a revive una vez por run. Diez runs y resize en
   intermisión; no reutilizar ciegamente `restartRun()` si borra la build.

**Salida:** el jugador debe aprender sectores/alineación, no sólo más densidad.

### EX-08 — Niveles y evoluciones, ficha reutilizable por arma

Los nombres y porcentajes viven únicamente en §16.4–16.5 del plan. Una entrega
implementa un arma o una evolución; no las doce rutas a la vez.

1. Diseñar mapeo explícito de las cartas existentes a niveles 1–7 sin duplicar
   bonus de stacks. Guardar fixtures de las builds anteriores. Hacerlo antes de
   presentar la primera evolución; no cambiar todas las cartas durante EX-05b.
2. Probar elegibilidad al nivel 7, dos rutas ofrecidas en la siguiente ocasión,
   exclusión mutua, aplicación única y comportamiento de reroll. DEC-03 cierra
   el layout de dos rutas frente a las tres cartas normales antes de UI.
3. Implementar las rutas en orden de dependencia real: modificaciones de
   Projectile/Orbit primero; Boomerang tras EX-05; Pulse en Acto II; Aura en III.
   Closed Circuit espera un estado de borde cargado definido y probado; no
   deduce carga de colores ni inventa un segundo estado de arena en render.
4. Comparar contra nivel 7 base: objetivo +30–45% de contribución ideal, techo
   1.6× single-target y 2× cobertura del plan. Registrar daño sostenido, cobertura
   y seguridad; testear todos los niveles y meta máxima que puedan romper caps.
5. Verificar cooldown por target, tope de entidades, boss inmune a fuerzas y
   una run por ruta. Si una ruta domina daño/control/seguridad, recalibrar antes
   de seguir. No usar su aspecto más brillante como evidencia de diferenciación.

## 5. Plataforma y producción

### EX-09 — SDKs, uno por build y por entrega

**Entrada:** EX-07 cerrado y flujo rewarded local seguro. Cargar skill platforms
+ validation; consultar en ese momento documentación oficial, con fecha/URLs.

1. Auditar primero aislamiento real de build, lifecycle, guardado y textos
   i18n/inglés. Los directorios `dist/poki` y `dist/crazygames` no son SDKs.
2. Implementar Poki tras su adaptador y probar éxito/fallo/init/adblock sin
   tocar simulación. Implementar CrazyGames en otra entrega con su Data Module.
3. Probar contrato local y real: callbacks duplicados/tardíos, timeout, no fill,
   muting, pausa, blur, regreso y save. Ocultar CTA cuando el destino no soporte
   rewarded; nunca activar anuncios automáticos para satisfacer una suposición.
4. Registrar el artefacto exacto en Inspector/Preview, errores, red y tamaño.
   Medir descarga fría y assets/audio diferidos; hacer efectiva la puerta de
   presupuesto en CI si aún falta. No subir su límite sólo para dejarla verde.

**Salida:** evidencia por portal; credenciales, subida o acuerdos requieren
autorización pertinente. Sin acceso: entregar adaptador probado localmente y
marcar QA de portal pendiente, no declarar integración comercial cerrada.

### EX-10 — Acto III Fracture

Orden: especificación DEC-02 → barrera temporal aislada → una familia enemiga
por entrega → Resonant Aura base → evoluciones pendientes → Fracture Engine
→ transición II→III y final de Expedition → diez runs.

Barreras no nacen bajo el player; telegraph inicial mínimo 0.8 s y corredor de
cuatro diámetros del player. Probar transitabilidad con combinaciones activas,
no sólo dibujar un hueco. Aura tiene banda interior vacía y cooldown por target;
Prism Wall tiene huecos lógicos reales, no sólo arcos visuales. Reutilizar los
límites globales; no aumentar enemigos/proyectiles para aparentar progresión.

### EX-11 — Overdrive y preparación de lanzamiento

Entrada: tres actos y sus puertas cerrados. Es una continuación opcional tras
III, no reemplaza Quick Act/Expedition. Definir tabla de ciclos con composición,
patrones, presión y caps; no multiplicadores de HP sin límite ni daño inevitable
como única forma de acabar. Probar sesiones prolongadas, contadores, memoria,
save y recompensa una sola vez. La dificultad puede ser extremadamente alta,
pero no romper números ni volver inútiles los telegraphs.

Después, y en tareas propias: economía observada, metadatos/capturas, acceso
comercial y analítica sólo con autorización. No añadir logros, retos diarios,
cuentas, moneda premium o sincronización propia como «parte implícita» de release.

## 6. Fichas visuales y estado de ejecución

Origen: propuestas de la revisión del 04-09. La solicitud del 05-09 y §22.5
autorizan flota/cosméticos: VIS-01 tiene asset modular y despiece implementados,
pero falta anticipación por fase; VIS-02 tiene tratamiento visual implementado
y espera medición física/aprobación. VIS-03 sigue PROPUESTA. No ejecutar de
nuevo las partes terminadas. Requieren rendering + SVG
cuando corresponda + mobile-performance + validation. No bloquean EX-01–03.

### VIS-01 — Boss modular y legible

- Objetivo: igualar el acabado de las naves actuales conservando Core Sentinel.
- Leer `CombatEntitiesView.ts` (dueño actual del sprite), `BossView.ts`
  (telegraphs/barra), `EnemyShipVisual`, `SvgTextureFactory`, `TerminalFxView`.
- Estado 05-09: `BossShipVisual` ya compone cuatro piezas y un flat Low,
  con reloj terminal de despiece. Ver la guía artística por familias. No crear
  otra instancia ni rehacer el asset al retomar la anticipación por fases.
- Propuesta acotada: núcleo + placas + aro segmentado, máximo ocho piezas
  visibles. Producir ficha/silueta y después SVGs alineados; no duplicar el boss
  entre dos vistas ni crear un segundo slot de gameplay.
- Mapear animaciones a `BossRenderState.phase/progress`: carga antes de barrido,
  apertura antes de anillo, recuperación y colapso. La animación sigue el
  telegraph existente, nunca lo retrasa ni amplía daño/radio/HP.
- Aceptar sólo si se distingue en móvil/Low, el hueco seguro sigue visible,
  frames y anclas coinciden, restart no deja piezas y no cambia la secuencia
  seeded de combate. No prolongar los 3 s terminales existentes.

### VIS-02 — Fondo integrado, no más partículas

- Leer `BackgroundView.ts`, `ArenaView.ts`, definiciones y previews del locker.
- Comparar baseline con una textura de nebulosa suave cacheada desde una fuente
  compatible y reutilizada. Empezar con los conteos actuales; no añadir capas
  animadas. Ensayo implementado: alpha de arena 0.84 (antes 0.92), textura suave
  y composición periférica; Low conserva dos nubes estáticas. No sumar capas
  antes de medir este ensayo. El menú CSS sigue siendo una indicación de tema,
  la lámina Pixi es la referencia exacta; alineación total del menú pendiente.
- No introducir imagen enorme, blur por frame, otra simulación ni cambio de
  mundo. Alinear preview y runtime; todas las atmósferas son cosméticas.
- Aceptación: cuatro temas legibles, landscape/portrait/resize, peligro visible
  en escala de grises y sin regresión medida. Si reduce contraste, revertir el
  ensayo propio aunque se vea mejor en una captura vacía.

### VIS-03 — Resonancia coordinada

- Sincronizar borde, onda, una respuesta del core y cue existente sobre el
  evento de expansión; usar relojes de presentación y tokens, no timers nuevos
  que gobiernen gameplay. No añadir daño ni buff por el aspecto de la onda.
- Reutilizar `ArenaView`, `PlayerView`, `ScreenFxView` y `AudioCueDefinitions`;
  un máximo de una secuencia de expansión activa. No aumentar voces, pools o
  shake global por iniciativa propia. Verificar deduplicación durante crecimiento.
- Pausa y reduced-motion mantienen señal informativa sin movimientos grandes.
  Comparar el momento completo, no sólo una captura de máxima luminosidad.

## 7. Decisiones que el ejecutor no debe inventar

Las siguientes fichas son planificación habilitada; su resultado debe quedar
aprobado antes de implementar el contenido ambiguo. No hace falta pedirlas
todas ahora: resolver sólo la que bloquea la próxima subtarea.

| ID | Antes de | Debe quedar escrito |
| --- | --- | --- |
| DEC-01 | EX-05a | parámetros Boomerang, retorno/captura, TTL/cap, origen y regla al borde; propuesta comparada con Projectile base |
| DEC-02 | regla nueva de cada acto | cronología, geometría, daño, respuesta segura, prioridad frente a hazards existentes y parámetros de cada enemigo/boss; un acto a la vez |
| DEC-03 | primera evolución | mapeo niveles/cartas, cuándo aparecen dos rutas, interacción con reroll y Calibration; conservar máximo tres armas |
| DEC-04 | metaprogresión adicional | si se desean cosméticos por dominio/investigación y condiciones; no crear sistema de logros por inferencia |
| DEC-05 | alternativa NOVA de reroll si falta precio | coste authored y momento del débito; no cambiar precios de cosméticos para financiarlo |

La ficha de decisión contiene: problema, opción recomendada, alternativa,
impacto en el control de un dedo, coste/caps, pruebas y aprobación del usuario.
El ejecutor puede escoger detalles locales reversibles (nombres privados,
organización de tests), no cambiar la regla de producto para evitar preguntar.

## 8. Validación y traspaso obligatorio

### Comandos y evidencia

Para un cambio de código: prueba específica primero, luego `npm run typecheck`,
`npm test`, `npm run test:browser`, `npm run build:poki` y
`npm run build:crazygames`. `test:browser` ya construye local según package.json;
verificar scripts actuales antes de duplicar trabajo. Documentar comandos,
exit codes y entorno. Si el runner imprime tests OK pero no termina, informar
el problema del proceso; no convertirlo en exit code 0 supuesto.

Para documentación sola: revisar diff, whitespace, rutas/enlaces locales,
numeración/IDs, dependencias y coherencia con la fuente de verdad. No afirmar
que se probó el juego si no se ejecutó. No es necesario reconstruir runtime.

Para rendimiento: mismo dispositivo, navegador, commit, preset, viewport y
escenario; separar calentamiento y medición. Como protocolo inicial, tres
muestras de 60 s por variante tras 15 s de calentamiento, anotando temperatura
o ahorro de energía si afecta. Informar media/p95/frames largos y conteos reales;
GPU/GC/draw calls sólo cuando estén medidos por herramienta apropiada. Una
regresión repetida obliga a investigar antes de aumentar presupuesto. Meta 60
FPS y mínimo jugable 30 no son una promesa sobre cualquier teléfono.

### Formato de cierre en CONTINUACION.md

```text
Fecha y commit de partida:
ID / subtarea:
Objetivo y exclusiones:
Archivos cambiados:
Pruebas ejecutadas y resultados:
Evidencia humana / dispositivo / reporte:
Puerta: AUTOMÁTICO OK / ESPERA HUMANA / CERRADO
Pendiente concreto y condición para avanzar:
Siguiente ID habilitado:
Publicación: sin publicar / artefacto y commit verificados
```

No copiar el plan completo al snapshot. Actualizar su cabecera para que una
nota vieja al final no sea el único lugar que contiene el estado real.

### Cuándo detenerse

- Falla una prueba relacionada: resolverla o explicar bloqueo, no abrir otra EX.
- El diff alcanza una responsabilidad ajena: separar la tarea y justificarla.
- Falta especificación de daño/patrón/economía: abrir la DEC pertinente.
- Falta móvil, QA de portal o aprobación visual: marcar ESPERA HUMANA; se puede
  preparar documentación, no certificar ni saltar a gameplay dependiente.
- El worktree contiene cambios ajenos incompatibles: preservar y pedir dirección.
- Un test exige manipular internals desde UI/render: revisar la frontera, no
  introducir atajos de producción para que el test pase.

Prompt breve de continuación sugerido:

> Lee AGENTS.md, CONTINUACION.md y la entrada §22 del plan. Sigue la primera
> subtarea EX habilitada en docs/PLAN_EJECUCION.md. Indica su ID, conserva lo ya
> implementado, no actives propuestas VIS/DEC sin aprobación y entrega evidencia
> de sus pruebas con el siguiente paso exacto. No hagas commit ni push salvo
> que esta solicitud lo autorice expresamente.
