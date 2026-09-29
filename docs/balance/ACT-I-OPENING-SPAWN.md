# Ajuste puntual: apertura del Acto I

**Estado:** prueba local; pendiente de validación humana.

El intervalo de aparición del Acto I cambia solo durante los primeros 30 s:

| Tiempo del acto | Intervalo | Cambio |
| --- | ---: | --- |
| 0:00–0:30 | 1.00 s | Antes: 0.85 s |
| 0:30–1:00 | 0.85 s | Se recupera el ritmo anterior |
| 1:00 en adelante | Sin cambios | 0.70 s desde 1:00; luego sigue la curva actual |

Esto reduce aproximadamente 15% los ciclos de aparición programados en la ventana
inicial frente al intervalo previo, sin tocar vida, daño, experiencia,
composición, hazards ni la entrada del boss. Actos II y III no cambian.

El alcance es la campaña del Acto I. Overdrive conserva su curva radial previa
para no alterar el balance de ese modo, que tiene su propia presión por tramo.

La curva y sus fronteras están cubiertas por tests de `DifficultyDefinitions` y
`RadialActDirector`; el contrato de Overdrive comprueba que mantiene el intervalo
anterior. La prueba aún necesita validación manual del usuario para confirmar
que la apertura se siente menos cargada sin retrasar demasiado la primera carta.
