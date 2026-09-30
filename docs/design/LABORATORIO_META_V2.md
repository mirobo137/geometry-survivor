# Laboratorio de meta — contrato V2

Estado: progresión implementada localmente; árbol UI automático OK, revisión
visual/táctil y pruebas humanas aplazadas por solicitud del usuario (29-09-2026).
Última actualización: 29-09-2026.

Este documento reemplaza el contrato de la tienda permanente V1. Es la fuente
canónica para contenido, UI, guardado y pruebas del Laboratorio. El balance
aprobado de enemigos y bosses de EX-02c es independiente: esta entrega no lo
reabre. El plan futuro de Overdrive por ritmo de puntos tampoco se implementa
ni se presume como fuente actual de NOVA.

## Acceso y alcance

- El Laboratorio se desbloquea únicamente cuando el jugador vence realmente
  Fracture Engine y `overdrive.unlocked` queda persistido. Tener Acto III
  seleccionable no basta.
- Antes del desbloqueo, el botón permanece visible pero bloqueado y explica el
  requisito. No existe bypass en el flujo normal.
- Una mejora comprada se conserva en localStorage y aplica en todas las nuevas
  partidas de Actos I–III y Overdrive. La mejora no altera cosméticos ni la
  composición de cartas adquiridas durante una run.
- Cada atributo tiene un tope de cinco rangos de prueba. Los topes son editables
  desde contenido cuando exista evidencia de balance; no ampliar un tope por
  conveniencia técnica.
- La presentación es un árbol de habilidades DOM/SVG; no es una nueva regla de
  prerequisitos. Se conserva el catálogo, la rotación de ofertas, los efectos,
  los costes y el contrato del guardado descritos aquí.

## Catálogo, incrementos y topes de prueba

Hay once ramas permanentes: una de daño global, seis específicas por arma y
cuatro de piloto/ritmo.

| Rama | Incremento por rango | Tope V2 | Efecto de una rama completa |
| --- | ---: | ---: | ---: |
| Matriz de impacto | +5% daño global | 5 | +25% daño global |
| Daño de cada arma (6 ramas) | +2% daño de esa familia | 5 por familia | +10% para esa familia |
| Calibración de fuego | −3% intervalo de arma | 5 | −15% intervalo; cadencia resultante ≈ +17.6% |
| Propulsores vectoriales | +2% velocidad base | 5 | +10% movimiento |
| Integridad del casco | +2% vida máxima | 5 | +10% vida máxima NOVA |
| Blindaje reactivo | −1% daño recibido | 5 | −5% daño recibido |

Daño global y específico se multiplican, no se suman: una familia con ambas
ramas completas recibe `1.25 × 1.10 = 1.375` de daño base antes de otros
modificadores de run/Overdrive. La velocidad de ataque se expresa como
reducción del intervalo para que el texto corresponda con la fórmula del juego.
La resistencia se aplica al paquete restante después de la armadura plana.

Además, el placement rewarded opcional `laboratory-vitality` concede +1% de
vida máxima permanente por anuncio completado, hasta cuatro rangos (+4%). Cada
rango de NOVA requiere tres compras NOVA desde la recompensa anterior. Esta
vida se combina multiplicativamente con la línea NOVA: el máximo provisional
es `1.10 × 1.04 = 1.144` (+14.4% de vida máxima). Rechazar, cerrar o no tener un
anuncio disponible no concede efecto ni reinicia el progreso de compras.

## Costes y oferta

Todos los tipos de rama usan el mismo precio por rango:

| Rango comprado | Coste NOVA |
| ---: | ---: |
| 1 | 875 |
| 2 | 1,325 |
| 3 | 2,000 |
| 4 | 3,000 |
| 5 | 4,500 |
| Total de una línea | **11,700** |

Con once ramas, completar todo el catálogo permanente costaría 128,700 NOVA,
antes de la bonificación opcional de vitalidad. Los costes son iguales entre
familias; no priorizar Doble Cañón ni otra arma.

- Cada mano ofrece hasta tres ramas elegibles distintas, mezcladas de forma
  determinista para mantenerlas estables al reabrir la pantalla.
- Las dos opciones no elegidas descansan durante las dos siguientes compras;
  una rama elegida puede volver a salir para ofrecer su rango siguiente.
- El mapa resalta esas tres ofertas actuales; las demás ramas se pueden
  inspeccionar, pero sólo se compran cuando regresan a la oferta. El historial
  conserva como máximo las cuatro compras más recientes y queda plegado bajo el
  árbol. No hay un radar con nombres futuros ni una lista infinita.
- Una rama en rango 5 deja de ser elegible. Si quedan menos de tres ramas, la
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
  El número de nodos está acotado por las once ramas y cinco rangos más la línea
  rewarded.

## Persistencia y migración

`SaveData.laboratory` es la única progresión autoritativa. El esquema actual es
8 y usa el `LocalSaveStore` del runtime local, respaldado por localStorage; el
fallback en memoria sólo cubre entornos donde el almacenamiento persistente no
está disponible.

Al migrar un save anterior a esquema 8 se inicia limpio **sólo el Laboratorio**,
como fue autorizado. Se conservan NOVA, skins, fondos, mejores resultados,
actos desbloqueados y el desbloqueo de Overdrive que ya estuviera respaldado
por un save compatible. Rangos inválidos, IDs desconocidos, historiales largos
y contadores fuera de rango se normalizan.

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

- once ramas, costes iguales y total de 11,700 NOVA por línea;
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

Ruta humana normal: menú → `Actos` → completar Acto III → menú → `Laboratorio`.
Probar una compra por rama, recargar la página, verificar saldo/rango/historial,
iniciar distintos actos y Overdrive, y observar que la bonificación aparece en
cartas de rango. Para el placement local, completar tres compras NOVA, probar
rewarded y después los resultados con `?ad=dismissed` y `?ad=unavailable`.

La aprobación final del equilibrio de los topes y costes requiere juego manual.
El ritmo futuro de Overdrive por puntos debe medir NOVA/minuto antes de
recalibrar estos precios; no duplicar ingresos por anticipado.

### Recordatorio: pruebas manuales aplazadas

El 29-09-2026 el usuario pide dejar el Laboratorio en pausa y probarlo después.
Las pruebas automáticas ya registradas no sustituyen esta aceptación humana.
Al retomar, comprobar:

- [ ] PC y móvil físico: lectura de iconos y ofertas, arrastre, zoom, pinch,
  recentrado y acceso a la isla de Vitalidad sin bloquear otros controles.
- [ ] Modal: efecto y coste comprensibles; cerrar por botón, exterior y Escape
  en teclado; comprar, mostrar el rango siguiente y respetar el saldo.
- [ ] Recargar: conservar NOVA, rangos, ofertas y contador de compras.
- [ ] Vitalidad: habilitar tras tres compras NOVA; conceder una sola vez por
  anuncio exitoso y no conceder al cancelar o no disponer de anuncio.
- [ ] Actos y Overdrive: aplicar las mejoras compradas y mostrar en las cartas
  el daño que incluye las bonificaciones permanentes; revisar topes y costes
  jugando antes de declararlos aprobados.

No reiniciar el Laboratorio, cambiar sus precios ni ampliar topes al retomar
sin una solicitud o evidencia nueva. El baseline aprobado de enemigos/bosses
continúa vigente.
