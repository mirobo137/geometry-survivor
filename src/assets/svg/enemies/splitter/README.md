# Splitter — nave de fractura angular

Ficha de la tercera familia de Acto II. El Splitter no es una recoloracion del
Orbiter ni del Charger: su verbo es **separarse**. Tiene un casco diamante
partido, dos placas laterales que parecen dos mitades desacoplables y un nucleo
dual. El frente funcional apunta a `-Y`; el ancla y el collider permanecen en
`(0, 0)`.

## Contrato visual

- `viewBox`: `-32 -32 64 64`; el centro es el centro de masa.
- Paleta: tinta `#101827`, indigo `#5862a6`, violeta `#7656ae`, bisel marfil
  `#f0eaff` y señal de fractura `#d678ff`.
- Capas: motores traseros, alas/placas, casco facetado, cavidad y nucleo.
- 23 primitivas autocontenidas: rear 4, wings 7, hull 8, cockpit 4.
- `splitter.svg` es exactamente la concatenacion de las cuatro piezas y es la
  textura Low completa. Las texturas se rasterizan una vez y se animan por
  transforms; no se regenera XML durante gameplay.

La silueta debe leerse como una unidad antes de morir y como dos mitades
desplazadas despues de la fractura. El runtime puede dar a las alas un sway
contrapuesto y a los hijos una escala menor; nunca debe mover el punto de
colision para conseguir el efecto.

## Mecánica y límites

Un padre de profundidad `0` libera dos hijos de profundidad `1` cuando recibe
el golpe letal. Los hijos no vuelven a dividirse. La capacidad se comprueba
antes de cada acquire, por lo que el efecto no puede superar el pool global ni
el cap de la familia. Los offsets son laterales y deterministas para que la
fractura sea visible, no un spawn aleatorio debajo del jugador.

El drill aislado `?splitter=1&debug=1&quality=high` mantiene el autofire
intencionalmente: permite destruir el padre, comprobar la aparición de los dos
hijos y observar que la cadena termina. No cambia las oleadas normales del
Acto I ni cierra el balance final de daño/vida.

## Checklist para futuras variantes

1. Cambiar primero el verbo o la silueta; no añadir detalles para tapar una
   lectura débil.
2. Conservar centro, orientación y frame de 64 px en las cinco fuentes.
3. Comparar 32/64/96 px, silueta negra y fondos oscuro/claro.
4. Animar piezas existentes con `position`, `rotation`, `scale` y `alpha`; no
   crear Graphics o texturas por entidad y frame.
5. Mantener Low con la silueta master y sin filtros/blur.
6. Probar reciclaje de pool, pausa, reset, profundidad máxima y cap global.

La guía transversal está en `docs/design/ANGULAR_ART_PREMIUM.md`; la regla de
SVG en `skills/geometry-survivor-svg/` y el orden del acto en
`docs/design/EX-07b-splitter.md`.
