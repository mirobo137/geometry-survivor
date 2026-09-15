# EX-08-R — Evoluciones con decisiones reales

Fecha: 2026-09-14. Estado: **especificación para implementar y probar, no implementada ni aprobada visualmente**.

Ampliación vigente: [PROGRESION_ARMAS_V2.md](PROGRESION_ARMAS_V2.md) define
las 42 filas I–VII, cartas, calibraciones y herencia de estadísticas al
evolucionar. Sus fórmulas de herencia prevalecen sobre los valores fijos de
prototipo en §4. Los rangos tienen ahora una secuencia fija por familia.

## 1. Mandato y diagnóstico

El usuario aprueba Rail Lance y Pulse Volley por cambiar realmente el disparo.
Solar Crown y Event Horizon no comunican su utilidad; Compression Wave y
Singularity Return atraen enemigos peligrosamente cerca; Polar Collapse no
aporta una diferencia útil. Las otras cinco rutas tampoco tienen aprobación
humana explícita. Conservar la pareja Projectile; rediseñar las otras diez.
No confundir «tests pasan» con «la evolución es divertida».

Esta entrega solamente modifica documentación. Luna debe implementar por
parejas, detenerse para su prueba humana y conservar una comparación con el
arma base. No ejecutar otra vez todo el lote sin revisión.

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

- **Verbo:** las cuchillas abandonan la órbita en una emisión espiral escalonada.
  Permite alcanzar grupos alejados, perdiendo cobertura próxima durante la salida.
- Ciclo inicial: 1.8 s orbitando; preparación 0.25 s; salida una por una cada
  0.08 s. Capturar origen en la preparación. Durante 0.7 s cada blade sigue
  `r = lerp(radioOrbital, radioOrbital + 150, t)` y
  `ángulo = ánguloSalida + sentido * 1.4 * t`. Trayectoria en simulación.
- Al terminar se desactiva el blade; reaparece cerca de la nave tras una
  recuperación común de 0.3 s. **No daña por el salto de reconstrucción**.
  No añadir blades: usar cantidad adquirida, máximo seis.
- Presupuesto: 40% fase orbital, 60% emisión repartida entre blades; ledger
  limita golpes de salida por target/cast. Intervalo de emisión independiente
  del frame rate. No conservar órbita invisible dañina mientras está vacía.
- Arte: seis alojamientos según cantidad real, filos marfil/lavanda, costura
  ámbar que se carga; salida como comas espirales afiladas con cola corta que
  desvanece. Núcleo de órbita queda visualmente abierto al perder sus piezas.
  Nada de un aro continuo que sugiera daño donde no pasan cuchillas.
- Carta: «Lanza tus cuchillas en espiral. Alcanza grupos lejanos; durante la
  descarga pierdes protección cercana».
- Prueba decisiva: enemigo fuera del radio orbital recibe un blade real;
  enemigo próximo no recibe hits fantasma de blades ya lanzados.

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

### E. Pulse Ring: sembrar dos posiciones o abrir un frente

#### Echo Shock / Eco de desplazamiento — `echo_shock`

- **Verbo:** una onda nace en posición A y otra sigue tu desplazamiento hasta B.
  Capturar A al primer disparo; 0.45 s después capturar B = posición actual.
  Anunciar segundo emisor mediante dos pequeñas marcas junto a la nave hasta
  fijarse B. Después ambas ondas permanecen ancladas a sus propios orígenes.
- Cada onda usa expansión/barrido base; máximo dos ondas y un cast activo.
  Presupuesto 60% A, 40% B. Un hit por onda/target y tope total por cast.
  No exigir distancia mínima, quieto repite en A sin bonus oculto.
- Ventaja: cubrir dos lugares mientras esquivas. Pérdida: menos golpe inicial,
  duplicar espacio exige moverse; no atrae ni añade inmunidad.
- Arte: primera cresta violeta/ámbar; segundo núcleo con doble muesca y eco
  más fino de igual borde físico. Mostrar identidad compartida sin una línea
  dañina entre A y B. Nunca color/cúpula del escudo ni hazard enemigo.
- Carta: «Una segunda onda nace donde estés un instante después. Muévete para
  cubrir dos zonas; el primer impacto concentra menos fuerza».
- Prueba: al moverse >100 u se ven y dañan dos centros diferentes; no arrastrar A
  con player; movimiento durante pausa no cambia la posición simulada.

#### Compression Wave / Ariete de presión — `compression_wave`

- **Verbo:** convertir el aro completo en un frente direccional que abre paso.
  Orientación último movimiento, fallback arriba; mostrarla durante carga base
  y fijar eje 0.15 s antes del disparo. Sin apuntado extra ni target requerido.
- Frente de arco de 110°, espesor28, radio desde30 hasta280 en0.55 s, alrededor
  del origen capturado. Un hit/target/cast y empuje radial saliente máximo26 u
  limitado por arena; bosses reciben daño sin desplazamiento. **Cero atracción**.
- Presupuesto 100% frente. Ventaja alcance y corredor despejado; pérdida total
  de cobertura trasera. El interior ya barrido no sigue haciendo daño.
- Arte: dos mordazas en V cargan frente a nave, cavidad oscura, cresta gruesa
  marfil/violeta y puntas ámbar; estela corta que desvanece hacia atrás.
  No renderizar círculo completo, cono relleno sólido ni indicador hasta borde.
- Carta: «Proyecta una onda frontal que empuja y abre camino. Llega más lejos;
  no golpea detrás de ti».
- Prueba: daña un enemigo a200 u delante y no otro detrás; trayectoria inducida
  aumenta separación de nave; sin atracción en ninguna fase.

### F. Magnetic: sostener un núcleo remoto o cerrar una trampa geométrica

Ambas conservan lanzamiento desde boca/nave a punto aleatorio lejano válido,
con semilla y aunque no haya enemigos. No se vuelven armas homing. Sin daño
aliado a player. El contrato de banda con centro vacío sigue en el arma base;
estas ramas cambian expresamente sus zonas de daño.

#### Event Horizon / Núcleo de acreción — `event_horizon`

- **Verbo:** mantener un pozo remoto con centro dañino, seguido de implosión.
  Viaje base; apertura0.25 s; sostener1.6 s con atracción radio180 y velocidad
  máxima110 u/s. Centro disco radio64 daña cada0.25 s. Cierre0.2 s y golpe
  final en disco radio110. Seguridad de §3 siempre activa.
- Un pozo. Presupuesto 65% repartido entre ticks del núcleo,35% golpe final.
  No mantener banda base adicional ni centro sin daño. Cadencia no solapa pozos.
- Ventaja: retener una concentración y dañarla en su destino. Pérdida: zona
  inmóvil pequeña, tarda en concentrar daño; enemigos fuera no reciben nada.
- Arte: cápsula abre tres placas orientadas al centro, filamentos finitos de
  acreción, cavidad oscura con núcleo luminoso de daño claramente visible;
  el radio de atracción lleva solo motas, el de daño tiene cresta definida.
  Implosión contrae placas y produce destello breve en disco final, sin cubrir
  pantalla con relleno. Un núcleo oscuro no debe confundirse con zona sin efecto.
- Carta: «Deja un núcleo que atrae y daña a los enemigos concentrados en él.
  Control duradero; el daño tarda y permanece en una zona fija».
- Prueba: enemigo en el centro pierde vida durante sostén; fuera del64 recibe
  control pero no ticks; golpe final respeta110, incluidas colisiones de borde.

#### Polar Collapse / Prensa polar — `polar_collapse`

- **Verbo:** la bomba abre tres satélites y tres frentes convergen hacia su centro.
  Sin atracción de enemigos. Viaje base, apertura0.3 s hacia vértices de un
  triángulo radio90; aviso0.25 s; cada lado avanza paralelamente al centro
  durante0.45 s; explosión final disco radio55, recuperación0.25 s.
- Los frentes son tres segmentos finitos de ancho18; extremos interpolan de
  vértices originales al centro. Barrer su desplazamiento. En el instante
  degenerado no dibujar segmentos de longitud cero; usar disco final.
- Máximo tres satélites, tres segmentos y un centro por cast. Un hit combinado
  de frentes por enemigo, más un final; presupuesto60% frentes,40% centro.
- Elegir centro lejano con margen para triángulo completo usando ArenaBoundary;
  intentos limitados (8), luego reducir uniformemente radio hasta caber. Si
  no cabe radio32, usar solo final de55 recortado al área disponible, sin
  ampliar daño. No clamp independiente de vértices que deforme colisión/arte.
- Ventaja: daño concentrado y barrido remoto sin acercar enemigos al jugador;
  pérdida: puede fallar al salir del área durante preparación, sin control.
- Arte: cápsula se divide en tres polos angulares cian/lavanda/ámbar, cables
  tenues de preparación; al activar aparecen tres filos materiales que cierran
  una prensa. Desvanecer detrás, punta sólida delante. Centro explota en gema
  compacta, no una segunda banda igual a Magnetic base.
- Carta: «Despliega tres polos que cierran una trampa explosiva. Golpe remoto
  rápido; no retiene a los enemigos que escapan».
- Prueba: tres frentes físicos coinciden con lo visible; target alcanzado por
  dos frentes no duplica daño; funciona sin enemigos y en hexágono/cuadrado.

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

## 7. Laboratorio antes de cambiar armas

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

## 8. Orden de entregas y puertas

| Paso | Alcance | Condición para avanzar |
| --- | --- | --- |
| R0 | Este plan y registro del rechazo | Documentación solamente; completado |
| R1 | Laboratorio, tablas I–VII, migración de cartas/calibración y selección | Tests de aislamiento, perfiles y UI; conservar mecánicas de evoluciones Projectile |
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
  de enemigos/daño sigue diferido. Automatización no cierra aprobación humana.

## 9. Instrucción de arranque para el siguiente agente

Leer CONTINUACION → plan §16.4–16.5 y §22.1r → este documento → skills.
Empezar **R1**, aplicar [PROGRESION_ARMAS_V2.md](PROGRESION_ARMAS_V2.md),
enseñar rangos/cartas y verificar laboratorio. Incluye nueva progresión base
Projectile; conserva comportamiento y arte de sus dos evoluciones aprobadas.
Después implementar únicamente **R2** y entregar accesos comprobados para
base/Echo/Ariete, individual y presión. Resumir qué funciona, qué se midió y
qué falta probar. No presentar los diez diseños de esta especificación como
features que ya existen. Conservar aprobación de Projectile y pedir aprobación
de cada nueva pareja sobre gameplay y presentación reales.
