# EX-06d — decisión de cadencia de hazards

## Propósito

El usuario probó el perfil de mayor frecuencia y decidió adoptarlo como cadencia
principal del Acto I. Es una decisión de ritmo, no un ajuste de daño:
no cambia vida de enemigos, daño, ancho, telegraph, ataque, recuperación,
refugios, spawn, recompensas ni el boss.

## Línea base protegida

El perfil principal ahora es `chaos` y conserva el contrato de seguridad:

- pulso radial: primer disparo a 92 s y último inicio a 250 s; su intervalo
  principal es un tercio del authored histórico;
- láser: primer disparo a 45 s; sus intervalos principales son un tercio de los
  authored históricos según la forma;
- el arbitraje sigue impidiendo que un hazard nuevo empiece durante el otro.

Las nuevas runs de `?baseline=1` usan chaos y deben comenzar en el storage de
baseline v2. Las dos runs registradas antes de esta promoción pertenecen al
control histórico y no se mezclan con la nueva línea base.

## Perfiles disponibles

Abrir el juego con:

```text
?hazards=chaos&debug=1&quality=high
```

Este perfil es el comportamiento normal aunque el parámetro se omita. Multiplica
por `1/3` los intervalos de ambos hazards: es aproximadamente tres veces la
cadencia authored. El número visible real puede ser menor porque se conserva el
arbitraje y el pulso deja de iniciar en la ventana del boss. El primer disparo
permanece en su tiempo original para que la promoción no mezcle “aparece antes”
con “aparece más seguido”.

Para comparar con el ritmo anterior, usar sólo `?hazards=authored&debug=1`.
Ese perfil es un control histórico y no debe usarse para registrar baseline.

El panel debug muestra `hazards: chaos`. Si el parámetro falta o es inválido,
el juego vuelve a `hazards: chaos`. `?baseline=1&hazards=authored` no activa el
registrador, para evitar mezclar cadencias.

## Runs posteriores a la promoción

Registrar por separado:

1. si el jugador detecta cada telegraph sin confundirlo con feedback decorativo;
2. si hay tiempo de respuesta y dos bolsillos seguros siguen siendo cómodos;
3. si rayos y pulsos se sienten como decisiones espaciales, no como ruido;
4. si el boss conserva prioridad y la pantalla sigue siendo legible;
5. calidad, dispositivo, navegador, resultado, daño inevitable percibido y
   frecuencia aproximada observada.

La promoción visual/humana del usuario no cierra por sí sola EX-06d. Completar
las diez runs formales con el perfil principal, registrar legibilidad, tiempo de
respuesta, bolsillos seguros, resultado y dispositivo. Si el ritmo requiere
corrección, cambiar intervalos en una tarea explícita de balance; no compensar
reduciendo daño o vida de enemigos en esta fase.

## Validación reducida aceptada — 11-09-2026

Las dos runs compartidas por el usuario se registran como evidencia suficiente
para avanzar con el trabajo estructural: ambas fueron victorias con boss
derrotado en calidad High, a 59.97 FPS, con 11–12 enemigos, 20 proyectiles y
45–47 FX. No sustituyen una muestra estadística de diez runs ni prueban por sí
solas todos los criterios de legibilidad, evasión y móvil.

Por decisión de producto, las ocho runs restantes quedan **PENDIENTES** y no
bloquean EX-07a. Se conserva la opción de completarlas en una auditoría
posterior con `?baseline=1`; no se deben mezclar con el registro histórico ni
usar su ausencia para justificar cambios de daño, vida o spawn.

## Contrato para futuras iteraciones

Las variaciones de frecuencia deben entrar como un perfil tipado, mantener un
modo authored intacto y poder probarse con una URL explícita. Nunca se debe
editar `LASER_DEFINITION` o `RADIAL_PULSE_DEFINITION` directamente para una
prueba temporal: eso contaminaría comparaciones históricas y el reporte de diez
runs.
