# FX premium del boss

## Por qué el boss tenía el láser antiguo

El láser de arena y los ataques del boss no comparten vista:

- `HazardView` dibuja `CombatRenderState.laser` y ahora usa Solar Rail.
- `BossView` dibuja `BossRenderState` y conservaba su propia línea simple y
  su circunferencia completa.

Compartir dirección visual no implica compartir contrato. El boss tiene dos
patrones distintos: una línea de barrido y un anillo expansivo con hueco
seguro. Por eso se actualiza `BossView` con la misma jerarquía de materiales,
pero no se fuerza el estado del boss dentro de `HazardView`.

## El hueco seguro sí debe pintarse

Sí. `BossSystem.intersectsRing()` excluye el sector definido por
`safeGapAngle` y `safeGapHalfAngle`; sin una señal visual, el jugador no puede
entender por qué una parte del mismo aro daña y otra no. El hueco debe
comunicarse durante `ring-telegraph`, antes de que empiece el daño.

La solución no es rellenar el sector con un bloque sólido. Prism Aegis usa:

1. el aro peligroso dibujado en dos tramos, excluyendo físicamente el hueco;
2. una cuña translúcida de alpha muy bajo para sugerir el corredor radial;
3. un arco cian/mint en el radio actual del hazard;
4. dos brackets en los límites del hueco y tres ticks internos;
5. durante `ring-active`, la misma señal con más contraste y el radio que
   avanza con `state.ringRadius`.

La forma, la interrupción del aro y la posición comunican la regla; el color
sólo la refuerza. La cuña no es una hitbox, no cambia colisiones y no debe
ocultar al player. Su alpha de referencia es `0.04` en aviso y `0.075` activo.

## Recetas implementadas

### Command Rail — sweep

- Aviso: 16 segmentos ámbar discontinuos, núcleo fino y emisores en extremos.
- Activo: base oscura de contraste, cuerpo peligroso coral, núcleo dorado y
  centro marfil; un flash corto al inicio.
- Recuperación: siete fragmentos débiles, sin cuerpo sólido dañino.
- El ángulo procede de `state.sweepAngle`; la vista no decide cuándo barre.

### Safe Corridor — ring

- Aviso: arco peligroso tenue separado del corredor seguro.
- Activo: banda peligrosa ancha + núcleo caliente sólo en los dos arcos que
  realmente pueden golpear.
- Recuperación: segmentos discontinuos que se desvanecen, más corredor tenue.
- El radio procede de `state.ringRadius`; el hueco usa exactamente los ángulos
  de simulación. Se conserva el caso wrap-around alrededor de 0/2π.

Cada línea o arco independiente inicia su propio `beginPath()`/`moveTo()`. El
radio del anillo cambia continuamente, por lo que su Graphics se reconstruye
de forma acotada en la vista única del boss; no se crean objetos, texturas ni
filtros por frame. El sweep comparte sólo la jerarquía visual, no la lógica de
daño de Solar Rail.

## Validación

La prueba de `BossView` confirma que los arcos del corredor funcionan tanto
normalmente como al cruzar 0/2π. La referencia ejecutable usa el renderer real:
`docs/visual/boss-laser-reference.html`. Ejecutar
`node docs/visual/capture-boss-lasers.mjs` para capturas desktop/móvil y revisar
aviso, activo, contraste claro y ruta segura.

En una partida comprobar que el corredor se entiende sin quedarse mirando el
color: debe verse la interrupción del aro, sus brackets y la cuña tenue. También
comprobar Low/High, pausa, resize y que el player siga visible. Tests y capturas
no sustituyen una prueba humana del encuentro ni una medición de FPS en un
teléfono físico.
