# EX-03b — observaciones humanas de las runs baseline

## Estado actualizado — 10-09-2026

La condición de dedos gruesos ya tiene resolución implementada: `relative-touch`
fija un origen invisible y usa el desplazamiento del gesto para definir la
dirección, sin exigir que el dedo permanezca sobre el player. Se ofrece desde
inicio y pausa, se persiste en `SaveStore` y quedó validada en el smoke mobile
de Pixel 5. `auto` y `touch` conservan el comportamiento anterior. Esta
condición ya no bloquea EX-03; el reporte numérico de 10/10 ya fue recibido y
el usuario confirmó el contexto de navegador, duración y origen de la
anomalía de telemetría.

Fecha del registro: 10-09-2026
Estado: CERRADO por evidencia automática y validación humana del usuario
Fuente: reporte del usuario después de probar las diez runs en las calidades disponibles

## Entorno declarado

- Teléfono principal: Samsung S25+, usando Chrome.
- También probado en PC usando Chrome y Edge; la última sesión duró 5 minutos.
- El usuario confirma que la build quedó correcta. Sistema operativo y versiones
  exactas de navegador no fueron copiados al reporte y quedan como metadato
  opcional, no como bloqueo de esta puerta.
- También hubo pruebas exploratorias en móviles de menor gama, pero sin datos
  comparables suficientes para usarlas como baseline.
- Low, Medium y High fueron probados; el reporte recibido contiene medium 4,
  low 1 y high 5, y queda conservado íntegramente en el anexo numérico.

## Respuestas de la puerta EX-03b

| Criterio | Resultado | Nota |
| --- | --- | --- |
| Softlock | No | No se observó ninguno. |
| Pérdida de progreso | No | No se observó. |
| Daño inevitable | No | El jugador pudo responder a las amenazas. |
| Controles | Sí, con condición | En móvil, dedos gruesos pueden tapar al player; hace falta una segunda opción de desplazamiento. |
| Telegraphs y lasers | Sí | Se entendieron durante la partida. |
| Decisiones de cartas | Sí | Cambian la estrategia y el recorrido. |
| Builds diferentes | Sí | Produjeron recorridos distintos. |
| Diferencia Low/Medium/High | Casi no | La diferencia visual fue pequeña. |
| Stutter o saturación | No | No se percibieron problemas relevantes. |
| Calidad preferida | High | El usuario considera que Low podría no mostrar una diferencia perceptible. |
| Comprensión inicial | Sí | Una persona nueva entendió el juego a la primera. |

## Hallazgo de controles móviles

El resultado no invalida el movimiento, pero sí deja una condición de aceptación:
probar una segunda modalidad de desplazamiento o una solución de posición del
control que evite que un dedo grueso cubra totalmente al player. No decidir la
implementación desde este documento; debe conservar precisión, no interferir con
el canvas y validarse en el Samsung S25+ y en un móvil de menor gama.

## Hallazgos de balance — no aplicar todavía

Estos hallazgos se registran para EX-02c, que permanece diferida hasta la pasada
final de daño, vida y resistencia de enemigos:

- Doble cañón elimina de un golpe a los primeros enemigos y parece demasiado
  fuerte al combinarse con disparo rápido.
- Chain Lightning con mejoras de daño escala fuerte en late game.
- Prism Aegis / órbita geométrica se siente débil.

No cambiar porcentajes, vida, daño ni resistencia por estas observaciones antes
de completar la matriz de balance prevista.

## Actualización — reporte numérico recibido — 10-09-2026

Las diez runs ya están ejecutadas y ahora también quedó recibido el texto
numérico exportado por `?baseline=1`. El reporte contiene 8 victorias y 2
game-over, con primera subida en 00:09 y boss en 04:20 para las 8 victorias.
La distribución de calidad de esta muestra es medium 4, low 1 y high 5.

El reporte íntegro, sin resumir ni reinterpretar las cartas elegidas, está en
[EX-03b-baseline-report-2026-09-10.md](EX-03b-baseline-report-2026-09-10.md).
La línea `Run en curso: si` es una undécima run iniciada al copiar y no cambia
el resultado 10/10.

La única anomalía detectada en los números es que las runs #6–#9 dicen `FPS
medio 16.67` aunque su `frame medio` es 16.67 ms. El usuario confirmó que fue
un error del reporte: revisando las métricas en todo momento, la caída real más
alta fue a 56 FPS. No se interpreta como una caída a 16 FPS.

## Metadatos opcionales posteriores al cierre

El texto copiado desde `?baseline=1` ya quedó conservado sin editarlo en
`EX-03b-baseline-report-2026-09-10.md`. Completar todavía:

```text
Commit probado:
Modelo exacto:
Sistema operativo:
Navegador y versión:
Calidades y número de runs por calidad:
Meta equipada:
Revive usado (run/cantidad):
Reroll usado (run/cantidad):
¿Se compró algún nivel durante las diez runs?: no / aclarar
¿Se cambió balance o build base entre runs?: no / aclarar
Siguiente observación nueva o reproducción pendiente:
```

La puerta EX-03b queda cerrada: la condición de controles móviles tiene una
decisión e implementación explícita, las diez runs están registradas y el
usuario confirmó la anomalía como error de reporte. El sistema operativo,
versiones exactas de navegador, commit y métricas numéricas del S25+ pueden
añadirse después para mejorar la trazabilidad histórica, pero no bloquean el
avance del plan.

## Cierre EX-03 — 10-09-2026

El usuario confirma que las pruebas se realizaron en PC con Chrome y Edge, y en
Samsung S25+ usando Chrome. Compras, revive, reroll y duplicar NOVA funcionan
correctamente; la build quedó correcta; la última sesión duró 5 minutos; y la
telemetría de 16 FPS fue errónea, con una caída real máxima observada de 56 FPS.

Con esta confirmación, EX-03 queda **CERRADO**. No se modifica el balance
pendiente de EX-02c ni se inventan métricas de p95 móvil.
