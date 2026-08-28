# UI Pixi

Esta carpeta contiene efectos de presentacion que acompanan a overlays DOM. No
recibe input ni modifica la simulacion; consume contratos semanticos emitidos por
`src/ui/` y posiciones convertidas al espacio logico.

El resize solo vuelve a calcular anclas. El reloj visual se actualiza desde el
render de `Game`, incluso cuando el gameplay esta pausado, para que un feedback
de seleccion no dependa del avance de la simulacion.
