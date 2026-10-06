# Escena de derrota — contrato visual

Implementación del 05-10-2026, pendiente de comprobación y aceptación.
Consumidores: `src/ui/DefeatSceneOverlay.ts`, `src/ui/defeat-scene.css` y
coordinación en `src/app/Game.ts`.

La animación existente de la nave en PlayerView y sus 2,2 s permanecen intactos.
La escena ocupa el contenedor completo, incluido el espacio fuera del mundo
lógico, durante la espera existente de 3 s previa al resumen. No alarga la
partida ni modifica daños, resultados, recompensas o disponibilidad de revive.

Coreografía: pulso luminoso único y tenue, onda y facetas que se separan,
oscurecimiento de los bordes y bandas cinematográficas. El título aparece
después del impacto y desaparece antes del resumen. En partida normal dice
«SEÑAL PERDIDA»; en retos semanales y rutas de práctica dice
«RETO INTERRUMPIDO». Los retos sin impactos activan también la animación
existente del jugador al fallar con vida restante; no simulan daño adicional.
Victoria y retirada voluntaria de Overdrive no activan esta escena.

El montaje DOM se realiza una vez por Game. Son ocho capas fijas, sin imágenes,
filtros, partículas dinámicas, listeners ni temporizadores propios. Las curvas
CSS finitas animan transform y opacidad; permanecen pausadas y se muestrean con
un delay negativo recibido del mismo delta de la animación de muerte.

Low omite facetas y onda; movimiento reducido omite además destello y horizonte,
conservando sólo fade, texto y encuadre estático. Toda la escena ignora eventos
de puntero. Es decorativa y `aria-hidden`; el resumen existente comunica el
resultado accesible y proporciona los botones de salida.

El resumen, la activación de una run, revive y regreso al menú cierran la escena.
Shutdown retira el nodo DOM. No acumula capas al reintentar.

Comprobado el 05-10-2026: `npm run typecheck`; suite unitaria completa con
Vitest (758 tests / 134 archivos); build `vite build --configLoader runner
--mode development`; smoke Chromium del acceso directo al boss (1 prueba).
`Game.test.ts` confirma que el fallo no-hit activa el player defeat y la escena
con los indicadores `weeklyChallenge` y `noHitFailure`. También se montó la
escena real en Chromium vía Vite y se comprobó en 390×844 y 1280×720: cubre el
viewport, muestra el texto del fallo semanal, ignora puntero, avanza el reloj y
se cierra correctamente. Sigue pendiente el flujo browser de una run real
(muerte normal/no-hit hasta resumen, revive y reintento), movimiento reducido
y aceptación en móvil físico.
