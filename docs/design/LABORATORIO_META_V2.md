# Laboratorio de meta — contrato V2

Contrato funcional y visual del Laboratorio V2. El estado de aceptación actual
se sigue únicamente en [PLAN_DESARROLLO.md](../../PLAN_DESARROLLO.md).

Este documento reemplaza el contrato de la tienda permanente V1. Es la fuente
canónica para contenido, UI, guardado y pruebas del Laboratorio. El baseline
aprobado de enemigos y bosses es independiente y no se reabre por cambios de
meta.

## Acceso y alcance

- El Laboratorio se desbloquea cuando el jugador vence Radial/Acto I y el
  progreso persistido permite seleccionar Angular/Acto II (`unlockedActs`
  contiene `angular`). Desbloquear Overdrive ya no es requisito.
- Antes del desbloqueo, el botón permanece visible pero bloqueado y explica el
  requisito. No existe bypass en el flujo normal.
- Una mejora comprada se conserva en localStorage y aplica en todas las nuevas
  partidas de Actos I–III y Overdrive. La mejora no altera cosméticos ni la
  composición de cartas adquiridas durante una run.
- Cada atributo tiene un tope provisional de diez rangos. Este aumento queda
  pendiente de aprobación humana tras comparar perfiles con y sin Laboratorio.
- La presentación es un árbol de habilidades DOM/SVG; no es una nueva regla de
  prerequisitos. Se conserva el catálogo, la rotación de ofertas, los efectos,
  los costes y el contrato del guardado descritos aquí.

## Catálogo, incrementos y topes de prueba

Hay once ramas permanentes: una de daño global, seis específicas por arma y
cuatro de piloto/ritmo.

| Rama | Incremento por rango | Tope V2 | Efecto de una rama completa |
| --- | ---: | ---: | ---: |
| Matriz de impacto | +5% daño global | 10 | +50% daño global |
| Daño de cada arma (6 ramas) | +2% daño de esa familia | 10 por familia | +20% para esa familia |
| Calibración de fuego | −3% intervalo de arma | 10 | −30% intervalo; cadencia resultante ≈ +42.9% |
| Propulsores vectoriales | +2% velocidad base | 10 | +20% movimiento |
| Integridad del casco | +2% vida máxima | 10 | +20% vida máxima NOVA |
| Blindaje reactivo | −1% daño recibido | 10 | −10% daño recibido |

Daño global y específico se multiplican, no se suman: una familia con ambas
ramas completas recibe `1.50 × 1.20 = 1.80` de daño base antes de cartas de run
y Overdrive. Sumada la cadencia máxima, esa familia puede llegar a
`1.80 ÷ 0.70 ≈ 2.57×` DPS base (≈ +157%), antes de daño plano, críticos y
mejoras/evoluciones durante la partida. La cadencia se expresa como reducción
del intervalo; la resistencia se aplica al daño que queda después de armadura.

Además, el placement rewarded opcional `laboratory-vitality` concede +1% de
vida máxima permanente por anuncio completado, hasta cuatro rangos (+4%). Cada
rango de NOVA requiere tres compras NOVA desde la recompensa anterior. Esta
vida se combina multiplicativamente con la línea NOVA: el máximo de prueba es
`1.20 × 1.04 = 1.248` (+24.8% de vida máxima). Rechazar, cerrar o no tener un
anuncio disponible no concede efecto ni reinicia el progreso de compras. El
placement también queda disponible desde el desbloqueo del Acto II cuando la
plataforma ofrece rewarded.

### Riesgo al combinar las ramas con cartas de run

El tope de diez es una configuración de prueba, no un balance aprobado. Si se
combina el perfil máximo con cartas defensivas: `hardened_shell` puede añadir
hasta 18 de armadura plana; `regenerative_reactor`, hasta 6% de vida máxima cada
5 s; `vampiric_core`, hasta 2% por derrota con su enfriamiento actual de 0.25 s;
y `recharging_shield` bloquea un impacto y se recarga. Además, `reinforced_core`
añade +20 de vida máxima por adquisición y tiene tope de 9 en Overdrive: con el
Laboratorio y Vitalidad al máximo, `280 × 1.248 = 349.44` de vida máxima antes
de curaciones. En una densidad suficiente, el vampirismo puede aportar
teóricamente hasta 8% de vida máxima/s, más 1.2%/s del reactor mientras falte
vida. Esto puede trivializar encuentros; son topes individuales de cartas y no
significa que todas aparezcan en una sola mano.

No hay un máximo universal seguro sumando cartas de run: Overdrive es continuo y
algunas cartas repetibles no tienen un tope finito global. El perfil máximo
permite medir ese extremo. La comparación debe jugarse en el mismo acto y con
el mismo equipamiento/condiciones; el tope sólo se aprueba si conserva tensión,
lectura de amenazas y margen para fallar.

## Costes y oferta

Todos los tipos de rama usan el mismo precio por rango:

| Rango comprado | Coste NOVA |
| ---: | ---: |
| 1 | 613 |
| 2 | 928 |
| 3 | 1,400 |
| 4 | 2,100 |
| 5 | 3,150 |
| 6 | 4,725 |
| 7 | 7,088 |
| 8 | 10,632 |
| 9 | 15,947 |
| 10 | 23,921 |
| Total de una línea | **70,504** |

Con once ramas, completar todo el catálogo permanente costaría **775,544 NOVA**,
antes de la bonificación opcional de vitalidad. Los precios aplican un descuento
del 30% a la curva previa; los rangos 6–10 continúan aproximadamente el factor
×1.5 por rango. La línea completa cuesta unas seis veces el máximo de cinco
rangos anterior (11,700 NOVA), así que “cada mejora cuesta menos” no significa
que completar una rama o todo el árbol salga más barato. A 4,000–5,000 NOVA por run
de Overdrive citado como referencia, una línea requiere aproximadamente 15–18
runs sin duplicar recompensa o 8–9 con duplicación máxima. Los costes son
iguales entre familias; no priorizar Doble Cañón ni otra arma. Con las
referencias de 400–700 NOVA por partida de Actos I–III, la misma línea requiere
aproximadamente 101–177 runs (o 59 con 1,200 NOVA duplicadas).

- Cada mano ofrece hasta tres ramas elegibles distintas, mezcladas de forma
  determinista para mantenerlas estables al reabrir la pantalla.
- Las dos opciones no elegidas descansan durante las dos siguientes compras;
  una rama elegida puede volver a salir para ofrecer su rango siguiente.
- El mapa resalta esas tres ofertas actuales; las demás ramas se pueden
  inspeccionar, pero sólo se compran cuando regresan a la oferta. El historial
  conserva como máximo las cuatro compras más recientes y queda plegado bajo el
  árbol. No hay un radar con nombres futuros ni una lista infinita.
- Una rama en rango 10 deja de ser elegible. Si quedan menos de tres ramas, la
  mano muestra las opciones restantes; nunca inventa una carta vacía.
- Sólo se descuenta NOVA al ejecutar una opción válida y guardar juntos saldo,
  rango, rotación e historial.

## Presentación del árbol de habilidades

- El mapa ya no usa una rueda radial. Parte del núcleo NOVA y abre dos redes
  laterales agrupadas: `ARSENAL` (daño global, seis familias y cadencia) y
  `NAVE Y PILOTO` (movimiento, vida y resistencia). Troncales y ramales dan la
  lectura de árbol; **no crean prerequisitos** ni cambian las ofertas: cualquier
  atributo elegible puede comprarse si aparece en las tres ofertas actuales.
- Cada atributo empieza como un hexágono con icono y rango. Tras comprar un
  rango, la rama revela solamente el nodo siguiente a su derecha; rangos más
  lejanos no se crean en el DOM hasta progresar. Los iconos anticipan familias,
  mientras nombre, efecto, totales y coste se consultan en el modal.
- Cada hexágono muestra únicamente el icono representativo y un marcador de
  rango. No imprime nombre ni efecto dentro del nodo. Su nombre es accesible
  como etiqueta para lector de pantalla; al tocar/clicar se abre un modal con
  icono, descripción, rango, incremento, total actual/siguiente y precio.
- Por rama se dibujan los rangos ya adquiridos y exactamente un rango futuro.
  Los rangos posteriores todavía no existen en el DOM hasta avanzar la rama.
  Las tres ofertas resaltan en cian, las compradas en verde y las reservadas
  permanecen atenuadas; el modal también explica por qué una compra está
  deshabilitada.
- El modal se cierra con Escape, su botón o clic en el fondo exterior. Su
  acción de adquirir vuelve a validarse mediante `purchaseLaboratoryUpgrade`
  y la transacción atómica existente; la UI nunca descuenta NOVA por sí sola.
- El mapa se desplaza con arrastre de mouse o un dedo, admite pinch y rueda, y
  tiene controles accesibles de zoom/recentrado. Los controles táctiles son de
  al menos 44 CSS px; el zoom mínimo es 52% para conservar esa medida en los
  hitboxes hexagonales. El cuerpo de la consola mantiene su scroll normal fuera
  del mapa.
- La bonificación `laboratory-vitality` vive en una red dorada independiente,
  fuera del encuadre inicial hacia la derecha. Se descubre al alejar o desplazar el árbol;
  muestra rangos completados y sólo el siguiente. Su modal conserva el progreso
  de 0–3 compras NOVA y permite solicitar rewarded al completarlas; no consume
  NOVA y sólo aplica tras resultado confirmado.
- El árbol usa HTML y un SVG de conexiones estático con símbolos locales
  `<use>`; no usa Pixi, canvas, filtros ni animación permanente. Las
  transformaciones sólo se actualizan ante zoom, arrastre, resize o progreso.
  El número de nodos está acotado por las once ramas y diez rangos más la línea
  rewarded.

## Persistencia y migración

`SaveData.laboratory` es la única progresión autoritativa. El esquema actual es
15 y usa el `LocalSaveStore` del runtime local, respaldado por localStorage; el
fallback en memoria sólo cubre entornos donde el almacenamiento persistente no
está disponible.

La migración histórica a esquema 8 inició limpio **sólo el Laboratorio**, como
se autorizó entonces. Este ajuste de balance no incrementa el esquema ni borra
datos: los rangos 1–5 existentes se conservan y pueden avanzar hasta 10; los
rangos, ofertas e historial todavía se normalizan dentro de límites válidos.
Los perfiles de comparación locales nunca se escriben en el save real.

No se serializan vidas o efectos de combate activos. El runtime reconstruye las
bonificaciones persistentes al configurar el modo y reiniciar una partida.

## Fórmulas y cartas de nivel

Las fuentes de verdad son `LaboratoryDefinitions.ts`, `WeaponDefinitions.ts`,
`CombatWeaponSystem.ts` y `PlayerModel.ts`. Los behaviors consumen la misma
tabla authored de daño por rango usada por la carta; la UI no mantiene una copia
de fórmulas ni calcula una versión aproximada.

Para una carta que sube el rango de arma:

```text
daño actual = daño authored del rango actual
              × daño global permanente
              × daño permanente de la familia
              × poder independiente de Overdrive

daño siguiente = la misma fórmula usando el daño authored del rango ofertado
```

El preview es daño por impacto y debe corresponder con el cambio real de la
carta. Las ofertas que no cambian el daño no muestran un preview engañoso. La
línea de daño global y la línea de arma afectan también a las evoluciones y sus
paquetes secundarios a través del multiplicador del behavior propietario.

## Anuncios y límites de plataforma

El flujo utiliza el contrato de plataforma `RewardedPlacement` y valida la
elegibilidad de nuevo antes de conceder el rango, evitando doble entrega. En
este repositorio sólo hay un servicio de anuncios local de simulación; el
resultado por defecto es rewarded y `?ad=dismissed|unavailable|error|timeout`
permite probar fallos. No es una integración real de Poki/CrazyGames. SDKs,
políticas de privacidad y QA por portal siguen en EX-09.

## Validación y prueba humana

Comprobación automática requerida:

- once ramas, diez rangos, costes iguales y total de 70,504 NOVA por línea;
- normalización/migración de esquema 7 → 8 sin perder el resto del save;
- ofertas estables, sin duplicados, rotación de las no elegidas y tope de rango;
- anuncio sólo después de tres compras NOVA, hasta cuatro veces y sólo con
  resultado rewarded;
- aplicación persistente de movimiento, vida, resistencia, daño y cadencia;
- preview de rango que integra daño permanente de laboratorio y poder de
  Overdrive, más regresión de campaña y las seis familias/evoluciones;
- árbol: tres ofertas resaltadas, iconografía legible, rangos futuros ocultos,
  compra/modal/guardado, cierre por Escape y fondo, desplazamiento/zoom y
  ramal rewarded sólo tras tres compras NOVA;
- consola legible, sin solapamientos ni overflow horizontal en 320×568,
  390×844, 640×360 y 1280×720.

Ruta humana normal: menú → `Actos` → completar Acto I → menú → `Laboratorio`.
Probar una compra por rama, recargar la página, verificar saldo/rango/historial,
iniciar distintos actos y Overdrive, y observar que la bonificación aparece en
cartas de rango. Comparar, en el mismo acto y con condiciones similares, estas
rutas locales temporales: `/?debug=1&act=radial&lab-profile=none` y
`/?debug=1&act=radial&lab-profile=max`; cambiar `act=radial` por `angular` o
`fracture` para comparar actos. El perfil máximo incluye rango 10 en las once
ramas y los cuatro rangos opcionales de Vitalidad. No altera el save permanente.
Para comparar Overdrive sin escribir al save, usar `/?debug=1&mode=overdrive&od-variant=normal&lab-profile=max`
o `lab-profile=none`; cambiar `od-variant=normal` por `assault` para probar
Overdrive Asalto. Estas rutas entran directamente a la partida y conservan los
registros, recompensas y cambios de progreso sólo en memoria.
Para el placement local, completar tres compras NOVA, probar rewarded y después
los resultados con `?ad=dismissed` y `?ad=unavailable`.

La aprobación final del equilibrio de los topes y costes requiere juego manual.
El ritmo futuro de Overdrive por puntos debe medir NOVA/minuto antes de
recalibrar estos precios; no duplicar ingresos por anticipado.

### Criterios de aceptación

Las puertas que falten por comprobar se registran en el
[plan único](../../PLAN_DESARROLLO.md). Esta ficha mantiene los criterios:

- PC y móvil físico: lectura de iconos y ofertas, arrastre, zoom, pinch,
  recentrado y acceso a la isla de Vitalidad sin bloquear otros controles.
- Modal: efecto y coste comprensibles; cerrar por botón, exterior y Escape
  en teclado; comprar, mostrar el rango siguiente y respetar el saldo.
- Recargar: conservar NOVA, rangos, ofertas y contador de compras.
- Vitalidad: habilitar tras tres compras NOVA; conceder una sola vez por
  anuncio exitoso y no conceder al cancelar o no disponer de anuncio.
- Actos y Overdrive: aplicar las mejoras compradas y mostrar en las cartas
  el daño que incluye las bonificaciones permanentes; revisar topes y costes
  jugando antes de declararlos aprobados.

No reiniciar el Laboratorio ni borrar rangos previos con este balance. Los
valores de diez rangos y sus precios quedan provisionales hasta la comparación
humana. El baseline aprobado de enemigos/bosses continúa vigente.
