# EX-03b — observaciones humanas de las runs baseline

Fecha del registro: 06-09-2026  
Estado: EVIDENCIA CUALITATIVA RECIBIDA; baseline numérico pendiente  
Fuente: reporte del usuario después de probar las diez runs en las calidades disponibles

## Entorno declarado

- Teléfono principal: Samsung S25+.
- También probado en PC; modelo, sistema, navegador y versión exactos quedan
  pendientes de registrar.
- También hubo pruebas exploratorias en móviles de menor gama, pero sin datos
  comparables suficientes para usarlas como baseline.
- Low, Medium y High fueron probados; falta anotar cuántas runs corresponden a
  cada calidad y conservar el reporte automático de cada sesión.

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

## Datos todavía necesarios para cerrar el reporte

Pegar aquí el texto copiado desde `?baseline=1` sin editarlo. Antes del texto,
completar:

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

La puerta EX-03b no se marca cerrada hasta conservar este reporte numérico y
resolver la condición de controles móviles o registrar su decisión explícita.
