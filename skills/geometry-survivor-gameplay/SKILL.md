---
name: geometry-survivor-gameplay
description: Crear o ajustar armas, enemigos, upgrades, hazards, bosses, arena, director y balance de Geometry Survivor. Usar cuando una tarea cambia decisiones, reglas o ritmo de una run; no para infraestructura de render aislada.
metadata:
  short-description: Gameplay y contenido data-driven
---

# Gameplay y contenido

Cada mecánica debe mejorar movimiento, decisiones de build, amenaza, variedad o sensación de poder.

## Contexto requerido

Lee `../../PLAN_DESARROLLO.md`, especialmente “Alcance cerrado”, “Diseño de la primera partida”, “Fases y puertas” y “Métricas de decisión”. Consulta en `../../proyecto.md` las secciones 2–13 y 43–59; para un cambio de visión, lee ambos documentos completos.

## Reglas

- El vertical slice sigue limitado a una run de 5–6 minutos hasta superar sus puertas.
- La arena viva es el gancho inicial: expansión, borde y hazards deben sentirse conectados.
- Una nueva definición usa sistemas existentes; modifica el engine solo para una mecánica fundamental nueva.
- Evita upgrades que sean únicamente porcentajes pequeños. Cada arma necesita rutas perceptiblemente distintas.
- La dificultad crece mediante composición, densidad, patrones y espacio antes que HP.
- Todo hazard peligroso separa `telegraph`, `attack` y `recovery` y deja una respuesta posible.
- El diseño debe funcionar moviéndose con un dedo y sin botones pequeños durante combate.
- Labels visibles usan claves i18n con inglés como fallback.
- Colisiones simples y reglas legibles tienen prioridad sobre fidelidad a la silueta visual.

## Procedimiento

1. Declara qué decisión o comportamiento del jugador busca la mecánica.
2. Define datos, límites y sinergias; evita valores mágicos repartidos.
3. Implementa la regla en simulación y la reacción visual mediante eventos/snapshots.
4. Añade casos con semilla para éxito, límite y fallo.
5. Comprueba que no introduce camping dominante, daño inevitable o una opción siempre superior.
6. Registra nuevas métricas de balance solo si influyen en una decisión futura.

## Validación

- tests sin Pixi para reglas, cooldowns, targeting, upgrades y director;
- una run completa o escenario reproducible con semilla;
- comportamiento consistente a 30/60/144 Hz;
- legibilidad y targets táctiles cuando exista UI.

Entrega el cambio junto con su intención jugable, parámetros configurables y evidencia de balance disponible.
