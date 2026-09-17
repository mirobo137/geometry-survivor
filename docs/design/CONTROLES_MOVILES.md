# Contrato de controles móviles — 16-09-2026

## Elección persistente

Inicio → Configuración → Desplazamiento y Pausa → Configuración → Desplazamiento
usan el mismo `settings.controlScheme` y `isControlScheme`. Cambiarlo se aplica
y guarda inmediatamente sin reiniciar ni modificar la build. Elegir `touch`
(Seguir el dedo) desactiva el joystick; elegir `joystick` lo activa.

`auto` mantiene el comportamiento previo (dedo/mouse directo y teclado).
`relative-touch` se conserva por compatibilidad con guardados anteriores;
no convertirlo silenciosamente. `keyboard` ignora gestos. Guardados sin opción
o con valores desconocidos vuelven a `auto`. No cambia la versión del save:
es una ampliación del enum compatible con el lector existente.

## Joystick flotante

- El primer contacto sobre la superficie jugable fija el origen. No hace falta
  tocar la nave ni un botón fijo: se recomienda apoyarlo debajo/lateral de la arena.
- Radio máximo 52 CSS px, zona muerta de 8 CSS px. Fuerza lineal entre ambos:
  `(distancia - 8) / 44`, limitada a 1. Diagonal nunca excede velocidad máxima.
- Tanto el pomo visual como el input usan las mismas coordenadas de pantalla.
  No aplicar DPR, cámara ni escala de arena al joystick. El modo directo sí
  mantiene `ViewportTransform.toWorld` para alcanzar el punto tocado.
- Un solo pointer/touch es dueño del gesto. Otro dedo no reubica el origen.
- Soltar, cancelar, perder captura/foco, resize, cambio de modo, detach o salir
  de PLAYING limpia el gesto y oculta el control. Al reanudar hace falta otro
  contacto; no recuperar una dirección vieja. Botones y overlays no mueven.
- Mouse también permite probarlo; sólo botón principal. WASD/flechas siguen
  disponibles, con magnitud combinada limitada a 1.

## Separación y coste

`InputManager` produce vector acotado y `JoystickState` de sólo lectura para
el consumidor; no conoce HTML decorativo, Pixi ni daño. `JoystickView` consume
ese estado con dos nodos DOM reutilizados, pointer-events none y aria-hidden.
Actualiza estilos sólo por eventos; no anima en un loop ni agrega texturas,
filtros o dependencias. Mismo control en todas las calidades.

CSS usa placa oscura, bisel y acento pequeño conforme a la guía UI; no una luz
que compita con hazards. El área de inicio no está limitada al dibujo de 104 px.
No desplazar visualmente el origen para evitar bordes sin trasladar también
el origen matemático: causaría movimiento sin arrastrar.

## Validación y futuras iteraciones

Unit: zona muerta, intensidad media, límite diagonal, multitouch, cancelación,
cambio de modo, bloqueo en overlays, detach y fallback Touch Events; save enum.
Browser móvil: persistencia tras recargar, movimiento real, cambio en pausa,
portrait/landscape y ocultación al girar/cancelar.

Pendiente prueba física en S25: comodidad del radio, no tapar la nave, rotación,
pausa por background y run completa. Si se ajusta sensibilidad, cambiar constantes
y expectativas de pruebas juntos. No cambiar la velocidad máxima del jugador.
