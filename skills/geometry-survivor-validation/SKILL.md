---
name: geometry-survivor-validation
description: Probar, auditar o cerrar features y fases de Geometry Survivor mediante tests, CI, smoke browser, profiling y criterios de aceptación. Usar para verificación, regresiones, release readiness o cuando una puerta del plan deba demostrarse.
metadata:
  short-description: Tests, CI y puertas de calidad
---

# Validación y puertas

No declares terminado lo que no tenga evidencia proporcional al riesgo.

## Contexto requerido

Lee `../../PLAN_DESARROLLO.md`, especialmente “Estrategia de pruebas”, “Fases y puertas”, “Métricas de decisión” y “Definition of Done”. Usa además la skill del dominio validado.

## Capas de prueba

- Unit: simulación, fórmulas, spatial grid, director, upgrades, estados y migraciones sin Pixi.
- Integration: sistemas conectados con semilla, pools y eventos tipados.
- Browser smoke: carga, input, pausa, level-up, anuncio simulado, storage, resize y consola.
- Visual: estados deterministas importantes; no bloquear por partículas aleatorias.
- Manual móvil: run completa, rotación, background/foreground, audio y ahorro de energía.
- Portal: Poki Inspector y CrazyGames Preview en la fase de plataforma.

## Procedimiento

1. Deriva casos de la aceptación de la tarea y de la puerta de fase.
2. Ejecuta primero pruebas específicas y luego la suite proporcional.
3. Usa semillas y contadores explícitos para reproducibilidad.
4. Comprueba errores de consola, requests 404, bundle size y presupuestos relevantes.
5. Si una comprobación no puede ejecutarse, sepárala de los resultados confirmados y deja el paso exacto pendiente.

## Reglas

- Un test no debe afirmar rendimiento sin medir un escenario real.
- Evita snapshots de texto o estructura que no demuestren comportamiento.
- No cambies código de producción solo para satisfacer un test incorrecto.
- CI debe impedir deploy cuando fallen typecheck, tests, build o presupuestos duros.
- La ausencia de errores no demuestra diversión: las puertas de game feel requieren runs humanas.

## Informe

Resume resultado, comandos/ambientes, evidencia, riesgos residuales y puerta aprobada o rechazada. No ocultes warnings materiales.
