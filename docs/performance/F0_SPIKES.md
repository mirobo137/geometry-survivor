# Spikes de Fase 0

Estos benchmarks son herramientas temporales de decisión. No forman parte del loop normal de la partida y no deben convertirse en sistemas de gameplay.

## Representación masiva

Abrir GitHub Pages con:

```text
?spike=rendering
```

El spike ejecuta tres fases consecutivas con 500 entidades y una trayectoria determinista:

1. `Sprite compartido`: una textura generada una vez y reutilizada por todos los sprites.
2. `GraphicsContext compartido`: 500 objetos `Graphics` que comparten el mismo contexto vectorial.
3. `Sprite pool (reutilizado)`: sprites preasignados y reutilizados; su ruta de render es la misma que la primera fase, pero representa la estrategia de alta rotación.

Cada fase dura cinco segundos; se descarta el primer segundo de calentamiento. Se muestran FPS medio, frame medio, p95 de frame y cantidad de frames medidos. La comparación debe repetirse en el mismo dispositivo, orientación y nivel de batería. No se deben comparar cifras entre dispositivos como si fueran equivalentes.

La decisión inicial queda pendiente de una medición manual real. El criterio esperado para el juego es:

- entidades repetidas: textura + `Sprite` con pool cuando exista churn;
- geometría dinámica de arena/warnings: `Graphics`;
- `GraphicsContext` compartido sólo para formas vectoriales repetidas si gana o empata sin empeorar la legibilidad.

## Audio móvil

Abrir GitHub Pages con:

```text
?spike=audio
```

El botón `Activar y reproducir SFX` comprueba el desbloqueo por gesto. El botón de ráfaga programa 24 tonos para observar estabilidad de voces, estado del `AudioContext` y latencia base. Los tonos son sintéticos y no representan todavía el diseño sonoro final.

El resultado necesario antes de crear `AudioService` es que el primer gesto desbloquee el contexto, que una ráfaga no deje el contexto suspendido y que volver desde background actualice el estado visible. Si Web Audio no está disponible, el juego debe seguir siendo jugable sin audio.

## Registro de mediciones

Completar una fila por dispositivo. Si una fila no se puede medir, conservarla vacía en lugar de inventar un valor.

| Fecha | Dispositivo / navegador | Orientación | DPR | Sprite FPS / p95 | GraphicsContext FPS / p95 | Pool FPS / p95 | Audio desbloqueo | Observaciones |
|---|---|---:|---:|---:|---:|---:|---:|---|
| pendiente | teléfono disponible | portrait | pendiente | pendiente | pendiente | pendiente | pendiente | requiere prueba manual |

La medición en este entorno queda limitada porque no hay un navegador gráfico ni un teléfono conectado. El panel en pantalla está diseñado para que el resultado pueda copiarse manualmente desde GitHub Pages sin abrir DevTools.
