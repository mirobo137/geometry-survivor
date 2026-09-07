# Prism Aegis — órbita geométrica premium

Esta es la receta específica para la órbita persistente de Geometry Survivor.
Se aplica junto a `docs/design/EFECTOS_PREMIUM.md` y las skills canónicas de
rendering, SVG y mobile-performance.

## Contrato

- Rol: arma persistente de corto alcance; no es un hazard.
- Autoridad: `OrbitBehavior` decide posición, radio, daño, cooldown y cantidad.
- Vista: `WeaponView` sólo dibuja y transforma piezas cacheadas.
- Ancla: centro de masa en `state.x/state.y`.
- Orientación: `state.angle`; la simulación ya lo usa para ubicar el módulo.
- Colisión: `state.radius`; la presentación no la aumenta por adornos.
- Fases: presencia continua mientras `active`; no inventar telegraph, impacto o
  recovery desde la vista.
- Movimiento: deriva del ángulo de simulación; no usar `Date.now()` ni
  `performance.now()`.

## Silueta y material

La identidad se llama **Prism Aegis**: una cápsula/placa facetada, una cavidad
oscura y un núcleo hexagonal que concentra energía. No es un rombo plano ni un
anillo genérico. La silueta debe leerse a 32 px mediante cuatro decisiones:

1. carcasa exterior oscura de ocho vértices;
2. dos planos internos con contraste distinto;
3. apertura central que crea profundidad;
4. núcleo claro pequeño con una forma interior diferente.

Paleta de referencia: tinta `#0d1025`, metal `#51456f`, placa `#9b82c8`,
bisel `#e8dcff`, energía cian `#75e6ff`, energía dorada `#ffd978` y núcleo
marfil `#fff4cf`. Cian y dorado separan energía y metal; no son la única señal.

## Capas permitidas

| Capa | Construcción | Regla |
| --- | --- | --- |
| wake | dos raíles tangenciales cortos | Medium/High; nunca parece otra arma |
| aura | tres arcos rotos y dos acentos | sin filtros; alpha menor en Low |
| shell | placas, bisel, cavidad | siempre visible |
| accent | arcos internos y chevrons | siempre visible, discreto |
| core | hexágono marfil y rombo cian | siempre visible; energía concentrada |

Las cinco texturas se generan una vez por `WeaponView` y se reutilizan para
los seis módulos. Los `Sprite` viven en un `Container` por blade. En cada
frame sólo se actualizan `position`, `rotation`, `scale`, `alpha` y `visible`.
No llamar a `clear()`, reconstruir paths, parsear SVG ni crear partículas.

El root rota con `state.angle`. El halo y los acentos usan una rotación
secundaria contraria; el núcleo rota más rápido y pulsa con `sin(state.angle *
3 + index * 0.9)`. La estela queda tangencial y corta. El movimiento es
determinista, congelable y no cambia el gameplay.

## Calidad

Low conserva shell, apertura, accent, core y un aura tenue. Sólo omite la
estela decorativa. Medium habilita una estela tenue y halo medio. High aumenta
su alpha dentro del mismo número de piezas. No eliminar la carcasa ni el núcleo
para ahorrar; la reducción de fidelidad no puede eliminar la identidad.

No ampliar el tamaño visual para simular daño. La referencia usa una carcasa
de aproximadamente 32 unidades para una colisión de radio 10, pero esa
diferencia es puramente visual. El radio de daño sigue perteneciendo a la
simulación.

## Errores que deben evitarse

- apilar círculos concéntricos hasta borrar la silueta;
- usar un filtro blur/glow por blade;
- colocar estelas radiales que parezcan proyectiles o zonas dañinas;
- cambiar `OrbitBehavior` desde la vista;
- crear una textura o `Graphics` durante `render`;
- usar color como única señal de energía;
- copiar la composición del láser: el láser es un evento lineal con fases,
  Prism Aegis es una herramienta orbital persistente;
- confundir aprobación automática con aprobación visual humana.

## Referencia y validación

Con Vite activo, abrir `/docs/visual/orbit-reference.html`. La página usa el
`WeaponView` real y presenta High con seis módulos, Medium, Low y fondo claro.
`node docs/visual/capture-orbit.mjs` genera capturas desktop y móvil en
`test-results/orbit-reference/`.

Después revisar una partida con la órbita desbloqueada: debe distinguirse del
player, no taparlo con seis halos y seguir siendo reconocible cerca de enemigos.
Los tests deben comprobar que la geometría no se reconstruye, que Low/High
mantienen la señal, que reset oculta todos los módulos y que la cadena
eléctrica conserva su comportamiento. Tests verdes prueban estructura, no
calidad estética ni FPS móvil.
