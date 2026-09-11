# EX-06d — experimento de cadencia de hazards

## Propósito

Medir si el Acto I gana tensión y diferenciación cuando los rayos y pulsos
aparecen con mayor frecuencia. Es una prueba de ritmo, no un ajuste de daño:
no cambia vida de enemigos, daño, ancho, telegraph, ataque, recuperación,
refugios, spawn, recompensas ni el boss.

## Línea base protegida

La línea base usa el perfil `authored` y conserva el contrato aprobado:

- pulso radial: primer disparo a 92 s, intervalo de 52 s y último inicio a 250 s;
- láser: primer disparo a 45 s, intervalos de 18/14/10.5 s según la forma;
- el arbitraje sigue impidiendo que un hazard nuevo empiece durante el otro.

Las 10 runs de `?baseline=1` deben seguir ejecutándose sin `hazards=chaos`.
Un reporte baseline no se mezcla con este experimento.

## Perfil de prueba

Abrir el juego con:

```text
?hazards=chaos&debug=1&quality=high
```

Este perfil multiplica por `1/3` los intervalos de ambos hazards. Por tanto,
prueba hasta aproximadamente tres veces la cadencia authored; el número visible
real puede ser menor porque se conserva el arbitraje y el pulso deja de iniciar
en la ventana del boss. El primer disparo permanece en su tiempo original para
que la comparación no mezcle “aparece antes” con “aparece más seguido”.

El panel debug muestra `hazards: chaos`. Si el parámetro falta o es inválido,
el juego vuelve a `hazards: authored`.

## Qué observar en 2–3 runs exploratorias

Registrar por separado:

1. si el jugador detecta cada telegraph sin confundirlo con feedback decorativo;
2. si hay tiempo de respuesta y dos bolsillos seguros siguen siendo cómodos;
3. si rayos y pulsos se sienten como decisiones espaciales, no como ruido;
4. si el boss conserva prioridad y la pantalla sigue siendo legible;
5. calidad, dispositivo, navegador, resultado, daño inevitable percibido y
   frecuencia aproximada observada.

No usar estas runs para cerrar la línea base ni declarar balance aprobado. Si el
ritmo se siente correcto, la siguiente tarea será convertir una cadencia elegida
en contenido authored y repetir la puerta humana de EX-06d. Si se siente
excesivo, ajustar intervalos de contenido en una tarea explícita de balance;
no compensar reduciendo daño o vida de enemigos en esta fase.

## Contrato para futuras iteraciones

Las variaciones de frecuencia deben entrar como un perfil tipado, mantener un
modo authored intacto y poder probarse con una URL explícita. Nunca se debe
editar `LASER_DEFINITION` o `RADIAL_PULSE_DEFINITION` directamente para una
prueba temporal: eso contaminaría comparaciones históricas y el reporte de diez
runs.
