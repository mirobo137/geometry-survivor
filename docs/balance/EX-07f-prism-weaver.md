# EX-07f — Prism Weaver: control espacial emitido por el enemigo

## Propósito

Prism Weaver es el cuarto enemigo de control angular del Acto II. Su función es
enseñar que una amenaza geométrica puede viajar con una nave y no pertenecer al
centro de la arena. Esta entrega define integración y legibilidad; no cierra el
balance final de vida, daño o resistencia reservado para EX-02c.

## Contrato de comportamiento

El enemigo recorre el siguiente ciclo:

`approach → telegraph → active → recovery → approach`

- `approach`: se mueve hacia un ancla authored alrededor del centro lógico de
  la arena; no teletransporta al siguiente punto.
- `telegraph`: congela el cuerpo, muestra tres radios comprometidos y conserva
  la acción aunque el player entre en la ruta.
- `active`: los tres radios giran como una celosía triangular durante el tiempo
  authored. El player puede usar cualquiera de los huecos angulares.
- `recovery`: se desplaza hacia el siguiente ancla y prepara un nuevo cast; no
  regresa al primer punto ni salta visualmente.

El contacto con el cuerpo sigue activo por separado. El ataque de radios aplica
un solo hit por cast y la colisión usa el cooldown común del sistema.

## Regla crítica de origen

El centro de la arena sólo sirve para calcular puntos de aproximación. El origen
del ataque es siempre el cuerpo del enemigo:

```ts
const dx = player.x - state.x;
const dy = player.y - state.y;
```

La misma regla debe existir en la presentación. `PrismWeaverTelegraphView`
construye la geometría en coordenadas locales y, en cada render, coloca el root
en `(state.x, state.y)`. No se deben usar `ARENA_CENTER`, `640`, `360` ni un
offset global para dibujar o colisionar el cast. Si la nave se encuentra fuera
del centro o cerca del borde, el abanico debe seguir naciendo de su núcleo.

## Valores de integración actuales

| Parámetro | Valor | Nota |
| --- | ---: | --- |
| radios por cast | 3 | separación angular de 120° |
| anclas | 6 | puntos authored de reposicionamiento |
| radio interior seguro | 28 u | el cuerpo cubre el contacto |
| radio máximo | 226 u | puede extenderse fuera de la arena |
| aviso | 0.82 s | lectura antes del daño |
| activo | 1.25 s | movimiento con smoothstep |
| recuperación | 0.62 s | desplazamiento al siguiente ancla |
| giro por cast | π/3.1 | alterna sentido por spawn |
| ancho angular peligroso | 0.11 rad | huecos reales entre radios |
| daño del cast | 16 | provisional, no es balance final |
| máximo simultáneo | 3 | cap authored del pool |

Los valores anteriores son una primera composición de Acto II y deben cambiarse
sólo con evidencia de runs. El cap no se aumenta para aparentar progresión.

## Receta visual premium y eficiente

La vista usa una sola geometría cacheada por `sequence` y radio, separada en:

1. base oscura para dar canal y profundidad sin un rectángulo plano;
2. manto teal translúcido que conserva la silueta de peligro;
3. dos rieles metálicos laterales que separan material y dirección;
4. trama de tres riostras diagonales alternadas: comunica un telar energizado,
   no tres líneas independientes;
5. core aqua fino para señalar el eje real;
6. edge ámbar segmentado, nunca una línea continua barata;
7. terminales estratificados (metal -> ámbar -> slit aqua), núcleo romboidal
   y collar de carga con dientes mecánicos alrededor del casco;
8. filamentos laterales segmentados y compuertas prismáticas transversales que
   hacen que cada radio rote como un conducto ensamblado, en vez de como una
   franja plana;
9. un pulso corto y una cometa de energía con cola, de ritmos distintos, que
   recorren cada radio durante `active`.

La animación por frame sólo transforma posición, rotación, escala y alpha. El
collar gira lentamente, el pulso viaja desde el emisor hacia cada terminal y la
cometa larga repite un ritmo más lento para que la energía tenga dirección. La
intensidad oscila con el mismo reloj determinista. Low omite filamentos, trama,
cometas y edge decorativos, pero conserva canal, manto, core, collar,
terminales y el pulso corto. No añadir filtros,
blurs, texturas generadas por frame ni Graphics reconstruidos cada tick.

El presupuesto actual es un pool de tres slots: nueve `Graphics` por slot para
materiales/carga (trama y filamentos sólo en Medium/High), tres pulsos cortos y
tres cometas reutilizables por slot. Las capas permanecen
ocultas según fase; no todas compiten visualmente al mismo tiempo. Si una nueva
capa no comunica origen, material, dirección o transición, debe rechazarse.

El cuerpo usa la familia SVG de cuatro piezas de Prism Weaver:
`rear → wings → hull → cockpit`. Todos los paths comparten el frame centrado
`-32 -32 64 64`; el telegraph no debe reemplazar la nave ni dibujarse como una
línea global independiente. El asset usa el verbo **telar astral**: contra-peso
trasero, tres brazos abiertos con vacíos, huso de planos e iris prismático
localizado. Debe mantener 21 primitivas (techo 24), frente `-Y`, master exacto
de sus piezas y lectura en Low; la sofisticación sale de planos y espacios
negativos, nunca de filtros o un borde blanco continuo.

## Pruebas y Definition of Done

La integracion de campana queda separada del drill: el perfil real de Angular
elige `prism-weaver` desde 165 s como soporte tardio y lo mantiene acotado por
`activeCap`. `CombatSimulation.test.ts` verifica que aparece en una simulacion
real del Acto II antes de abrir al Orbital Warden; `?prism=1` sigue siendo solo
la herramienta para inspeccionar su telegraph.

- `PrismWeaverBehavior.test.ts` comprueba compromiso aunque el player invada la
  ruta, un hit por cast, huecos seguros y reposicionamiento sin teletransporte.
- `PrismWeaverTelegraphView.test.ts` comprueba que el root sigue
  `(state.x, state.y)` al cambiar la nave y que el pool se resetea.
- `EnemySystem.test.ts` comprueba aparición tardía y cap authored.
- `npm run typecheck` debe pasar.
- `npm test -- --run` debe pasar completo.
- Drill manual: `?prism=1&debug=1&quality=low|medium|high`.

La puerta humana queda pendiente hasta observar el ataque en una run real en
PC y móvil. La aprobación debe responder si el cuerpo se percibe como emisor,
si los huecos son legibles y si el cast sigue siendo evadible cerca del borde.
