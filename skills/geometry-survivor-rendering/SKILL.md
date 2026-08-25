---
name: geometry-survivor-rendering
description: Crear o modificar rendering PixiJS, assets SVG, lenguaje visual, UI, animaciones y FX de Geometry Survivor. Usar para decisiones de Sprite, Graphics, texturas, atlas o jerarquía visual; no para cambiar reglas de combate.
metadata:
  short-description: PixiJS, SVG y efectos visuales
---

# Rendering, SVG y FX

Convierte geometría simple en feedback fuerte sin esconder información ni gastar GPU sin medida.

Para crear o revisar SVG code-first con contrato, geometría, accesibilidad y validación detallados, carga también `../../skills/geometry-survivor-svg/SKILL.md`; esta skill conserva las decisiones de representación y rendimiento de PixiJS.

## Contexto requerido

Lee `../../PLAN_DESARROLLO.md`, especialmente “Responsive sin alterar gameplay”, “Rendering y pipeline SVG” y “Rendimiento y presupuestos”. Consulta en `../../proyecto.md` las secciones 16–17, 23–30, 43–49 y 73–103.

## Selección de representación

- Masas repetidas: textura/atlas + `Sprite`.
- Partículas: sprite pool; evalúa `ParticleContainer` con medición antes de convertirlo en dependencia central.
- Arena, líneas y warnings dinámicos: `Graphics`, mesh o geometría simple.
- Formas simples repetidas que deban seguir vectoriales: `GraphicsContext` compartido si el spike lo justifica.
- Menús y cartas: HTML/CSS + SVG cuando mejore responsive y accesibilidad.
- SVG complejo: master editable y validación; rasterización en build solo como fallback medido cuando el destino o el presupuesto lo exijan, nunca como sustituto por defecto del SVG fuente.

## Invariantes

- No parsear SVG complejo durante gameplay ni reconstruir `Graphics` cada frame.
- No usar filtros SVG incompatibles o blur caro por entidad.
- Reutiliza texturas/contextos y destruye recursos con ownership explícito.
- La prioridad es hazard crítico > player > boss > enemigos > armas > XP > FX > fondo.
- Color nunca es la única señal de un peligro importante.
- Gameplay emite estado/eventos; renderer no aplica daño ni decide drops.
- Low puede reducir partículas, trails y glow, nunca telegraphs o entidades reales.

## Procedimiento

1. Define tamaño en pantalla, número máximo de instancias y frecuencia de cambio.
2. Elige la representación más barata que mantenga el resultado.
3. Conserva SVG semántico, centrado, recoloreable y sin metadata innecesaria.
4. Integra animación mediante transforms y recetas FX presupuestadas.
5. Revisa resultado en tamaños pequeño/grande, fondo claro/oscuro y presets Low/High.

## Validación

- perfil de draw calls, frame time, memoria y cambios de textura cuando sea crítico;
- comparación visual del SVG antes/después de optimizar;
- prueba de jerarquía visual durante el máximo caos esperado;
- ninguna regresión en pointer mapping o responsive.
