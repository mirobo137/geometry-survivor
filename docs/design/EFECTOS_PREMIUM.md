# Dirección de efectos premium

Para avisos de enemigos Angular, usar [ANGULAR_ART_PREMIUM.md](ANGULAR_ART_PREMIUM.md):
Charger comunica dirección corta; Orbiter comunica recorrido discontinuo.
Incluye el compositor real, límites y criterios para evitar trazos planos.

Para golpes a enemigos y daño recibido por el player, seguir
[DAMAGE_FX_PREMIUM.md](DAMAGE_FX_PREMIUM.md): Hull Fracture y Breach Petals,
contacto inmediato, material, apertura y disipación con geometría reutilizada.

Referencia implementada: **Solar Rail**, el láser de arena de
`src/presentation/pixi/HazardView.ts`. Aplicar junto a las skills canónicas
de rendering y mobile-performance. Para assets vectoriales, aplicar además
la guía SVG; un efecto procedural no necesita convertirse en SVG.

La receta equivalente para la frontera y el espacio habitable vive en
[ARENA_FX_PREMIUM.md](ARENA_FX_PREMIUM.md); no reutilizar Solar Rail como
decoración de arena ni convertir la frontera en un hazard falso.

Esta entrega reemplaza el láser anterior por solicitud del usuario. No está
aprobada visualmente por él todavía. La aprobación de skins y cañones no se
extiende automáticamente a nuevos efectos.

## Qué significa premium

No significa añadir más líneas, blanco, anillos o bloom. Significa que el
efecto tiene origen físico, silueta propia, materiales jerarquizados y una
historia temporal legible a tamaño de juego. Primero diseñar esas decisiones;
después elegir primitivas. Tomar las referencias existentes como base de
calidad, no repetir sus formas en todas las familias.

Antes de implementar, escribir un contrato breve: origen, dirección, zona
dañina, fases, respuesta a pausa, presupuesto por calidad y referencia visual.
La simulación es la única autoridad de daño, posición, ángulo y progreso.

## Receta verificable: Solar Rail

| Fase | Forma y movimiento | Contrato |
| --- | --- | --- |
| Aviso | Dos raíles discontinuos ámbar, carga central creciente, mordazas mecánicas que se preparan | Inmóvil; no revela si habrá barrido |
| Activo | Cuerpo de plasma coral, banda dorada, núcleo marfil estrecho; encendido breve y filamentos longitudinales | Siempre visible mientras daña; ángulo exacto de simulación |
| Recuperación | Desaparece inmediatamente el cuerpo sólido; quedan segmentos débiles y emisores que se apagan | No parecer un ataque todavía activo |
| Idle | Oculto | Reiniciar no conserva residuos |

Los emisores tienen cavidad oscura, placas facetadas y biseles selectivos.
Su tamaño no se estira con la longitud del rayo. Se sitúan en la frontera
real de la arena y apuntan hacia dentro. No sustituirlos por círculos de glow.

El haz se construye en coordenadas locales X de −1 a 1 y después se escala
al radio. Sus últimos 18% afinan hacia cada extremo: no usar un rectángulo
con remates planos. La base oscura separa el efecto de fondos claros. El
núcleo ocupa aproximadamente 28% del ancho nominal, no toda la banda.
Paleta de referencia: tinta `#11182b`, metal `#495673`, bisel `#aab6cc`,
plasma `#f26449`, energía `#ffbe69`, núcleo `#fff3d1`.

El ancho nominal viene de `state.width`: no modificar la colisión para
acomodar un adorno. La base de contraste llega a 112% de ese ancho y es
decorativa; no representa daño adicional. El taper también es una decisión
visual, no una nueva fórmula de colisión. Validar legibilidad cerca del borde.

El flash ocupa sólo el primer 22% de la fase activa. El cuerpo dañino no
parpadea. Los filamentos viajan dentro del rayo; no añadir réplicas angulares
en zonas seguras. La recuperación cae con `(1-progress)^2`. Toda animación
usa progreso de simulación: no `Date.now()` ni `performance.now()`.

## Presupuesto y construcción

- Construir geometría una vez; animar transformaciones, alpha y visibilidad.
  `renderLaser` no llama a `clear()` ni vuelve a emitir paths.
- Hay 11/15/17 `Graphics` persistentes en Low/Medium/High, incluidos ambos
  emisores. Son 0/4/6 filamentos opcionales, no partículas ilimitadas.
- Low mantiene placas, cavidad, núcleo, aviso y disipación completos.
  Reducir decoración móvil, no degradar el material ni ocultar peligro.
- No hay filtros, blur de pantalla, texturas nuevas ni dependencias nuevas.
  Más objetos persistentes no equivalen automáticamente a menos coste GPU:
  medir antes de afirmar FPS o mejora de batería.
- Cada trazo independiente comienza con `beginPath()` y `moveTo()`.
  Los polígonos se cierran explícitamente. Nunca heredar el punto del trazo
  anterior: es la regla que evita diagonales hacia el origen.
- Si una capa hija rota por dirección de disparo mientras el padre rota por
  movimiento, convertir el ancla mundial usando la **rotación mundial efectiva
  de la capa hija**, no sólo la del padre. De otro modo el origen se rota dos
  veces y el flash puede quedar detrás del proyectil. Probar casco y disparo
  en direcciones distintas, incluidos ambos cañones.
- No generalizar un motor de FX para un solo consumidor. Usar las vistas y
  la calidad existentes; presentación no decide cadencias ni daño.

## Procedimiento para el siguiente efecto

1. Inspeccionar renderer, reglas SVG y referencias aprobadas. Elegir una
   silueta y un material propios: arco eléctrico angular, plasma sostenido y
   impacto mecánico no deben ser el mismo anillo recoloreado.
2. Dibujar primero origen y cuerpo en un fotograma estático a tamaño real.
   Si se ve plano, corregir proporciones, cavidades y contraste, no apilar glow.
3. Añadir preparación, encendido y disipación con funciones acotadas del
   progreso. Reservar el blanco para energía concentrada.
4. Definir Low antes de añadir ornamentos High. Compartir la señal jugable.
5. Verificar reinicio, pausa, geometría estable y separación entre daño y
   recuperación. Ningún efecto secundario puede fingir una hitbox adicional.
6. Capturar y mirar el renderer real sobre fondo oscuro y claro, en desktop
   y viewport móvil. Revisar después una partida con enemigos y boss:
   una lámina aislada no demuestra jerarquía en combate ni rendimiento móvil.
7. Registrar pruebas realizadas y pendientes. La aprobación humana corresponde
   al usuario; no deducirla de tests verdes o de una autoevaluación estética.

## Referencia reproducible y puerta de aceptación

Con Vite activo, abrir `/docs/visual/laser-reference.html`; usa la clase del
juego, no una imitación HTML. Sus seis paneles muestran aviso, activo,
recuperación, Low, fondo claro y barrido. El botón anima cada fase por separado:
no es una reproducción del ciclo completo de simulación.

Ejecutar `node docs/visual/capture-lasers.mjs` para capturas en
`test-results/laser-reference/`. Se pueden regenerar sin guardar imágenes
pesadas en el repositorio. `HazardView.test.ts` comprueba separación de fases,
reutilización de geometría, reinicio y consistencia Low/High; no juzga belleza.

Antes de entregar: ¿se distingue daño de residuo?, ¿se entiende el origen?,
¿hay profundidad sin sobreexposición?, ¿Low conserva identidad?, ¿pausa y
reinicio son estables?, ¿el coste está acotado? Si falla una respuesta, corregir
esa causa. No compensarla con capas nuevas. FPS móvil y diversión sólo se
cierran con evidencia de juego real, no con capturas del navegador emulado.

Para los dos patrones del boss, leer también
[BOSS_FX_PREMIUM.md](BOSS_FX_PREMIUM.md): explica por qué `BossView` tiene una
ruta propia, cuándo debe mostrarse el hueco seguro y cómo construir el
corredor sin convertirlo en una superficie opaca.

Para la cadena de rayos leer también
[CHAIN_FX_PREMIUM.md](CHAIN_FX_PREMIUM.md): define Arc Relay, sus quiebres
deterministas, el pulso direccional, el módulo de impacto y la degradación
Low/Medium/High sin tocar `ChainBehavior`.

Para el hazard anular leer también
[RADIAL_PULSE_FX_PREMIUM.md](RADIAL_PULSE_FX_PREMIUM.md): define Pulse Crest,
la banda activa con dirección geométrica, su disipación y el presupuesto de
paths cacheados sin tocar `RadialPulseHazard`.
