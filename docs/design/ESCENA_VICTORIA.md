# Escena de victoria

Implementación: 05-10-2026. Estado y aceptación en el plan único, sección F.

## Contrato

- `src/ui/VictorySceneOverlay.ts` y `victory-scene.css`, coordinados por `Game`.
- Se activa una sola vez al terminar un acto con victoria o superar un reto
  semanal de Bitácora, incluidas sus pruebas/prácticas. No celebra cobros de
  objetivos ni cada boss de Overdrive, que conserva su transición de etapa.
- Apertura radial dorada/cian, anillo expansivo, horizonte luminoso y emblema.
  Textos: ACTO COMPLETADO / ACT COMPLETE o RETO SUPERADO / CHALLENGE COMPLETE,
  con subtítulos registrados en el catálogo i18next y traducidos por el
  observador DOM existente.
- Usa la espera terminal existente de tres segundos; no cambia liquidación,
  recompensas, guardado, daño ni la animación del jugador al morir.
- Seis capas DOM fijas reutilizadas, sin PNG nuevos, dependencia, filtros,
  partículas, temporizadores propios ni otro loop. CSS pausado se muestrea
  mediante delay negativo desde el reloj de presentación terminal.
- Low elimina rayos y anillo. Movimiento reducido conserva fades y texto sin
  expansión/rotación. La capa no captura input y es decorativa (`aria-hidden`);
  el resumen conserva la información accesible del resultado.
- Resumen, nueva partida, revive y regreso al menú cierran la capa. Shutdown
  elimina el DOM. La derrota conserva su escena independiente.

## Evidencia local

Typecheck y suite completa previa a añadir la aserción semanal: 785 pruebas /
139 archivos; Game focalizado final: 41 pruebas. Build development correcto.
Chromium comprobó la capa aislada en 390×844, 1280×720 y 844×390: títulos ES/EN
sin desbordamiento, movimiento reducido, cierre a tres segundos y eliminación.
Estos checks no equivalen a medir rendimiento en móvil físico ni a completar
el flujo del portal; la integración de victoria/resumen se comprobó en unitarias.
