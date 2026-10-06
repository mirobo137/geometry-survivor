# RET-05 — Ruleta diaria

Implementación local: 04-10-2026. Solicitud expresa del usuario: acceso junto a
Retos y Bitácora, diez ranuras de NOVA, una skin exclusiva muy rara y un extra
diario al completar un video opcional. Actualización autorizada: ambos giros
pueden entregar la skin y aumentan su probabilidad en un punto porcentual
por giro completado, desde 1% hasta 20%. Este contrato describe el sistema
implementado; su validación local y puertas de publicación están en el
[plan único de pendientes](../../PLAN_DESARROLLO.md).

## Colección de temporadas — actualización 04-10-2026

El piloto aprobado se amplió a 15 premios de ruleta: cinco naves, cinco cañones
y cinco fondos. Cambia el cosmético visible cada semana UTC, desde 05-10-2026,
y repite cada 15 semanas. Solstice es el primero. Cada premio tiene una única
fuente; sólo el ofrecido actualmente se puede conseguir. Ganar lo conserva para
siempre. [Contrato del catálogo](CATALOGO_RECOMPENSAS.md).
Las reglas de giro, porcentajes y compensación no cambian. El video conserva
el premio ofrecido antes de iniciarlo, incluso si atraviesa un cambio semanal;
el recibo añade `rewardId` opcional, compatible con schema 13 y premios viejos.

## Reglas implementadas

| Giro / premio | Regla |
| --- | --- |
| Gratuito | Disponible al empezar; luego 24 horas reales desde el último giro gratuito guardado. No depende del tiempo conectado o la zona horaria. |
| Diez ranuras NOVA | 40, 50, 60, 75, 90, 110, 130, 160, 200 y 300; cada una tiene `(100 - p) / 10`%, donde `p` es la probabilidad actual de skin. |
| Ranura exclusiva | Cosmético actual de la temporada; primero Solstice Regent, sin ventajas de combate. Primer giro 1%, segundo 2%, hasta 20%. Ambos tipos comparten el mismo porcentaje. |
| Skin ya adquirida | La ranura dorada entrega 500 NOVA; no duplica la skin. |
| Extra por video | Después del giro gratis y antes del siguiente ciclo, una vez. Puede entregar NOVA o la skin exclusiva. |
| Progresión | Cada premio guardado aumenta un punto porcentual para el siguiente giro, con tope 20%. No reinicia al cambiar de día ni al ganar la skin. |
| Video incompleto/error | No consume el extra, no sortea ni paga. Sin inventario publicitario el botón explica que no está disponible. |
| Ausencia | No acumula giros. Un extra no utilizado vence al habilitarse el siguiente gratuito. |
| Selección | Ganar desbloquea, no equipa. Equipar requiere decisión explícita; el cosmético se refleja en batalla y, si es nave, también en Inicio. |

No hay pago de giros con NOVA/dinero, racha, compra obligatoria, garantía de
skin ni garantía oculta. El porcentaje del próximo giro se muestra y se
explica en el desplegable. Las once secciones visuales son iguales para lectura,
**no representan pesos**; esto se advierte junto a la rueda y en probabilidades.
El giro se detiene en el premio real guardado, sin diseñar un «casi ganaste».

Valores de prueba: en cualquier modalidad, media de NOVA `121.5 * (1 - p/100)`
mientras falta el cosmético; si ya está adquirida, sumar `500 * p/100`.
La probabilidad acumulada desde el inicio es
`1 - producto(1 - min(n, 20)/100)` para los giros `n = 1..N`.
Llegar al 20% no garantiza un premio ni implica reiniciar el porcentaje.
Validar rareza/economía físicamente; no añadir garantía oculta.
Cartera se satura en `MAX_NOVA`; la skin
se concede incluso con cartera llena. Los premios no se duplican con anuncios
normales de fin de partida ni cuentan como compras del Laboratorio.

## Guardado y concurrencia

Schema actual **13** (probabilidades introducidas en 12), migración de 9/10/11/12 sin borrar cuenta, retos, Bitácora, laboratorio,
NOVA, preferencias o cosméticos. Schema 11 conserva su ciclo y último premio;
al no registrar conteo histórico, inicia la nueva probabilidad en 1%.
`dailyWheel` conserva porcentaje del próximo giro, inicio de ciclo,
extra utilizado y un último recibo acotado (ID, modalidad, fecha, ranura y premio).
Normalización defensiva y límite de payload existente. Recibo, propiedad, saldo
y cooldown y porcentaje se escriben en un único payload y se confirman por lectura antes de
animar. Recargar/cerrar durante el giro no revierte ni vuelve a entregar premios.

`DailyWheelService` usa Web Locks por origen para excluir dos pestañas y un
guard local para doble clic; conserva el lock durante el video. No ofrecer
giros en navegadores sin ese mecanismo: mensaje de HTTPS/localhost y navegador
actualizado. No añadir lock casero de localStorage con carreras silenciosas.
Probado en Chromium; compatibilidad real Safari/Android sigue como QA humano.

La persistencia se comprueba antes de solicitar el video. Si falla el pago
posterior, el premio ya sorteado permanece en memoria y se puede reintentar
**en la misma pestaña** sin otro video ni otro sorteo. Si se cierra la pestaña
antes de poder guardarlo no hay recibo durable que recuperar: no prometer lo
contrario. Un recibo cuyo write funcionó pero falló su confirmación se reconoce
por ID en el reintento, sin cobrarlo dos veces. El almacenamiento local sigue
sin ser autoritativo, sincronizado entre PCs o antitrampas.

Videos cancelados, errores, cuota, doble clic o recuperaciones de reloj no
incrementan el porcentaje. Reintentar el mismo premio lo incrementa sólo una
vez al guardarse. Se normaliza como entero entre 1 y 20.

Retroceso de reloj: botón visible para restablecer horario, conserva premios,
rebase a la hora actual y espera máxima de 24h, sin conceder otro premio ni
extra inmediatamente. Adelantar fecha puede eludir la cadencia local; un reloj
confiable requiere un proveedor aprobado, fuera de esta entrega.

## Capas y coste

- Contenido puro: `DailyWheelDefinitions` (pesos, elegibilidad, premios).
- Aplicación: `DailyWheelService` (transacción/lock/RNG/reintento) y callbacks de
  Game para anuncio, audio y equipo, sólo en menú.
- DOM: `DailyWheelDialog` (UI y reveal); no decide premios, no importa Pixi.
- Plataforma: placement `daily-wheel-nova`, sólo resultado `rewarded` concede.
  Durante video se silencia/pausa el audio; se restaura respetando lifecycle.
- Una animación `transform` de 4.2s, cinco vueltas y aterrizaje exacto. Omitible;
  reduced-motion revela inmediatamente. Cancelación/close libera animación,
  intervalo de 1s y listener de storage. No hay loop nuevo, shader, partículas
  o física de rueda. No prometer coste cero ni FPS físicos no medidos.
- Marco y nave generados: PNG maestros transparentes, WebP runtime con alpha
  exacto. **60,690 bytes** de arte nuevo (43,854 + 16,836). Rueda 512² RGBA
  decodificada ~1 MiB; nave 224×256 ~224 KiB, compartida por miniatura/catálogo
  y nave equipada. Marco estático, sólo disco gira. Colores/textos legibles sin
  depender exclusivamente de imagen o color. Claves es/en y fallback inglés.
- Para cumplir el presupuesto, los PNG anteriores de naves/cañones y arsenal
  usan derivados WebP **lossless con igualdad RGBA comprobada**, sin modificar
  imagen/dimensiones/hitbox/alpha. Script `prepare-skin-lossless-webp.py`;
  ahorro directo **348,198 bytes**; maestros permanecen versionados.

## Plataforma y pruebas

Local/GitHub Pages usan el adaptador local existente: **video simulado**, indicado
en la propia ruleta. No es inventario real ni integración terminada de un SDK.
Poki/CrazyGames no simulan éxitos y no entregan el extra sin adaptador real.
Antes de publicar en portales, completar integración y revisión de esta mecánica;
estas puertas no impiden probar la entrega local autorizada por el usuario.
Referencias oficiales revisadas el 04-10-2026:
[Poki rewardedBreak](https://developers.poki.com/guide/sdk-html5),
[CrazyGames video ads](https://docs.crazygames.com/sdk/video-ads/),
[CrazyGames recompensas aleatorias](https://docs.crazygames.com/sdk/in-game-purchases/#lootbox-and-similar-mechanics).

Automatización: distribución exacta de 1000 tickets; migración; skin/duplicado;
video exitoso/cancelado/error; reloj; cuota; reintento sin otro video; doble
solicitud y lock compartido; saldo saturado. Smoke compartido PC/móvil comprueba
once ranuras, assets cargados, 320/390/844/1280px sin overflow horizontal,
44px de botones, cooldown persistente, dos pestañas reales, anuncio cancelado,
skin/equipo/Inicio/batalla y reveal omitible. Capturas en `test-results`.

Pendientes humanos: aceptación de diseño, rareza/economía, móvil físico y
compatibilidad de plataformas. No se cambia balance de combate ni la guía
pendiente de Overdrive por puntos.

Evidencia de la entrega anterior, antes de probabilidades crecientes: tipado, 724 unitarias en 131 archivos y 11 smoke enfocados
en 32.1s, todos correctos. Tres builds bajo 15 MB: Local 14,915,355 bytes (con
source maps), Poki 9,862,552 y CrazyGames 9,862,558. No es la suite browser
completa ni evidencia de rendimiento físico. Queda el warning conocido de
chunk JS >500kB. Sin commit/push/publicación automática.

Actualización de probabilidad creciente: tipado y **729 unitarias / 131 archivos**
correctos; **6 smoke de ruleta PC/móvil en 21.2s** correctos, incluida skin
ganada con video, porcentaje tras recarga y cancelaciones sin incremento.
Distribución exacta comprobada a 1/2/10/20%, tope tras más de 30 giros,
migración 11→12 conservando premios y reintento sin doble incremento.
Builds Local/Poki/CrazyGames: **14,918,422 / 9,863,397 / 9,863,403 bytes**.
No es validación de SDK publicitario real ni prueba en móvil físico.
