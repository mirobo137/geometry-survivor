# Audio de juego con ZzFX

## Decisión

Howler es dueño de la música de fondo. Los efectos cortos son recetas
procedurales del sintetizador ZzFXMicro 1.3.2; ZzFX no ofrece un catálogo de
grabaciones listas, sino parámetros para generar cada sonido. La implementación
usa la síntesis ZzFX completa de 21 parámetros, adaptada para escribir en el
`AudioContext` que Howler desbloquea. No se importa el entrypoint original
porque crea su propio contexto al cargar y rompe el desbloqueo móvil diferido.

La señal sintetizada se cachea como `AudioBuffer` al primer uso de cada cue y
después sólo se crean fuentes livianas para reproducirla. El bus limita la
mezcla a ocho voces y cada cue tiene cooldown. No hay archivos de efecto,
requests de red ni trabajo de audio en la simulación. UI y combate comparten
el control persistente de volumen SFX/silencio, pero tienen categorías
distintas para respetar el lifecycle. El aviso MIT está en
`public/third-party-licenses/zzfx.txt` y se copia a los builds.

## Cobertura actual

| Grupo | Cues/eventos |
| --- | --- |
| Nave y combate | Disparo básico, impacto enemigo, golpe crítico, muerte enemiga, daño al jugador y bloqueo de escudo |
| Armas | Órbita evolucionada, rayo en cadena, búmeran y su retorno, Pulse Ring y Magnetic Charge; el impacto común cubre la colisión constante de Orbit Blade |
| Amenazas | Avisos de charger/orbiter/prism/fracture, hazards de arena, telegraph del boss, llegada/derrota del boss y transformación de arena |
| Progresión/entrada | Subida de nivel, entrada a run, transición entre tramos, recompra meta/cosméticos y recompensa recibida |
| Interfaz | Click, confirmar, volver, seleccionar carta/pestaña/ruta y cambios de controles/volumen |

No existe un pickup físico de experiencia: se concede directamente al derrotar
enemigos y se comunica con muerte/level-up, sin inventar un sonido de colección
para algo que no ocurre.

## Contrato para añadir o ajustar un sonido

1. Añadir el nombre y la receta en `src/content/audio/AudioCueDefinitions.ts`.
   Cada receta sigue el orden de parámetros documentado en el encabezado del
   archivo. Usa notas cortas para sucesos frecuentes; reserva colas largas para
   eventos raros como entrada o derrota del boss.
2. Emitirlo en `Game` cuando exista un evento/snapshot de presentación fiable.
   No importar audio desde `simulation`, `content` ni comportamientos de armas.
3. Asignar categoría `gameplay` o `ui`. La música no se define aquí: pertenece
   exclusivamente a `HowlerMusicBackend`.
4. Dar a impactos repetidos cooldown y mantener el límite de voces. No generar
   un sonido por cada enemigo/partícula de una ráfaga; agrupar eventos del mismo
   tick y dejar que el cooldown suprima repeticiones.
5. Comprobar mute, volumen cero, pausa, revive, retorno de anuncio y primer
   gesto en navegador móvil. Los cues de interfaz pueden sonar durante pausa;
   los cues de combate nuevos no. Las voces cortas ya iniciadas terminan sin
   interrumpirse abruptamente.

El sintetizador no asigna prioridad automática a música vs. efectos: esa mezcla
se controla por buses/ganancias y presupuesto de voces. Si se introduce un cue
que compite con telegraphs importantes, reducir antes los impactos repetidos;
no bajar la legibilidad del aviso crítico.
