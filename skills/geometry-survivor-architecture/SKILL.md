---
name: geometry-survivor-architecture
description: Diseñar o modificar la arquitectura, módulos, contratos, estado y dependencias de Geometry Survivor. Usar para cambios estructurales o para ubicar una responsabilidad; no para un ajuste puramente visual o de balance.
metadata:
  short-description: Arquitectura modular del juego
---

# Arquitectura de Geometry Survivor

Mantén localidad del cambio sin construir abstracciones especulativas.

## Contexto requerido

Lee `../../PLAN_DESARROLLO.md`, especialmente “Stack aprobado”, “Arquitectura ejecutable” y “Definition of Done”. Para cambios importantes, lee también `../../proyecto.md` completo; para tareas acotadas consulta sus secciones 13–22 y 104–134.

## Invariantes

- `simulation` contiene estado y reglas puras; no importa PixiJS, DOM, audio ni SDKs.
- `presentation` representa snapshots/eventos y no decide gameplay.
- `content` contiene definiciones tipadas; añadir contenido común no cambia el engine.
- `platform` implementa puertos externos seleccionados en el composition root.
- `World` almacena estado y no se convierte en manager universal.
- `Game` coordina lifecycle/loop y no implementa sistemas completos.
- Usa eventos tipados solo para desacoplar reacciones reales; una dependencia directa clara es preferible a un bus global opaco.
- Prefiere composición; evita jerarquías profundas, archivos `utils.ts` heterogéneos y dependencias circulares.

## Procedimiento

1. Identifica la responsabilidad y el módulo que debe cambiar.
2. Inspecciona contratos, consumidores y tests existentes.
3. Define el cambio público mínimo antes de tocar internals.
4. Mantén la lógica crítica ejecutable sin renderer ni plataforma.
5. Añade una abstracción solo si existe un segundo consumidor real o una frontera externa estable.
6. Actualiza un ADR o el plan únicamente si la decisión es costosa de revertir.

## Validación

- typecheck y tests de la lógica afectada;
- búsqueda de imports inversos o circulares;
- ninguna llamada a Pixi/DOM/SDK desde simulación;
- añadir un ejemplo de contenido no debe requerir atravesar capas sin relación.

Entrega la implementación y explica brevemente la responsabilidad elegida, la superficie modificada y las validaciones ejecutadas.
