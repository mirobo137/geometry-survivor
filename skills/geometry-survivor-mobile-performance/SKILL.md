---
name: geometry-survivor-mobile-performance
description: Implementar o revisar viewport responsive, input touch, game loop, DPR, spatial grid, pooling, calidad adaptativa y profiling de Geometry Survivor. Usar cuando un cambio pueda afectar framerate, memoria, resize o móviles modestos.
metadata:
  short-description: Mobile, responsive y rendimiento
---

# Mobile y rendimiento

La simulación debe ser estable y el canvas adaptable sin conceder ventaja por aspect ratio.

## Contexto requerido

Lee `../../PLAN_DESARROLLO.md`, especialmente “Responsive sin alterar gameplay”, “Rendimiento y presupuestos”, “Estrategia de pruebas” y las puertas de Fases 0/7. Consulta en `../../proyecto.md` las secciones 20–22, 30–35, 42, 50–51 y 61–62.

## Invariantes responsive

- World space no depende del tamaño físico.
- Viewport lógico seguro: 720×1280 en portrait y 1280×720 en landscape, escalado uniforme `min(width/logicalWidth, height/logicalHeight)` y centrado.
- Área sobrante solo contiene fondo decorativo; no amplía la vista jugable.
- Input aplica la inversa de la misma matriz usada para render.
- `ResizeObserver` agrupa cambios a una actualización por frame.
- HUD respeta safe areas; portrait es la orientación primaria y no muestra overlay de rotación.
- La presentación usa 720×1280 en portrait y 1280×720 en landscape, mientras la simulación conserva su mundo lógico estable.
- DPR se limita por preset: punto de partida 1.0/1.25/1.5.

## Invariantes de simulación

- Timestep fijo de 60 Hz, acumulador, delta limitado y máximo de catch-up.
- La velocidad no depende de FPS o refresh rate.
- IA, targeting y spawn pueden actualizar a menor frecuencia si el perfil lo permite.
- Evita allocations y consultas O(n²) en hot paths.
- Pooling obligatorio solo para alto churn probado o previsto: proyectiles, partículas, pickups y textos.
- Spatial grid reutiliza buffers; no devuelve arrays nuevos masivamente.

## Procedimiento

1. Reproduce con contador, semilla y preset explícitos.
2. Mide CPU, GPU, GC, memoria y draw calls; identifica el cuello antes de optimizar.
3. Cambia una variable y compara el mismo escenario.
4. Mantén gameplay idéntico entre calidades.
5. Añade el escenario al debug/stress mode si puede regresar.

## Validación

- matriz completa de tamaños/DPR del plan;
- resize durante gameplay, level-up, pausa, game over y anuncio simulado;
- stress mínimo Low: 250 enemigos, 300 proyectiles, 150 pickups y 150 FX reales;
- prueba manual en el móvil modesto disponible;
- informa números medidos, dispositivo y límites; no uses “debería ser rápido”.
