# Geometry Survivor — continuación operativa

Actualizado: 02-10-2026. Base inspeccionada: `d793740` (`node solucion`).
Este archivo es un snapshot, no reemplaza `PLAN_DESARROLLO.md` ni el estado Git.

## Solicitud vigente y siguiente acción

Auditar memoria Node/Vite, recursos del juego, carga tardía de imágenes/ataques
y preparación para plataformas; documentar los hallazgos y depurar documentación.
La solicitud autoriza diagnóstico y limpieza documental, no corregir producción,
instalar dependencias ni publicar automáticamente.

Entrada de esta sesión: [auditoría de recursos](docs/audits/AUDITORIA_RECURSOS_2026-10-02.md).
Antes de continuar, leer su evidencia, límites y prioridades. No declarar la
publicación lista ni avanzar a contenido nuevo mientras existan bloqueantes.
La [guía de ejecución](docs/PLAN_EJECUCION.md) contiene la cola vigente.

Auditoría entregada: typecheck, 578 unitarias y tres builds correctos; 81 casos
browser correctos con cierre de preview asistido (QA-01), no cierre automático
certificado. Los servidores propios de QA en 4173/4175/5175 quedaron cerrados.
Los hallazgos siguen abiertos: próxima implementación, si se autoriza, RES-01/02
y consolidación RES-04; después menús RES-03 y audio RES-05. No rehacer esta
auditoría breve como sustituto de la prueba larga pendiente.

Auditoría entregada: typecheck, 578 unitarias y tres builds correctos; 81 casos
browser correctos con cierre de preview asistido (QA-01), no cierre automático
certificado. Los servidores propios de QA en 4173/4175/5175 quedaron cerrados.
Los hallazgos siguen abiertos: próxima implementación, si se autoriza, RES-01/02
y consolidación RES-04; después menús RES-03 y audio RES-05. No rehacer esta
auditoría breve como sustituto de la prueba larga pendiente.

## Estado que no hay que reconstruir

- Actos I–III, seis familias de armas, evoluciones, Overdrive, NOVA y flujo
  rewarded local están implementados. La aceptación humana de actos/Overdrive
  fue registrada el 22-09 y el baseline de balance EX-02c el 28-09; son evidencia
  histórica, no una medición de memoria ni QA del checkout actual.
- Laboratorio V2: once ramas, cinco rangos, ofertas rotativas y Vitalidad
  rewarded, con guardado. El usuario aplazó las pruebas humanas visuales/táctiles
  el 29-09; siguen pendientes según [su contrato](docs/design/LABORATORIO_META_V2.md).
- Catálogo actual: ocho naves y ocho cañones PNG. Naves muestra sólo casco;
  Cañones muestra módulo/disparo/estela. Gameplay combina nave, dos módulos y
  cables. Ver [NAVES_PNG](docs/design/NAVES_PNG.md) y procedencia en sus READMEs.
- Inicio, cartas, actos, fondos y arsenal tienen arte raster además de SVG/
  Graphics. No asumir «todo es SVG» ni prometer menor memoria por ser PNG.
- Música: Howler; SFX: ZzFX, coordinados por `src/audio/AudioService.ts`.
- `src/main.ts` aún compone `LocalPlatform` en todos los targets. Tener bundles
  `local`, `poki` y `crazygames` no significa SDKs reales ni QA de portal: EX-09
  permanece pendiente.

## Node/Vite y memoria: evidencia separada

La referencia del repositorio es Node 24 LTS (`.node-version`: 24.19.0); CI usa
la rama 24. El watcher actual excluye `dist/**`, reportes y temporales.
[VITE_MEMORY](docs/performance/VITE_MEMORY.md) conserva el incidente de Node
22.14.0 y pruebas acotadas posteriores: no demuestra el disparador exacto del
episodio histórico de ~30 GB ni certifica estabilidad durante horas.

Memoria del servidor Node, heap de Chromium, caché de imágenes decodificadas y
texturas/GPU son medidas diferentes. Carga tardía no prueba por sí sola una fuga.
Usar el informe nuevo para resultados de esta auditoría, no copiar cifras de
sesiones anteriores como si acabaran de medirse. No asumir que un Vite histórico
sigue activo: comprobar procesos/puertos antes de iniciar o detener servidores.

## Puertas pendientes antes de publicación

1. Resolver los bloqueantes reproducibles del informe de recursos, en una
   entrega autorizada y con regresiones concretas.
2. Comprobar carga fría/caché, navegación repetida, reinicios y sesiones largas;
   medir memoria y descarga de forma separada del game feel.
3. Retomar la prueba humana del Laboratorio y del arte de la flota; perfil físico
   en teléfono modesto sigue sin demostrarse por un móvil potente o emulado.
4. EX-09: adaptadores reales separados, lifecycle/ads/save, presupuestos de
   descarga efectivos, texto internacionalizable y QA en Inspector/Preview.
5. Sólo entonces preparar artefactos/metadatos y una submission autorizada.

OD-F01 (`Asalto`, ritmo de Overdrive por puntos) es
[propuesta futura](docs/design/OVERDRIVE_RITMO_POR_PUNTOS.md), no modo existente.
Expedition fue eliminado; no crear guardado ni pantallas para esa propuesta antigua.

## Para retomar aquí o en otra PC

Leer `AGENTS.md` → este snapshot → [§22 del plan](PLAN_DESARROLLO.md#ejecucion-vigente)
→ [guía vigente](docs/PLAN_EJECUCION.md) → skill/contrato de la tarea elegida.
Comprobar `git status --short --branch`, `git log -5 --oneline`, `node --version`
y scripts actuales antes de trabajar. Conservar cambios ajenos.

Las pruebas actuales, warnings y límites de la sesión están en el informe de
auditoría. Los resultados antiguos están fechados en los contratos/archivos;
no prueban que la suite actual completa haya pasado. Registrar el próximo ID
exacto tras cada entrega. Commit/push/deploy requieren autorización vigente.

Índice documental: [docs/README.md](docs/README.md).
Historial íntegro recuperable: [sesiones anteriores](docs/archive/CONTINUACION_HASTA_2026-10-02.md).
No volver a pegar ese historial en el snapshot; añadir sólo el estado vigente
y enlazar evidencia de sesión cuando sea necesaria.
