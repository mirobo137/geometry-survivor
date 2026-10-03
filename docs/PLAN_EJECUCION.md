# Guía de ejecución vigente — Geometry Survivor

Revisión operativa: 02-10-2026. Base de correcciones: `76a6c78`.
Desarrolla [§22 del plan](../PLAN_DESARROLLO.md#ejecucion-vigente); alcance y
decisiones siguen en el plan maestro y los contratos canónicos. Esta guía
reemplaza la cola de trabajo de septiembre, no sus reglas todavía vigentes.

## 1. Cómo empezar una sesión

1. Leer `AGENTS.md`, [CONTINUACION.md](../CONTINUACION.md), la entrada §22 y el
   contrato de la tarea. Cargar completas las skills requeridas.
2. Comprobar Git, versión de Node, scripts, módulos y tests existentes. No
   reconstruir features porque una ficha antigua dice «pendiente».
3. Elegir una subtarea autorizada y anunciar objetivo/exclusiones. Una auditoría
   no autoriza implementar sus soluciones ni publicar.
4. Verificar proporcionalmente, separar resultado automático de aceptación
   humana y registrar siguiente acción exacta en el snapshot.

| Estado | Qué demuestra |
| --- | --- |
| IMPLEMENTADO | hay consumidor runtime; no implica QA actual completo |
| AUTOMÁTICO OK | comandos/aserciones identificados pasaron en una revisión concreta |
| ESPERA HUMANA | falta dispositivo, run, arte o aceptación requerida |
| PENDIENTE | no implementado o no comprobado |
| CERRADO | aceptación automática y humana aplicable satisfecha en su fecha |
| PROPUESTA | no implementar sin aprobación explícita |

Los informes fechados no prueban el estado Git, procesos activos o publicación
de hoy. La fuente de evidencia actual es la
[auditoría de recursos del 02-10-2026](audits/AUDITORIA_RECURSOS_2026-10-02.md)
y su [seguimiento de correcciones](audits/CORRECCIONES_RECURSOS_2026-10-02.md).

## 2. Mapa de avance que se conserva

| ID | Estado documentado y regla al retomar |
| --- | --- |
| EX-00 | Estabilización inicial entregada; sólo reabrir con regresión reproducible. |
| EX-01 | Cierre económico/revive implementado y cubierto; no volver a liquidar una run ni reiniciar sus ofertas entre tramos. |
| EX-02 | Laboratorio V2 implementado. EX-02c balance aprobado por el usuario el 28-09; prueba visual/táctil del Laboratorio aplazada el 29-09. EX-02d es diagnóstico opcional, no recalibración global obligatoria. |
| META-01 | Consumidores reales de meta/actos/Overdrive entregados; ya no es una implementación pendiente. Expedition está eliminado. |
| EX-03 | Baseline/rewarded local y stress PC/S25+ aceptados en septiembre. Esa evidencia no certifica el móvil modesto, memoria prolongada ni builds actuales. |
| EX-04 | Extracción de armas existente; no hacer otra capa equivalente. |
| EX-05 | Vector Boomerang base entregado; variaciones vigentes en contratos del arsenal. |
| EX-06 | Acto I Radial entregado y validado por el usuario. |
| EX-07 | Acto II Angular entregado y validado por el usuario. |
| EX-08 | Seis familias, rangos, dos evoluciones por arma y maestrías entregados/validados. No ejecutar instrucciones V1 antiguas. |
| EX-09 | PENDIENTE: SDKs, presupuestos, artefactos y QA de portales. |
| EX-10 | Acto III Fracture entregado y validado por el usuario. |
| EX-11.1–EX-11.7 | Contrato/save, director, transición, seis armas, reservas, parejas y entrada pública/retirada entregados. Auditorías OD-A/OD-B se conservan como criterios de regresión, no otra cola pendiente. |
| OD-F01 | PROPUESTA futura de Asalto por puntos; Normal conserva sus reglas. |

La aprobación de contenido registrada en [§22.15–17 del plan](../PLAN_DESARROLLO.md)
no equivale a aprobación comercial, suite actual completa o ausencia de fugas.

## 3. Cola inmediata antes de publicación

### AUD-RES — Auditoría de recursos y carga (sesión actual)

**Estado original:** informe y evidencias entregados el 02-10-2026, sin correcciones
en aquella revisión. Browser: 81 casos correctos con teardown asistido QA-01.
La entrega posterior autorizada y el estado vigente por ID están en
[correcciones](audits/CORRECCIONES_RECURSOS_2026-10-02.md); no repetir el diagnóstico
original como si fuera la cola vigente. La prueba larga sigue pendiente.

**Objetivo:** distinguir memoria Node/Vite, recursos Chromium/Pixi y preparación
de imágenes. Localizar problemas reproducibles con severidad, evidencia y
regresiones propuestas; no etiquetar toda caché retenida como fuga.

**Lectura:** [informe actual](audits/AUDITORIA_RECURSOS_2026-10-02.md),
[diagnóstico Vite](performance/VITE_MEMORY.md), skills validation +
mobile-performance/rendering según el área. Seguir sus resultados antes de
prometer qué cambio resolverá el síntoma.

**Salida:** hallazgos con dueño, reproducción, impacto y prioridad; resultados
de comandos separados de límites de medición. El episodio histórico de Node
no debe adjudicarse al juego ni a la versión sin evidencia suficiente.

### AUD-RES-CORR — Correcciones de los hallazgos

**Entrada:** solicitud de implementación y alcance autorizado por el usuario.
Corregir cada riesgo con regresión identificable, preservando arquitectura,
balance, saves y arte. Esta revisión autoriza el conjunto de correcciones de
recursos; no la publicación ni la ejecución automática de puertas futuras.

Seguimiento autorizado el 02-10: [estado de correcciones por ID](audits/CORRECCIONES_RECURSOS_2026-10-02.md).
RES-01–07, parte aplicable de RES-08, peso/CI de RES-09 y protección de rewarded
de RES-10 implementados; RES-11/SDKs reales y puertas humanas no se cierran por
esta entrega. No volver a ejecutar la auditoría anterior como si fuera pendiente.

1. Resolver bloqueantes/altos de ciclo de vida, descarga o integridad primero.
2. Añadir una regresión que reproduzca el fallo antes de la solución cuando sea
   posible: carga fría, error de red, cambio de skin, navegación/reinicio repetido
   o limpieza de vista. No convertir la precarga de todo el catálogo en solución
   por defecto: medir red, memoria decodificada y tiempo de primer estado útil.
3. Repetir el escenario corregido con mismo artefacto, viewport/calidad y cache.
   Separar Node de browser/GPU y estabilización tras GC de crecimiento sostenido.
4. Volver a validar las fronteras del consumidor afectado; no ampliar pools ni
   borrar fallback para esconder la carga tardía.

**Salida:** condición del hallazgo resuelta o bloqueo explicado, pruebas y
riesgo residual. No reclamar «sin fugas» con un smoke breve.

### EX-02-HUM — Aceptación del Laboratorio aplazada

Retomar únicamente cuando el usuario pueda comprobarlo. Usar el
[recordatorio V2](design/LABORATORIO_META_V2.md#recordatorio-pruebas-manuales-aplazadas):
desbloqueo real tras Fracture, ofertas actuales, compra/persistencia, rango
siguiente, paneo/pinch/zoom/recentrado, modal y Vitalidad rewarded tras tres
compras NOVA. No confundir este QA con reabrir el baseline EX-02c.

### PERF-RELEASE — Carga y sesión prolongada

- Carga fría y caché en Inicio, Actos, Skins, inicio/reinicio de run y primer cast
  de cada arma/evolución. Documentar latencia hasta imagen lista y primera
  respuesta; un PNG descargado puede aún requerir decode/subida de textura.
- Ciclos repetidos de menús/equipado/reinicio y una sesión larga de Overdrive,
  incluyendo pareja y transición. Registrar nodos/recursos y memoria en momentos
  comparables, no sólo un valor máximo aislado.
- Android real Low/High con rotación y background/foreground; cuando haya
  teléfono modesto, verificar mínimo jugable y densidad real. El S25+ no sustituye
  esa puerta y Chromium emulado no mide VRAM/dispositivo físico.
- Verificar descarga inicial y completa de cada build con criterio explícito;
  warning de chunk JavaScript no equivale a puerta de descarga comprimida.

Usar los presupuestos de [§9 del plan](../PLAN_DESARROLLO.md). Un incremento
medido requiere investigación, no subir límites para aprobar.

## 4. EX-09 — Plataformas, una por entrega

**Estado:** pendiente. `src/main.ts` crea `LocalPlatform` en los tres targets;
los directorios `dist/poki`/`dist/crazygames` no son integraciones reales.

**Entrada:** riesgos bloqueantes de esta auditoría resueltos, flow rewarded
local seguro, skill platforms + validation y documentación oficial consultada
en la fecha de la integración. No implementar ambos portales en un diff masivo.

1. Auditar selección real de build, imports/requests del SDK, lifecycle/save y
   textos i18n/inglés. No permitir que el destino local cargue SDK comercial.
2. Poki: adaptador aislado, init/fallo/adblock, game start/pause/resume y contrato
   de rewarded. CrazyGames en una entrega posterior, con su Data Module vigente.
3. En ambos: callback duplicado/tardío, timeout/no fill, pausa/audio/blur/retorno
   y guardado seguro. Ocultar CTA cuando el destino no soporte rewarded.
4. Mantener aceptación explícita para revive, reroll, doble NOVA, cosmético y
   Vitalidad conforme a producto; nunca abrir anuncios automáticos por inferencia.
5. Hacer efectivas las puertas de tamaño/validación pendientes en CI. Registrar
   las peticiones permitidas y descarga fría/diferida; no elevar el presupuesto
   sólo para pasar el check.
6. Registrar commit/artefacto exacto y evidencia Poki Inspector/CrazyGames Preview.
   Sin acceso real: marcar QA de portal pendiente, no integración comercial cerrada.

Subida comercial, credenciales, contratos, analítica y publicación requieren la
autorización pertinente; GitHub Pages prueba el target local, no estas condiciones.

## 5. Fuentes canónicas por dominio

| Tema | Entrada actual |
| --- | --- |
| Alcance/puertas/fronteras | [PLAN_DESARROLLO.md](../PLAN_DESARROLLO.md), [AGENTS.md](../AGENTS.md) y `skills/` |
| Campaña/Overdrive | [ACTOS_Y_META](design/ACTOS_Y_META.md), [PLAN_INFINITO](design/PLAN_INFINITO.md) |
| Rangos/evoluciones/cartas | [PROGRESION_ARMAS_V2](design/PROGRESION_ARMAS_V2.md), [EVOLUCIONES_V2](design/EVOLUCIONES_V2.md) y definiciones/tests actuales |
| Meta/NOVA/Laboratorio | [LABORATORIO_META_V2](design/LABORATORIO_META_V2.md) |
| Raster/SVG/identidad | [ARTE_HIBRIDO](design/ARTE_HIBRIDO.md), [NAVES_PNG](design/NAVES_PNG.md), READMEs de assets/prompts y skill SVG/rendering |
| Carga/recursos | [auditoría actual](audits/AUDITORIA_RECURSOS_2026-10-02.md), [VITE_MEMORY](performance/VITE_MEMORY.md) |
| Audio | [AUDIO_SFX_ZZFX](design/AUDIO_SFX_ZZFX.md) |
| CI y fallos browser | [CI_DEPLOY](CI_DEPLOY.md), scripts/configuración actuales |

Expedition, tienda meta V1, estados antiguos de «evoluciones pendientes» y
recomendaciones de Node anteriores no vuelven a ser vigentes por aparecer en un
archivo histórico. Ante contradicción material, aplican las fuentes de verdad
de `AGENTS.md`; actualizar el contrato correcto con autorización, no copiar reglas.

## 6. Validación y traspaso

Para lógica: caso focalizado → `npm run typecheck` → `npm test`. Para una vista,
añadir smoke pertinente, errores de consola/red, resize, pausa y cleanup. La
puerta final incluye los tres builds y suite browser completa. Inspeccionar
`package.json`: los scripts de build/test:browser repiten comprobaciones, por lo
que se puede ejecutar `npx vite build --mode ...` después de typecheck/tests sin
afirmar que se ejecutaron scripts diferentes ni omitir pruebas necesarias.

Para docs solamente: diff/whitespace, enlaces locales, IDs y coherencia. Para
rendimiento: misma máquina, navegador, commit, calidad, viewport y escenario;
calentamiento separado de medición. Informar p95/frames largos/recursos sólo
cuando estén medidos. Una suite verde no demuestra diversión, seguridad de un
portal ni estabilidad durante horas.

Al cerrar, conservar en `CONTINUACION.md`: fecha/base, ID, objetivo/exclusiones,
archivos, comandos y resultados, evidencia humana, puerta, pendiente concreto,
siguiente ID y publicación verificada o «sin publicar». Detenerse ante una prueba
relacionada fallida, autoridad nueva necesaria o cambios ajenos incompatibles.

## 7. Historial consultable, no tareas pendientes

Las fichas completas EX/VIS/DEC, ensayos de balance y entregas se conservaron
en el [archivo de ejecución anterior](archive/PLAN_EJECUCION_HASTA_2026-10-02.md).
VIS-01–03 y DEC-01–05 no se activan por consultarlas: comprobar primero la
implementación/decisión posterior y una solicitud vigente.
Las [sesiones previas](archive/CONTINUACION_HASTA_2026-10-02.md) contienen la
evidencia fechada original. Índice general: [docs/README.md](README.md).
