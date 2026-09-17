# EX-11 — Plan de implementación del modo Infinito

Estado: **implementación incremental; EX-11.1 a EX-11.5 completados automáticamente**
Última actualización: 2026-09-17

Este documento es el contrato de trabajo para implementar el modo Infinito después del Acto III. La intención es reutilizar los actos, enemigos, bosses, arenas, armas, evoluciones y efectos ya validados, sin crear variantes visuales ni un sistema de combate paralelo.

## 1. Decisiones cerradas

- Infinito se desbloquea al derrotar al boss del Acto III.
- Es una partida independiente que comienza con **build limpia**. Conserva únicamente las mejoras permanentes que ya aplican a una partida normal.
- La build conserva armas, evoluciones, mejoras, experiencia y nivel entre tramos.
- Comienza con un máximo de tres familias de armas. Cuando las tres evolucionan, se habilitan las otras tres; no se exige completar las mejoras posteriores a la evolución.
- Los multiplicadores definidos aquí afectan la vida máxima de enemigos y bosses. No modifican daño, velocidad ni resistencia porcentual.
- Los encuentros dobles empiezan después de completar tres vueltas, es decir, después de derrotar nueve bosses.
- Entre tramos el jugador recupera 25% de su vida máxima, sin superar el máximo.
- El balance global de daño, vida y resistencia sigue siendo una tarea posterior. Este modo no debe ocultar ni sustituir esa calibración.

Como referencia de diseño, Brotato reutiliza bloques de oleadas, introduce encuentros con varios bosses y separa el escalado de dificultad de límites como la velocidad. Se toma como referencia conceptual, no como fórmula ni como copia de economía: <https://brotato.wiki.spellsandguns.com/Endless_Mode>.

## 2. Modelo de tramos y vueltas

Un **tramo** es una secuencia de aparición, arena, hazards y boss. Una **vuelta** contiene tres tramos. El reloj de cada tramo comienza en cero, mientras que el tiempo total de la partida continúa acumulándose.

| Vuelta | Tramos | Familias principales | Perfil de arena | Vida de enemigos y bosses | Bosses simultáneos |
|---|---:|---|---|---:|---:|
| 1 | 1–3 | Acto I → II → III | Acto I → II → III | ×1 → ×3 → ×6 | 1 |
| 2 | 4–6 | Acto I → II → III con invitados | Acto II → II → III | ×9 → ×12 → ×15 | 1 |
| 3 | 7–9 | Acto I → II → III con más invitados | Acto II → II → III | ×18 → ×21 → ×24 | 1 |
| 4 en adelante | 10+ | Mezcla de los tres actos | Acto III | ×27, ×30, ×33… | 1 o 2 |

Un tramo termina cuando se derrotan todos los bosses de su encuentro, no cuando se cumple solamente el tiempo. El siguiente tramo no comienza mientras quede un boss vivo.

### Fórmula de vida

Para el tramo `n`, empezando en 1:

```text
multiplicador(n) = 1, si n = 1
multiplicador(n) = 3 × (n - 1), en los demás casos

vida final = vida base de la definición × multiplicador(n)
```

Reglas obligatorias:

- Calcular siempre desde la definición base; nunca multiplicar la vida ya escalada del tramo anterior.
- Aplicar el multiplicador una sola vez a hijos del Splitter y réplicas, respetando después su coeficiente propio.
- Un enemigo invitado recibe el multiplicador del tramo actual, aunque pertenezca a otro acto.
- Cambiar el balance base de un enemigo debe actualizar Infinito automáticamente.
- No multiplicar experiencia, daño, velocidad ni recompensas por este factor.
- Limitar el resultado a `1_000_000_000` por seguridad numérica; este límite no es una decisión de balance.

## 3. Composición de enemigos y presión

La primera vuelta debe reproducir las secuencias y frecuencias actuales de los tres actos sin alterar sus perfiles.

En la segunda vuelta, cada aparición normal utiliza la composición principal del tramo con 80% de probabilidad. El 20% restante selecciona uno de los otros dos actos con igual probabilidad y luego uno de sus cuatro enemigos normales también con igual probabilidad.

En la tercera vuelta se utiliza 65% de composición principal y 35% de invitados.

Desde el tramo 10 se elige primero uno de los tres actos con igual probabilidad y luego uno de sus cuatro enemigos normales con igual probabilidad.

No incluir en esta selección a bosses, réplicas, hijos ni fragmentos del Splitter. Esas entidades solamente se crean mediante sus mecánicas originales.

Multiplicador de presión de aparición:

```text
vuelta 1: 1,00
vuelta 2: 1,15
vuelta 3: 1,30
vuelta 4+: min(1,75; 1,40 + 0,10 × (vuelta - 4))
```

El intervalo mínimo es `0,20 s`. Si el pool está lleno, no acumular una ráfaga pendiente para ejecutarla después. Posponer el spawn evita una explosión de entidades al liberarse el pool.

## 4. Arenas y hazards

- La primera vuelta utiliza exactamente las transformaciones, peligros, telegraphs y restricciones actuales de cada acto.
- Separar la familia de enemigos del perfil de arena. Por ejemplo, enemigos del Acto I en un tramo con arena del Acto II reciben los hazards y transformaciones del Acto II.
- Hasta el tramo 9 se conservan las entradas actuales de bosses: Acto I a 260 s, Acto II a 260 s y Acto III a 250 s.
- Desde el tramo 10 se usa la cronología del Acto III y boss a 250 s.
- Aumentar la presión no significa reducir los tiempos de reacción de los telegraphs.
- En un encuentro doble la arena permanece circular y estable para que el reto proceda de los bosses, no de la combinación de dos transformaciones impredecibles.

No reutilizar `CombatSimulation.reset()` para cambiar de tramo, porque ese reset borra armas, XP y modificadores.

Crear una transición específica:

1. Confirmar que todos los bosses del encuentro fueron derrotados.
2. Retirar enemigos y amenazas restantes sin otorgar bajas, XP ni recompensas.
3. Limpiar proyectiles y FX transitorios, incluidas referencias a objetivos retirados.
4. Conservar build, XP, modificadores y tiempos restantes de recarga.
5. Recuperar 25% de vida máxima, con tope en la vida máxima.
6. Mostrar durante tres segundos `Vuelta X · Tramo Y`.
7. Reconfigurar arena, director y hazards; reiniciar solamente el reloj del tramo.

Durante la transición no debe existir daño ni avance de recargas. Las elecciones de cartas pendientes se resuelven antes de reanudar. Si el jugador quedó fuera del nuevo contorno, reubicarlo dentro de la arena de forma segura.

Si la muerte del jugador coincide con la derrota de un boss, resolver primero muerte/revive. La curación de transición no puede revivir ni evitar una muerte ya resuelta.

## 5. Rotación de bosses y encuentros dobles

Mantener la rotación principal Acto I → Acto II → Acto III.

Desde el tramo 10:

- 50% de probabilidad de añadir un segundo boss.
- Elegirlo entre los otros dos tipos con igual probabilidad.
- No duplicar el mismo tipo de boss en un encuentro.
- Si los dos encuentros anteriores fueron individuales, forzar el siguiente encuentro doble.
- Máximo absoluto: dos bosses vivos.
- No comenzar el tramo siguiente hasta derrotar a ambos.
- Utilizar una semilla para reproducir cada elección.

El engine debe dejar de asumir un solo boss:

- El snapshot de combate debe contener una colección acotada a dos instancias.
- Cada boss necesita un identificador de instancia además de su tipo.
- La definición de aparición debe recibirse explícitamente; no derivarse siempre del director del acto principal.
- Las barras de vida, eventos de derrota, FX y amenazas deben identificar al boss propietario.
- Derrotar un boss no debe limpiar amenazas del otro ni terminar la partida.
- La campaña sigue usando el mismo contrato con una colección de un elemento.

Para evitar daño inevitable:

- Solo un boss puede iniciar o ejecutar un ataque especial a la vez.
- Alternar la prioridad entre bosses y dejar 0,35 s entre ataques completos.
- El boss sin turno conserva movimiento y daño de contacto.
- Esperar a que termine el peligro persistente antes de conceder el turno al otro.
- No iniciar nuevos hazards de arena durante un encuentro doble; dejar terminar los ya anunciados.

## 6. Cartas, armas y progresión

Las seis familias existentes son:

1. Proyectil.
2. Órbita geométrica.
3. Rayo en cadena.
4. Bumerán.
5. Pulse Ring.
6. Magnetic Charge.

Política de arsenal de Infinito:

```text
Límite inicial: 3 familias
Condición de ampliación: las 3 familias iniciales evolucionadas
Límite ampliado: 6 familias
```

La ampliación se activa permanentemente durante la partida. Adquirir una cuarta arma no puede volver a bloquearla.

Conservar la progresión actual: niveles base hasta el 6 y elección de evolución en el nivel 7. Las dos ramas de cada arma siguen siendo excluyentes.

Reglas de ofrecimiento:

- Igual probabilidad entre armas nuevas elegibles; ninguna prioridad para doble cañón.
- Máximo una carta de adquisición de arma nueva por mano.
- Reservar otra posición para progresión de un arma mientras exista nivel, evolución o mejora esencial pendiente.
- Priorizar una evolución lista sobre una mejora ordinaria para evitar postergación infinita.
- Rotar entre familias elegibles para no favorecer siempre la misma arma.
- Completar la mano con pasivas y mejoras post-evolución existentes.
- Las mejoras universales no pueden desplazar permanentemente una evolución.
- Reroll utiliza las mismas reglas y no reinicia condiciones al cambiar de tramo.
- Sustituir todas las comprobaciones que exijan exactamente tres armas evolucionadas por reglas compatibles con cuatro, cinco y seis, únicamente en Infinito. La campaña conserva su límite de tres.

### Cartas de reserva

Cuando ya no existan adquisiciones, niveles, evoluciones ni mejoras ordinarias elegibles, ofrecer cartas repetibles exclusivas de Infinito:

- **Potencia de [arma]:** +5 puntos porcentuales de daño de esa familia, acumulado aditivamente en un multiplicador independiente y válido para sus dos evoluciones y daños secundarios.
- **Reparación:** recupera 25% de vida máxima; solamente elegible si falta vida.

Composición:

- Con vida incompleta: dos familias elegibles y Reparación.
- Con vida completa: tres familias elegibles.

No aumentar indefinidamente proyectiles, cadencia, alcance ni duración. El multiplicador repetible de potencia tiene límite técnico ×1.000. Si se agotan también estas opciones, ofrecer recuperación o una conversión de 25 NOVA respetando el límite total de recompensa de la partida. En el caso extremo se permiten menos de tres cartas.

## 7. Presupuestos y estabilidad

Conservar los presupuestos actuales:

- 250 entidades enemigas, reservando dos posiciones para bosses.
- 300 proyectiles del jugador.
- 48 proyectiles hostiles y 12 minas compartidos entre enemigos y bosses.
- Pools existentes de armas y FX.

No aumentar pools automáticamente por el hecho de tener seis armas. Ante saturación, posponer spawns y nunca producir daño invisible ni cancelar un ataque ya anunciado por falta de capacidad; reservar sus recursos antes del aviso.

Además:

- Limitar historiales diagnósticos a los últimos 256 registros y conservar totales agregados.
- Evitar listas crecientes por carta, baja o tramo.
- Liberar referencias y suscripciones al cambiar de tramo.
- Procesar subidas de nivel masivas por lotes sin perder XP ni bloquear el hilo.
- Validar números finitos y sumas seguras.
- La calidad gráfica puede reducir decoración, nunca geometría de daño ni legibilidad.

## 8. Desbloqueo, guardado y recompensas

Infinito debe ser un modo `campaign | overdrive`, no un cuarto `ActId`.

Persistir como mínimo:

- `overdrive.unlocked`.
- Mejor tiempo total.
- Mayor número de tramos completados.
- Mejor cantidad de bajas.

Migrar el guardado actual con Infinito bloqueado si no existe evidencia de victoria en el Acto III. Tener el Acto III disponible solamente demuestra haber superado el Acto II.

Añadir la entrada de menú **Infinito**. Bloqueada debe mostrar `Derrota al boss del Acto III`. Al vencerlo, permitir iniciar una partida nueva y limpia.

Liquidar NOVA una sola vez al morir definitivamente o retirarse:

- No mostrar victoria terminal ni pagar por cada boss.
- Conservar límites de recompensa y cartera actuales.
- No reiniciar revive, duplicación ni contadores de monetización por tramo.
- Añadir `Retirarse y cobrar` en pausa, con confirmación.
- Una retirada no cuenta como victoria de campaña.

La primera versión no necesita reanudar el combate después de cerrar el navegador. Debe quedar claro que se guardan récords y desbloqueos, no el estado vivo de la run.

## 9. Rutas de depuración

Añadir accesos reproducibles que no entreguen NOVA, récords ni desbloqueos persistentes:

```text
?debug=1&mode=overdrive&od-stage=1
?debug=1&mode=overdrive&od-stage=4
?debug=1&mode=overdrive&od-stage=7
?debug=1&mode=overdrive&od-stage=10
```

Parámetros opcionales:

```text
od-build=starter|three-evolved|six-evolved
od-pair=core-warden|core-fracture|warden-fracture
seed=<número>
```

El flujo normal siempre debe respetar el desbloqueo. Los atajos de desarrollo no deben cambiar el guardado.

## 10. Orden de implementación

1. Crear el contrato del modo, estado de tramo, guardado y desbloqueo.
2. Crear el director de Infinito que componga los perfiles de enemigos y arena existentes.
3. Implementar la transición segura sin borrar build, XP ni modificadores.
4. Ampliar la política de cartas de tres a seis armas después de las tres evoluciones.
5. Implementar cartas de reserva post-evolución y sus límites.
6. Migrar bosses, eventos, amenazas y presentación a un máximo de dos instancias.
7. Añadir retirada, recompensa única y protección de contadores.
8. Añadir rutas de depuración y documentación.
9. Ejecutar las pruebas y corregir regresiones antes de declarar EX-11 terminado.

No declarar terminado el modo si solamente funcionan los primeros tres tramos.

## 11. Pruebas de aceptación

### Unitarias y de integración

- Verificar multiplicadores de los primeros doce tramos.
- Confirmar que hijos y réplicas no reciben el multiplicador dos veces.
- Comparar la primera vuelta con las cronologías actuales de los tres actos.
- Confirmar invitados y arenas correctos en vueltas 2 y 3.
- Confirmar que no hay dos bosses antes del tramo 10.
- Confirmar que el siguiente tramo espera a todos los bosses.
- Confirmar conservación de build, XP, nivel, modificadores y recargas.
- Confirmar bloqueo inicial en tres armas y ampliación permanente a seis.
- Verificar selección reproducible y aproximadamente uniforme de armas nuevas.
- Verificar las doce evoluciones y las cartas de potencia de reserva.
- Confirmar que nunca aparecen manos vacías sin fallback.
- Probar migración de guardado y liquidación de recompensa idempotente.
- Verificar que la campaña continúa limitada a tres armas.

### Bosses y estabilidad

- Probar las tres parejas de bosses con seis armas evolucionadas.
- Simular al menos cien cambios de tramo y revisar que no crezcan referencias ni historiales.
- Forzar saturación de pools y confirmar que no existe daño invisible.
- Probar muerte/revive durante transición y muerte simultánea con boss.
- Ejecutar diez minutos de stress en low, medium y high.
- Revisar resize, pausa, level-up y salida durante transición.
- Probar manualmente en PC y en el móvil disponible.

No presentar simulaciones como mediciones de FPS. Registrar dispositivo, calidad, duración, frame time y memoria realmente observados.

## 12. Documentación de cierre

Al implementar, enlazar este documento desde el plan de ejecución vigente, registrar EX-11 y actualizar `CONTINUACION.md` con:

- Tramos y fórmulas implementados.
- Contenido reutilizado y diferencias exclusivas de Infinito.
- Política de cartas y estado de las seis armas.
- Límites técnicos y coordinación de bosses.
- Rutas de prueba.
- Resultados realmente comprobados.
- Balance y validaciones humanas que sigan pendientes.

### Definition of Done

Infinito está terminado cuando aparece en el flujo normal tras vencer el Acto III, empieza con build limpia, conserva progresión entre tramos, habilita las seis armas después de tres evoluciones, reutiliza correctamente las arenas y enemigos, soporta encuentros dobles desde el tramo 10, liquida una sola recompensa y no rompe la campaña ni los presupuestos técnicos. El balance final de daño y aguante permanece separado como tarea posterior.
