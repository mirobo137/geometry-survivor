# Documentación — mapa vigente

Revisión de navegación: 03-10-2026. Este índice clasifica contratos, evidencia y
propuestas; no certifica pruebas del juego ni sustituye el plan maestro.

## Para trabajar ahora

Leer [AGENTS](../AGENTS.md) → [CONTINUACION](../CONTINUACION.md) →
[§22 del plan](../PLAN_DESARROLLO.md#ejecucion-vigente) →
[guía corta de ejecución](PLAN_EJECUCION.md) y la skill de la tarea.
La [auditoría de recursos](audits/AUDITORIA_RECURSOS_2026-10-02.md) es la entrada
para memoria/carga y preparación de publicación. Su
[seguimiento de correcciones](audits/CORRECCIONES_RECURSOS_2026-10-02.md)
distingue cambios comprobados de puertas aún pendientes. EX-09 continúa pendiente.

## Contratos y referencias activas

| Área | Documento | Uso |
| --- | --- | --- |
| Visión y alcance | [proyecto](../proyecto.md), [plan maestro](../PLAN_DESARROLLO.md) | Principios, decisiones, presupuestos y puertas. Las entregas fechadas no son una cola pendiente. |
| Actos/campaña | [ACTOS_Y_META](design/ACTOS_Y_META.md) | Identidad y transiciones; las menciones antiguas de Expedition no describen un modo vigente. |
| Infinito | [PLAN_INFINITO](design/PLAN_INFINITO.md) | Contrato Overdrive implementado. EX-02c quedó aprobado posteriormente en §22.16; no reabrirlo por su nota antigua. |
| Arsenal | [PROGRESION_ARMAS_V2](design/PROGRESION_ARMAS_V2.md), [EVOLUCIONES_V2](design/EVOLUCIONES_V2.md) | Rangos, dos rutas, ofertas y maestrías; aplicar refinamientos posteriores del plan/contenido. |
| Laboratorio | [LABORATORIO_META_V2](design/LABORATORIO_META_V2.md) | Contrato actual de progresión permanente, compras y guardado; reemplaza V1. |
| Controles | [CONTROLES_MOVILES](design/CONTROLES_MOVILES.md) | Input y experiencia táctil. |
| Audio | [AUDIO_SFX_ZZFX](design/AUDIO_SFX_ZZFX.md), [laboratorio de escucha](audio/sound-lab.html) | Recetas/categorías, Howler música y ZzFX efectos. |
| Arte | [ARTE_HIBRIDO](design/ARTE_HIBRIDO.md), [NAVES_PNG](design/NAVES_PNG.md), [ESTUDIO_ARTE_GENERADO](design/ESTUDIO_ARTE_GENERADO.md) | Identidad, generación/optimización, transparencia, ownership y costes. |
| Catálogo de lanzamiento | [CATALOGO_DIEZ](design/CATALOGO_DIEZ.md) | Diez naves, diez cañones y diez fondos; identidad, procedencia, precios y validaciones del lote adicional. |
| Enemigos y muerte | [ENEMIGOS_IMAGEN_UNICA](design/ENEMIGOS_IMAGEN_UNICA.md) | Cuerpo único y ruptura compartida de las 13 familias y tres bosses. PNG y nuevas entradas de bosses pendientes. |
| Fondos/entrada | [FONDOS_PREMIUM](design/FONDOS_PREMIUM.md), [TRANSICIONES_ENTRADA](design/TRANSICIONES_ENTRADA.md), [PORTALES_APARICION](design/PORTALES_APARICION.md) | Composición y transiciones de presentación. |
| Rendimiento Node | [VITE_MEMORY](performance/VITE_MEMORY.md) | Incidente histórico, hipótesis y diagnóstico reproducible; separado de memoria del navegador. |
| CI/Pages | [CI_DEPLOY](CI_DEPLOY.md) | Contrato de checks y diagnóstico; cifras de casos/duración son evidencia fechada, consultar configuración actual. |
| Procedimiento agentes | [skills canónicas](../AGENTS.md#skills-canónicas), [guía portátil](GUIA_PORTABLE_GAMEDEV_PREMIUM.md) | Enrutado neutral al modelo; usar fuentes canónicas, no adaptadores como copia de reglas. |

## Referencias de arte/FX que se conservan

Las fichas `design/*_PREMIUM.md`, `design/FRACTURE_ATTACK_FX.md`,
`design/FLOTA_FRACTURE.md` y `design/EX-07b-*.md` conservan recetas, anclas,
jerarquía visual y decisiones por enemigo/arma. No se eliminan por estar
implementadas: sirven para ampliar contenido o reproducir una regresión.
Consultar únicamente las relacionadas con la tarea.

`visual/` contiene galerías HTML/SVG y guiones de captura para comparar
presentación. No son bundles del juego ni benchmarks runtime. Los scripts de
captura pueden exigir servidor/artefacto específico; leerlos antes de ejecutarlos.

Prompts, procedencia, licencias y presupuestos viven también en los READMEs de
`src/assets/**` y manifiestos `scripts/*-image-sources.json`. Conservarlos:
eliminar un registro de generación no reduce la memoria runtime.

## Evidencia histórica útil

- `balance/`: ensayos, baseline, decisiones de vida, rewarded y evoluciones.
  Sus cantidades/porcentajes describen la revisión fechada, no siempre el valor
  actual; el contenido y contrato posterior gobiernan. No repetirlos como tareas
  pendientes sólo porque su título conserve el ID.
- [F0_SPIKES](performance/F0_SPIKES.md): elección inicial de representación y
  prueba de desbloqueo de audio. No sustituye la ruta de audio actual.
- [EX-03c stress](performance/EX-03c-stress-pending.md): el título es histórico;
  la ficha registra cierre el 10-09. PC/S25+ no certifican teléfono modesto.
- [auditoría Overdrive OD-A](design/AUDITORIA_OVERDRIVE.md),
  [OD-B](design/AUDITORIA_OVERDRIVE_EX11_6_7.md) y
  [auditoría evoluciones](design/AUDITORIA_EVOLUCIONES_2026-09-15.md): origen y
  criterios de regresión. Sus «siguiente tarea»/«pendiente push» ya no son cola
  vigente; validar un defecto actual antes de reabrirlo.

## Propuestas sin implementar

[RET-F01 — Retención, eventos y recompensas](design/RETENCION_EVENTOS_Y_RECOMPENSAS.md):
**pendiente de implementar**. Bitácora, retos semanales con colección exclusiva
y cápsula gratuita de 24 horas. Los duelos conservan ataques e invocaciones,
incluidas las réplicas de Orbital Warden; vida/ritmo se calibran sólo en el evento.
Dirección documentada, no código, precios/probabilidades fijados ni permiso de
portal. Retomar únicamente una entrega autorizada, según §22.21 del plan.

[OD-F01 — Asalto por puntos](design/OVERDRIVE_RITMO_POR_PUNTOS.md) no modifica
Overdrive Normal. La dependencia antigua de EX-02c no autoriza implementación:
el baseline está aprobado, pero siguen necesarias aprobación de cuotas/reglas
y validación del Laboratorio. Ideas VIS/DEC antiguas tampoco son autorización.

## Archivos fuera de la lectura operativa

- [Historial completo de sesiones](archive/CONTINUACION_HASTA_2026-10-02.md).
- [Fichas históricas de ejecución](archive/PLAN_EJECUCION_HASTA_2026-10-02.md).

La limpieza apartó logs acumulados e instrucciones caducas de los puntos de
entrada, conservando contratos, IDs y evidencia recuperable. No se borraron
assets, guiones, prompts ni informes necesarios para comparar resultados.
En una entrega nueva, actualizar el snapshot corto y enlazar su evidencia;
no volver a copiar todo el historial en la continuación.
