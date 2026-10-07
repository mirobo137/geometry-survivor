# Geometry Survivor — pendientes vigentes

Revisión: 06-10-2026. Este es el único roadmap del proyecto. Contiene trabajo
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
3. suavizar el early de Overdrive Asalto y validar su balance, legibilidad y
   rendimiento en móvil según el contrato de balance; comparar la cuota y el
   ritmo de XP con una partida Normal;
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

**Estado:** árbol, compras, guardado y balance de prueba (10 rangos, precios
−30% y desbloqueo al abrir Acto II) implementados. La aprobación depende de
comparar juego normal y perfiles locales con/sin Laboratorio; no declarar aún
seguros los nuevos topes.

Probar en PC y teléfono físico:

- leer las ofertas, arrastrar, hacer zoom/pinch y recentrar sin bloquear otros
  controles; localizar la isla de Vitalidad;
- abrir/cerrar el modal con botón, exterior y Escape; comprobar efecto, precio,
  compra, saldo y aparición del siguiente rango;
- recargar y verificar NOVA, rangos, historial y ofertas;
- confirmar que el Laboratorio queda bloqueado antes de completar Acto I y se
  abre al desbloquear Acto II, sin requerir Overdrive;
- comparar el mismo acto y condiciones con `?debug=1&act=radial&lab-profile=none`
  y `?debug=1&act=radial&lab-profile=max` (también `angular`/`fracture`). Los
  perfiles son locales y no escriben cambios en el guardado permanente;
- comparar también Overdrive Normal y Asalto con ambos perfiles usando
  `?debug=1&mode=overdrive&od-variant=normal&lab-profile=max|none` y
  `?debug=1&mode=overdrive&od-variant=assault&lab-profile=max|none`;
- evaluar especialmente DPS máximo (`1.8×` daño × `1/0.7` cadencia), curación,
  armadura y resistencia al combinar rangos de Laboratorio con cartas;
- habilitar Vitalidad después de tres compras NOVA: sólo conceder ante rewarded
  exitoso y no conceder ante cancelación, error o falta de anuncio;
- jugar actos y Overdrive para confirmar que las mejoras aplican y que las
  cartas muestran daño total, incluidos los bonos permanentes.

No recalibrar globalmente el balance ya aprobado. Los nuevos topes y precios del
Laboratorio siguen provisionales hasta completar esa comparación humana; ajustar
un valor sólo con evidencia de juego reproducible.
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

## D. Overdrive Asalto continuo por bajas

**Estado:** ensayo de balance implementado y cubierto por pruebas; falta
calibración humana en móvil. No es un balance aprobado. Overdrive Normal y su
contrato de etapas permanecen sin cambios.

**Contrato vigente**

- La tarjeta de Overdrive ofrece dos opciones elegibles dentro de la misma
  tarjeta: Normal y Asalto. La mitad de Asalto oscurece el arte para distinguir
  su variante; la selección persiste como preferencia de menú, no como run.
- Asalto usa un director independiente y un único campo de batalla radial, sin
  contador de tramos ni transición/pausa de arena entre jefes. Las oleadas
  comunes no se detienen durante un encuentro.
- El roster determinista mezcla los doce enemigos comunes de los tres actos.
  Jefes, réplicas del Warden y entidades de diagnóstico no aportan cuota; los
  hijos destructibles del Splitter sí cuentan.
- La cuota inicial configurable es **100 bajas comunes por jefe**. El primer
  jefe aparece al alcanzar la cuota; no basta con esperar. Sólo se mantiene un
  jefe siguiente en cola mientras el actual vive. Esta cifra es un valor de
  arranque, no una medición: debe compararse con bajas, XP, nivel y tiempo al
  primer jefe de partidas Normal antes de cerrar balance/publicación.
- Los jefes rotan individualmente entre Core Sentinel, Orbital Warden y
  Fracture Engine. No se altera el modo Normal ni se usan parejas en Asalto.
- La vida de enemigos y bosses sigue esta secuencia al derrotar cada boss:
  ×0.25, ×0.5, ×1, ×2, ×3, ×4… No existe tope de diseño en ×5; cada 100 bajas
  comunes se habilita otro boss y la vida sigue escalando. Sólo queda el límite
  técnico global de seguridad numérica. Las entidades ya vivas conservan su
  vida; el nuevo multiplicador afecta apariciones posteriores.
- Hasta derrotar al primer boss, las bajas comunes entregan ×0.5 XP; los bonos
  de XP de la run siguen aplicándose encima y la XP de boss no se reduce.
  Después del primer boss, las bajas comunes vuelven a entregar XP normal.
- La cadencia común es 75% de la cadencia radial base, con piso de 0.20 s y
  capacidades/pools existentes. El HUD separa tier, bajas de cuota y estado
  del siguiente jefe de la XP y las bajas totales.
- Normal conserva sus campos de récord existentes; Asalto añade récord propio
  de tiempo, jefes y bajas. Los saves previos migran con Asalto en cero y la
  selección Normal por defecto. Las rutas de diagnóstico no liquidan récords.

**Pendiente inmediato:** probar en móvil el escalado ×0.25→×0.5→×1→×2→×3… y
la XP reducida de la apertura. El usuario reportó que la mezcla completa desde
el comienzo contiene enemigos difíciles con recompensa alta de XP y puede
provocar subidas consecutivas; la frecuencia todavía no está medida. La cuota
sigue en 100 bajas comunes por boss. El roster y cadencia se mantienen. Los
valores son un ensayo, no un balance aprobado; factores anteriores `0.35–0.40`
y el objetivo de 7–8 elecciones quedan reemplazados.

**Validación pendiente antes de cerrar:** comparar en el mismo dispositivo,
semilla cuando esté disponible, equipamiento, calidad y nivel del Laboratorio:
primera carta, XP/tiempo/bajas al boss, separación entre mejoras, enemigos
acumulados, bajas por familia y supervivencia frente a Normal. Verificar
continuidad, la secuencia de vida indicada para bosses y spawns nuevos, la XP
normal después del primer boss, vida estable de enemigos existentes, cola única,
Splitter, resize, legibilidad del HUD, pools y sesiones largas. Las pruebas
detalladas y cifras provisionales están en
[balance de Overdrive Asalto](docs/design/OVERDRIVE_ASALTO_BALANCE.md). No
declarar balanceada la cuota ni aceptar móvil hasta tener resultados humanos.

Las reglas de Normal permanecen en
[contrato de Overdrive Normal](docs/design/OVERDRIVE_NORMAL.md).

## E. Plataformas y publicación comercial

**Estado:** EX-09 en curso. Poki y CrazyGames tienen adaptadores reales
aislados. `local` conserva su simulador; Pages no prueba SDKs reales.

### CrazyGames Data Module — integración inicial (validación de portal pendiente)

Implementado en el adaptador exclusivo del build `crazygames`: `SDK.init()` y
`SDK.data` quedan listos antes de la primera lectura de progreso. `SDK.data` es
la autoridad para invitados y usuarios conectados; `local`/Pages y Poki siguen
usando su `LocalSaveStore` y no reciben dependencias ni estado de CrazyGames.

- Un save existente de CrazyGames prevalece sobre cualquier `localStorage`
  antiguo. Solo si `SDK.data` no contiene save y no hay marcador de migración,
  importa una vez el save local actual y verifica la escritura antes de usarlo.
- Una carga fallida, el módulo deshabilitado, datos corruptos o un schema más
  nuevo no escriben defaults encima del portal: conserva el almacenamiento
  antiguo y permite jugar con progreso solo en memoria. Si las lecturas fallan
  después de preparar la sesión, mantiene el último valor leído y bloquea
  escrituras al portal durante esa sesión. Si falla una escritura, conserva en
  memoria el cambio de esa sesión y no vuelve a insistir con escrituras dudosas.
- La migración no borra la clave local: CrazyGames puede implementar el Data
  Module de invitados sobre almacenamiento local del navegador. Un marcador en
  `SDK.data` evita volver a importar un save obsoleto después de borrar progreso.
- La comprobación inmediata de `getItem` confirma la capa local del SDK, no un
  respaldo remoto ya sincronizado; la sincronización de cuenta/dispositivo aún
  requiere validación en Preview.
- No cambiar todavía el formulario del portal: mantener **Using LocalStorage**
  hasta validar el artefacto exacto y los flujos de invitado/cuenta en Preview.

**Poki:** validar Cloud gamesaves con acceso real y cuenta. La documentación
actual indica sincronización automática de `localStorage`/IndexedDB; aquí no
corresponde inventar un Data Module ni reemplazar esas APIs. Adaptar el
arranque/guardado solo si las pruebas o requisitos vigentes lo exigen, y
comprobar restauración antes del primer acceso al progreso.

**Otros portales futuros:** investigar soporte, disponibilidad y requisitos
oficiales al integrarlos; adoptar su guardado gestionado cuando exista. Si no
lo ofrecen, conservar guardado local, sin prometer sincronización.

**Aceptación:** preservar schema/migraciones, NOVA, cosméticos, Laboratorio y
recibos idempotentes de recompensas; probar invitado, cuenta, login/logout,
recarga y cambio de dispositivo, fallos de SDK y conflictos local/remoto.
Definir qué ajustes son del dispositivo y cuáles se sincronizan. No confundir
un write/read-back local del SDK con confirmación de respaldo remoto ni generar
un save vacío sobre uno existente cuando la carga falle. Cubrir límites de
tamaño, aislamiento de builds y validar en el portal, no solo localhost.

La migración, prioridad remoto/local, fallos de lectura y aislamiento tienen
pruebas unitarias locales. Pendiente en CrazyGames Preview: invitado, cuenta,
login/logout, recarga, cambio de dispositivo, persistencia remota real y
confirmar límites/comportamiento del formulario. No afirmar sync de nube a
partir de builds locales.

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
y timeout no otorgan premios; en ese corte el guardado seguía en `localStorage`.
Como el SDK no expone la fase Basic/Full antes de solicitar el anuncio, las
ofertas reales del portal permanecen desactivadas por defecto en
`src/platform/crazygames/CrazyGamesPlatform.ts`; localhost conserva el modo demo.
Activarlas requiere confirmación de elegibilidad Full Launch. No se añadió
midgame automático ni dependencia npm. Restan validar el artefacto en Preview
y completar metadata/requisitos/derechos en el portal.

Actualización de persistencia: `CrazyGamesSaveStore` usa `SDK.data` tras la
inicialización, importa el save local una vez solo si no hay save/marker del
portal y evita sobrescribir datos no legibles. El arranque espera a la conexión
por un máximo acotado; si el SDK no queda disponible, el juego abre con memoria
de sesión, sin recurrir al `localStorage` genérico. El formulario de CrazyGames
permanece en **Using LocalStorage** hasta completar la validación Preview.

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
