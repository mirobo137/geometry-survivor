# RET-F01 — Retención: Bitácora, retos semanales y cápsula diaria

**Estado: PROTOTIPO LOCAL IMPLEMENTADO; validación humana y puertas de publicación pendientes.**
Plan inicial: 03-10-2026. Implementación local: 04-10-2026. Base: `d042357`.
La implementación recibida por el jugador sigue siendo una prueba: sus cifras,
cadencia y perfiles de combate no son balance aprobado ni permiso para publicar.
La ruleta diaria y el extra opcional de NOVA están implementados para prueba
local por solicitud posterior del usuario. Revisión comercial e integración
real de anuncios en portales siguen siendo puertas de publicación.

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
| Bitácora del piloto | 13 objetivos persistentes y resumen conectado al resultado normal. | Prototipo local implementado; economía y objetivos por validar. |
| Retos semanales | Rotación UTC versionada, repetible y separada de las runs normales. | Prototipo local implementado; primera recompensa: Asterion Courier. |
| Duelo de boss sin impactos | Sin oleadas comunes ni cartas elegibles; un impacto conectado termina el intento, aunque lo absorba el escudo. | Implementado para Core Sentinel, Orbital Warden y Fracture Engine; QA humano pendiente. |
| Evasión Charger | Sin fuego/daño automático; sobrevivir 60 segundos activos, máximo cinco Chargers. | Prototipo local implementado; justicia y dificultad móvil pendientes. |
| Ruleta diaria | Gratis cada 24 h; diez ranuras NOVA y Solstice Regent (1% inicial, +1 punto por giro hasta 20%). Extra con video también puede entregar skin. | Implementación local; [contrato y pruebas](RULETA_DIARIA.md); QA humano/publicación pendientes. |
| Colecciones finitas | Diez naves, diez cañones y diez fondos exclusivos de retos/ruleta, Asterion y Solstice incluidos. | Catálogo completo funcional; [arte, temporadas, guardado y presupuesto](CATALOGO_RECOMPENSAS.md). QA humana móvil/publicación pendientes. |

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
tres duelos semanales repetidos cada tres semanas, una Bitácora y ruleta diaria.
El catálogo cosmético de lanzamiento tiene diez naves, diez cañones y diez fondos.
La colección exclusiva acordada añade Asterion y Solstice al conteo de diez
naves, más diez cañones y diez fondos; el catálogo está completado con balas y
estelas originales. Contrato: [CATALOGO_RECOMPENSAS](CATALOGO_RECOMPENSAS.md). La ruleta añade un extra opcional por video simulado
localmente; ver [contrato vigente](RULETA_DIARIA.md).

### Puerta de presupuesto para cosméticos exclusivos

**Puerta superada en la colección aprobada del 04-10-2026:** 58 derivados
nuevos, 1,463,696 B; los tres payloads públicos siguen bajo 15 MB. Ver
[contrato vigente](CATALOGO_RECOMPENSAS.md) y medidas finales en CONTINUACION.
La estimación y el bloqueo siguientes documentan el baseline anterior, no un
pendiente de implementación de este catálogo.

El artefacto local medido el 04-10-2026 ocupa 14,939,834 de 15,000,000 bytes;
quedan 60,166 bytes. Esa build incluía aproximadamente 5 MB de mapas de
diagnóstico y no representa el payload público separado. Por decisión del
04-10-2026, CI conserva los `.map` junto con los bundles JS/CSS como artefacto
temporal; Pages recibe una copia sin mapas y el límite de 15 MB se aplica al
payload publicado. A partir de los derivados existentes
(naves WebP de 42–75 KB, cañones de 8–22 KB y fondos con placa más preview de
80–139 KB), el lote de 8 naves, 10 cañones y 10 fondos se estima en alrededor
de 1.2–2.2 MB, antes de cualquier capa adicional de movimiento.

Se midió sin aplicar una recompresión Q64 de los fondos actuales: recuperaría
187,136 bytes, con PSNR de 37.56–45.49 dB frente a los derivados actuales.
Eso aún quedaría muy por debajo del espacio necesario y no se considera una
autorización para degradar arte aprobado. Por tanto, conservar el límite de
15 MB y la calidad actual son puertas obligatorias: no generar/importar el lote
completo hasta medir el payload público con los assets finales. No subir el
límite ni borrar los mapas; se conservan fuera del deploy como diagnóstico. La
limpieza de SVG sin consumidor de producción ordena el repositorio, pero no se
cuenta como ahorro de descarga. La ruta local de vista previa con propiedad
sintética se incorpora junto con el catálogo, y nunca debe persistir
desbloqueos de prueba en el guardado real.

Puntos de entrada existentes, no módulos nuevos ya implementados:

- [BossDefinition](../../src/content/bosses/BossDefinition.ts) y
  [BossSystem](../../src/simulation/bosses/BossSystem.ts): patrones e invocaciones.
- [EnemyDefinitions](../../src/content/enemies/EnemyDefinitions.ts) y
  [ChargerBehavior](../../src/simulation/enemies/ChargerBehavior.ts): avisos,
  embestidas y límites authored.
- [RunSummary](../../src/app/RunSummary.ts): resultado, tiempo, bajas, XP y score;
  no contiene un historial de maestrías o descubrimientos.
- [SaveStore](../../src/platform/save/SaveStore.ts): schema 13, payload limitado
  a 20,000 bytes, cartera, propiedad, Laboratorio, récords y progreso acotado
  de retención. Schema 9 migra conservando sus datos previos y comienza la
  Bitácora vacía; no se limpia el perfil.

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
- Actualización autorizada: los objetivos generales reciclan rangos con metas
  y NOVA crecientes. Actos I–III y sus bosses de campaña son únicos. El final
  sólo registra objetivos; NOVA se cobra manualmente aquí y entonces se activa
  el siguiente rango desde cero. [Contrato de Bitácora](BITACORA_OBJETIVOS.md).
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
- Primera regla específica implementada para probar dificultad: los tres
  duelos acortan las fases activas al 70% y recuperación al 33%, sin reducir
  telegraphs. El ciclo de patrones resulta al menos 1.45× más rápido; sólo se
  aplica al director del reto, no a campaña ni Overdrive. Aún requiere prueba
  humana antes de aceptarse como balance.

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
El casco del boss causa daño por contacto en cualquier fase y modo, no sólo
cuando una geometría de ataque conecta. El detector barre el desplazamiento
del boss para evitar atravesar al jugador entre ticks y aplica un cooldown de
0.45 s mientras hay solapamiento; la práctica sin impactos falla también por
este contacto.
Sólo el duelo Core Sentinel añade una barrera física alrededor del núcleo
(radio 112; el centro del jugador queda a ≥129 unidades). No daña al tocarla:
impide entrar y elimina el estacionamiento en el centro. La arena presenta el
anillo segmentado; campaña, Warden, Fracture y Charger no reciben esta regla.

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
   humana en touch. El primer perfil de prueba sube la cadencia acortando el
   tramo activo y la recuperación; no reduce avisos. No añadir oleadas comunes
   para compensar menos enemigos.
5. Si se necesita un verbo ofensivo nuevo, pedir aprobación específica. «Cambiar
   comportamiento» no autoriza reemplazar silenciosamente el kit por otro boss.
6. Registrar el perfil local del evento, motivo, parámetros y versión. Campaña
   y Overdrive conservan exactamente sus definiciones aprobadas.

No hacer al boss permanentemente agresivo, inevitable o inmóvil para abaratar.
La prueba debe tener anticipación, presión y recuperación perceptibles. Ganar
depende de posición y esquiva, no del poder permanente acumulado.

### Primer consumidor

Los primeros tres eventos de la rotación son Core Sentinel, Orbital Warden y
Fracture Engine; los tres exigen derrotar al boss sin recibir un impacto. El
primer impacto registrado —incluido uno absorbido por escudo— termina el intento;
un evento ignorado por invulnerabilidad no cuenta como impacto. Si impacto y
victoria se registran en el mismo tick, prevalece el fallo del reto.

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

Rotación aprobada e implementada, en este orden: Core Sentinel sin impactos,
Orbital Warden sin impactos y Fracture Engine sin impactos. Luego vuelve a
empezar con Core Sentinel. Charger se conserva como práctica local, no como
evento semanal. Sólo aparece una edición por semana;
los tres duelos están disponibles como prácticas locales de QA descritas abajo.
Variantes futuras pueden reutilizar ataques existentes con combinaciones
concretas y validación humana por plantilla. No generar combinaciones arbitrarias.

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
- Las repeticiones gratuitas no vuelven a pagar una edición ya cobrada. La primera
  victoria elegible de cada edición puede entregar su recompensa; si Asterion ya
  pertenece al jugador, entrega 250 NOVA en lugar de un duplicado, una sola vez
  por edición. Si la cartera no puede aceptar el pago, no se registra el recibo.
- Prácticas locales de QA no conceden premios, NOVA ni escrituras al guardado. Un
  ranking global o igualdad de semillas entre dispositivos exige trabajo y
  revisión independientes; no está incluido.

### Rutas locales de práctica para QA

En el target local, con `debug=1`, se puede abrir directamente cada duelo sin
esperar la semana correspondiente. Estas rutas inician una práctica gratuita,
sin premio, NOVA, récord normal ni cambios al guardado:

- `/?debug=1&retention-challenge=core-duel&quality=high`
- `/?debug=1&retention-challenge=warden-duel&quality=high`
- `/?debug=1&retention-challenge=fracture-duel&quality=high`

El parámetro se ignora en builds Poki/CrazyGames y Pages; no es un acceso de
producción. El puerto/host debe ser el que esté usando el servidor local.

## 11. Colección semanal y recompensas

La colección exclusiva 10/10/10 está implementada y aprobada para integrarse:
[contrato completo](CATALOGO_RECOMPENSAS.md). Cada catálogo normal tiene veinte
entradas (diez base + diez premios). Todos conservan sus contratos de batalla.

1. Cada fuente recorre 15 cosméticos en semanas UTC; el reto de boss mantiene
   su rotación independiente de tres semanas. El calendario de premios empieza
   el 05-10-2026 y se repite cada 15 semanas. Se muestra el premio exacto.
2. La victoria elegible desbloquea la recompensa de esa edición en su familia,
   con guardado durable y sin autoequipar. Si ya se posee, entrega 250 NOVA.
3. Sólo una entrega por edición; repetir/practicar no repaga. Los premios
   adquiridos permanecen disponibles aunque termine la temporada.
4. La rotación es fija, no salta los cosméticos poseídos: todos los jugadores
   ven el mismo premio semanal. La política propuesta anteriormente de saltar
   duplicados no se adopta en esta colección de temporadas visibles.
5. Las fichas normales de un premio actual no poseído redirigen a su fuente;
   fuera de temporada se indican como inactivas y no se venden por NOVA.
6. Las diez opciones base por categoría permanecen. Skins especiales son
   extras originales, no ventajas de combate ni recolores indistinguibles.
7. La ruta temporal `/?debug=1&reward-catalog=1` permite equipar/jugar con las
   treinta recompensas sin escritura al guardado real, sólo en local/Pages.

No hay ventajas de estadísticas en las skins de evento. Sus cañones/balas
pueden tener identidad visual propia sin modificar colisión, daño o targeting.

## 12. Ruleta diaria: actualización autorizada 04-10-2026

El usuario pidió concretamente una rueda de once ranuras, una skin muy rara
y un extra diario con video. Su actualización posterior permite skin en ambos
giros, con probabilidad compartida creciente (1% inicial, +1 punto por giro
completado hasta 20%, sin reinicio). Sustituye la propuesta
inicial de cápsula sin anuncios ni porcentajes. Implementado en local: gratis
cada 24 h, diez importes de 40–300 NOVA que comparten el porcentaje no dorado,
un cosmético semanal de su colección de 15 (Solstice es el primero), duplicado
convertido en 500 NOVA y extra tras video completado.
No hay compra de giros, rachas o garantía de skin. Probabilidades visibles.

[RULETA_DIARIA](RULETA_DIARIA.md) gobierna los parámetros, economía estimada,
guardado actual schema 13, Web Locks, recuperación de reloj, flujo de video/audio,
arte y pruebas. No aumentar estadísticas por cosméticos ni cambiar silenciosamente
esa política. El permiso de probar localmente no sustituye revisión comercial
por portal, integración de SDK ni QA humano.

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

La primera implementación añadió schema 10; la Bitácora migra ahora a 13. Se
conservan ajustes, cartera, propiedad, Laboratorio, actos, récords y última ruta;
las cuentas anteriores reciben progreso vacío, sin reset de su perfil previo.

Datos futuros mínimos: versión del catálogo, progreso finito de Bitácora,
última reclamación diaria, identificadores de ediciones cobradas,
récords comparables acotados y resultado/recibo mínimo si hace falta recuperación.
La propiedad cosmética debe reutilizar las colecciones existentes, no duplicarse
en un segundo inventario contradictorio.

### Integridad de reclamaciones

- Validar condiciones y operar cartera/propiedad/recibo/cooldown/garantía juntos
  en una única transición de guardado. No grabar «cobrado» separado del premio.
- La UI/animación representa un resultado confirmado; no decide la recompensa.
- Probar doble clic, callback repetido, recarga durante reveal y fallo de storage.
- La escritura local se verifica por lectura posterior antes de mostrar premio.
  `localStorage` no es transacción entre pestañas: la exclusión/revalidación
  concurrente sigue siendo un límite conocido para premios semanales.
  Bitácora y ruleta usan Web Locks propios y confirman su pago antes del reveal, sin
  prometer cobro global entre dispositivos.
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
- La Bitácora usa el arte raster/WebP ya aprobado de bosses y Chargers, además
  de Asterion Courier como premio visible. Se carga bajo demanda en el panel y
  en el resultado; tarjetas mobile pasan a una columna y el contenido conserva
  scroll interno. No se genera una ilustración distinta por cada objetivo.
- La pantalla estática no crea un loop Pixi, filtros animados ni partículas.
  Las imágenes usan `?no-inline`, carga diferida/observación visible y recursos
  reusados; verificar su coste en el build final antes de publicar.
- Producir un lote piloto pequeño, no todas las skins semanales/diarias juntas.
  No precargar todo el catálogo ni añadir shaders/partículas para retención.
- Última evidencia del catálogo: local 14,964,288 bytes, margen 35,712 hasta
  el límite de 15,000,000. Es evidencia fechada, no medida de este plan.
  Medir/optimizar antes de ampliar; no elevar el límite, borrar mapas o retirar
  contratos para conseguir una puerta verde. Los mapas se conservan como
  artefacto diagnóstico de CI, fuera del payload publicado.
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

La solicitud posterior añade `daily-wheel-nova` como placement opcional fuera
de los retos; sólo se solicita al elegir el extra. No abrir anuncios por entrar
a eventos o menús. Local indica simulación; portales no fingen éxito.
GitHub Pages valida sólo el target local, no el sorteo comercial, cloud save o
integración real. EX-09 conserva sus puertas.

## 18. Entregas y estado local

La implementación autorizada se hizo localmente. «Implementado» no equivale a
validado por el usuario, aprobado en móvil o listo para portal.

| ID | Entrega | Estado actual / puerta |
| --- | --- | --- |
| RET-00 | Parámetros y calendario local del prototipo. | Valores de prueba documentados abajo; aún no son aprobación de balance. |
| RET-01 | Duelos sin impactos de Core Sentinel, Warden y Fracture. | Core Sentinel aprobado por el usuario; Fracture se conserva sin cambios. Los duelos usan Projectile rango I (un emisor, sin Calibration), daño de contacto y cadencia de reto ≥1.45×. Core empieza y reintenta al lado opuesto del spawn del boss; recuperación al 33% del valor base. Sólo en Orbital Warden, las réplicas requieren dos impactos del proyectil base (28 de vida); campaña conserva 30. Tipado y suite completa (755 pruebas / 133 archivos) pasan; falta probar el nuevo ritmo de Warden en móvil. |
| RET-02 | Evasión Charger 60 s. | Implementada sin disparo y con máximo cinco; falta probar esquiva en móvil. |
| RET-03 | Rotación y duelos Warden/Fracture. | Rotación semanal Core → Warden → Fracture, repetida cada tres semanas; Charger queda fuera de calendario. Los duelos conservan kit y cadencia exclusiva; el tick de amenazas Fracture está activo. Los tres retos aprobados; QA en teléfono físico pendiente. |
| RET-04 | Bitácora y resumen conectado. | 13 objetivos y pagos locales; validar comprensión, persistencia y economía. |
| RET-05 | Ruleta gratuita de 24 h y extra de NOVA. | Implementada localmente por solicitud expresa; revisión humana y publicación de portal pendientes. |
| RET-06 | Validación de participación, regreso y costes. | Pendiente: revisión humana/datos aprobados; no se añadió analítica. |

RET-00 no obliga a detener el duelo por una revisión comercial del azar: ese
permiso es puerta de publicación, no de la prueba local autorizada. Antes de publicar deben
cumplirse EX-09 y las puertas de guardado, recursos e integridad aplicables.

## 19. Validación: estado y Definition of Done pendiente

Tipado y suite unitaria completa (755 pruebas / 133 archivos) comprobados en
esta actualización de vida de réplicas Warden. En la actualización anterior
de barrera central Core también pasaron 80 casos enfocados de geometría,
ArenaModel, PlayerModel, render, definición del evento y Game.
En la entrega anterior de los duelos
se habían ejecutado 84 pruebas enfocadas de Game, CombatSimulation y
RetentionDefinitions. Smoke enfocado PC/móvil previo
valida la ruleta y sus assets, premio/equipo en batalla, persistencia y dos
pestañas; no equivale a QA de combate/retención físico. Evidencia vigente en
CONTINUACION.

- [x] Lógica pura: calendario UTC determinista, progreso acotado, normalización
  defensiva, objetivos generales por rangos y actos/bosses únicos con cobro manual.
- [x] Retos aislados: proyectil fijo en duelos sin Laboratorio/cartas elegibles;
  Chargers sin armas; timer de simulación; premios fuera del combate.
- [x] Migración schema 9/10/11/12 → 13 sin borrar datos existentes; escritura de premios
  confirmada por lectura local antes de presentarlos.
- [x] Cubrir por unit test que un impacto bloqueado por escudo invalida el duelo
  aunque la victoria del boss llegue en el mismo tick.
- [x] Unit tests de contacto de casco para los tres bosses, cadencia aislada con
  telegraphs intactos y amenazas Fracture activas: typecheck y suite completa
  pasaron; aceptación humana en combate/móvil sigue pendiente.
- [ ] Suite unitaria completa y smoke browser para los flujos nuevos, incluyendo
  fallo de guardado y retorno entre modos (las 84 pruebas enfocadas ya pasaron).
- [ ] Core/Warden/Fracture mantienen todos sus patrones definitorios; el primer
  impacto conectado termina el duelo, también si lo bloquea el escudo. Réplicas
  de Warden se generan, atacan, reciben daño y limpian correctamente sin oleadas.
- [ ] Reservas/capacidades suficientes para proyectiles, réplicas y minas; no
  se salta un patrón silenciosamente por quitar al director común.
- [ ] Recompensa exactamente una vez por edición en el flujo soportado;
  doble clic, callbacks, recarga, dos pestañas, fallo de storage y cartera al tope.
- [ ] Cooldown 24 h, retrocesos/saltos de fecha, cambio semanal, versión de
  calendario y cierre de intentos; reglas iguales entre zonas horarias.
- [x] La migración desde schema 9 preserva la cuenta y comienza los campos nuevos
  vacíos. La prueba unitaria se ejecutó en la entrega de ruleta.
- [ ] Verificar dos pestañas simultáneas y `MAX_SAVE_BYTES` bajo todos los
  targets; el recibo local no es almacenamiento autoritativo.
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
- [ ] Aprobación de interfaz/combate en dispositivo físico y decisión de portal
  sobre la cápsula. Sin acceso, esas puertas siguen pendientes.

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

## 21. Decisiones actuales y pendientes de usuario/portal

- [x] Acceso opcional «Retos y Bitácora» en Inicio; Jugar conserva prioridad.
- [x] Loadout fijo de proyectil; sin Laboratorio, cartas elegibles, anuncios,
  revive ni double-NOVA. El Charger no recibe fuego automático.
- [x] Charger: 60 s activos, máximo cinco y llegada gradual; justicia/tensión
  requiere prueba humana antes de ajustar.
- [x] Rotación técnica: lunes 00:00 UTC, ancla 2026-10-05, cuatro plantillas
  versionadas. Un intento conserva la edición al cruzar una semana.
- [x] Premio inicial: Asterion Courier, una vez por edición; al poseerla,
  +250 NOVA por edición. Cifras provisionales; el lote futuro está pendiente.
- [ ] Economía final y política al alcanzar el tope de cartera.
- [ ] Reloj confiable y concurrencia entre pestañas: best-effort local, sin
  servidor ni sincronización entre PCs.
- [x] Ruleta diaria, cooldown 24 h y extra opcional NOVA por video implementados
  en local; [contrato](RULETA_DIARIA.md).
- [ ] Revisión comercial por portal e integración real de anuncios.
- [ ] Revisión humana de progreso/recompensas y prueba física en móvil/PC.
