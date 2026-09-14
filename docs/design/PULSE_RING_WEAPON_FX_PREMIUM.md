# Pulse Ring de jugador — dirección premium

Esta guía define el estándar visual del quinto arma. No debe confundirse con
`PulseRingHazard`, que es el hazard del Acto II y conserva su propio contrato.
El arma nace del jugador, captura su origen al disparar y libera una onda que
se expande; la vista nunca inventa su posición ni su colisión.

## Identidad

Pulido visual de 14-09-2026: cuatro compuertas facetadas convergen durante la
carga. Cada pétalo de presión conserva talón oscuro, cara violeta/magenta,
bisel ámbar y filo marfil selectivo también en Low. El encendido cae de forma
exponencial, sin parpadear el cuerpo dañino; los fragmentos finales se desplazan
ligeramente hacia fuera y se apagan. Mantener ocho Graphics, geometría local
cacheada por secuencia y animación sólo por transforms/alpha. Reduced motion
suprime convergencia, giro y deriva decorativa. El radio lógico no se modifica.

Pulse Ring no es un círculo azul transparente ni un `glow` escalado. Su lectura
es la de una descarga contenida que se abre:

1. un anillo de carga discontinuo y una marca central indican que la descarga
   está comprometida;
2. una carcasa de tinta separa el ataque del fondo;
3. una armadura tinta violeta da volumen a la banda;
4. un manto violeta, acentos magenta y un filo marfil concentran la energía en el borde;
5. crestas triangulares alternas hacen visible el sentido de expansión;
6. la recuperación deja sólo un riel débil, sin parecer una hitbox activa.

El centro no se pinta como superficie segura: permanece limpio para que el
jugador vea su nave, enemigos y hazards mientras decide si espera la onda o se
reposiciona.

## Diferenciacion obligatoria

Pulse Ring no puede compartir la lectura principal de efectos cercanos:

- **Inicio:** no usar un campo circular continuo como el Shield. La carga debe
  ser una apertura de reactor: cuatro compuertas separadas, ejes cardinales y
  un nucleo octagonal.
- **Ataque:** no usar una circunferencia lisa como el hazard radial. La onda
  debe tener paneles con separaciones, dientes serrados y vectores que apunten
  hacia afuera; la paleta dominante es violeta/ambar, no el cian del hazard.
- **Recuperacion:** no dejar otro ring completo. Usar ecos fragmentados que
  desaparecen y que no puedan confundirse con una zona de dano.

La forma es la senal principal; el color solo refuerza la diferencia. Si una
iteracion vuelve a verse como un escudo o como los rings de la arena, debe
volver a la geometria de compuertas/paneles antes de anadir mas brillo.

## Contrato temporal

| Fase | Presentación | Gameplay |
| --- | --- | --- |
| `telegraph` | compuertas discontinuas ámbar, núcleo de apertura | no daña; el origen ya está fijado |
| `active` | paneles violeta/ámbar, filo serrado y vectores | barre de `startRadius` a `endRadius`; un hit por enemigo; empuja vivos |
| `recovery` | ecos fragmentados y atenuados | no daña; no debe confundirse con ataque |
| `idle` | oculto | no hay cast activo |

El origen se captura cuando el scheduler dispara. Mover al jugador durante el
telegraph no arrastra la onda; esa decisión mantiene un riesgo/recompensa claro
y evita una hitbox que persigue al jugador. La simulación usa el cruce barrido
entre radios consecutivos, por lo que un frame lento no puede saltar la banda.
El empuje es un impulso discreto de 10 u por impacto para que sea visible sin
convertirse en una velocidad persistente ni depender del framerate.

## Reglas de implementación para futuros modelos

- Añadir primero una definición en `WeaponDefinitions.ts`; no poner números de
  daño o cooldown en Pixi.
- Crear un behavior puro separado. El behavior actual es
  `PulseRingWeaponBehavior.ts`: controla fases, captura de origen, ledger por
  cast/generación y empuje; no importa Pixi.
- Conectar el disparo al `WeaponScheduler`; no crear timers en la vista.
- Publicar un `PulseRingWeaponState` de sólo lectura dentro de
  `CombatRenderState`.
- Construir la geometría una sola vez por `state.sequence`. Durante el viaje
  sólo cambiar `position`, `scale`, `rotation`, `alpha` y `visible`.
- Cada arco independiente comienza con `beginPath()` y su propio `moveTo()`;
  los polígonos se cierran. No concatenar paths de casts anteriores: así se
  evita la diagonal hacia el origen.
- No usar filtros, blur, partículas ilimitadas, `Date.now()` ni
  `performance.now()`. El progreso viene de la simulación.
- Low conserva el aro de aviso, la silueta dañina y el riel de recuperación;
  sólo retira crestas/marcadores ornamentales. High agrega material y ritmo,
  no información jugable nueva.
- El arma y el hazard del Acto II no comparten estado, cooldown ni render.
  Reutilizar una paleta o una función geométrica pequeña es válido; reutilizar
  la lógica de daño del hazard no lo es.

## Presupuesto

El arma utiliza un único cast activo y ocho `Graphics` persistentes en
`WeaponView`. La banda usa una malla anular acotada y 72 segmentos por capa,
horneada al comenzar el cast. No se asignan arrays dentro del loop y el ledger
usa typed arrays dimensionados por el pool de enemigos.

## Acceso y revisión

Con el servidor de desarrollo o preview activo, abrir:

`/?weapon=pulse-ring&debug=1&quality=high`

El drill crea siete blancos estáticos alrededor del jugador, desactiva otras
armas y hazards, y dispara cada `1.6 s` para que la lectura sea inmediata.
Cambiar `quality=low` permite comprobar que la señal jugable permanece. La
URL `/?pulse=1...` sigue siendo exclusivamente el hazard Pulse Ring del Acto
II y no debe usarse para aprobar esta arma.

La aprobación visual requiere todavía revisión humana dentro del juego en
desktop y móvil. Los tests verifican fases, colisión, empuje, pooling y
reutilización; no sustituyen la decisión estética ni una medición física de
FPS.
