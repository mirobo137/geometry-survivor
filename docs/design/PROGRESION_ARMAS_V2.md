# EX-08-R1 — Progresión de armas I–VII y cartas

Fecha: 2026-09-14. Estado: **las seis rutas de prueba y el compositor normal
de campaña están implementados; la validación humana de la nueva rotación
queda pendiente**. Complementa
[EVOLUCIONES_V2.md](EVOLUCIONES_V2.md).

Las rutas activas son `/?weapon-path=projectile|orbit|chain|boomerang|pulse-ring|magnetic-charge&debug=1&quality=low|medium|high`.
Arranca una partida real con el director normal, sin escenario aislado ni
bonificaciones de XP. Cada level-up muestra una sola carta del siguiente rango
Projectile. En el nivel 7 del jugador, después de aplicar VI, aparece una sola
carta hito `Evolucion disponible`; al elegirla se abre la pareja Rail
Lance/Pulse Volley con `Volver`, sin consumir la subida hasta confirmar una
rama. El rango VII queda reservado en esta ruta de desarrollo, pero ya se
ofrece en la campaña normal de los tres actos. La ruta no se ofrece desde el menú
ni escribe una build especial en el guardado.

## 1. Decisión de diseño

Cada familia tiene una secuencia fija de siete rangos. Adquirir da I; elegir
su carta de mejora aplica el siguiente rango y cuesta una oportunidad normal.
El VII también mejora el arma; después habilita la carta de evolución en una
mano posterior. El jugador decide qué arma desarrollar y qué pasivas sacrifica
por ello. Cada carta muestra su próximo cambio concreto.

Esta especificación sustituye la propuesta inicial de contar libremente stacks
de cartas distintas como rangos. Una secuencia fija permite comparar dos armas
VII idénticas y evita llegar a VII solo repitiendo daño. Las cartas antiguas
se adaptan según §4; no se mantienen dos progresiones acumuladas en campaña.

Los números siguientes parten de `WeaponDefinitions.ts` y constituyen una
primera configuración de prueba. No son resultados medidos. Cada tabla muestra
el **nuevo valor absoluto**; los campos no citados conservan el rango anterior.
Aplicar el daño de cada rango una sola vez. Los bonus del Laboratorio y las
pasivas se calculan después desde sus fuentes actuales, sin aumentar rangos.

## 2. Análisis de viabilidad

| Familia | Estado actual útil | Trabajo necesario |
| --- | --- | --- |
| Projectile | Daño, doble emisor y cadencia ya tienen mejoras; velocidad configurable | Ordenar contenido y conectar valores de rango sin duplicar stacks |
| Orbit | Cantidad y radio modificables; pool máximo seis | Parametrizar daño por rango, mantener cantidad distinta de capacidad |
| Chain | Daño modificable; targets y salto definidos en contenido | Hacer efectivos targets, alcance y cadencia de rango; revisar pool de enlaces |
| Boomerang | Salida/regreso, tamaño, velocidades y cooldown definidos | Hacer consumibles los parámetros de rango; hoy solo existe carta de adquisición |
| Pulse Ring | Fases, alcance y empuje existentes | Propagar rangos a fases, scheduler, colisión y vista; hoy solo adquisición |
| Magnetic | Viaje, atracción, banda y ticks existentes | Propagar rangos a fase y consultas espaciales; hoy solo adquisición |

Los datos existen en definiciones, pero varios behaviors siguen leyendo
constantes. Declarar una tabla sin cambiar esos consumidores no implementa una
mejora. La primera pasada debe verificar cada parámetro de extremo a extremo.

## 3. Tablas de las seis armas

Unidades: daño por impacto válido, distancias en unidades lógicas, tiempos en
segundos. En Magnetic el daño es por tick; en Orbit depende del cooldown por
objetivo. No comparar directamente «18» de una familia con «18» de otra.

### Projectile — desarrollar la nave artillada

| Rango | Nombre de mejora | Cambio acumulado al aplicar | Resultado visible |
| --- | --- | --- | --- |
| I | Cañón automático | Daño14; intervalo0.55; velocidad460; radio7; vida2.5 | Disparo base actual |
| II | Doble cañón | Activa `twin_emitters` una vez | Se utilizan ambos emisores |
| III | Proyectiles enfocados | Daño18 | Impactos más fuertes |
| IV | Ráfaga rápida | Intervalo0.47 | Disparo más frecuente |
| V | Impacto reforzado | Daño22 | Mejora contra enemigos resistentes |
| VI | Acelerador | Velocidad540; radio/lifetime iguales | Menor tiempo de viaje |
| VII | Ciclo optimizado | Intervalo0.39 | Artillería completa; evolución disponible |

Usar la implementación actual de doble emisor, incluidos anclajes, reparto y
restricciones existentes. No introducir otro multiplicador por «dos cañones».
Conservar las curvas cosméticas/físicas de cada proyectil y la presentación
aprobada de Rail Lance/Pulse Volley. Las nuevas estadísticas de entrada cambian
la progresión previa, por lo que su potencia final necesita regresión.

### Orbit — construir una corona gradual

| Rango | Nombre | Cambio acumulado al aplicar | Resultado visible |
| --- | --- | --- | --- |
| I | Órbita geométrica | 1 blade; daño18; radioOrbital58; radioBlade10; giro2.7 rad/s; hitCooldown0.5 | Pieza orbitante actual |
| II | Órbita extendida | RadioOrbital76 | Más separación de la nave |
| III | Segundo satélite | 2 blades, espaciados uniformemente | Menor espera entre pasadas |
| IV | Filos reforzados | Daño22 | Mejor impacto de cada pieza |
| V | Tercer satélite | 3 blades | Cobertura más regular |
| VI | Órbita exterior | RadioOrbital94 | Más alcance, con hueco interior mayor |
| VII | Corona completa | 4 blades | Cuatro sectores; evolución disponible |

Capacidad del pool sigue en seis; esta progresión utiliza cuatro. No confundir
maxBlades con cantidad adquirida ni regalar seis al evolucionar. Mantener
cooldown de contacto para que aumentar blades no multiplique automáticamente
daño sobre el mismo target en un instante. La órbita continúa exigiendo posición.

### Chain Lightning — extender conexiones antes de transformarlas

| Rango | Nombre | Cambio acumulado al aplicar | Resultado visible |
| --- | --- | --- | --- |
| I | Cadena eléctrica | Daño10; 3 targets totales; salto180; intervalo1.2 | Cadena base |
| II | Sobrecarga eléctrica | Daño16 | Conserva la primera mejora actual |
| III | Cuarto enlace | 4 targets totales | Un enemigo adicional alcanzable |
| IV | Conductividad | Salto210 | Conecta grupos más separados |
| V | Recarga de arco | Intervalo1.05 | Menos espera entre cadenas |
| VI | Núcleo de descarga | Daño18 | Mayor potencia por enlace |
| VII | Quinto enlace | 5 targets totales | Cadena completa; evolución disponible |

«5 targets» incluye el primer objetivo: son cuatro saltos posteriores. No
interpretarlo como seis blancos. Sin target válido extra termina la cadena;
no repetir víctimas ni asignar daño de los saltos faltantes al boss.

### Vector Boomerang — extender una salida y acelerar el regreso

| Rango | Nombre | Cambio acumulado al aplicar | Resultado visible |
| --- | --- | --- | --- |
| I | Búmeran vectorial | Daño13; salida360; regreso430; distancia250; radio11; vida2.2; intervalo1.25; pool3 | Ida y vuelta actuales |
| II | Filo templado | Daño16 | Mejores impactos en ambas fases |
| III | Brazo extendido | Distancia280 | Punto de retorno más lejano |
| IV | Retorno acelerado | VelocidadRegreso500 | Vuelve más rápido a la nave |
| V | Hoja amplia | Radio13 | Más facilidad para rozar blancos |
| VI | Relanzamiento | Intervalo1.10 | Mayor disponibilidad del arma |
| VII | Núcleo de impacto | Daño19 | Base completa; evolución disponible |

Mantener un hit por target en ida y otro en regreso, según el contrato base.
No introducir segundas piezas o vórtices antes de evolucionar. Probar recorrido
y expiración con player moviéndose: un rango nunca debe cortar el regreso.
Cap3 es límite simultáneo, no tres proyectiles gratuitos por disparo.

### Pulse Ring — ganar respuesta, alcance y capacidad de abrir espacio

| Rango | Nombre | Cambio acumulado al aplicar | Resultado visible |
| --- | --- | --- | --- |
| I | Anillo de pulso | Daño26; carga0.65; expansión0.75; recuperación0.35; intervalo3.8; radio30→200; ancho28; empuje10 | Onda base actual |
| II | Carga ágil | Carga0.50 | Responde antes |
| III | Frente extendido | RadioFinal220 | Alcanza enemigos algo más lejos |
| IV | Impulso de escape | Empuje16 | Despeja mejor tras impacto |
| V | Cresta reforzada | Daño32 | Impacto más contundente |
| VI | Reactivación | Intervalo3.30 | Menos espera entre ondas |
| VII | Frente completo | RadioFinal240 | Cobertura madura; evolución disponible |

Un impacto por enemigo/onda. El ancho permanece28: aumentar el ancho no debe
ser una mejora falsa de DPS si la onda ya barre y golpea una vez. Mantener
expansión0.75 implica mayor velocidad radial al ganar alcance; colisión barrida
y vista deben usar exactamente ese radio. Empuje no afecta bosses.

### Magnetic Charge — mejorar colocación y persistencia remota

| Rango | Nombre | Cambio acumulado al aplicar | Resultado visible |
| --- | --- | --- | --- |
| I | Carga magnética | Daño18/tick; intervalo5.2; vuelo0.42; atracción1; detonación1.3; recuperación0.36; atracciónRadio180/fuerza135; banda62→148; hitCooldown0.32; lanzamiento190–255 | Bomba remota actual |
| II | Lanzador ágil | Vuelo0.34 | Llega antes, conserva parábola visual |
| III | Banda extendida | RadioExterior166; interior62 | Más superficie dañina alrededor del centro |
| IV | Captación amplia | RadioAtracción200; fuerza135 | Afecta enemigos más separados |
| V | Carga reforzada | Daño22/tick | Mejor golpe sostenido |
| VI | Recarga magnética | Intervalo4.60 | Menos espera entre lanzamientos |
| VII | Campo persistente | Detonación1.60 | La banda permanece más; evolución disponible |

No aumentar fuerza de atracción como premio automático. Probar la seguridad
del desplazamiento definida en EVOLUCIONES §3 en todos los rangos. El destino
aleatorio lejano y lanzamiento sin enemigos se conservan.

Antes de aprobar la base VII, comprobar qué ocurre al atraer hacia el hueco
interior. Si el test confirma que la propia fuerza deposita enemigos sin daño,
corregir la fuerza de la base para detenerlos a distancia del centro
`innerRadius + enemyRadius + 8`, sin empujarlos hacia afuera cuando ya estén
dentro. Este freno solo limita la fuerza del arma; la AI sigue moviéndose.
No convertir silenciosamente la banda base en disco: el núcleo dañino pertenece
a Event Horizon. Documentar esa corrección y probarla también en I.

Tick inicial en t=0 al activar banda; posteriores en múltiplos de0.32 menores
que la duración. Con permanencia completa son 5 oportunidades en1.3 s y 5 en
1.6 s (0,0.32,0.64,0.96,1.28). VII **extiende la ventana de entrada**, no añade
un sexto tick en el instante de cierre. Respetar ese límite con dt variable.

## 4. Cartas y migración de contenido

### Una tarjeta por familia y siguiente rango

Crear seis ofertas de mejora reutilizables con payload `{family, fromRank,
toRank}` y claves i18n por transición. El título muestra arma y rango; debajo
nombre de mejora, valor antes→después y consecuencia. Ejemplo:

> ANILLO DE PULSO · III → IV  
> Impulso de escape  
> Empuje: 10 → 16. Abre más espacio cuando la onda golpea.

Solo puede ofrecerse el siguiente rango, una vez por mano. El efecto aplicable
se calcula desde contenido validado; nunca aceptar toRank arbitrario de UI.
Tras aplicar, recomputar parámetros efectivos y aumentar rango atómicamente.

| IDs actuales | Tratamiento en campaña v2 |
| --- | --- |
| `twin_emitters`, `focused_projectiles`, `rapid_projectiles` | Sus efectos alimentan transiciones Projectile; dejan de salir como upgrades independientes |
| `orbit_blade` | Conservar como adquisición de Orbit I; repeticiones sustituidas por próximos rangos |
| `orbit_reach` | Transiciones II y VI de Orbit; retirar oferta independiente |
| `chain_lightning`, `vector_boomerang`, `pulse_ring`, `magnetic_charge` | Conservar como adquisiciones I, una vez cada una |
| `chain_overload` | Transición II de Chain; retirar oferta independiente repetible |
| Vida, armadura, velocidadPlayer, crítico, curación, escudo, XP | Mantener pasivas actuales; nunca cuentan como rango de arma |

Los IDs antiguos siguen siendo legibles para historial/fixtures de v1. No
ejecutar un stack antiguo como «cualquier siguiente rango» porque cambiaría
su significado. No hay migración de una run v1 arbitraria por conteo: reiniciar
ese escenario de desarrollo con perfil v2 explícito. Inspeccionar persistencia
antes de implementar; conservar economía, cosméticos y meta guardada.

### Calibración del Acto II

| Plantilla | Estado objetivo v2 | Adaptación |
| --- | --- | --- |
| Projectile | Projectile IV, sin otras armas | Reproduce doble emisor, daño18 e intervalo0.47 de sus tres mejoras actuales |
| Orbit | Projectile I + Orbit II + Núcleo reforzado actual | Reproduce un blade a radio76 y la pasiva de vida |
| Chain | Projectile I + Chain II + Núcleo resonante actual | Reproduce Chain daño16 y la pasiva de XP |

Construir esos perfiles mediante adquisiciones y transiciones reales, aplicadas
una vez. `starterUpgrades` e `initialStacks` no son dos fuentes acumulables;
actualizar consumidores y tests conjuntamente. Los rangos vienen de la plantilla
del nuevo acto; no se heredan de la run anterior.

### Oferta de tres cartas

Mantener tres opciones totales. La carta «Evolucionar» **ocupa una de las tres**;
no es una cuarta opción ni una evolución gratuita. Reglas de selección:

1. Reservar una oferta de evolución si hay elegibles, con rotación de §2 del
   documento de evoluciones. Al abrir sus ramas, volver no consume nada.
2. Reservar al menos una mejora de arma equipada inferior a VII, si existe.
   Rotar familias; una familia elegible no debe desaparecer durante más de
   tres manos normales por exclusión del generador.
3. Completar con adquisiciones y pasivas válidas mediante selección con semilla;
   no duplicar familia ni tarjeta. Si no hay slot de evolución, ese espacio
   puede ofrecer otra arma/mejora/pasiva. Mantener posibilidad de adquirir las
   dos armas adicionales; verificar que el nuevo pool no las deja sin ofertas.
4. Si un reroll exige opciones distintas, las reservas se cumplen en la mano
   original y pueden relajarse en el reroll para respetar sus exclusiones.
   No cobrar, gastar ni alterar las reglas económicas existentes como parte
   de esta tarea. Volver desde ramas restaura exactamente la misma mano.
5. A VII retirar sus cartas de rango, mantener evolución pendiente. Tras
   evolucionar, retirar ambas ramas y su oferta; las pasivas siguen disponibles.

Coste por arma adicional desde cero: adquisición + seis mejoras + evolución
= ocho elecciones. La primaria comienza adquirida y necesita siete. Es una
inversión relevante en actos cortos: medir disponibilidad y tiempo al primer
VII; no subir automáticamente varias armas por una sola carta.

## 5. Conservación de mejoras al evolucionar

Resolver primero perfil VII, después transformación de la rama y al final
bonus externos una vez, con clamps finales. Los tamaños/tiempos de las fichas
de evolución son valores de referencia; este apartado concreta su herencia.

| Pareja | Herencia y conversión obligatoria |
| --- | --- |
| Projectile | Damage22, intervalo0.39, velocidad540 y doble emisor entran a las reglas existentes de Rail/Volley una vez; preservar topes/reparto aprobados |
| Orbit | 4 blades, daño22 y radio94. Solar sale desde94 hasta244; Graviton usa semiejes178.6/61.1; giro e hitCooldown conservados |
| Chain | Daño18, intervalo1.05 y salto210 en ambas. Mantener cadena inicial de hasta5 targets. Circuito usa hasta3 de sus impactos como nodos; Thunderhead marca hasta2. No borrar los rangos de targets al elegir rama |
| Boomerang | Daño19, alcance280, regreso500, radio13 e intervalo1.10. Twin sustituye250 por alcance efectivo y escala sus controles por280/250; Singularity retiene el extremo efectivo. Preservar cap y esperar slots libres |
| Pulse Ring | Daño32, carga0.50 e intervalo3.30. Echo usa radioFinal240 y empuje16 por onda con presupuesto total de daño; Compression alcance=`radioFinal+80`=320, empuje=`base+16`=32, ancho28, sin atracción |
| Magnetic | Daño22/tick, vuelo0.34 e intervalo4.60. Event radioAtracción200, sostén1.60, núcleo=`0.43*radioExterior`=71.38, final=`0.74*radioExterior`=122.84. Polar radioTriángulo=`0.61*radioExterior`=101.26 y final=`0.37*radioExterior`=61.42 |

Polar convierte inversión de captación y duración a su función ofensiva:
anchoFrente=`18*(pullRadius/180)`=20 y ventana del disco final=
`0.25*(detonateSeconds/1.3)`≈0.308 s, un hit por target en esa ventana. Event
convierte persistencia de banda en tiempo de sostén. No añadir atracción a
Polar ni conservar un anillo invisible detrás de su prensa.

Esto sustituye en las fichas los valores fijos que contradigan las fórmulas
anteriores. Mantener sus fases, identidad, seguridad y reparto de daño. Las
cartas de evolución deben advertir cambios de cobertura o cantidad cuando una
transformación los redistribuya.

El presupuesto de un ciclo se obtiene ejecutando **la base VII completa**:
incluye ida/regreso, ticks y fuentes simultáneas según la familia. Definir el
intervalo observado entre casts; algunos schedulers esperan cooldown después
de recuperar, otros lo cuentan desde el disparo. Conservar su semántica actual
y mostrarla correctamente en UI («espera» frente a «intervalo entre disparos»).
No presentar dañoPorHit/cooldown como DPS medido si faltan esas fases.

## 6. Implementación y pruebas para Luna

1. Añadir contenido de progresión con las 42 filas anteriores, validación de
   secuencia y un resolver puro de perfil efectivo. Consumidor: las seis armas
   actuales. Ningún editor/árbol genérico adicional.
2. Separar rango de familia de XP global en `UpgradeApplier`; adquisición y
   transición alimentan un único estado. Descartar ofertas obsoletas cuando
   fromRank no coincide y no consumir el level-up ante rechazo.
3. Actualizar parámetros de behaviors, scheduler y snapshots. Aplicar nuevos
   parámetros de cast al siguiente ataque; un ataque ya activo conserva su
   perfil capturado para evitar saltos de radio/hits. Orbit, persistente,
   aplica al reanudar con posiciones previas reiniciadas para no barrer la
   distancia de recolocación como daño. No resetear cooldown para regalar tiros.
4. Migrar pool de cartas, previews, calibraciones, debug y tests v1 de manera
   explícita. Mantener acceso a fixtures antiguos para detectar cambios,
   identificado como v1 y separado de la campaña v2.
5. UI muestra `I/ VII`, próximo efecto y delta con valores efectivos. Los
   cambios de alcance/cantidad se representan físicamente en Low/High. Reusar
   iconos de familia, añadir marcadores discretos de rango; no aumentar glow
   cada nivel ni reemplazar skins/cañones cosméticos.
6. Laboratorio permite elegir I–VII y comparar rango anterior/siguiente con
   misma semilla, además de baseVII/A/B. Implementar y comprobar los parámetros
   antes de dar URLs; no afirmar que ya existen por figurar aquí.
7. Tests de 42 perfiles y resultados: rango VII exige seis aplicaciones,
   mejora pasiva no avanza, preview coincide, cadencia/cantidad/alcance efectivos,
   reset y calibración exactos, doble clic idempotente, VII no evoluciona gratis.
8. Tests de colisión y tiempos30/60/144, tick de cierre, pools, máximo de tres
   armas, boss inmune a fuerzas y regeneración de enlaces sin entidades extras.
9. Validar I/IV/VII bajo presión y sin meta; después VII con meta máxima y
   combinación de tres armas. Comparar arma baseVII y ambas ramas por separado.
   Registrar tiempo a primera evolución y cada mejora realmente elegida.

El lote queda implementado con seis cartas de rango base I→VI por familia,
aplicación acumulativa, hito de evolución, panel debug y partida normal. El
laboratorio directo aísla la familia elegida; queda validar manualmente los seis
rangos, seis hitos y doce ramas. La ruta no cierra todavía la progresión normal
de campaña ni el balance de EX-02c.

La integración normal de cartas queda deliberadamente separada de estas rutas
de desarrollo. Cada familia conserva el mismo contrato: una partida normal,
una sola familia en sus level-ups, hito en nivel global 7 y sus dos ramas.
La aprobación antigua de armas y Projectile sigue como referencia funcional/
visual; **no certifica estos números nuevos**. EX-02c conserva el balance final
de daño y resistencia enemigos. Esta entrega de documentación no ejecuta
ninguna migración ni prueba de rendimiento del juego.

## Estado vigente de campaña - 15-09-2026

La integración normal descrita arriba ya está conectada en `UpgradeApplier` y
prevalece sobre los párrafos históricos de este documento. En cada mano normal
se compone una oferta de arsenal con peso uniforme entre `projectile_rank_2`
(Doble cañón) y las cinco armas adicionales que aún caben. Se conserva como
máximo una adquisición por mano; al completar tres armas se retiran todas las
adquisiciones del pool. Las familias activas avanzan por sus rangos reales
II→VII, después reciben una carta hito de evolución y finalmente las
maestrías de Potencia/Ritmo/Cobertura.

La carta universal `Potencia calibrada` solo entra cuando las tres armas
activas ya evolucionaron; abre una segunda pantalla para elegir el objetivo y
no reabre ramas. La ruta QA `/?debug=1&campaign=evolved&act=angular&quality=high`
permite revisar esa presentación directamente en una partida de acto. El modo
infinito conserva un compositor futuro separado y el balance EX-02c no cambia.

Corrección de compositor, 16-09-2026: las runs reales reciben semilla nueva;
las pruebas pueden inyectarla. La mano no vuelve a usar el pool legacy como
relleno, reserva rangos/evoluciones pendientes, admite solo una adquisición de
arsenal y convierte una adquisición tomada en progreso de rango. `Potencia
calibrada` exige objetivo válido, tiene cap real de tres y bloquea reroll en su
selector. La entrada pública al Acto II permanece temporalmente limpia; las
calibraciones directas se conservan solo para QA.
