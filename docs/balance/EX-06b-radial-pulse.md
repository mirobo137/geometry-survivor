# EX-06b — Pulso radial del Acto I

Estado: **AUTOMÁTICO OK; espera de validación humana**.

Esta entrega convierte la identidad radial del Acto I en una regla jugable: una
onda anular cruza la arena y obliga a leer distancia, centro y borde. No añade
enemigos, no cambia la vida/daño existentes y no cierra la pasada de balance
EX-02c.

## Contrato authored

| Parámetro | Valor | Intención |
| --- | ---: | --- |
| Primer aviso | 92 s | aparece antes del boss y después de que el jugador conozca la arena |
| Intervalo | 52 s | cuatro ventanas posibles antes del boss |
| Último inicio | 250 s | nunca invade la entrada del boss a 260 s |
| Telegraph | 1.1 s | anillo discontinuo, dirección y marcadores visibles; no daña |
| Ataque | 1.6 s | banda que recorre el radio completo |
| Recovery | 0.6 s | residuo visual sin colisión |
| Ancho | 28 u | lectura clara sin ocupar toda la arena |
| Daño | 16 | provisional; queda sujeto a EX-02c |
| Bolsillo interior | 72 u | refugio central fuera del ancho de la banda |
| Margen exterior | 8 u | reserva espacio para el cuerpo del player en el borde |

La primera onda viaja desde el bolsillo interior hacia el bolsillo exterior y la
siguiente invierte el sentido. La alternancia es determinista por cast, no
depende de FPS ni de una tirada aleatoria. La banda captura su radio
inicial/final al empezar para que una expansión de arena no cambie una onda a
mitad de recorrido.

## Respuesta del jugador

El telegraph no hace daño. Durante el ataque sólo existe una banda circular y
el jugador puede entrar a cualquiera de los dos bolsillos: el centro queda
dentro del radio interior y el perímetro queda fuera del radio exterior,
considerando el cuerpo del player y el ancho de la onda. Un player en la zona
media sí debe apartarse durante el telegraph. La colisión usa el cruce barrido
entre radios consecutivos y aplica como máximo un impacto por cast. El pulso no
pinta una zona segura opaca: el espacio libre debe seguir siendo legible junto
con enemigos, player y láseres.

## Arbitraje y seguridad

- Un láser ya telegraphed/active/recovery nunca se cancela.
- Mientras el pulso no está idle, el láser no puede iniciar un nuevo disparo.
- Mientras el láser no está idle, el pulso conserva su próxima marca y espera.
- Si la espera supera 250 s o el boss está activo, el pulso se descarta para
  ese acto; no se desplaza accidentalmente al encuentro del Core Sentinel.
- No se permite solapamiento authored entre pulso y láser/boss, por lo que no
  se crea una combinación que cierre toda salida.

La implementación vive en `RadialPulseHazard`, su definición está en
`RadialPulseDefinition`, y la vista en `RadialPulseView`. La vista reutiliza
una jerarquía acotada de 10 `Graphics` y 2 `Container`, conserva la señal
completa en Low y sólo reduce marcadores decorativos en calidad baja. La receta
visual está en `docs/design/RADIAL_PULSE_FX_PREMIUM.md`. La presentación no
decide radio, daño ni fase.

## Evidencia automática

- `RadialPulseHazard.test.ts`: telegraph sin daño, un hit por cast, recovery
  inofensiva, alternancia, deadline, boss arbitration y reset.
- `RadialPulseView.test.ts`: visibilidad de telegraph/attack/recovery y set de
  objetos acotado entre frames/calidades.
- `LaserHazard.test.ts` y `CombatSimulation.test.ts`: regresión del láser y
  reset de la simulación.

La aceptación humana aún debe comprobar en desktop y móvil que la dirección se
entiende, que existe una salida cómoda con enemigos presentes y que la presión
añadida diferencia el Acto I sin volverlo injusto. El daño final no se ajusta
en esta unidad.
