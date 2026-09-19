# EX-08-R — Evoluciones con decisiones reales

Fecha: 2026-09-14. Estado: **las seis rutas implementadas y aprobadas por
validación humana; balance EX-02c pendiente**.

Ampliación vigente: [PROGRESION_ARMAS_V2.md](PROGRESION_ARMAS_V2.md) define
las 42 filas I–VII, cartas, calibraciones y herencia de estadísticas al
evolucionar. Sus fórmulas de herencia prevalecen sobre los valores fijos de
prototipo en §4. Los rangos tienen ahora una secuencia fija por familia.

## Correccion vigente de dano y lectura - 14-09-2026

Este bloque prevalece sobre las descripciones de prototipo mas abajo cuando
hay una diferencia.

- `solar_crown`: ya no emite cuchillas hacia afuera. Al evolucionar agrega
  tres cuchillas a la formacion y fija el total en seis, todas orbitando a
  radio authored fijo de 94u. El contacto de las seis cuchillas es el dano
  real; no existe fase de salida, desaparicion ni hit fantasma en el centro.
- `echo_shock`: una sola cresta alcanza 280u (o el alcance de rango si fuera
  mayor) y retorna al mismo origen capturado. Ida y vuelta hacen el dano
  completo una vez por objetivo y nunca desplazan; el movimiento posterior
  del player no crea un segundo centro ni puede cambiar la zona anunciada.
- `compression_wave`: el frente conserva el eje capturado al iniciar el
  telegraph, aunque el player se mueva durante el cast. La simulacion y la
  vista usan ese mismo eje; la vista ya no dibuja un aro completo para no
  prometer dano detras del player. El radio final es 320u y el borde fisico
  considera el radio del enemigo, por lo que un hull que roza el frente no se
  pierde por comprobar solo su centro. Libera tres frentes de 0.28s, con una
  pausa visual de 0.10s, y cada impacto empuja tres veces el empuje base del
  rango actual; no atrae en ninguna fase.
- `event_horizon`: retiene durante3.4s en un núcleo remoto radio64, con
  atracción radio210 y ticks de14% del daño base cada0.2s. No hay explosión
  final: los supervivientes que recibieron ticks salen ralentizados a38% por
  2.25s; quien no entró al núcleo nunca recibe ese control.
- `polar_collapse`: atrae durante0.55s a230u/s. Sus tres frentes conservan
  ancho físico24u, infligen60% y aturden1.1s a enemigos no-boss; la única
  implosión final de radio43% inflige140% a esos aturdidos o45% a un objetivo
  que llegara sin aturdimiento. La vista muestra triángulo, filos y un remate,
  no dos pulsos pequeños.
- La auditoria automatica exige que las doce ramas (`rail_lance`,
  `pulse_volley`, `solar_crown`, `graviton_halo`, `closed_circuit`,
  `thunderhead`, `twin_comet`, `singularity_return`, `echo_shock`,
  `compression_wave`, `event_horizon`, `polar_collapse`) reduzcan la vida de
  un objetivo colocado en su zona fisica descrita. Tambien exige que Rail Lance
  avance y se libere por TTL; una textura de estela no puede mantener un slot
  muerto en pantalla.

## 1. Mandato y diagnóstico histórico

El siguiente diagnóstico conserva el motivo por el que se revisaron las
evoluciones: la pareja Projectile comunicaba mejor el cambio, mientras que
Solar Crown, Event Horizon, Compression Wave, Singularity Return y Polar
Collapse necesitaban una diferencia funcional más clara y una ejecución segura.
Ese registro no representa el estado de aprobación actual.

La decisión vigente del usuario es aprobar las seis parejas después de su
validación humana. Esta especificación continúa siendo la guía de
implementación, regresión y futuras iteraciones; los tests no sustituyen la
aprobación humana, y la aprobación humana tampoco cierra el balance global de
enemigos/daño de EX-02c.

Evidencia del código revisado:

- `OrbitBehavior`: Solar modifica principalmente radio, daño y velocidad.
- `PulseRingWeaponBehavior`: Compression atrae cerca de la nave antes del golpe.
- `BoomerangBehavior`: Singularity produce su pulso al volver al player.
- `MagneticChargeBehavior`: Event atrae hacia un centro que la banda de daño
  excluye. Geométricamente puede concentrar enemigos donde la detonación no
  alcanza; comprobarlo con un test, no inferir daño por la animación.
- `UpgradeApplier.getEvolutionChoices`: el umbral usa el nivel global del
  jugador; no demuestra inversión hasta nivel 7 de esa arma como pide el plan.
- Los blancos estáticos de laboratorio no demuestran seguridad contra enemigos
  que persiguen, ni aíslan de verdad el arma si sigue disparando la primaria.

No es un problema que se resuelva añadiendo brillo: primero debe existir una
nueva decisión espacial, después una animación que la explique.

## 2. Referentes y decisión de selección

Vampire Survivors vincula evoluciones a inversión en el arma, requisitos y
cofres; poncle explica el ejemplo Magic Wand al máximo + Empty Tome + cofre.
[Fuente primaria del desarrollador](https://itch.io/profile/poncle).
Brotato utiliza combinaciones de armas idénticas del mismo tier dentro de la
tienda. [Wiki comunitaria, fuente secundaria](https://brotato.wiki.spellsandguns.com/Shop).
Consulta: 2026-09-14. Son referentes diferentes, no una regla universal del
género ni evidencia de que nuestro diseño vaya a gustar.

Decisión de proyecto: conservar dos ramas exclusivas, pero hacer que sean la
culminación visible de desarrollar el arma. No añadir recetas secretas,
cofres, anuncios, NOVA ni botones de combate para imitarlos. La adaptación a
actos cortos y móvil es una decisión propia pendiente de prueba.

### Flujo obligatorio

1. Cada arma equipada tiene rango propio I–VII. Adquirirla da I; la primaria
   empieza en I. XP/nivel del jugador y rango del arma son estados distintos.
2. Una carta de mejora de familia aplica exclusivamente el siguiente rango
   de su tabla I–VII. La carta muestra su efecto y valores antes/después. Una
   mejora global, pasiva o del Laboratorio nunca aumenta rangos. No añadir un
   multiplicador genérico por rango encima de los valores de la tabla.
3. El contrato de contenido usa familia, rango de origen y rango de destino;
   validar transición de un solo paso. Aplicar la migración explícita de
   cartas antiguas en PROGRESION §4: sus efectos alimentan la secuencia y
   dejan de acumularse como un segundo sistema paralelo. Cada familia tiene
   seis transiciones legales; rerolls, vistas o cancelaciones no cuentan.
4. Al llegar a VII queda elegible. En una siguiente mano normal de tres cartas
   puede aparecer «Evolucionar [arma]». **No reemplazar automáticamente toda
   la mano por una pareja al alcanzar nivel global 7.**
5. Esa carta abre las dos ramas con «Volver». Todavía no consume el level-up.
   Confirmar una rama aplica una vez y consume esa oportunidad; Volver restaura
   exactamente la mano, semilla y recursos anteriores. No hay reroll dentro
   de la pareja. Elegir otra carta permite posponer la evolución.
6. Máximo una carta «Evolucionar» por mano. Si hay varias familias elegibles,
   rotarlas en orden de elegibilidad con desempate por adquisición; no dar
   siempre prioridad a Projectile. Reservar esa oferta en la siguiente mano
   mientras haya una familia elegible; posponer rota la prioridad.
7. Máximo tres armas; evolucionar ocupa el mismo slot. Exclusión mutua, una
   evolución por familia y acto. Respetar el reinicio/calibración entre actos:
   reconstruir rangos desde sus cartas realmente aplicadas, no heredar VII.
8. UI: mostrar rango y progreso en carta/arsenal. Antes de VII: «Evolución al
   rango VII». Las dos ramas dicen **qué cambia / dónde destaca / qué pierde**,
   no una lista de porcentajes. Confirmación táctil explícita, foco teclado,
   objetivos de 44 px y pausa/suspensión seguras.

No prometer tres armas evolucionadas en cuatro minutos. Medir primer rango
VII y primera evolución en partidas normales con inversión intencional; si
no se llega antes del boss, revisar disponibilidad de cartas primero y
presentar evidencia antes de cambiar el umbral. No aumentar XP silenciosamente.

## 3. Contratos comunes

- Conservar IDs actuales y slugs para URLs; los subtítulos pueden cambiar.
  Los comportamientos siguientes **sustituyen** las diez rutas antiguas, no
  se suman encima de ellas. No tocar la pareja Projectile aprobada.
- Conservar base de cada arma y mejoras adquiridas. Derivar parámetros de
  base + mejoras + rama, sin resetear alcance o cantidad al evolucionar.
- Todos los tiempos/distancias siguientes son semillas de prototipo en
  unidades lógicas, no balance aprobado. EX-02c sigue pendiente.
- Comparar cada rama con su misma arma VII, semilla, meta y duración. Objetivos
  del plan: +30–45% de contribución ideal; techos 1.6× DPS single y 2× cobertura.
  Medir daño, control y exposición por separado: no ocultar daño excesivo
  detrás de un promedio de utilidad.
- Para arrancar cada prototipo, distribuir el presupuesto de daño de un ciclo
  base VII entre sus eventos (pesos indicados). Estos pesos suman 1; los
  cooldowns parten del intervalo base y se alargan si el ciclo no cabe. Medir
  con las mejoras reales antes de cualquier aumento. No multiplicar el daño
  completo por tick, segmento, blade o explosión solapada.
- Colisiones usan la geometría física y barrido entre pasos, no solo la
  posición final. Ledger por cast/fase y `slot + generation` del enemigo;
  reutilizar un slot muerto no hereda inmunidad ni daño pendiente.
- Fuerzas aliadas nunca desplazan bosses. Para normales, cada desplazamiento
  inducido comprueba segmento contra disco de seguridad del player:
  `radioPlayer + radioEnemigo + 24`. Recortar antes de entrar; si ya está
  dentro, no atraer hacia el player. Esto no elimina la colisión normal ni
  impide que el jugador se acerque voluntariamente a enemigos.
- Fuerzas usan dt y límites; no teletransportan, ni atraviesan arena o nave.
  Render no elige targets, daño, trayectoria ni centro. Consultas espaciales
  cubren el radio efectivo de la evolución más el tamaño de los enemigos.
- Origen capturado y centro remoto son snapshots explícitos. Transformar
  local→world una sola vez. No reutilizar el centro de arena como origen.
- Límites por instancia de arma; sin listas que crecen, asignaciones por frame,
  shaders de pantalla completa ni filtros por objetivo. Boss/splits/muerte,
  pausa, restart y cambio de acto limpian todos los estados pendientes.

## 4. Parejas: especificación funcional y visual

Cada ficha define un prototipo completo. Una interpretación visual no puede
cambiar la mecánica. En las cinco parejas nuevas las cifras necesitan prueba.

### A. Projectile — conservar aprobación

`rail_lance`: disparo pesado perforante; `pulse_volley`: abanico de proyectiles.
Conservar daño, cadencia, curvas, anclas y presentación que el usuario probó.
Solo adaptar elegibilidad/UI, con regresión de comportamiento. No aprovechar
la migración para rediseñar estos assets o «mejorar» su balance.

### B. Orbit: emitir hacia afuera o peinar un corredor

#### Solar Crown / Corona de lanzamiento — `solar_crown`

> Corrección vigente: la evolución ya no usa la emisión espiral del prototipo.
> Al elegirse agrega tres cuchillas y fija la formación en seis cuchillas a
> radio 94u. Las seis permanecen orbitando a distancia constante y cada
> contacto real conserva el daño orbital; no hay salida, recuperación ni
> proyectil remoto.

- **Verbo histórico:** las cuchillas abandonaban la órbita en una emisión
  espiral escalonada. Ese prototipo queda reemplazado por la formación estable
  descrita arriba.
- Las cuchillas usan el ciclo orbital normal, máximo seis slots del pool y
  radio authored fijo de 94u. No se construye una órbita invisible ni se
  simula una línea de salida.
- Presupuesto: 100% contacto orbital repartido entre las seis cuchillas; el
  primer posicionamiento es visual y no daña desde una coordenada ficticia.
- Arte: seis alojamientos, filos marfil/lavanda y costura ámbar; la corona
  completa comunica cobertura constante sin dibujar un aro continuo dañino.
- Carta: «Añade tres cuchillas. Forma una corona estable de seis filos a
  distancia fija».
- Prueba decisiva: los seis slots permanecen activos y a 94u durante la
  rotación; un enemigo en la trayectoria recibe daño orbital real.

#### Graviton Halo / Órbita de avance — `graviton_halo`

- **Verbo:** la órbita se alarga en un eje que sigue el desplazamiento de la
  nave, formando dos alas que barren por delante y detrás. No atrae enemigos.
- Posiciones: elipse centrada en player; semieje largo `1.9 * radioOrbital`,
  corto `0.65 * radioOrbital`, ángulo orbital normal y cantidad adquirida ≤6.
  Orientar eje hacia último movimiento no nulo con giro máximo 2 rad/s;
  quieto conserva dirección, inicial hacia arriba. No usar puntero de móvil.
- El cambio de dirección barre posiciones reales; subdividir/barrer para no
  saltar enemigos. Daño orbital base repartido igual que antes, sin pulso extra.
- Ventaja: abrir paso al avanzar y alcanzar al perseguidor. Pérdida: flancos
  mucho más estrechos; no emite proyectiles ni protege todas las direcciones.
- Arte: filos de la familia, dos guías elípticas discontinuas muy tenues y
  estelas solo detrás de cada cuchilla; pivote de eje visible sin flecha gigante.
- Carta: «Tus cuchillas se alargan en la dirección de movimiento. Barre
  delante y detrás; deja tus flancos más abiertos».
- Prueba: cambiar de dirección modifica cobertura y daños; target lateral
  fuera del semieje corto no recibe daño por la guía decorativa.

### C. Chain: construir una trampa o detonar una concentración

#### Closed Circuit / Circuito tendido — `closed_circuit`

- **Verbo:** tres impactos levantan un triángulo eléctrico estacionario.
  La cadena inicial conserva sus targets adquiridos (cinco en VII); elegir
  hasta tres de esos impactos como nodos por búsquedas limitadas de la grid.
  Congelar sus posiciones al impacto: aunque mueran, los anclajes no persiguen.
- Impacto inicial y red de 0.9 s, con ticks cada 0.2 s. Solo los tres cables
  dañan (ancho físico 10), **no el interior completo**. Una unión de segmentos
  por tick y target evita triple daño en las esquinas.
- Un blanco: un enlace origen capturado→blanco, longitud máxima de alcance
  base; dos blancos: un enlace entre ellos. No inventar vértices fuera de arena
  ni repetir targets para simular triángulo. Máximo una red/3 nodos/3 segmentos.
- Presupuesto: 40% impacto, 60% red repartido entre ticks. No dispara una
  segunda red mientras la primera sigue activa.
- Ventaja: conducir perseguidores a cables ya tendidos. Pérdida: enemigos
  dispersos o que abandonan la red reducen utilidad; no requiere borde cargado.
- Arte: nodos metálicos pequeños, conectores cian/marfil y carga que viaja al
  cerrarse. Cable estable, no rayos aleatorios por frame; vacíos entre nodos
  legibles. No rellenar triángulo ni copiar las tres aspas giratorias de Prism.
- Carta: «Deja cables eléctricos entre impactos. Castiga enemigos que los
  cruzan; la trampa permanece donde nació».
- Prueba: target nuevo cruza cable y recibe tick; target en interior sin tocar
  cable no; target muerto/reutilizado no arrastra el nodo.

#### Thunderhead / Descarga diferida — `thunderhead`

- **Verbo:** dos impactos de la cadena siembran sobrecargas que explotan después.
  Mantener los cinco targets de la cadena base VII; solo dos reciben marca.
  Elegir hasta dos targets distintos de la cadena. Marca sigue target 0.2 s,
  congela posición; aviso final 0.15 s; explosión disco radio70 en ese punto.
  Si muere antes, usar última posición válida de esa generación.
- Máximo dos marcas/explosiones por cast. Explosiones no generan otras marcas.
  Daño de sus discos solapados se resuelve una vez por objetivo/cast.
- Presupuesto: 35% enlaces, 65% explosiones. Ventaja contra concentraciones;
  enemigo veloz puede salir tras bloqueo. No deja zona persistente.
- Arte: sello de tres pequeños capacitores sobre target, cierre de diamante
  al fijarse y golpe radial breve con dientes eléctricos. Conservar el disco
  real visible durante impacto; nada de una línea base simplemente más gruesa.
- Carta: «Sobrecarga dos blancos y detona a su alrededor. Premia grupos
  compactos; las explosiones se fijan antes de impactar».
- Prueba: objetivos secundarios reciben explosión real; uno que sale a tiempo
  no recibe daño; no aparece una cascada de nuevas explosiones.

### D. Boomerang: cruzar alas o detenerse lejos para cargar el regreso

#### Twin Comet / Cometas cruzados — `twin_comet`

- **Verbo:** dos piezas recorren alas curvas opuestas y cruzan sus regresos.
  Salida capturada, eje al target válido al lanzar (fallback dirección retenida).
  Para cada pieza usar curva cuadrática: salida `P`, control
  `P + forward*120 ± normal*100`, extremo `P + forward*250 ± normal*50`.
- Retorno captura posición de player al iniciarse, con control al lado opuesto.
  Después de la curva, captura final a velocidad limitada si player se movió;
  nunca salto al player. Máximo dos piezas por cast y un cast simultáneo.
- Ledger máximo un impacto por pieza/target/cast, presupuesto mitad por pieza.
  Ventaja flancos y cruce por movimiento; pérdida de concentración frontal.
- Arte: piezas gemelas con núcleo compartido y acentos distintos, estelas
  afiladas que explican curvas opuestas. Cruce no crea explosión ni daño falso.
- Carta: «Dos cometas barren tus flancos y cruzan al volver. Reposiciónate para
  alinear el regreso; cada pieza concentra menos daño».
- Prueba: curva y barrido reales en ambas piezas; sin daño adicional por
  superposición de trails, ni duplicación de hits en el cruce.

#### Singularity Return / Retorno de acreción — `singularity_return`

- **Verbo:** el boomerang se detiene en su extremo lejano, agrupa enemigos allí
  y vuelve cargado. El vórtice **nunca nace al recogerse sobre el player**.
- Salida base; extremo fijo, retención 0.65 s, radio de atracción100,
  velocidad máxima90 u/s. Frenar mediante seguridad de §3. Si el extremo queda
  demasiado cerca de player (`< radioPlayer + 100 + 24`), omitir atracción,
  mantener carga/retorno; no cancelar el arma ni trasladar el punto de golpe.
- Capturar dirección hacia player al acabar carga, retorno perforante con
  captura final limitada. Boss recibe daño pero no movimiento. Una pieza y
  un vórtice remoto. Carga garantizada por tiempo, no por cantidad de víctimas.
- Presupuesto: 30% ida, 70% retorno; vórtice controla sin daño extra. Un impacto
  por fase/target. Intervalo mayor por tiempo detenido, no mayor entidad.
- Arte: pieza se abre en dos mordazas alrededor de núcleo remoto; filamentos
  cortos convergen ahí; cierre súbito comprime su núcleo y libera retorno
  ancho/afilado. Al recogerse: destello mínimo sin aro de daño.
- Carta: «Agrupa enemigos en el extremo del lanzamiento y atraviesa el grupo
  al regresar. Tarda más en volver; no atrae enemigos hacia tu nave».
- Prueba: player puede moverse junto al extremo sin ser atravesado por fuerzas;
  ningún pulso al recoger; enemigo intermedio recibe retorno real.

### E. Pulse Ring: regresar por un corredor o abrir un frente

#### Echo Shock / Eco de retorno — `echo_shock`

- **Verbo:** una cresta larga sale del origen capturado y vuelve por el mismo
  corredor. No sigue al player, no crea un segundo emisor y no requiere apuntado.
- Alcanza al menos 280u; cada objetivo puede recibir un impacto completo en ida
  y otro en vuelta. Un solo cast, dos cruces, sin desplazamiento ni atracción.
- Ventaja: duplica el daño en una ruta legible y castiga al grupo que permanece
  en ella. Pérdida: no abre espacio ni cubre el nuevo lugar del jugador.
- Arte: la vuelta reutiliza la cresta violeta/ámbar, invierte su recorrido y
  contrae sus segmentos hacia el núcleo; nunca dibuja otro centro ni una línea
  dañina ajena a la banda física.
- Carta: «Una onda de largo alcance regresa a tu nave. Ida y vuelta golpean;
  no empuja enemigos».
- Prueba: un objetivo a 240u recibe dos impactos y no se mueve; mover al player
  durante el cast no cambia el origen ni crea otra zona de daño.

#### Compression Wave / Ariete de presión — `compression_wave`

- **Verbo:** convertir el aro completo en un frente direccional que abre paso.
  Orientación último movimiento, fallback arriba; mostrarla durante carga base
  y fijar eje 0.15 s antes del disparo. Sin apuntado extra ni target requerido.
- Frente de arco de 110°, espesor28, radio desde30 hasta320 en0.28 s, alrededor
  del origen capturado. Repetir tres veces, separadas por0.10 s. Cada frente
  puede golpear una vez al mismo objetivo y lo empuja radialmente tres veces el
  empuje base de su rango; bosses reciben daño sin desplazamiento. **Cero atracción**.
- Presupuesto 100% frente. Ventaja alcance y corredor despejado; pérdida total
  de cobertura trasera. El interior ya barrido no sigue haciendo daño entre
  frentes, por lo que las tres bandas son legibles y no un DOT oculto.
- Arte: dos mordazas en V cargan frente a nave, cavidad oscura, cresta gruesa
  marfil/violeta y puntas ámbar; estela corta que desvanece hacia atrás.
  No renderizar círculo completo, cono relleno sólido ni indicador hasta borde.
- Carta: «Tres ondas frontales rápidas empujan con fuerza triple y abren camino.
  Llegan más lejos; no golpean detrás de ti».
- Prueba: un enemigo a200u delante recibe tres impactos y se aleja en cada uno;
  otro detrás no recibe daño; sin atracción en ninguna fase.

### F. Magnetic: sostener un núcleo remoto o cerrar una trampa geométrica

Ambas conservan lanzamiento desde boca/nave a punto aleatorio lejano válido,
con semilla y aunque no haya enemigos. No se vuelven armas homing. Sin daño
aliado a player. El contrato de banda con centro vacío sigue en el arma base;
estas ramas cambian expresamente sus zonas de daño.

#### Event Horizon / Núcleo de acreción — `event_horizon`

- **Verbo:** mantener un pozo remoto que captura, daña progresivamente y deja
  lentos a los supervivientes. Viaje base; sostener3.4s con atracción radio210
  a145u/s. Centro disco radio64 daña14% cada0.2s. Al cierre no hay explosión.
- Un pozo. Todo el daño pertenece a ticks del núcleo; no mantener banda base,
  centro sin daño ni golpe final. Cadencia no solapa pozos.
- Ventaja: retener una concentración y dañarla en su destino. Pérdida: zona
  inmóvil pequeña, tarda en concentrar daño; enemigos fuera no reciben nada.
- Arte: cápsula abre tres placas orientadas al centro, filamentos finitos de
  acreción, cavidad oscura con núcleo luminoso de daño claramente visible;
  el radio de atracción lleva solo motas, el de daño tiene cresta definida.
  Al cierre las placas se apagan hacia dentro y dejan una estela fría en cada
  superviviente ralentizado, sin destello explosivo ni relleno de pantalla.
- Carta: «Deja un núcleo que atrae y daña a los enemigos concentrados en él.
  Control duradero; al salir, los supervivientes quedan lentos».
- Prueba: enemigo en el centro pierde vida durante todo el sostén y al salir
  conserva ralentización; fuera del64 recibe arrastre pero nunca ticks ni slow.

#### Polar Collapse / Prensa polar — `polar_collapse`

- **Verbo:** la bomba abre tres satélites, atrae con seguridad a los enemigos
  hacia su destino remoto y tres frentes convergen hacia el centro. Viaje base,
  atracción0.55s a230u/s, apertura visual hacia vértices de un triángulo radio90
  y frentes durante0.45s; el núcleo final permanece0.42s, recuperación base.
- Los frentes son tres segmentos finitos de ancho24; extremos interpolan de
  vértices originales al centro. Barrer su desplazamiento. En el instante
  degenerado no dibujar segmentos de longitud cero; usar disco final.
- Máximo tres satélites, tres segmentos y un centro por cast. Un hit de frentes
  por enemigo aplica60% y aturde1.1s; una única implosión final aplica140% a
  los aturdidos que sigan en el núcleo o45% a objetivos no preparados. El
  control no afecta bosses.
- Elegir centro lejano con margen para triángulo completo usando ArenaBoundary;
  intentos limitados (8), luego reducir uniformemente radio hasta caber. Si
  no cabe radio32, usar solo final de55 recortado al área disponible, sin
  ampliar daño. No clamp independiente de vértices que deforme colisión/arte.
- Ventaja: concentrar enemigos en un destino remoto, inmovilizarlos y rematarlos
  con una implosión severa; pérdida: perder los filos o salir del núcleo reduce
  el remate y el centro debe estar dentro del área.
- Arte: cápsula se divide en tres polos angulares cian/lavanda/ámbar, cables
  tenues de preparación; al activar aparecen tres filos materiales que cierran
  una prensa. Desvanecer detrás, punta sólida delante. Centro explota en gema
  compacta, no una segunda banda igual a Magnetic base.
- Carta: «Tres filos arrastran y aturden; la implosión final castiga al objetivo
  preparado. Golpe remoto de alto daño».
- Prueba: tres frentes físicos coinciden con lo visible; target alcanzado por
  un filo queda aturdido y recibe el remate140%; sin filo sólo recibe45%;
  funciona sin enemigos y en hexágono/cuadrado.

## 5. Procedimiento visual premium para Luna

Leer completas las skills gameplay, rendering, SVG, mobile-performance y
validation y las referencias pertinentes antes de implementar una pareja.
Fuentes visuales canónicas: [efectos](EFECTOS_PREMIUM.md),
[órbita](ORBITA_PREMIUM.md), [cadena](CHAIN_FX_PREMIUM.md),
[Pulse Ring](PULSE_RING_WEAPON_FX_PREMIUM.md),
[Magnetic](MAGNETIC_CHARGE_WEAPON_FX_PREMIUM.md),
[UI](../../skills/geometry-survivor-svg/references/ui-art-direction.md),
[proyectiles](../../skills/geometry-survivor-svg/references/projectile-direction.md).

1. Capturar referencia actual aprobada de familia, láser premium y UI. Reutilizar
   materiales, proporción de energía y anclas; no copiar una silueta de otra arma.
2. Dibujar storyboard **carga / ataque / recuperación**, con origen, zona de
   daño y zona decorativa etiquetadas. Mostrar también resultado en tamaño real.
   Una captura gigante no demuestra calidad en móvil.
3. Construir primero silueta y colisión: underlay oscuro, cuerpo cromático,
   núcleo marfil acotado, acentos mínimos. Energía concentrada, no rellenos
   translúcidos que oculten enemigos. Puntas y colas afinadas; nunca rectángulos
   planos que terminan abruptamente ni ruido regenerado cada frame.
4. SVG para piezas rígidas cacheadas; Graphics preconstruido para frentes y
   geometría variable. PNG/imagegen solo si existe necesidad justificada de
   textura: estas diez rutas no requieren generar bitmaps ni nuevas dependencias.
5. Geometría local alrededor de `(0,0)` y frame compartido para piezas.
   Cada arco independiente usa `beginPath`/`moveTo` apropiado. Separar origen,
   elevación visual y punto físico para no repetir desfases de bomba/orbiter.
6. Low conserva todos los frentes, nodos, blades, núcleos dañinos, fases y
   direcciones. Quitar únicamente estelas secundarias/motas. Med/High añaden
   acabado, nunca más información necesaria para jugar.
7. Presupuesto inicial por familia: ≤24 display objects persistentes en Low,
   ≤40 en High, incluyendo piezas y trails; cero nuevas partículas por víctima.
   Es un techo de implementación, **no una medición ni garantía de rendimiento**.
   Perfilar coste incremental contra base; si se supera, reducir decoración
   antes de ampliar presupuesto. No ocultar coste trasladándolo a otro pool.
8. Icono de carta muestra el verbo (espiral, elipse, circuito, sobrecarga,
   cruce, núcleo remoto, dos centros, frente, pozo, prensa), no el mismo icono
   recoloreado. Reutilizar el marco UI aprobado y texto HTML, sin rediseñar UI.
9. Entregar comparativa base/A/B en Low/High y clip de un ciclo completo. El
   usuario debe poder decir qué cambió tras dos ciclos sin leer debug.

## 6. Integración acotada

- `WeaponEvolutionDefinitions`: mantener identidad/slugs; configurar parámetros
  y textos v2. Nada de dos versiones activas acumulando efectos por flags.
- `UpgradeDefinitions`, `UpgradeApplier`, `LevelProgression`: rango por familia,
  elegibilidad y selección atómica. Tests de inversión, exclusión, consumo y
  vuelta al menú. Inventario obligatorio de cartas en R1 antes de migración.
- `CombatWeaponSystem` y behaviors existentes: fases y daños puros. Extender
  cada familia donde se usa; no inventar motor genérico de evoluciones.
- `CombatRenderState`, pools y `WeaponView`: snapshot de fase, evolución,
  castId/generation, origen/destinos/radios cuando haga falta. La vista consume,
  no reconstruye targeting desde posiciones actuales. Extraer vista pequeña
  de familia solo si reduce complejidad con consumidor actual.
- `Game`/`main`: laboratorio explícito y aislado. No modificar inventario
  persistente, NOVA, desbloqueos ni progreso normal desde rutas de desarrollo.
- Revisar sin pérdida el worktree existente. No resetear la entrega EX-08d;
  tests y documentación son evidencia histórica, no autorización de arte v2.

## 7. Ruta de prueba arma por arma

La prueba autorizada por el usuario se realiza como una partida normal enfocada
en una sola familia. Las seis entradas disponibles son:

`/?weapon-path=projectile&debug=1&quality=low|medium|high`

`/?weapon-path=orbit|chain|boomerang|pulse-ring|magnetic-charge&debug=1&quality=low|medium|high`

La ruta no usa `scenario=single|mass`, no desactiva el director ni concede XP.
Empieza con Projectile en I; los level-ups muestran únicamente la carta del
siguiente rango hasta VI. El nivel 7 del jugador no entrega una mejora de
estadística: muestra una sola carta hito `Evolucion disponible`. Al elegirla se
abre la pareja Rail Lance/Pulse Volley sin consumir todavía la subida. La
pareja incluye `Volver`; confirmar una rama consume esa oportunidad y
continuar vuelve a la selección normal. El rango VII queda reservado para la
integración normal futura y no aparece en esta ruta de prueba. El panel debug
muestra `mode: weapon-path-projectile`, rango y paso. El flujo es temporal de
desarrollo, no aparece en el menú ni altera el guardado. Las cinco familias
restantes reutilizan este mismo patrón y ya están conectadas al código; la
validación humana puede ejecutarse ahora familia por familia.

Para validar Projectile, registrar I, II, III, IV, VI, la carta hito, Rail
Lance y Pulse Volley por separado. Comprobar que cada carta se muestra una sola
vez, que se juega con enemigos/hazards normales, que el disparo cambia en cada
rango y que la evolución conserva el perfil de cierre. No usar una URL de evolución directa
como sustituto de esta prueba: esa entrada sigue siendo el laboratorio aislado
histórico.

## 8. Laboratorio comparativo

Conservar entradas `?evolution=<slug>&scenario=single|mass&debug=1`.
No prometer escenarios nuevos como si existieran: implementar lo siguiente en R1:

- Selector base VII / A / B con misma semilla, mejoras y estado reiniciado.
  `single`: boss inmóvil y boss móvil como casos separados.
- `mass`: 56 enemigos para cobertura; además un escenario `pressure` con
  perseguidores móviles y colisión real, reposición acotada al morir y vida
  suficiente para observar control. No todos inmortales en la prueba de bajas.
- Aislamiento real: desactivar scheduler de primaria al probar otra familia;
  nada de daño «cero» que aún aplique críticos, lifesteal o control. Sin hazards,
  jefe, otras armas ni meta. Verificar también rutas con acto Angular para que
  las condiciones del acto no reactiven amenazas durante el laboratorio.
- Prueba separada `combined`: máximo tres armas reales + hazards del Acto II;
  no combinar parámetros contradictorios de drills silenciosamente. Mostrar
  acto, semilla, escenario, familia, rango y calidad actuales.
- Registrar por arma daño efectivo (sin overkill), hits, bajas, targets únicos,
  tiempo de control, contactos player y máximos de entidades/FX. Si una métrica
  no se implementó, marcarla no medida. No concluir utilidad por conteo de sprites.
- Las rutas actuales sin acto explícito no garantizan Acto II. Documentar URL
  verificada en código para cada entrega; no inventar parámetros en la respuesta.

## 8.1 Cartas post-evolución — contrato vigente — 15-09-2026

Esta capa se aplica a los tres actos de campaña. El modo infinito tendrá una
política de ofertas separada y no heredará silenciosamente el límite de tres
armas. La evolución sigue siendo el momento de elegir una rama; las cartas
post-evolución son maestrías del arma ya transformada y no crean una tercera
rama.

### Diferencia entre Evolucionar y Maestría

- `Evolucionar [arma]` solo aparece cuando una familia llega a VII. Al
  seleccionarla se abre la pantalla de sus dos ramas exclusivas y `Volver`.
  Confirmar una rama consume la subida.
- `Potencia calibrada` **no abre esa pantalla** y nunca vuelve a mostrar las
  dos evoluciones. Al seleccionarla abre una selección breve de las armas ya
  evolucionadas que pueden recibirla; el jugador elige explícitamente una y
  después la carta se consume.
- `Potencia calibrada` solo es elegible cuando las tres armas activas de la
  campaña están evolucionadas. Si todavía falta una evolución, no entra en el
  pool ni aparece como carta bloqueada.
- Las maestrías específicas de una familia sí pueden aparecer desde la mano
  posterior a su evolución. No deben esperar a que las otras dos armas
  evolucionen.

### Rareza y presentación

`Potencia calibrada` es una carta rara de maestría universal, no una carta
normal de rotación. Su primera configuración de prueba usa como límites una
aparición máxima cada tres manos normales y hasta tres aplicaciones por run;
los números se podrán recalibrar después de EX-02c sin cambiar el contrato.
La rareza no depende de anuncios, NOVA ni de una probabilidad sin límite.

El límite de tres es de estado real, no solo una intención de composición. La
carta no puede entrar sin al menos un objetivo de Potencia válido, y el reroll
queda bloqueado durante la selección de objetivo para no convertirla en una
cuarta mano gratis. El selector muestra el preview numérico antes → después del
canal elegido.

La carta debe diferenciarse visualmente de una evolución:

- etiqueta `MAESTRÍA UNIVERSAL` y marco de rareza propio, ámbar/iridiscente;
- emblema de tres núcleos conectados, no el icono de una rama de evolución;
- animación corta de calibración al abrir la selección de arma;
- comparación antes → después del arma elegida;
- Low conserva etiqueta, silueta, color de rareza y selección táctil sin
  partículas costosas; High añade pulso y destello acotados desde los pools
  existentes.

No usar glow permanente, shader de pantalla completa ni una textura nueva por
arma. La rareza debe comunicar valor y disponibilidad, no tapar el combate.

### Maestrías compartidas por las dos ramas

Cada familia evolucionada expone tres canales de maestría. El resolver aplica
el modificador a todas las fuentes de daño o tiempo de esa familia, conservando
la diferencia de la rama. La fórmula conceptual es:

```text
daño efectivo = daño de la rama × modificador de Potencia
tiempo efectivo = tiempo de la rama × modificador de Ritmo
cobertura efectiva = geometría de la rama + modificador de Cobertura
```

| Familia | Potencia | Ritmo | Cobertura / identidad compartida |
|---|---|---|---|
| Projectile | Carga calibrada: daño de cada proyectil | Ciclo de fuego: menor intervalo | Balística extendida: velocidad y alcance útil |
| Orbit | Filos resonantes: daño de hojas y pulsos | Impulso angular: giro o frecuencia | Campo de contacto: ancho de impacto; Solar conserva radio fijo |
| Chain | Núcleo de descarga: daño de enlaces/explosiones | Recarga conductiva: menor intervalo | Red ampliada: salto, alcance o capacidad de conexión |
| Boomerang | Filos vectoriales: daño de ida, regreso y pulso | Retorno cinético: regreso y relanzamiento | Arco amplio: alcance o radio de impacto |
| Pulse Ring | Cresta energética: daño de ondas | Resonancia acelerada: carga/recuperación | Frente expandido: alcance y ancho sin cambiar el verbo |
| Magnetic Charge | Núcleo de flujo: daño de núcleo, frentes y pulsos | Recarga magnética: cadencia o persistencia | Envolvente magnética: captación/detonación con freno seguro |

Las tres maestrías benefician a las dos ramas de su familia, pero no pueden
borrar su identidad: Rail Lance sigue perforando, Pulse Volley sigue usando
abanico, Solar Crown mantiene seis filos, Compression conserva su frente y
Polar conserva sus frentes convergentes. La potencia no se implementa como una
carta de daño exclusiva del rayo.

### Composición después de evolucionar

1. Después de una evolución, la siguiente mano puede reservar una maestría de
   esa familia; las cartas de rango base de esa familia se retiran.
2. Mientras existan armas no evolucionadas, una mano conserva como máximo una
   maestría, una mejora de otra familia o rango válido y una pasiva/sinergia.
3. Al tener tres armas evolucionadas, `Potencia calibrada` puede ocupar una de
   las tres opciones según su enfriamiento de rareza. Las otras dos opciones
   siguen siendo maestrías específicas, pasivas o sinergias válidas.
4. La selección de `Potencia calibrada` muestra solo armas evolucionadas que no
   alcanzaron su límite de calibración. No ofrece cartas muertas ni permite
   elegir un arma no evolucionada.
5. Si todas las maestrías de todas las armas están al límite, la campaña ofrece
   únicamente sinergias y mejoras globales válidas. Un futuro `Limit Break`
   pertenece al modo infinito y no se agrega a los actos por anticipado.
6. La mano normal se compone solo de pools authored: nunca se rellena desde el
   catálogo legacy completo. Reserva/rota una evolución o rango pendiente para
   que una familia elegible no desaparezca indefinidamente entre pasivas.

### Requisitos de implementación y prueba

- La política de campaña está confinada en el compositor de `UpgradeApplier`;
  cuando se construya infinito deberá extraerse como `EndlessOfferPolicy`
  separada, sin heredar este cap ni alterar los actos.
- Registrar por familia: rango, rama elegida, maestrías aplicadas y límite de
  rareza de `Potencia calibrada`.
- Aplicar las maestrías en simulación; la UI solo muestra el preview y emite
  la selección del arma objetivo.
- Probar ambas ramas de las seis familias con cada canal de maestría, preview
  antes → después, exclusión mutua, pausa, reroll y reinicio.
- Verificar que la carta universal no aparezca con dos o menos armas
  evolucionadas y que, con tres, nunca deje una mano sin tres opciones válidas.
- Comparar base evolucionada y maestría con la misma semilla a 30/60/144 Hz.
  No fijar porcentajes finales hasta cerrar EX-02c.

## 9. Orden de entregas y puertas

| Paso | Alcance | Condición para avanzar |
| --- | --- | --- |
| R0 | Este plan y registro del rechazo | Documentación solamente; completado |
| R1 | Ruta normal enfocada, tablas I–VII, migración de cartas/calibración y selección | Projectile probado rango por rango; después inventario normal |
| R2 | Pulse Ring: Echo + Ariete | Prueba humana de dos centros y frente útil sin atraer |
| R3 | Magnetic: Núcleo + Prensa | Daño en centro visible y cierre geométrico distinto |
| R4 | Boomerang: Cometas + Retorno | Cruces físicos y retención lejos de nave segura |
| R5 | Orbit: Corona + Órbita de avance | Coberturas distintas observables y sin hits fantasma |
| R6 | Chain: Circuito + Sobrecarga | Trampa de cruce frente a explosión diferida real |
| R7 | Integración de tres armas / Acto II | Sinergias, caps, claridad y perfil PC/móvil |

Dentro de cada pareja: primero A lógica/tests + visual; después B; entregar
ambas URLs y base para comparar. No saltar al paso siguiente hasta la respuesta
humana. Si una rama se rechaza, revisar su verbo antes de aumentar brillo/daño.

### Tests obligatorios por entrega

- Fases, targeting vacío, enemigo muerto/reutilizado, colisión barrida a
  30/60/144 Hz, daño por fase/target y límites bajo cadencia máxima.
- Fuerzas con player quieto, persiguiendo, cruzando centro remoto y junto al
  borde; bosses inmóviles a fuerzas; cambios de arena sin desalineación.
- Pausa, suspensión, reset, muerte, cambio de acto y máximos de tres armas.
- Browser comprueba resultado de mecánica y selección, no únicamente texto
   «evolución activa»; screenshot/clip revisado a tamaño de juego Low/High.
- Primera prueba humana breve: base/A/B, aislada y bajo presión. Preguntar:
  ¿explicas la diferencia?, ¿cuándo elegirías cada una?, ¿te hizo daño un
  enemigo acercado artificialmente?, ¿ves el área real?, ¿hay una opción
  siempre superior? No exigir ahora otras diez runs para aceptar un prototipo.
- Stress y run completa en Acto II tras aceptar la pareja; usar PC y S25 como
  evidencia de esos dispositivos, no certificación de gama baja. Balance final
  de enemigos/daño sigue diferido. La aprobación humana de las seis parejas ya
  está registrada; cualquier cambio posterior requiere una nueva validación.

## 10. Instrucción de arranque para el siguiente agente

Leer CONTINUACION → plan §16.4–16.5 y §22.1r → este documento → skills.
Empezar por cualquier ruta `weapon-path` de la lista anterior y probar los seis
rangos base I→VI, después el hito y ambas evoluciones. Las seis parejas tienen
aprobación humana vigente; cualquier ajuste de sus verbos, daño o presentación
debe conservar este contrato y solicitar una nueva validación. No modificar el
balance global de enemigos durante esta revisión.
