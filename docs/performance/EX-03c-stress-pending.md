# EX-03c — perfil de stress pendiente

Estado: plantilla preparada; datos reales pendientes  
Objetivo: comparar el escenario de stress en Low, Medium y High sin confundir
el p95 rolling del instrumento con p95 de toda la run ni con una medición de GPU.

## Procedimiento para mañana

Usar el mismo build/commit y el mismo dispositivo cuando se comparen calidades.
Abrir cada variante con:

```text
?stress=1&profile=1&quality=low
?stress=1&profile=1&quality=medium
?stress=1&profile=1&quality=high
```

Para cada sesión:

1. Anotar dispositivo, navegador, calidad y hora.
2. Dejar correr una ventana de observación comparable y registrar la duración
   exacta; no presentar una instantánea como duración de run.
3. Copiar o capturar el panel debug con frame medio, p95 rolling, máximo y
   conteos reales.
4. Registrar si los conteos realmente mantuvieron activos enemigos,
   proyectiles y FX; no escribir un presupuesto teórico.
5. Comprobar legibilidad del player, enemigos, lasers, boss y UI, además de
   input, audio, pausa y retorno de background si la sesión lo permite.

## Tabla de captura

| Calidad | Dispositivo/navegador | Duración | Frame medio | p95 rolling | Frame máximo | Max enemigos | Max proyectiles | Max FX | Legibilidad / incidencias |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Low | pendiente | pendiente | pendiente | pendiente | pendiente | pendiente | pendiente | pendiente | pendiente |
| Medium | pendiente | pendiente | pendiente | pendiente | pendiente | pendiente | pendiente | pendiente | pendiente |
| High | pendiente | pendiente | pendiente | pendiente | pendiente | pendiente | pendiente | pendiente | pendiente |

## Comparación humana

Responder después de las tres sesiones:

- ¿El player sigue visible con muchos enemigos y FX?
- ¿Los telegraphs de laser y boss conservan contraste?
- ¿La órbita, Chain Lightning y proyectiles se distinguen entre calidades?
- ¿Hay stutter, calentamiento o input perdido?
- ¿Qué calidad recomendarías por defecto en el Samsung S25+?
- ¿Qué ocurre en el móvil de menor gama probado?

Los datos de PC sirven como comparación, pero no sustituyen la medición del
Samsung S25+ ni permiten generalizar a todos los móviles. Este perfil no cierra
EX-03c hasta que existan datos de las tres calidades y observaciones reales.
