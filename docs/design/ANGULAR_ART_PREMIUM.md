# Angular: ariete cerámico y señales de movimiento

Revisión 11-09-2026. Charger y los dos avisos revisados; aprobación humana
pendiente. El diseño del Orbiter se conserva por solicitud del usuario.

## Qué falló y cómo evitar repetirlo

La versión anterior confundió acabado con añadir líneas, círculos y diamantes
al mismo trazo. El Charger cambió a una proa desplazada sin comprobar lectura
frontal ni comparación visual. Una build verde se presentó como evidencia
de calidad: no lo es. La guía de SVG necesita aplicarse también a la inspección.

Antes de producir otra familia, comparar tres masas en negro con las aprobadas,
elegir por función y construir la lámina de comparación. Aquí se descartaron
la aguja por proximidad a Fast y el martillo ancho por proximidad a Tank.
La masa elegida concentra una proa de ariete en el eje y retrasa estabilizadores
y motores. Las variantes y fuentes se ven en /docs/visual/angular-reference.html.

## Charger: construcción

Referencia de acabado: Tank (placas, retornos, cavidad) y Elite (componentes
separados). Diferencia: proa cerámica larga marfil, estabilizadores titanio,
reactor pequeño ámbar, muescas laterales reales y dos motores traseros.
Frente -Y; centro (0,0); frame -32 -32 64 64. Collider existente, radio 19.

23 primitivas: rear 4, wings 7, hull 8, cockpit 4. Master idéntico a concatenar
las cuatro piezas en ese orden. Cinco texturas compartidas de 64×64:
80 KiB RGBA teóricos, sin overhead. Low conserva el master completo.
Sin filtros, PNG ni resolución adicional. SVG resuelve este material por planos;
ARTE_HIBRIDO.md permite PNG cuando una superficie pintada lo justifique.
El proyecto no exige que todo asset sea SVG ni prohíbe transparencia raster.

Durante telegraph el casco apunta al vector anunciado; estabilizadores se
abren 4.5% y retroceden 1.2 u, motores 0.8 u. La unión se conserva. La carga
estira longitudinalmente el casco 3.5%. Muerte usa las cuatro piezas existentes.
Animación por snapshot/reloj del juego; sin reloj propio ni cambios de collider.

## Avisos: preparación, lanzamiento, disipación

Aplicar EFECTOS_PREMIUM.md por intención, no copiar el plasma dañino de Solar Rail.
La única superficie dañina de estos enemigos es el casco.

- Charger: dos aletas de luz abiertas, base tinta, cuerpo ámbar y bisel marfil
  parcial. Comprimen transversalmente al cargar; punta corta avanza de 66 a
  81 u. Extensión máxima 91 u; no comunica alcance. Acompaña a la nave al
  iniciar la embestida y desaparece en su primer 30%. Sin línea central,
  círculo de origen ni flecha maciza. Cinco slots, dos Graphics por slot.
- Orbiter: ocho plumas curvas discontinuas sobre el arco anunciado. Cada
  segmento afina ambos extremos, mantiene espacio vacío y una barba oblicua
  indica sentido. Se iluminan secuencialmente en el aviso y se apagan detrás
  del casco durante commit. No hay anillo sólido, nodos ni extremos como pickups.
  Seis slots, ocho Graphics por slot. Capas dibujadas dentro del mismo objeto.

Low/Medium/High conservan el mismo material y la misma señal. Geometría Charger
construida una vez; Orbiter sólo reconstruye cuando cambia identidad, secuencia,
radio, ángulo o sentido. Incluir identidad y geometría evita reutilizar un trazo
de otro enemigo con igual secuencia. Subpaths explícitos. Reset oculta ambos
avisos. Sin filtros, partículas, geometría por frame estable ni nueva dependencia.
Presupuestos acotados no certifican rendimiento Android.

## Procedimiento obligatorio para siguientes entregas

1. Declarar verbo, silueta, frente, material, tamaño real y referencia aprobada.
2. Comparar tres masas; no resolver una silueta débil con detalles.
3. Construir chasis, plano medio, bisel selectivo, retorno y cavidad.
4. Separar piezas sólo por movimiento/despiece. Verificar master Low equivalente.
5. Escribir qué comunica cada fase y qué NO representa una hitbox.
6. Usar progreso simulado; verificar pausa, reset y reciclaje de entidades.
7. Capturar compositor real oscuro/claro, 32/64/96 px, Low y partida.
8. Mirar las capturas y corregir antes de reportar. Tests de XML no juzgan arte.

Lámina: /docs/visual/angular-reference.html. Capturas reproducibles:
`node docs/visual/capture-angular.mjs` con Vite en 5173. Incluye referencias
Tank/Elite, exploración, siluetas, seis paneles Pixi y ambos drills Low.
URLs: ?charger=1&debug=1 y ?orbiter=1&debug=1.
Las pruebas automáticas cubren límites del aviso, varias instancias, reset,
reutilización de paths e identidad de ruta; SVG compara master y piezas.
La aprobación visual y el perfil en móvil físico quedan para el usuario.

Evidencia de esta revisión: typecheck, build local y 301 tests en 87 archivos
correctos. Se inspeccionaron capturas del comparador desktop/portrait y ambos
drills Low sin errores de ejecución. Incluyen materiales en fondo claro y
oscuro; no constituyen benchmark. Durante captura headless y compilación
simultánea el HUD indicó aproximadamente 24 FPS; no se extrapola a juego
interactivo ni a Android. Persiste el warning previo de chunk mayor de 500 kB.

## Splitter: fractura acotada

El tercer verbo angular es **separarse**, no girar ni embestir. La masa elegida
es un diamante facetado con una costura vertical, dos placas laterales
desacoplables y un nucleo dual. Tank aporta los planos y retornos; Orbiter
aporta la idea de placas moviles, pero la silueta no copia su herradura; Charger
aporta la proa funcional, pero Splitter no usa una aguja frontal.

La fuente tiene 23 primitivas: rear 4, wings 7, hull 8, cockpit 4. El master es
la concatenacion exacta de esas piezas, usa el mismo frame centrado y mantiene
la forma en Low. Durante la vida normal las alas respiran en sentidos opuestos;
al morir, el FX pooled separa las piezas del padre y la simulacion crea dos
hijos laterales. Un hijo se escala por transform y no crea otra textura.

La regla de gameplay es una sola fractura: profundidad 0 crea dos hijos de
profundidad 1; los hijos no se dividen. El cap de familia y el pool global se
comprueban antes de cada slot. El drill mantiene autofire porque la mecanica
necesita una muerte real para poder inspeccionarse: `?splitter=1&debug=1`.
La señal visual es la transicion padre -> dos fragmentos, no un rayo ni un
telegraph de alcance. El daño sigue siendo solo contacto del casco.

## Hoja sectorial del hazard Angular

EX-07d anade una cuarta receta visual de la familia: una hoja sectorial no es
un rayo lineal ensanchado ni un anillo recoloreado. Durante `telegraph` muestra
solo el contorno discontinuo del sector comprometido, marcas cortas y
chevrones que declaran el sentido. Durante `active` usa una cuña fisica con
base tinta, manto metalico, cuerpo coral, nucleo marfil y dos bordes; rota el
contenedor segun el snapshot. En `recovery` deja fragmentos discontinuos, sin
cuerpo solido.

Revision de telegraph premium: la camara de calibracion es apenas
translucida; sus rieles radiales usan segmentos con base metalica y nucleo
ambar, remates fisicos en los dos extremos, un emisor de origen y chevrones
tangenciales que declaran el sentido. La lectura es de sector comprometido,
no de una linea de alcance continua. Low conserva camara, rieles, extremos,
direccion, hoja y respuesta; High solo suma chevrones y detalle. Cada arco,
linea y sector empieza su propio `beginPath()`.

La hoja recorre un arco limitado y deja una ruta amplia fuera de su angulo.
No se pinta una cuña de "zona segura": la seguridad se deduce de la ausencia
real de geometria y de la colision. El renderer no decide daño ni longitud; no
se anaden lineas, flechas macizas, filtros ni particulas para aparentar
premium. `AngularSweepView` construye geometria por secuencia/radio y anima
solo transform, alpha y visibilidad.

Orbital Warden usa el mismo lenguaje material con una familia propia: su riel
rota mientras daña, fija una embestida, recorre un arco curvo, lanza dos
réplicas destructibles y desplaza el corredor del anillo. Su silueta modular y
la de sus copias viven en assets separados; la vista cambia de familia por
`bossId` y no aplica un recolor silencioso. La receta detallada queda en
[`ACTO_II_BOSS_FAMILY_PREMIUM.md`](ACTO_II_BOSS_FAMILY_PREMIUM.md).

Lamina: /docs/visual/angular-reference.html. Capturas reproducibles:
`node docs/visual/capture-angular.mjs` con Vite en 5173. Incluye referencias
Tank/Elite, exploracion, siluetas, paneles Pixi de las tres familias y los tres
drills Low, mas la hoja Angular en sus tres estados. URLs: `?charger=1&debug=1`,
`?orbiter=1&debug=1`, `?splitter=1&debug=1` y `?angular=1&debug=1`.
