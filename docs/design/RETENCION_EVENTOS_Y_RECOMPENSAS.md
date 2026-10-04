# RET-F01 — Retención: Bitácora, retos semanales y cápsula diaria

**Estado: PENDIENTE DE IMPLEMENTAR. Sólo documentación.**
Fecha: 03-10-2026. Base inspeccionada: `7d9ec8f` (`10 de 10`).
Dirección de producto aceptada para elaborar este plan; no equivale a una
orden de implementar, aprobación de balance, arte terminado o permiso del portal.

## 1. Propósito y precedencia

Dar motivos distintos para volver: descubrir una build, dominar un encuentro,
completar una colección y encontrar un reto diferente. No convertir la partida
normal en una obligación diaria ni alargarla artificialmente para retener.

Este documento detalla la propuesta futura enlazada desde §22.21 de
[PLAN_DESARROLLO](../../PLAN_DESARROLLO.md). Aplicar [AGENTS](../../AGENTS.md)
y las skills gameplay, platforms, architecture y validation según la entrega.
No sustituye las puertas de publicación EX-09, las pruebas humanas aplazadas
del [Laboratorio V2](LABORATORIO_META_V2.md), los presupuestos ni el plan
independiente de [Overdrive por puntos](OVERDRIVE_RITMO_POR_PUNTOS.md).

**Corrección expresa del usuario:** no eliminar ataques para simplificar un
duelo. Orbital Warden conserva sus réplicas; enfrentarse al boss implica
enfrentarse también a sus invocaciones y ataques. Esta regla sustituye la
sugerencia conversacional anterior de quitar su patrón de réplicas.

## 2. Decisiones acordadas y valores aún abiertos

| Elemento | Dirección de diseño | Estado de ejecución |
| --- | --- | --- |
| Bitácora del piloto | Objetivos permanentes de descubrimiento, dominio y Overdrive; resumen conectado con el siguiente objetivo. | Pendiente. |
| Retos semanales | Un evento destacado, reutilizando recursos aprobados; condiciones particulares y cosméticos exclusivos. | Pendiente. |
| Duelo de boss | Sin oleadas comunes ni cartas; boss completo, incluidas sus invocaciones. | Pendiente. |
| Evasión Charger | Sin disparar; sobrevivir 60 segundos de simulación activa. | Pendiente. |
| Gachapón/cápsula diaria | Una apertura gratuita cada 24 horas; NOVA o cosmético exclusivo. | Pendiente de implementación y revisión de portal. |
| Colecciones finitas | Cosméticos adicionales al catálogo base; eventos recurrentes y NOVA después de completar la colección. | Arte, cantidad y economía por definir. |

Son propuestas para validar, no cifras aprobadas: cantidades de NOVA,
probabilidades, garantía de cosmético, número de skins, calendario/fecha de
activación, acceso inicial, loadouts, vida del boss y ajustes de ritmo.
Registrar esas decisiones antes de programarlas; no interpretar un ejemplo de
este documento como un valor definitivo.

## 3. Investigación y aplicación al proyecto

Referencias consultadas el 03-10-2026:

- [Brotato](https://store.steampowered.com/app/1942280/Brotato/) ofrece variedad
  de personajes, armas y objetos. Inspiración: experimentar con builds.
- [Halls of Torment](https://store.steampowered.com/app/2218750/Halls_of_Torment/)
  declara metaprogresión por misiones y sinergias. Inspiración: objetivos claros.
- [Adventures de Vampire Survivors](https://poncle.games/adventures-faq)
  remezcla contenido en recorridos autocontenidos sin borrar los desbloqueos
  principales. Inspiración: eventos separados con reglas authored.
- [Slay the Spire](https://store.steampowered.com/app/646570/Slay_the_Spire/)
  incluye desafíos diarios y modificadores de partidas. Inspiración: variedad
  renovable, no copiar su contenido ni asumir un leaderboard ya disponible.
- [Estudio original de motivación](https://selfdeterminationtheory.org/SDT/documents/2006_RyanRigbyPrzybylski_MandE.pdf):
  autonomía y competencia percibidas se relacionan con disfrute y preferencia
  por seguir jugando. No demuestra el efecto causal de nuestro plan en D1/D7.
- [Poki: engagement](https://developers.poki.com/guide/engagement) prioriza la
  primera sesión, objetivos claros y continuidad. El regreso no debe depender
  únicamente de completar una progresión permanente extensa.
- [Poki: monetización](https://developers.poki.com/guide/monetization) propone
  personalización y contenido temático/semanal como incentivos de participación.

Los sistemas presentes en juegos exitosos no prueban cuánto aporta cada uno
a su retención. Esta propuesta es una hipótesis de producto a validar con
jugadores, no una promesa de resultados ni de aceptación comercial.

## 4. Estado real y exclusiones

En la base inspeccionada existen tres bosses, seis familias de arma con dos
evoluciones, Overdrive, Laboratorio, NOVA y un catálogo base de diez naves,
diez cañones y diez fondos. No existe todavía este sistema de eventos,
cápsula diaria ni Bitácora persistente.

Puntos de entrada existentes, no módulos nuevos ya implementados:

- [BossDefinition](../../src/content/bosses/BossDefinition.ts) y
  [BossSystem](../../src/simulation/bosses/BossSystem.ts): patrones e invocaciones.
- [EnemyDefinitions](../../src/content/enemies/EnemyDefinitions.ts) y
  [ChargerBehavior](../../src/simulation/enemies/ChargerBehavior.ts): avisos,
  embestidas y límites authored.
- [RunSummary](../../src/app/RunSummary.ts): resultado, tiempo, bajas, XP y score;
  no contiene un historial de maestrías o descubrimientos.
- [SaveStore](../../src/platform/save/SaveStore.ts): schema 9, payload limitado
  a 20,000 bytes, cartera, propiedad y selección de cosméticos, Laboratorio y
  récords. Esa versión no añade campos de retención por este documento.

Fuera de alcance inicial: backend, servicios de hora externos, cuentas propias,
compras reales, moneda nueva, apuestas, intercambio de skins, ranking mundial,
notificaciones externas, rachas con penalización y enemigos/bosses nuevos.
No reabrir el baseline de campaña/Overdrive ni ampliar el Laboratorio para
financiar recompensas. No generar un catálogo completo de premios sin presupuesto.

## 5. Tres horizontes de juego

| Horizonte | Motivo de regreso | Recompensa / reconocimiento |
| --- | --- | --- |
| Diario | Sorpresa gratuita disponible tras 24 horas. | NOVA o un cosmético de la colección diaria. |
| Semanal | Un reto de habilidad diferente, de duración acotada. | Cosmético de la colección semanal; después NOVA. |
| Permanente | Descubrir y dominar el arsenal, progresar y superar marcas. | Bitácora, insignias/títulos propuestos y premios únicos calibrados. |

Son actividades opcionales. Jugar campaña/Overdrive no exige abrir la cápsula
ni completar un evento. La habilidad se practica jugando, no esperando al reloj.

## 6. Bitácora del piloto

Propuesta inicial: 12–18 objetivos authored, no cientos de contadores.
Agrupar descubrimiento del arsenal, dominio de combinaciones y hitos Overdrive.
Ejemplos para calibrar: descubrir ambas evoluciones de una familia en partidas
distintas; vencer un boss con una evolución concreta; completar una vuelta
Overdrive; mejorar una marca comparable.

- Mostrar un objetivo seguido en Inicio; el jugador puede cambiarlo.
- No bloquear armas, rutas ni mejoras existentes detrás de nuevos logros.
- El resumen resalta hasta tres novedades relevantes y propone el siguiente
  intento sin abrir una cadena obligatoria de modales.
- Premios únicos; insignias/títulos sin estadísticas y NOVA moderada por definir.
  No añadir daño permanente paralelo al Laboratorio.
- Objetivos se actualizan por eventos/snapshots relevantes, no buscando toda
  la colección cada frame. Progreso e historial tienen capacidad finita.
- Las «maestrías» de la Bitácora son reconocimientos persistentes, no las
  cartas postevolución ya implementadas: usar nombres/UI inequívocos.
- Los eventos de habilidad pueden tener objetivos propios, pero no cuentan
  como victorias normales, desbloqueos de campaña o récords de Overdrive.
- No reconstruir retroactivamente logros desde datos que el save no conserva.
  Importar únicamente hechos demostrables y documentar qué empieza a contar
  desde la implementación. Debug/atajos nunca generan progreso legítimo.

## 7. Reglas comunes de los retos de habilidad

Cada evento declara arena, enemigo/boss, reglas, condición de éxito, loadout,
presupuesto, recompensa y versión. El intento captura esa definición al entrar;
una actualización del calendario no cambia reglas a mitad del combate.

- Sin Laboratorio: desactivar todos sus efectos, incluida Vitalidad rewarded.
- Atributos y armamento fijos iguales para todos; ninguna mejora comprada se
  pierde ni se modifica en el save al salir.
- En duelos se conserva autoataque con un loadout authored; «sin mejoras»
  significa sin cartas/crecimiento durante el intento, no necesariamente
  proyectil de rango I incapaz de sostener el encuentro.
- Sin XP que abra cartas, elecciones, evolución, curación por level-up ni
  ofertas de reroll. Las invocaciones tampoco crean crecimiento accidental.
- Sin revive, double-nova ni ofertas rewarded dentro del flujo del reto.
- Cosméticos elegidos disponibles, siempre sin diferencias de gameplay.
- Reintentos gratuitos e ilimitados; abandonar/perder no gasta NOVA.
- No esperar 4:20: iniciar directamente el escenario, conservando la intro
  y preparación seguras del boss. No activar la cronología normal por atajos.
- Condición de victoria y derrota inequívoca; retiro no equivale a completar.
- Tiempo de supervivencia cuenta simulación activa: pausa/background/intro
  no regalan segundos. No usar el reloj de calendario para medir habilidad.
- No sumar la recompensa de bajas/tiempo/primera victoria de una run normal;
  la recompensa del evento se resuelve por su propio contrato una sola vez.
- Al salir se limpian amenazas, reservas y estado de evento; la siguiente
  partida normal restaura sus reglas. Nunca mutar definiciones globales.

Propuesta de acceso, pendiente de confirmar: explicar el formato antes del
primer intento y destacar duelos de bosses ya conocidos sin obligar a farmear
actos. No introducir por inferencia un nuevo bloqueo de progreso.

## 8. Duelo de boss: preservar la esencia

**«Sin enemigos comunes» significa sin oleadas independientes del director.
NO significa eliminar entidades, proyectiles o peligros del kit del boss.**

| Boss | Identidad y patrones que deben conservarse |
| --- | --- |
| Core Sentinel | Barrido y anillo con huecos seguros; lectura de la arena y distancia. |
| Orbital Warden | Barrido/rail rotatorio, carga, curva, réplicas destructibles y anillo con corredor móvil. Las réplicas forman parte obligatoria del duelo. |
| Fracture Engine | Batería, espinas, zigzag y minas; conservar sus amenazas asociadas, conexiones y lectura espacial. |

Suprimir las oleadas no debe desactivar incidentalmente las invocaciones,
reservas de pool o consumidores de ataques que comparten sistemas con ellas.
Usar el kit vigente al implementar, no una descripción histórica sustituida.

### Ajustes admisibles y límites

El usuario considera viable ajustar la vida o un comportamiento que vuelva
aburrido el encuentro, pero no vaciar su identidad. Guía de calibración:

1. Probar el boss completo con el loadout fijo y sin meta; observar ventanas
   de ataque, movimiento requerido y tiempo en el que sólo absorbe disparos.
2. Ajustar primero vida y potencia del loadout del evento para una duración
   razonable. Propuesta de ensayo para duelos: aproximadamente 90–180 segundos,
   no tiempo aprobado ni requisito que fuerce el resultado.
3. Si hay tiempos muertos, evaluar recuperación, frecuencia, movimiento,
   posicionamiento o secuencia de los ataques existentes. Mantener todos los
   patrones definitorios presentes; no ocultarlos con probabilidades mínimas.
4. Todo ajuste conserva telegraph/reacción/salidas seguras y necesita prueba
   humana en touch. No reducir avisos para compensar menos enemigos comunes.
5. Si se necesita un verbo ofensivo nuevo, pedir aprobación específica. «Cambiar
   comportamiento» no autoriza reemplazar silenciosamente el kit por otro boss.
6. Registrar el perfil local del evento, motivo, parámetros y versión. Campaña
   y Overdrive conservan exactamente sus definiciones aprobadas.

No hacer al boss permanentemente agresivo, inevitable o inmóvil para abaratar.
La prueba debe tener anticipación, presión y recuperación perceptibles. Ganar
depende de posición y esquiva, no del poder permanente acumulado.

### Primer consumidor

Propuesto: Core Sentinel, por ser el duelo inicial más acotado. Esta prioridad
no excluye a Warden ni Fracture: sus duelos quedan pendientes en la misma guía.
La victoria ocurre al derrotar al boss; resolver el caso simultáneo de muerte
de boss/player antes de publicar, con una regla explícita y testeada.

## 9. Evasión de Chargers — 60 segundos

El jugador no dispara y sobrevive un minuto frente a la familia Charger.
El desafío mide lectura de avisos y desplazamiento, no DPS ni selección de cartas.

- Desactivar todos los comportamientos ofensivos del loadout, no sólo ocultar
  las balas en presentación. No dejar órbitas, anillos u otro daño automático.
- Entrada gradual, número máximo fijo y embestidas escalonadas; evitar cierres
  de todas las rutas de escape y colisiones/spawns encima del jugador.
- Conservar aviso y compromiso de trayectoria: no convertir la embestida en
  persecución que gira después de anunciarla.
- Base inspeccionada: `activeCap: 5`, `chargeCap: 1`, aviso 0.72 s. Son datos
  actuales para arrancar una comparación, no garantía de dificultad semanal.
- Mayor presión puede usar una configuración local validada dentro de los
  presupuestos; no cambiar silenciosamente el comportamiento de campaña.
- Sin bajas no desaparece la presión por falta de XP; limitar población y
  reciclar/retirar mediante reglas seguras, nunca spawnear indefinidamente.
- Contador de 60 s activo, estado de victoria una sola vez y parada ordenada
  de ataques/daño al resolver. Testear muerte en el mismo tick del umbral.
- Ensayar en móvil portrait y landscape con input de un dedo, Low/High y
  movimiento reducido, conservando la información de todos los telegraphs.

## 10. Catálogo de eventos, calendario y repetición

Primer lote propuesto: duelo Core Sentinel y evasión Charger. Después duelos
completos de Warden/Fracture. Variantes futuras pueden reutilizar anillos,
barridos o minas, con combinaciones concretas y validación humana por plantilla.
No generar combinaciones arbitrarias que nunca se hayan probado.

- Una edición destacada por semana; catálogo finito que vuelve a rotar.
- Propuesta técnica pendiente de confirmar: cambio los lunes 00:00 UTC,
  ancla de lanzamiento explícita y orden de plantillas versionado. Mostrar
  cuenta atrás/localización sin depender de la zona horaria del dispositivo.
- Identificar edición por calendario + plantilla + versión; definir antes de
  programar cómo una revisión de balance afecta a récords/recompensas ya cobradas.
- La misma edición no cambia por recargar, abrir en otra pestaña o cambiar
  selección. No elegir el evento semanal al azar en cada visita.
- Una skin perdida una semana no desaparece para siempre: regresan eventos
  y oportunidades de completar la colección en rotaciones posteriores.
- Congelar recompensa y reglas al comenzar. Política exacta para un intento
  que cruza el cambio semanal pendiente: proponer terminar el intento sin cortar
  el combate y reconocer su edición original con una ventana de cierre acotada.
  Fijar esa ventana y su historial máximo antes de implementar.
- No almacenar/reanudar una run activa sólo por añadir eventos; el contrato
  normal de recarga segura sigue vigente. Conservar logros/premios ya confirmados.
- Práctica y récord personal del evento no conceden cobros adicionales. Un
  ranking global o igualdad de semillas entre dispositivos exige trabajo y
  revisión independientes; no está incluido.

## 11. Colección semanal y recompensas

Colección propia de naves, cañones y fondos, distinta del catálogo base y de
la colección diaria. Cantidad inicial, identidades y orden pendientes.
Los cosméticos mantienen todos los contratos de batalla de sus categorías.

1. Mostrar la recompensa exacta y condición del evento antes de entrar.
2. Al completar y confirmar la liquidación, desbloquear propiedad permanentemente
   y añadir el cosmético al catálogo elegible normal con origen «Reto semanal».
3. No equiparlo sin decisión del jugador; ofrecer «Equipar» o «Seguir usando».
4. Cobrar una sola vez por edición; múltiples victorias posteriores no entregan
   skins, NOVA ni bonos normales de combate adicionales.
5. Propuesta al repetir plantillas: destacar el siguiente cosmético pendiente
   según un orden estable; mostrarlo antes del intento. No entregar un duplicado
   mientras queden premios pendientes en la colección semanal.
6. Una vez completa la colección semanal, futuras ediciones entregan una
   cantidad authored de NOVA, también una sola vez por edición.
7. Las diez opciones base por categoría siguen intactas. Las skins especiales
   son extras, no reemplazos, recolores indistinguibles ni compras/anuncios
   encubiertos. Lo ya adquirido conserva propiedad, selección e ID.

No hay ventajas de estadísticas en las skins de evento. Sus cañones/balas
pueden tener identidad visual propia sin modificar colisión, daño o targeting.

## 12. Cápsula diaria / gachapón gratuito

**Pendiente de validación comercial; no asumir permiso por ser gratuito.**
La intención es una sorpresa temática espacial, no una apuesta. Cambiar el
nombre o dibujar una cápsula no cambia la clasificación de su mecánica.

- Un uso gratuito cada 24 horas reales desde la última apertura reclamada.
  No son «una vez por fecha» ni 24 horas con el juego abierto.
- Sin compras de intentos con NOVA/dinero, moneda premium, apuestas ni anuncios
  de aperturas extra en el alcance inicial. Sin premios vacíos o «casi ganaste».
- NOVA o una skin exclusiva diaria; colección separada de premios de habilidad.
- Probabilidades publicadas por premio disponible, con pesos coherentes y
  explicación de cambios por propiedad/garantía. Nunca cifras sólo cosméticas.
- Excluir cosméticos ya adquiridos mientras queden pendientes. Tras completar
  la colección diaria, convertir la tabla a NOVA; no reclamar skins inexistentes.
- Propuesta: garantía tras un número máximo de aperturas sin cosmético. Umbral
  y reglas de reinicio pendientes; contar aperturas reales, no días de conexión.
- No reiniciar garantía ni propiedad por faltar días. No introducir una racha.
- Resultado se decide y confirma una vez antes de la animación; cancelar,
  recargar, hacer doble clic o cerrar la vista no vuelve a sortear ni duplica.
- Sin acumulación ilimitada de aperturas por ausencia; propuesta inicial una
  disponible al volver. Confirmar esta política con los demás parámetros.
- Al agotarse la colección, la cápsula conserva utilidad con NOVA calibrada,
  no aumenta atributos directamente ni reabre topes del Laboratorio.

No fijar ahora porcentajes, garantía o importes. Simular previamente el tiempo
esperado de colección y los casos extremos; verificar que la tabla publicada
corresponda a la selección real, incluidas garantías y exclusión de duplicados.

## 13. Economía y límites de recompensas

Seguir NOVA como única moneda y [Laboratorio V2](LABORATORIO_META_V2.md).
Referencia documentada de una rama completa: 11,700 NOVA, sin modificar precios.
Las cifras conversacionales de ingresos por run son estimaciones del usuario,
no una nueva medición del balance actual o del futuro modo Asalto.

- Modelar ingresos diarios/semanales + partidas normales durante varias semanas.
- La cápsula debe complementar jugar, no volver más rentable entrar y salir
  que superar retos o jugar Overdrive.
- Separar premio semanal, premio Bitácora y liquidación normal: no duplicarlos
  por compartir resumen o callbacks; no aplicar double-nova a estos premios.
- Recompensas especiales no elevan el poder fuera de sus topes. La NOVA
  concedida tampoco cuenta como compras de Laboratorio para habilitar Vitalidad.
- Saturar saldos con el límite existente; deduplicar sin perder los desbloqueos
  cosméticos cuando la cartera esté al máximo.
- Definir el balance antes de elegir probabilidades llamativas o muchas skins.

## 14. Guardado, relojes y honestidad técnica

Extender el schema únicamente cuando exista la primera implementación consumidora;
no crear migración/campos por este plan. Mantener ajustes, cartera, propiedad,
Laboratorio, actos, récords y última ruta del schema actual, sin reset.

Datos futuros mínimos: versión del catálogo, progreso finito de Bitácora,
última reclamación diaria, garantía, identificadores de ediciones cobradas,
récords comparables acotados y resultado/recibo mínimo si hace falta recuperación.
La propiedad cosmética debe reutilizar las colecciones existentes, no duplicarse
en un segundo inventario contradictorio.

### Integridad de reclamaciones

- Validar condiciones y operar cartera/propiedad/recibo/cooldown/garantía juntos
  en una única transición de guardado. No grabar «cobrado» separado del premio.
- La UI/animación representa un resultado confirmado; no decide la recompensa.
- Probar doble clic, callback repetido, recarga durante reveal y fallo de storage.
- Diseñar exclusión/revalidación entre pestañas del mismo origen; localStorage
  no es una transacción multitab ni una garantía de cobro exactamente una vez.
  Probar dos reclamaciones simultáneas, no sólo debounce de un botón.
- Guardar al adquirir/completar/reclamar; nunca cada frame ni todo el historial
  por enemigo. Respetar `MAX_SAVE_BYTES` y una retención explícita de recibos.
- Fallo de persistencia: mantener el juego accesible con su fallback y advertir
  que el progreso de la sesión puede no sobrevivir a recarga. No prometer una
  recompensa durable sin escritura confirmada ni reintentos que la multipliquen.

### Tiempo y límites de seguridad

El calendario y cooldown dependen de tiempo UTC; el reto depende del reloj de
simulación. Pausa del combate no congela las 24 horas reales de la cápsula.
Validar fechas finitas, retroceso del reloj y grandes saltos sin castigar con
bloqueos de meses. Definir recuperación visible y política ante anomalías.

**localStorage, RNG con semilla, hashes y reloj del cliente no proporcionan
antitrampas fiable.** Cambiar fecha/guardado puede eludir reglas locales.
Un reloj confiable o resultados autoritativos requerirían capacidad validada
de plataforma/servidor y aprobación de red, privacidad y mantenimiento.
No añadir servicios externos, secretos en el cliente ni backend por inferencia.
Sin esas capacidades, documentar el modo local como best-effort; no mezclarlo
con una competición global validada. No garantizar sincronización entre PCs.

## 15. Responsabilidades de implementación futura

Los nombres de módulos se decidirán al inspeccionar los consumidores; no crear
managers o infraestructura vacía. El contrato mínimo separa:

| Responsabilidad | Ubicación / contrato |
| --- | --- |
| Plantillas, versiones, loadouts, premios y calendario | Contenido tipado, acotado y validado. |
| Reglas de éxito/derrota, ataques, enemigos y contador activo | Simulación pura; reutilizar BossSystem/behaviors/pools existentes. |
| Identidad de intento, entrada/salida y coordinación | Aplicación; no ampliar Game.ts con todos los sistemas. |
| Sorteo, elegibilidad, garantía y liquidación | Lógica pura testeable; adaptador de reloj/guardado en su frontera externa. |
| Persistencia y SDK | SaveStore/puertos de plataforma existentes; ningún SDK dentro de simulación. |
| Calendario visible, reveal, menú, catálogo y resumen | View models/DOM/Pixi; sin decidir recompensa o daño. |

Cada intento necesita identidad de edición, plantilla y balance, seed de prueba,
atributos/loadout, condición terminal y premio capturado. Esto es un contrato
de diseño, no un `interface` ya implementado ni permiso para una reescritura.

## 16. UI, arte y presupuestos

- Inicio conserva Jugar como acción principal; pequeño acceso a evento/cápsula
  sin tapar la nave personalizada ni abrir ofertas automáticamente.
- Mostrar reto, reglas, tiempo restante y recompensa antes de iniciar.
- Reveal corto/omitible; teclado/touch, safe areas, modal cerrable y reduced-motion.
  Textos con claves i18n y fallback inglés; no sólo iconos/color.
- Skins ganadas se inspeccionan y equipan por el flujo normal. Nave en Inicio,
  cañones/cables/balas y fondos siguen sus contratos actuales.
- Arte nuevo con identidad distinta, alpha/pivotes/perfiles/derivados y pruebas
  conforme a [Arte híbrido](ARTE_HIBRIDO.md), [Naves PNG](NAVES_PNG.md),
  [Fondos premium](FONDOS_PREMIUM.md) y [Catálogo diez](CATALOGO_DIEZ.md).
- Producir un lote piloto pequeño, no todas las skins semanales/diarias juntas.
  No precargar todo el catálogo ni añadir shaders/partículas para retención.
- Última evidencia del catálogo: local 14,964,288 bytes, margen 35,712 hasta
  el límite de 15,000,000. Es evidencia fechada, no medida de este plan.
  Medir/optimizar antes de ampliar; no elevar límite, retirar mapas o borrar
  contratos para conseguir una puerta verde.
- Pools/ataques de boss siguen limitados; reservar capacidad para réplicas y
  amenazas propias aunque no haya oleadas. Low no puede eliminar esos ataques.
- Medir carga, memoria y cleanup con entradas/reintentos/cambios de skin.
  Menos enemigos no demuestra por sí solo coste cero ni ausencia de fugas.

## 17. Publicación y revisión de plataforma

Consultado el 03-10-2026; volver a consultar antes de integrar/publicar:

- [Poki: seguridad de contenido](https://developers.poki.com/guide/content-player-safety)
  excluye temas de apuestas. No asumir que el sorteo gratuito sea automáticamente
  aceptable o prohibido: solicitar revisión de la mecánica concreta.
- [CrazyGames: loot boxes](https://docs.crazygames.com/sdk/in-game-purchases/#lootbox-and-similar-mechanics)
  incluye recompensas aleatorias gratuitas en su definición; sus preocupaciones
  principales son compras con dinero o moneda comprable y contempla otros casos
  individualmente. Revisar el caso gratuito, no aplicar reglas de venta como
  si ya tuviéramos compras o autorización comercial.

Documentar decisión de cada portal y versión exacta del feature. Si un portal
no acepta azar, una recompensa diaria determinista sería una alternativa a
aprobar explícitamente, no un cambio silencioso ni una supuesta forma de eludir
restricciones. Retos de habilidad y Bitácora no dependen del permiso de la cápsula.

Este plan no añade placements de publicidad. Mantener la política opcional
actual fuera de los retos; no abrir anuncios por entrar a eventos o menús.
GitHub Pages valida sólo el target local, no el sorteo comercial, cloud save o
integración real. EX-09 conserva sus puertas.

## 18. Entregas propuestas — todas pendientes

No ejecutar esta tabla como tarea autorizada sólo por retomar el repositorio.
Pedir la selección explícita de una entrega. El orden recomendado prioriza
pruebas de habilidad; Bitácora puede desarrollarse aparte sin depender del azar.

| ID | Entrega pendiente | Entrada / puerta |
| --- | --- | --- |
| RET-00 | Confirmar parámetros, acceso, reglas de reloj/edición, economía y consulta de portal. | Aprobación de la subtarea; no crear infraestructura de red. |
| RET-01 | Duelo piloto Core Sentinel con reglas aisladas y premio piloto. | Perfil fijo validado, kit completo, save idempotente y aceptación humana. |
| RET-02 | Evasión Charger 60 s. | Sin ofensiva residual, rutas justas, límites y prueba móvil. |
| RET-03 | Rotación semanal, colección finita y duelos Warden/Fracture. | Réplicas/ataques completos, calendario y repetición segura. |
| RET-04 | Bitácora y resumen conectado. | Objetivos útiles, datos demostrables, recompensas únicas y UI no invasiva. |
| RET-05 | Cápsula gratuita de 24 h. | Revisión por portal, probabilidades/garantía/economía aprobadas y pruebas de reloj/cobro. |
| RET-06 | Validación de participación, regreso y costes. | Jugadores reales/portales, sin promesas causales ni SDK analítico nuevo implícito. |

RET-00 no obliga a detener el duelo por una revisión comercial del azar: ese
permiso bloquea RET-05, no los eventos de habilidad. Antes de publicar deben
cumplirse EX-09 y las puertas de guardado, recursos e integridad aplicables.

## 19. Validación y Definition of Done futura

Todas las casillas siguen pendientes; no se ejecutaron pruebas de estas features.

- [ ] Reglas puras: éxito/derrota simultáneos, loadout fijo, sin meta/cartas,
  timer activo, reto sin armas, RNG/pesos/garantía y selección sin duplicados.
- [ ] Core/Warden/Fracture mantienen todos sus patrones definitorios. Réplicas
  de Warden se generan, atacan, reciben daño y limpian correctamente sin oleadas.
- [ ] Reservas/capacidades suficientes para proyectiles, réplicas y minas; no
  se salta un patrón silenciosamente por quitar al director común.
- [ ] Recompensa exactamente una vez por edición en el flujo soportado;
  doble clic, callbacks, recarga, dos pestañas, fallo de storage y cartera al tope.
- [ ] Cooldown 24 h, retrocesos/saltos de fecha, cambio semanal, versión de
  calendario y cierre de intentos; reglas iguales entre zonas horarias.
- [ ] Migración desde schema 9 y guardados anteriores, datos corruptos,
  propiedad desconocida y payload bajo el límite; ningún reset de progreso.
- [ ] Nada de XP/cartas/revive/bonos normales filtra hacia eventos. Los eventos
  no conceden desbloqueos de campaña ni récords normales por atajos.
- [ ] Salir/reiniciar/evento → campaña/Overdrive restaura todas las reglas,
  audio, input, lifecycle y recursos sin crecimiento sostenido de memoria.
- [ ] Browser PC/móvil: pantalla de reglas, recompensa, reveal y catálogo;
  pausa, resize, blur, background, reduced-motion y errores/404.
- [ ] 30/60/144 Hz conserva velocidad, contador, targeting y resultado.
- [ ] Android real: identidad del boss, esquiva posible, presión/diversión,
  duración y coste Low/High. No sustituir por emulación o una suite verde.
- [ ] Typecheck/unitarias, smoke proporcionado y builds de tres targets bajo
  presupuestos; portal real cuando corresponda. No esperar/pushear automáticamente.
- [ ] Probabilidades publicadas coinciden con el algoritmo; decisión de portal
  registrada para la cápsula. Sin acceso, esa puerta sigue pendiente.

## 20. Medir regreso sin confundirlo con sesiones largas

Comenzar con pruebas humanas cortas: comprensión del evento, intentos hasta
ganar, frustración por golpes inevitables, diversidad de objetivos y ganas de
repetir al día siguiente. Comparar versiones/condiciones y separar fallos de
carga/guardado de un problema de diseño.

Indicadores: otra partida en la misma sesión; retorno D1 y D7 por cohorte cuando
haya datos; apertura de eventos e inicio/abandono/completado; vuelta a una edición
posterior; uso real del cosmético ganado. No optimizar sólo «minutos conectados».

[CrazyGames Basic Launch](https://docs.crazygames.com/resources/basic-launch-metrics/)
documenta medición automática y métricas de participación/retorno. Sus referencias
no garantizan aprobación ni sustituyen QA. Usar datos de plataforma disponibles;
no prometer métricas o exportaciones que el portal concreto no proporciona.
Datos locales acotados sirven para diagnóstico, no una medición poblacional
fiable ni seguimiento entre dispositivos. Analítica externa requiere aprobación.

## 21. Decisiones necesarias al retomar

- [ ] Acceso a retos y momento en que se presentan sin spoilers ni grind nuevo.
- [ ] Loadout, HP, arena y perfil del primer duelo; criterio de muerte simultánea.
- [ ] Presión/capacidad/cadencia Charger y criterio terminal a los 60 s.
- [ ] Ancla semanal, orden/versionado y cierre de un intento que cruza de edición.
- [ ] Cantidad/identidad de premios diarios y semanales; primeros assets piloto.
- [ ] NOVA por sistema y economía de varias semanas; propiedad al tope de cartera.
- [ ] Pesos por premio, garantía y cooldown; aprobación específica de cada portal.
- [ ] Política de fecha anómala, sincronización/fallback y deduplicación multitab.
- [ ] Objetivos Bitácora que justifican medir progreso; no crear logros de relleno.

**Siguiente acción documental cumplida:** plan detallado y corrección de identidad
de bosses registrados. **Siguiente implementación: ninguna iniciada.** Retomar
RET-00 o la entrega elegida sólo por nueva indicación explícita del usuario.
