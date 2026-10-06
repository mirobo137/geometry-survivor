# Geometry Survivor — visión y principios

Este documento conserva la identidad del juego y sus límites arquitectónicos;
no es una hoja de tareas. El único backlog vigente está en
[PLAN_DESARROLLO.md](PLAN_DESARROLLO.md).

## Identidad del juego

Geometry Survivor es un survivor de una mano en el que la arena es un sistema
vivo. El jugador se mueve para esquivar; armas, enemigos, hazards y bosses
plantean decisiones legibles basadas en geometría y posición. La campaña ofrece
actos con resultados claros y Overdrive es una continuación opcional, no una
run infinita obligatoria.

La identidad visual combina geometría, naves ilustradas, movimiento, color y
feedback. El arte debe ayudar a leer función, amenaza y dirección; no se copia
contenido de otros juegos. No se agregan efectos sólo para llenar la pantalla.

## Principios de producto

- El jugador debe entender el movimiento y las amenazas sin una larga
  explicación; el control móvil debe poder realizarse cómodamente con un dedo.
- Cada amenaza peligrosa necesita aviso y una respuesta posible. La legibilidad
  del jugador, boss, ataques y telegraphs prevalece sobre partículas y fondo.
- Las mejoras y cosméticos deben conservar decisiones claras. Una skin no
  modifica daño, vida, velocidad, targeting ni otra regla de combate.
- La dificultad crece mediante composición, patrones, espacio y presión antes
  que por aumentos arbitrarios de vida.
- Low, Medium y High cambian fidelidad visual, nunca la simulación o la
  información crítica.

## Principios de arquitectura

La dirección de dependencias es:

CONTENT → SIMULATION → EVENTS/SNAPSHOTS → PRESENTATION

INPUT → SIMULATION · UI → comandos/estado · PLATFORM → lifecycle/ads/save

- Simulation contiene reglas puras y no importa PixiJS, DOM ni SDKs.
- Presentation representa el estado; no decide daño, dificultad, drops,
  targeting ni progresión.
- Content configura sistemas existentes. Cambiar una variante común no debe
  exigir duplicar el motor.
- UI presenta información accesible y emite acciones; no manipula internals de
  simulación.
- Los adaptadores de plataforma permanecen aislados por build. Un fallo externo
  debe degradar con seguridad y no bloquear una partida local.
- Se prefiere una solución cohesionada y medible a managers, dependencias,
  pools o servicios futuros sin consumidor real.
- Mantener save versionado, transacciones idempotentes y fallback seguro.

## Rendimiento y presentación

Diseñar para teléfonos Android modestos además de desktop. Mantener un mundo
lógico estable, input y render coherentes al cambiar el viewport, pools acotados
para efectos frecuentes y carga de arte bajo demanda cuando corresponda.
Optimizar después de medir; separar memoria de Node, browser, imágenes
decodificadas y recursos GPU. El resize cambia presentación, no gameplay.

El formato de cada asset se decide por su función: raster para ilustración con
material/volumen; SVG o Graphics para geometría editable y señales precisas;
sprites/texturas compartidas para contenido repetido. Todas las opciones deben
respetar fallback, accesibilidad, carga, ciclo de vida y presupuesto móvil.
Las decisiones concretas viven en las skills canónicas y contratos de dominio,
no se duplican aquí.

## Fuentes de trabajo

- [AGENTS.md](AGENTS.md): reglas portátiles para agentes y validación.
- [PLAN_DESARROLLO.md](PLAN_DESARROLLO.md): única lista de pendientes y puertas.
- [docs/README.md](docs/README.md): índice de contratos activos, evidencia y
  referencias de assets.
- [skills/](skills/): procedimientos canónicos por dominio.

Si una especificación antigua contradice una decisión aprobada posterior,
prevalecen la solicitud vigente, el plan único, la definición actual de
contenido y el código probado. No reactivar instrucciones históricas por
encontrarlas en archivos de referencia.
