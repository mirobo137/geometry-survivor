# Resonant Aura - direccion premium (histórico)

> **SUPERSEDIDA.** Esta receta ya no corresponde al arma activa. La sexta arma
> vigente es Magnetic Charge; su receta está en
> [`MAGNETIC_CHARGE_WEAPON_FX_PREMIUM.md`](MAGNETIC_CHARGE_WEAPON_FX_PREMIUM.md).

Esta receta define la presentacion de la sexta arma. Resonant Aura es una
banda persistente que sigue al player y deja un centro limpio; no es el hazard
Pulse Ring, no es el Shield y no es la resonancia visual de la frontera.

## Identidad visual

La lectura es la de un campo sintonizado, no la de una explosion:

1. una carcasa de tinta segmentada establece el limite exterior;
2. doce paneles annulares alternan cian, violeta y armadura azul oscura;
3. un riel interior discontinuo marca el borde del centro seguro;
4. un riel exterior dorado y seis nodos indican que la banda esta activa;
5. pequenos conectores radiales muestran sincronizacion sin llenar el centro.

Los huecos entre paneles son parte de la silueta. El vacio central nunca se
rellena, porque comunica la decision de mantener una distancia concreta.

## Diferenciacion obligatoria

- Shield: no usar una superficie circular cerrada ni un unico contorno liso.
- Pulse Ring: no usar una onda que nace, viaja y desaparece; Aura permanece y
  sus paneles rotan alrededor del player.
- Hazard de arena: no reutilizar su cian uniforme, su escala de expansion ni
  su logica. Aura usa material estratificado, huecos y nodos de sintonizacion.
- La rotacion es decorativa y proviene del snapshot; nunca decide colision.

## Capas y animacion

`WeaponView` conserva cuatro `Graphics` persistentes: `backplate`, `band`,
`rails` y `nodes`. La geometria se construye una sola vez al cambiar
`state.sequence`. En cada frame solo se actualizan posicion, rotacion, alpha,
visible y el ritmo sinusoidal del snapshot. El centro queda libre para el
player, enemigos y telegraphs de prioridad superior.

Low mantiene la carcasa, los paneles de dano y el riel interior; apaga los
nodos ornamentales. High agrega el contraste de nodos y conectores, no una
senal de gameplay nueva. No usar filtros, blur, particulas ilimitadas ni
reconstruccion de paths en el loop.

## Regla de paths

Cada arco independiente empieza con `beginPath()` y termina con su propio
`stroke()`. Cada panel annular inicia un path, mueve al primer punto, recorre
el borde exterior, vuelve por el interior y cierra. Nunca encadenar dos arcos
independientes despues de `clear()`: Pixi 8 conserva el punto activo y puede
crear la diagonal hacia el origen o hacia el panel anterior.

## Presupuesto y futuras evoluciones

La base usa doce paneles, ocho pares de rieles y seis nodos cacheados. No crea
objetos durante el loop. `breathing_halo` puede animar radios 65-150 pero debe
conservar el centro seguro y el cooldown por objetivo. `prism_wall` sustituira
la banda por solo tres arcos logicos de 55 grados con huecos reales; no debe
simular huecos solo ocultando un anillo completo.

Antes de aceptar una evolucion, comparar contra la misma semilla y comprobar
que la lectura premium no se usa como evidencia de balance. La mecanica vive
en behavior; el SVG/Graphics solo comunica estado.
