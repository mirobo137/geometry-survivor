# Impactos premium — Hull Fracture y Breach Petals

Aplicar junto a [EFECTOS_PREMIUM.md](EFECTOS_PREMIUM.md). Esta referencia usa
las clases reales `EnemyImpactFxView`, `ImpactFxView` y `DamageBloomView`.
Entrega visual solicitada el 10-09-2026; aprobación estética humana pendiente.

## Intención y autoridad

El enemigo debe parecer golpeado en su material. El jugador debe reconocer una
pérdida de vida inmediatamente, sin perder de vista su casco ni el próximo láser.
No representar todos los impactos como anillos completos: ese lenguaje pertenece
a otras mecánicas del juego y diluye su lectura.

Los impactos enemigos se activan por descenso de salud en el snapshot existente;
son agrupados por render, no una reproducción individual de cada proyectil.
La derrota activa también la fractura para que las bajas de un solo golpe tengan
contacto visible. Las piezas de muerte existentes siguen su propia receta.
El impacto del player se activa sólo después de `resolveDamage`: protección,
invulnerabilidad o escudo que absorbió el golpe no deben dispararlo.

El origen disponible es el centro de la entidad en ese instante. No inventar una
normal de colisión: la orientación determinista de la fractura enemiga es una
decisión de material, no la dirección autoritativa de una bala. El efecto queda
en el lugar del golpe; el jugador puede salir de él. No mueve entidades.

## Recetas

| Aspecto | Enemigo — Hull Fracture | Player — Breach Petals |
| --- | --- | --- |
| Silueta | Lente horizontal asimétrica con rotura oblicua | Cuatro placas coral separadas, centro abierto |
| Material | Base tinta, borde ámbar, hendidura marfil | Base tinta, caras coral y bisel salmón |
| Contacto | Núcleo estrecho, se apaga en primeros 58 ms | Cuñas internas marfil, se apagan en primeros 90 ms |
| Apertura | Lente y rotura crecen a ritmos distintos | Placas se separan radialmente un 22% |
| Final | 180 ms; alpha cuadrática | 280 ms; alpha cuadrática |
| Restos | 2/3/4 astillas afiladas Low/Medium/High | 3/5/8 astillas con el pool existente |

El flash del casco del player arranca en su máximo y decae cuadráticamente,
en vez de usar una sinusoide cuyo máximo llega tarde. La compresión y el flash
siguen limitados por los tokens del player. Las placas no significan que se haya
roto un escudo: son estrés del casco tras daño aceptado, sin duración de
invulnerabilidad implícita. La señal de escudo sigue siendo independiente.

## Construcción y coste

`DamageBloomView` comparte únicamente el lifecycle acotado de estos dos
consumidores. Tres `GraphicsContext` por pool: cuerpo, fractura/bisel y núcleo.
Cada instancia usa tres `Graphics` sobre esos contextos; sólo cambia position,
rotation, scale, alpha y visible. No crear paths, texturas o filtros al golpear.
Los contextos tienen ownership del pool y se destruyen con su root.

- Pool enemigo: 8/12/16 impactos, es decir 24/36/48 Graphics persistentes.
- Player: un impacto, tres Graphics; un golpe nuevo reinicia ese slot.
- Saturación enemiga: descartar decoración nueva; nunca aumentar el pool.
- Partículas: se reutiliza `FxPool`; dos texturas enemigas existentes en número
  (fragmento y nueva astilla), una del player. Generación una vez al construir.
- Low conserva todos los materiales y tiempos. Reduce astillas y concurrencia.
- Reduced motion suprime astillas y apertura, mantiene la señal estática que
  se desvanece. `update(0)` congela exactamente el efecto; `clear()` lo oculta.
- Los anillos de derrota heredados siguen su ruta actual; no afirmar que toda
  la clase enemiga sea transform-only: lo es el nuevo contacto.
- No añadir sacudida por cada golpe enemigo ni aumentar hit-stop para compensar
  una forma pobre. No hay nuevo audio, daño, balance, shader ni dependencia.

Estos son límites de objetos, no mediciones de GPU/FPS. El stress físico en móvil
debe validarse antes de afirmar coste nulo o equivalencia de rendimiento.

## Procedimiento para Luna y futuros agentes

1. Leer quién confirma el daño y qué datos existen. Separar impacto, bloqueo,
   muerte y peligro; cada uno debe contar algo distinto.
2. Elegir silueta propia y reservar un centro legible. Tomar estas recetas como
   nivel de acabado, no copiar cuatro pétalos a cada efecto nuevo.
3. Diseñar tinta, material y núcleo a tamaño de partida. El blanco ocupa una
   hendidura breve; no cubrir el casco con una bola opaca.
4. Definir contacto inmediato, apertura y disipación con tiempos explícitos.
   Disipación no debe parecer una zona que todavía haga daño.
5. Diseñar Low primero; el resto añade concurrencia/restos, no información.
6. Reutilizar recursos. Cada arco independiente necesita `beginPath()`; cada
   polígono debe cerrar su figura. No crear diagonales implícitas.
7. Probar saturación, pausa, clear, impactos consecutivos y muerte de un golpe.
   Comparar fondos y móvil; registrar qué se midió y qué necesita juego humano.

## Referencia reproducible

Con `npx vite --host 127.0.0.1 --port 5174`, abrir
`/docs/visual/damage-reference.html`. Seis paneles de los renderers reales muestran
contacto, 50 ms y 120 ms sobre fondos claros/oscuros y Low/High. El botón permite
animar y congelar. Captura automatizada:

`node docs/visual/capture-damage.mjs http://127.0.0.1:5174`

Guarda desktop, portrait y escena Low de boss en `test-results/damage-reference/`.
La lámina prueba composición; la escena general no demuestra que cada fotograma
capturado coincida con daño. Para aprobación jugar con tank/elite y recibir un
golpe con el player, comparando Low/High y visibilidad del láser durante el FX.
