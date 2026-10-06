# Geometry Survivor — pendientes vigentes

Revisión: 05-10-2026. Este es el único roadmap del proyecto. Contiene trabajo
que todavía falta construir, validar o cerrar para publicación; no es un diario
de sesiones ni un archivo de decisiones ya reemplazadas.

La implementación se comprueba en el código, los tests y el estado Git actual.
Las especificaciones enlazadas abajo conservan contratos detallados; sus
checklists de aceptación se resumen aquí para que exista una sola cola de
trabajo.

## Estado resumido

La campaña de tres actos, Overdrive Normal, las seis armas y sus evoluciones,
el baseline general de balance, el Laboratorio V2, Retos/Bitácora/ruleta local
y los catálogos base y de recompensas ya tienen implementación. No se rehacen
ni se reabren decisiones aprobadas sin un defecto reproducible o una nueva
solicitud.

Pendientes reales:

1. completar pruebas humanas de Laboratorio, retención y arte en dispositivo;
2. cerrar la prueba prolongada de recursos y dispositivos modestos;
3. implementar opcionalmente Overdrive Asalto por puntos, tras validar el
   Laboratorio y tomar datos de Normal;
4. integrar Poki y CrazyGames para publicación comercial;
5. validar las nuevas entradas visuales de bosses como mejora no bloqueante.

El último estado de Git/Actions se consulta al empezar una entrega. Un commit
presente en origin o un build local correcto no demuestra por sí solo que el
workflow actual de Pages haya terminado y desplegado.

## A. Estabilidad, carga y aceptación móvil

**Estado:** correcciones de los hallazgos de recursos implementadas; prueba
prolongada y aceptación en teléfono modesto pendientes.

**Siguiente trabajo**

- Repetir carga fría y caliente, navegación entre Inicio, Actos, Skins,
  Laboratorio, Retención y regreso al gameplay; incluir equipamiento, reinicio
  y primer uso de armas/evoluciones.
- Probar sesiones largas de Overdrive y ciclos repetidos de abrir/cerrar
  pantallas. Registrar puntos comparables y separar memoria del proceso Node,
  heap de Chromium, imágenes decodificadas y recursos/texturas del renderer.
- Probar en Android físico modesto, Low y High: rotación, background/foreground,
  audio, carga, legibilidad y estabilidad jugable.
- Revisar el arte y las estelas nuevas en una run real; no declarar FPS/GPU
  físicos a partir de Playwright o de un teléfono potente.
- Confirmar que Pages, Poki y CrazyGames siguen dentro del límite publicado de
  15 MB y que los mapas de diagnóstico no se publican. No subir el límite para
  hacer pasar una entrega.
- Para cualquier publicación, revisar Actions en el commit exacto de main y
  confirmar el deploy; no reutilizar estados de workflows antiguos.

**Criterio de cierre:** reproducir el escenario con dispositivo, navegador,
calidad, commit y datos antes/después; sin crecimiento sostenido inexplicado,
regresión funcional ni presupuesto excedido. Las mediciones y causas de cada
hallazgo permanecen en [auditoría de recursos](docs/audits/AUDITORIA_RECURSOS_2026-10-02.md)
y [seguimiento de correcciones](docs/audits/CORRECCIONES_RECURSOS_2026-10-02.md).

## B. Laboratorio V2 — aceptación humana

**Estado:** árbol, compras y guardado implementados; el usuario aplazó la
validación visual y táctil.

Probar en PC y teléfono físico:

- leer las ofertas, arrastrar, hacer zoom/pinch y recentrar sin bloquear otros
  controles; localizar la isla de Vitalidad;
- abrir/cerrar el modal con botón, exterior y Escape; comprobar efecto, precio,
  compra, saldo y aparición del siguiente rango;
- recargar y verificar NOVA, rangos, historial y ofertas;
- habilitar Vitalidad después de tres compras NOVA: sólo conceder ante rewarded
  exitoso y no conceder ante cancelación, error o falta de anuncio;
- jugar actos y Overdrive para confirmar que las mejoras aplican y que las
  cartas muestran daño total, incluidos los bonos permanentes.

No recalibrar globalmente el balance ya aprobado. Ajustar un tope o precio sólo
si una prueba concreta demuestra un problema.
Contrato: [Laboratorio V2](docs/design/LABORATORIO_META_V2.md).

## C. Retención local — validación y decisiones de producto

**Estado:** Retos, Bitácora, recompensas y ruleta están implementados localmente.
Sus cantidades y dificultad siguen siendo valores de prueba; anuncios reales,
backend y analítica externa no están implementados ni autorizados por este plan.

Validar los flujos completos en PC y móvil:

- reclamar manualmente objetivos de Bitácora y comprobar rangos posteriores,
  objetivos únicos de campaña y que el resumen de partida no pague por sí solo;
- jugar los duelos semanales sin recibir impactos y la evasión de Chargers;
  confirmar kit completo de cada boss, reintentos limpios y ausencia de ventajas
  del Laboratorio/cartas;
- comprobar edición semanal, recompensa única, compensación de duplicado,
  cambio de edición y persistencia;
- comprobar giro gratis cada 24 h, giro extra sólo tras rewarded, skin posible
  en ambos, probabilidad compartida de 1% a 20%, cambio de temporada y guardado;
- revisar en el catálogo que cada premio activo redirija a su fuente y los
  premios fuera de temporada no parezcan comprables;
- probar errores de almacenamiento, callbacks repetidos, dos pestañas, cartera
  al tope, cancelación de anuncio y salida/reinicio del evento.

Después de esas pruebas, decidir si se aprueban economía, compensaciones y
dificultad provisionales. No añadir analítica externa, sincronización en nube,
anti-trampas de servidor ni anuncios reales sin autorización y revisión de
privacidad/plataforma.

Contratos: [Bitácora](docs/design/BITACORA_OBJETIVOS.md),
[ruleta](docs/design/RULETA_DIARIA.md),
[catálogo de recompensas](docs/design/CATALOGO_RECOMPENSAS.md) y
[reglas del piloto de retención](docs/design/RETENCION_EVENTOS_Y_RECOMPENSAS.md).

## D. Overdrive Asalto por puntos — propuesta futura

**Estado:** no implementado. Overdrive Normal conserva el disparador por tiempo
y no debe cambiar por esta propuesta.

**Puertas previas:** aceptar manualmente el Laboratorio; luego instrumentar
partidas Normal comparables y medir bajas normales, XP, nivel y tiempo al boss
por tramo. No inventar cuotas a partir de partidas antiguas o de estadísticas
de otros actos.

**Contrato de Asalto**

- Ritmo opcional elegido al entrar a Overdrive: Normal o Asalto. No crear un
  cuarto ActId ni alterar campaña o Normal.
- En Asalto, las bajas de enemigos normales determinan cuándo queda listo el
  boss; esperar sin derrotar enemigos no lo invoca. Réplicas, bosses y entidades
  de debug no suman puntos. Los hijos destructibles del Splitter sí cuentan.
- Fijar por tramo una cuota derivada de la mediana de bajas de Normal; verificar
  también el promedio y la XP. El tiempo sobrevivido y el nivel del Laboratorio
  no alteran esa cuota.
- Acelerar la cadencia de oleadas con el punto inicial max(0.20 s, intervalo
  normal × 0.75), sin acumular ráfagas ni ampliar pools/capacidades. Conservar
  las familias y el orden de cambios de arena.
- Separar el disparador del boss del reloj de tramo. Mantener en tiempo real
  hazards, telegraphs, ataques y recuperaciones; antes de la intro terminar
  cambios de arena ya anunciados y llegar a una zona segura.
- Mantener puntuación, XP, fórmula de NOVA y liquidación actuales; separar
  récords Normal/Asalto y migrar el récord existente a Normal.
- Mostrar puntos/cuota sin confundirlos con XP o bajas totales. Las rutas debug
  no escriben récords, NOVA ni desbloqueos.

**Aceptación:** en tramos comparables, mediana y promedio de bajas y la mediana
de XP quedan dentro de ±10% de Normal; nivel con diferencia máxima de uno.
Con Laboratorio avanzado, objetivo de reducir aproximadamente 20–30% la mediana
de tiempo al boss en los tres primeros tramos. Validar semillas reproducibles,
hijos Splitter, cruces de hitos, transiciones, parejas de bosses, pools, frames,
memoria y evasión en móvil físico. Si se adelanta al boss suprimiendo enemigos,
XP, familias o avisos, la propuesta falla.

La especificación anterior se compactó aquí para mantener un único backlog;
las reglas actuales del modo implementado permanecen en
[contrato de Overdrive Normal](docs/design/OVERDRIVE_NORMAL.md).

## E. Plataformas y publicación comercial

**Estado:** EX-09 en curso. Poki y CrazyGames tienen adaptadores reales
aislados. `local` conserva su simulador; Pages no prueba SDKs reales.

### Pendiente — guardado gestionado por plataforma

Solicitud aprobada para trabajo futuro; no implementada. Sustituir el guardado
local directo por la solución oficial donde la plataforma lo requiera/ofrezca,
sin mezclar dependencias, cuentas ni partidas entre portales. Pages/local
conservan `LocalSaveStore`.

- **CrazyGames:** integrar `SDK.data` como autoridad del guardado para invitados
  y usuarios conectados. Esperar la inicialización y carga del SDK antes de
  leer/escribir progreso. Migrar una sola vez el save local existente cuando no
  exista save de plataforma; nunca sobrescribir una partida remota con defaults
  o con datos locales antiguos. Cambiar el formulario a Data Module únicamente
  cuando la integración esté implementada y validada. Hasta entonces usar
  **Using LocalStorage**.
- **Poki:** validar Cloud gamesaves con acceso real y cuenta. La documentación
  actual indica sincronización automática de `localStorage`/IndexedDB; aquí
  no corresponde inventar un Data Module ni reemplazar esas APIs. Adaptar el
  arranque/guardado solo si las pruebas o requisitos vigentes lo exigen, y
  comprobar restauración antes del primer acceso al progreso.
- **Otros portales futuros:** investigar soporte, disponibilidad y requisitos
  oficiales al integrarlos; adoptar su guardado gestionado cuando exista.
  Si no lo ofrecen, conservar guardado local, sin prometer sincronización.

**Aceptación:** preservar schema/migraciones, NOVA, cosméticos, Laboratorio y
recibos idempotentes de recompensas; probar invitado, cuenta, login/logout,
recarga y cambio de dispositivo, fallos de SDK y conflictos local/remoto.
Definir qué ajustes son del dispositivo y cuáles se sincronizan. No confundir
un write/read-back local del SDK con confirmación de respaldo remoto ni generar
un save vacío sobre uno existente cuando la carga falle. Cubrir límites de
tamaño, aislamiento de builds y validar en el portal, no solo localhost.

Fuentes oficiales consultadas el 05-10-2026:
[CrazyGames Data](https://docs.crazygames.com/sdk/data/) y
[Poki Cloud gamesaves](https://developers.poki.com/guide/accounts#cloud-gamesaves).

Implementar un portal por entrega, primero Poki y después CrazyGames:

- consultar documentación oficial vigente durante cada integración;
- aislar SDK por build; cubrir init/fallo, lifecycle, pausa/reanudación, audio,
  almacenamiento, anuncios rewarded, adblock, timeout, no-fill y callbacks
  duplicados/tardíos;
- no mostrar oferta de video donde no haya soporte; no conceder sin resultado
  rewarded y no iniciar anuncios automáticamente;
- revisar inglés/i18n, requisitos de edad, metadatos, portada, tamaño, derechos
  de música/assets y fallback sin SDK;
- validar el artefacto exacto en Poki Inspector y CrazyGames Preview. Pages y
  pruebas locales no sustituyen estas puertas.

Primer corte Poki (05-10-2026): el build `poki` carga el SDK oficial solo en su
adaptador, reporta `gameLoadingFinished` y transiciones idempotentes de
`gameplayStart/Stop`, y conecta los botones recompensados existentes. Un fallo
de carga/init, no-fill o timeout falla de forma segura; el juego no espera a la
red para arrancar y nunca otorga el premio si Poki no confirma el video. El
guardado sigue en `localStorage`; no se mezcló con guardado de cuenta/plataforma.
No se solicita `commercialBreak` automático: queda fuera hasta decidir sus
pausas naturales y probarlas en Inspector. Restan QA con artefacto real,
políticas/metadata/derechos.

Segundo corte CrazyGames (05-10-2026): el build `crazygames` carga el HTML5 SDK
v3 solo desde su adaptador, inicializa sin bloquear el arranque, informa
`loadingStart/Stop` y transiciones idempotentes `gameplayStart/Stop`, aplica el
ajuste de silencio del portal y conecta rewarded al contrato de anuncios
existente. El audio se silencia solo desde `adStarted`; el premio depende
exclusivamente de `adFinished`. No-fill, adblock, Basic Launch, cooldown, error
y timeout no otorgan premios; el guardado sigue en `localStorage`. Como el SDK
no expone la fase Basic/Full antes de solicitar el anuncio, las ofertas reales
del portal permanecen desactivadas por defecto en
`src/platform/crazygames/CrazyGamesPlatform.ts`; localhost conserva el modo demo.
Activarlas requiere confirmación de elegibilidad Full Launch. No se añadió
midgame automático, Data API ni dependencia npm. Restan validar el artefacto en
Preview y completar metadata/requisitos/derechos en el portal.

Corrección de QA del 05-10-2026: el SDK v3 oficial devuelve `uninitialized`
antes de `init()`. El adaptador ahora espera la inicialización antes de filtrar
el entorno; antes descartaba el SDK sin enviar eventos. Regresión cubierta con
ese estado real. Typecheck y 789 unitarias pasaron; build CrazyGames regenerado
(11.532.601 bytes). Smoke con SDK oficial 3.8.0 en localhost confirmó init,
loadingStart/Stop y gameplayStart; pendiente volver a subir y comprobar el
detector del Preview real. Rewarded del portal sigue sujeto a elegibilidad.

Control actualizado por solicitud posterior: joystick predeterminado en todas
las plataformas, sin depender de detección coarse ni tamaño de pantalla.
Schema 14 restablece únicamente el control de perfiles anteriores; conserva
progreso, NOVA, cosméticos y otros ajustes. Las elecciones realizadas con el
nuevo schema (incluido seguir dedo) se conservan. Teclado de PC sin cambios.
Migración y persistencia cubiertas por unitarias; QA del portal pendiente.

Contrato de build/CI: [CI y GitHub Pages](docs/CI_DEPLOY.md). La revisión de
requisitos de SDK debe hacerse con fuentes oficiales vigentes; las fechas de
investigación antiguas no certifican políticas actuales.

## F. Arte opcional — entradas de bosses y escenas de resultado

Implementada el 05-10-2026 la segunda propuesta de entradas con casco completo:
anticipación, emergencia con rebote amortiguado y onda expansiva. Core emerge
desde apertura dorada, Orbital girando desde una apertura azul inclinada y
Fracture desde una brecha vertical. Sustituye los ecos de naves de la primera
propuesta, no aceptada por el usuario. Sin armado de piezas SVG ni nuevos
assets; añade dos Graphics estáticos por slot de portal, animados por
transforms/alpha. No cambia la simulación.

Typecheck, suite unitaria completa (758 tests / 134 archivos), build development
y smoke Chromium del Core Sentinel pasaron el 05-10-2026. Pendiente para Luna:
revisión visual en Low/High, movimiento reducido, reintento, muerte, carga
raster tardía, bosses simultáneos y móvil físico. Validar coste en móvil antes
de dar aceptación final.

También implementada la [escena de derrota](docs/design/ESCENA_DERROTA.md):
cierre a pantalla completa durante la animación existente del jugador, tanto
en partidas normales como al fallar retos semanales (incluido un impacto con
vida restante). Typecheck, 758 unitarias y build pasaron; pendiente de smoke
del flujo de juego completo hasta resumen/revive, revisión móvil y aceptación
visual. La capa DOM se comprobó en Chromium portrait y desktop.

Implementada también la [escena de victoria](docs/design/ESCENA_VICTORIA.md)
para completar actos y vencer retos de Bitácora: apertura dorada/cian y mensaje
ES/EN durante los tres segundos existentes antes del resumen. No modifica
premios ni tiempos de partida. Comprobados typecheck, suite, build local y
encuadre/cierre de la capa en Chromium desktop, portrait y landscape móvil.
Pendiente aceptación visual en partida y móvil físico/portal.

## Reglas de esta cola

- Esta es la única lista de trabajo futuro. Una especificación de dominio puede
  contener comportamiento y criterios técnicos, pero no crear otra cola.
- «Implementado» no significa aceptado por el usuario, validado en teléfono o
  publicado en un portal.
- No reactivar ideas marcadas como reemplazadas, propuestas sin aprobación o
  fases ya cerradas. El código y los tests describen el estado implementado.
- Para cerrar una tarea, registrar aquí su estado vigente y retirar el punto
  cerrado de la cola; no crear snapshots de sesión duplicados.
- Cambios de código se validan según riesgo con pruebas focalizadas, typecheck,
  suite, builds y browser smoke. Las puertas humanas/portal se declaran por
  separado; una suite verde no demuestra diversión ni rendimiento físico.
