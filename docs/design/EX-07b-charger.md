# EX-07b — Charger: segunda familia Angular

**Estado:** prototipo aislado para validación humana; no forma aún parte de una run Angular.

El Charger enseña alineación: llega al borde, fija una dirección hacia la posición
que observó y, tras `0.72 s` de telegraph, cruza esa línea durante `0.86 s` sin
homing ni cancelación. La respuesta es salir lateralmente de la línea antes de
la carga; el riel sólo comunica la ruta, el collider circular del casco aplica
el daño de contacto normal. El telegraph muestra dos aletas de luz convergentes
y una punta corta delante de la nave; nunca revela la distancia completa.
Tras `0.52 s` de recuperación, vuelve a preparar
otra pasada.

Contrato provisional: radio 19, vida 38, daño 11, experiencia 3, coste 2;
cap de cinco activos y una carga simultánea. Son valores de composición, no
balance final de EX-02c. El casco usa cinco SVG cacheados de frame `-32 -32 64
64`: ariete cerámico marfil, estabilizadores titanio y reactor ámbar; Low conserva
el master compuesto y Medium/High separan rear/wings/hull/cockpit. Su silueta
concentra la proa en el eje de ataque, con motores y estabilizadores retrasados.
La receta vigente reemplaza las dos propuestas previas:
[ANGULAR_ART_PREMIUM.md](ANGULAR_ART_PREMIUM.md).

Prueba con `?charger=1&debug=1&quality=high` (repetir Low y móvil). El drill
no tiene oleadas, armas, boss ni hazards. Confirmar que la línea se entiende,
que mover al player durante el aviso no la curva, que se puede esquivar hacia
un lado y que el casco sí daña al tocarlo. Build y pruebas automáticas OK;
comparación visual Pixi oscuro/claro y drills Low inspeccionados. Pendiente
aprobación humana de esta revisión; falta incorporación al director Angular.
