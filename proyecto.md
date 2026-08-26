# GEOMETRY SURVIVOR — PROJECT MASTER DOCUMENT

> **Plan ejecutable:** la evaluación, decisiones técnicas, fases, métricas y puertas de calidad se mantienen en [PLAN_DESARROLLO.md](PLAN_DESARROLLO.md). Este documento conserva la visión y los principios generales del proyecto.

> Este documento define la visión, arquitectura inicial, requisitos técnicos y reglas de desarrollo de un videojuego HTML5 de supervivencia tipo *survivor/roguelike*, diseñado principalmente para **Poki, CrazyGames y navegadores móviles**.
>
> Debe utilizarse como contexto principal para cualquier IA/agente que trabaje sobre el proyecto.

---

# 1. INSTRUCCIONES PARA EL AGENTE DE IA

Antes de implementar cambios importantes:

1. Lee este documento completo.
2. Inspecciona la estructura y código existente del proyecto.
3. Busca las **skills, herramientas, documentación o capacidades disponibles** que puedan ser relevantes para:

   * TypeScript
   * PixiJS
   * Vite
   * WebGL
   * HTML5 games
   * optimización móvil
   * game loops
   * object pooling
   * spatial hashing
   * partículas
   * shaders
   * audio web
   * Poki SDK
   * CrazyGames SDK
   * testing
   * profiling
4. Utiliza las skills relevantes cuando estén disponibles.
5. Si una tecnología, API o SDK puede haber cambiado, consulta su documentación actual antes de asumir su funcionamiento.
6. No implementes mecánicas críticas basándote únicamente en APIs obsoletas o recuerdos de versiones anteriores.

## Libertad para mejorar el stack

El stack descrito aquí es la arquitectura inicial recomendada, **no un dogma**.

Si encuentras una alternativa claramente superior puedes proponerla.

Por ejemplo:

* una característica nueva de PixiJS;
* una técnica de rendering más eficiente;
* una mejor estrategia de batching;
* un sistema de partículas superior;
* una API moderna del navegador;
* una optimización específica para móviles;
* una mejor arquitectura para entidades;
* mejoras recientes en Poki o CrazyGames.

Pero antes de realizar un cambio arquitectónico importante:

1. explica el problema;
2. explica la alternativa;
3. compara rendimiento, complejidad y mantenibilidad;
4. verifica que funcione correctamente en móviles de gama baja;
5. verifica que sea compatible con Poki y CrazyGames;
6. evita introducir dependencias grandes para solucionar problemas pequeños.

La prioridad del proyecto es:

**simplicidad + rendimiento + buen game feel + facilidad para generar contenido.**

---

# 2. VISIÓN DEL JUEGO

Crear un juego HTML5 de supervivencia inspirado conceptualmente en juegos tipo:

* Vampire Survivors
* Brotato
* survivor-likes
* arena survival roguelikes

pero con identidad visual basada casi completamente en:

**GEOMETRÍA + MOVIMIENTO + COLOR + EFECTOS VISUALES.**

No se pretende copiar la estética ni contenido de ningún juego existente.

El objetivo es demostrar que:

> círculos, triángulos, polígonos, líneas y partículas pueden producir un juego visualmente espectacular si tienen excelente animación, feedback, sonido y efectos.

El juego debe ser fácil de entender inmediatamente.

Pero debe convertirse progresivamente en:

**rápido, caótico, satisfactorio y visualmente impresionante.**

---

# 3. GAMEPLAY PRINCIPAL

El jugador aparece aproximadamente en el centro de la pantalla.

Alrededor existe una **zona circular jugable**.

Conceptualmente:

```text
              enemigos

         ┌───────────────┐
      ╱                     ╲
    ╱                         ╲

           zona jugable

              ●
            PLAYER

    ╲                         ╱
      ╲                     ╱
         └───────────────┘
```

El jugador solamente puede desplazarse dentro de este círculo.

La zona funciona como una pequeña arena.

---

# 4. CRECIMIENTO DE LA ARENA

El radio de la arena debe crecer progresivamente.

Esto puede depender de:

* nivel del jugador;
* tiempo sobrevivido;
* eventos determinados;
* combinación de nivel y tiempo.

No fijar todavía la fórmula definitiva.

Debe ser configurable.

Ejemplo conceptual:

```text
INICIO

      ( ● )


DESPUÉS

        (       )
      (    ●      )
        (       )


LATE GAME

       (                 )
    (          ●            )
       (                 )
```

El crecimiento permite aumentar progresivamente:

* número de enemigos;
* movilidad necesaria;
* alcance de armas;
* cantidad de amenazas;
* complejidad visual.

---

# 5. CONTROLES

El diseño debe funcionar desde el principio con:

## Desktop

* mouse;
* teclado cuando resulte conveniente.

## Mobile

* dedo / touch.

El movimiento principal debe poder realizarse cómodamente con **un solo dedo**.

La interacción no debe requerir botones pequeños durante el combate.

El jugador controla principalmente:

**MOVIMIENTO.**

Las armas atacan automáticamente.

---

# 6. AUTO ATTACK

El jugador no necesita presionar constantemente para atacar.

Las armas funcionan automáticamente según propiedades como:

```text
cooldown
damage
range
projectileSpeed
targeting
projectileCount
area
piercing
criticalChance
```

Esto permite concentrarse en:

**posicionamiento + esquivar + decisiones de build.**

---

# 7. ENEMIGOS

Los enemigos iniciales también utilizarán geometría.

Ejemplo de lenguaje visual:

```text
○  Player / Friendly

△  enemigo agresivo

◇  ranged

⬡  tank

⬢  elite

✦  boss / special
```

Esto es solamente una convención inicial.

Puede modificarse si se encuentra un lenguaje visual mejor.

## Tipos iniciales

### Chaser

Persigue directamente al jugador.

### Fast

Menor vida.

Mayor velocidad.

### Tank

Grande.

Lento.

Mucha vida.

### Ranged

Mantiene cierta distancia y dispara.

### Elite

Versiones especiales con modificadores.

### Boss

Enemigos con patrones propios y múltiples ataques.

---

# 8. ESCALADO DE ENEMIGOS

Los enemigos aumentarán progresivamente su dificultad junto con el jugador.

Pero evitar:

> solamente multiplicar HP infinitamente.

La dificultad debe aumentar también mediante:

* densidad;
* velocidad;
* combinaciones;
* patrones;
* elites;
* proyectiles;
* hazards;
* ataques de área;
* restricciones de movimiento.

La sensación buscada es:

```text
EARLY GAME
controlado

↓

MID GAME
intenso

↓

LATE GAME
caos controlado

↓

END GAME
espectáculo visual
```

El jugador debe sentirse cada vez más poderoso mientras el juego simultáneamente se vuelve más peligroso.

---

# 9. ANTI-CAMPING

Un problema potencial es que una build poderosa permita quedarse prácticamente inmóvil.

Por eso deben existir amenazas que obliguen a moverse.

Ejemplo importante:

## LASER ATTACK

Aparece una advertencia:

```text
PLAYER

   ●

   │
   │ warning
   │
   │
```

Después de un breve tiempo:

```text
████████████████
     LASER
████████████████
```

El jugador debe moverse.

Debe existir suficiente telegraphing para que el ataque sea justo.

Nunca:

> daño inevitable sin advertencia.

Otros hazards futuros pueden incluir:

* líneas láser;
* zonas explosivas;
* círculos peligrosos;
* proyectiles grandes;
* paredes móviles;
* ondas;
* enemigos kamikaze;
* ataques desde fuera de la arena.

Estas mecánicas deben impedir gameplay completamente pasivo.

---

# 10. SISTEMA DE NIVEL

Los enemigos otorgan experiencia al ser derrotados.

Ejemplo visual:

```text
enemy dies

△ → ✦

       +XP
```

La experiencia se acredita inmediatamente al jugador, sin dejar gemas físicas en la arena. Así ninguna recompensa queda fuera del área circular alcanzable ni obliga a abandonar una posición segura para recogerla.

Cuando alcanza suficiente:

```text
LEVEL UP
```

El gameplay se pausa.

Se presentan:

**3 OPCIONES.**

Por ejemplo:

```text
┌──────────┐
│   ⚡     │
│ LIGHTNING│
└──────────┘

┌──────────┐
│    ●     │
│ + DAMAGE │
└──────────┘

┌──────────┐
│   ◉◉     │
│ +1 ORB   │
└──────────┘
```

El jugador selecciona una.

Después continúa inmediatamente la partida.

---

# 11. TIPOS DE RECOMPENSA

Las opciones pueden ser:

### Nueva arma

Añade un sistema ofensivo nuevo.

### Upgrade de arma

Mejora un arma existente.

### Player upgrade

Ejemplos:

```text
movement speed
max health
armor
pickup radius
critical chance
regeneration
```

### Weapon modifier

Puede modificar significativamente un arma.

Ejemplo:

```text
PLASMA ORB

↓

PLASMA SPLIT

↓

CHAIN PLASMA
```

---

# 12. ARMAS INICIALES

Crear pocas armas inicialmente.

Priorizar que sean extremadamente satisfactorias.

## Projectile

```text
●────────>
```

Ataque automático hacia enemigos.

---

## Orbit

```text
       ●

   ●   ◎   ●

       ●
```

Objetos orbitan alrededor del jugador.

---

## Aura

```text
     (( ◎ ))
```

Daño alrededor del jugador.

---

## Laser

```text
◎━━━━━━━━━━━━>
```

Ataque lineal.

---

## Chain Lightning

```text
◎~~~~◇~~~~◇~~~~◇
```

Salta entre enemigos.

---

## Spiral

```text
        ·
    ·       ·
  ·     ◎     ·
    ·       ·
        ·
```

Genera proyectiles con movimiento radial.

---

# 13. DATA-DRIVEN DESIGN

Contenido como:

* enemigos;
* armas;
* upgrades;
* waves;
* efectos;
* balance;

debe ser principalmente **data-driven**.

Evitar escribir sistemas completamente independientes para cada arma.

Ejemplo conceptual:

```ts
const plasmaOrb = {
    id: "plasma_orb",

    damage: 12,
    cooldown: 0.7,
    speed: 420,

    projectile: "orb",
    pattern: "radial",

    visuals: {
        shape: "circle",
        glow: 0.7,
        trail: "energy"
    }
};
```

Esto permite crear contenido nuevo rápidamente.

También permite que agentes de IA generen:

* armas;
* enemigos;
* upgrades;
* variantes;

sin modificar sistemas críticos.

---

# 14. PRINCIPIO FUNDAMENTAL DE ARQUITECTURA

Separar:

```text
SIMULATION
RENDERING
CONTENT
PLATFORM
```

Nunca mezclar innecesariamente lógica visual con lógica de gameplay.

Conceptualmente:

```text
                  GAME

        ┌──────────┼──────────┐

   SIMULATION    RENDER      META
       │            │          │
    enemies       PixiJS     upgrades
    weapons       WebGL      progression
    damage        FX         save
    collision
```

---

# 15. STACK INICIAL

## Lenguaje

**TypeScript**

---

## Build system

**Vite**

---

## Rendering

**PixiJS 8 / WebGL**

Investigar la versión estable actual antes de comenzar.

No asumir APIs antiguas de PixiJS.

---

## Arte fuente

Principalmente:

**SVG**

Pero SVG no será necesariamente el renderer runtime para cientos de entidades.

Los SVG funcionan como:

**fuente vectorial de assets.**

Pueden convertirse/reutilizarse como texturas optimizadas por PixiJS.

---

# 16. FILOSOFÍA DE ASSETS

Crear una biblioteca reutilizable parecida conceptualmente a utilizar assets neutros tipo Kenney.

Pero diseñada específicamente para geometría.

Ejemplo:

```text
assets/

    svg/

        shapes/
        characters/
        enemies/
        projectiles/
        weapons/
        particles/
        explosions/
        pickups/       # solo si una recompensa futura necesita presencia física
        icons/
        ui/
```

Los assets deben ser:

* simples;
* reutilizables;
* recoloreables;
* combinables;
* escalables;
* fáciles de modificar mediante IA.

Ejemplo:

```text
star.svg
```

puede convertirse visualmente en:

```text
normal
electric
fire
poison
legendary
boss
```

mediante:

* tint;
* escala;
* glow;
* partículas;
* trails;
* animación;
* shaders.

---

# 17. RENDERING RUNTIME

Evitar cientos de nodos SVG DOM simultáneos.

Utilizar PixiJS/WebGL para cantidades grandes de objetos.

SVG:

```text
SOURCE ART
```

Pixi/WebGL:

```text
RUNTIME RENDERING
```

Utilizar:

* batching;
* texture reuse;
* texture atlases;
* particle rendering;
* instancing cuando sea apropiado.

Investigar las capacidades actuales de PixiJS antes de diseñar sistemas propios que el engine ya resuelva eficientemente.

---

# 18. TÉCNICA DE PROGRAMACIÓN

Preferencia inicial:

**DATA ORIENTED + SYSTEMS + OBJECT POOLING**

No crear necesariamente un ECS extremadamente complejo.

Evitar también jerarquías gigantes de clases.

Ejemplo:

```text
World

├── PlayerSystem
├── EnemySystem
├── MovementSystem
├── WeaponSystem
├── ProjectileSystem
├── CollisionSystem
├── DamageSystem
├── PickupSystem
├── ExperienceSystem
├── SpawnSystem
└── EffectSystem
```

---

# 19. DATOS COMPACTOS

Para grandes cantidades de enemigos considerar estructuras compactas.

Ejemplo conceptual:

```ts
enemyX[id]
enemyY[id]
enemyVX[id]
enemyVY[id]
enemyHP[id]
enemyType[id]
enemyState[id]
```

No adoptar esta implementación automáticamente.

Primero evaluar:

* cantidad real de entidades;
* rendimiento;
* mantenibilidad.

La arquitectura debe evitar **optimización prematura**, pero permitir optimizar sistemas críticos posteriormente.

---

# 20. OBJECT POOLING

Debe existir pooling para entidades creadas/destruidas constantemente.

Ejemplos:

```text
EnemyPool
ProjectilePool
ParticlePool
PickupPool
DamageTextPool
ExplosionPool
```

Evitar:

```ts
new Projectile();
destroy();
new Projectile();
destroy();
```

miles de veces durante una partida.

Preferir:

```ts
const projectile = projectilePool.acquire();
```

y posteriormente:

```ts
projectilePool.release(projectile);
```

Reducir garbage collection durante gameplay.

---

# 21. SPATIAL HASH / SPATIAL GRID

No realizar colisiones:

```text
cada proyectil × cada enemigo
```

cuando existan cientos de entidades.

Utilizar una estructura espacial.

Ejemplo:

```text
┌───┬───┬───┬───┐
│   │ E │   │   │
├───┼───┼───┼───┤
│ P │ E │ E │   │
├───┼───┼───┼───┤
│   │   │   │   │
└───┴───┴───┴───┘
```

API conceptual:

```ts
spatialGrid.queryCircle(x, y, radius);
```

Usarlo para:

* collision detection;
* targeting;
* AoE;
* chain attacks;
* enemy queries.

---

# 22. GAME LOOP

No todos los sistemas necesitan ejecutarse 60 veces por segundo.

Objetivo aproximado:

```text
Rendering       60 Hz
Movement        60 Hz
Collision       30-60 Hz
AI              10-20 Hz
Target Search   10-20 Hz
Spawn Logic      5-10 Hz
```

Ajustar mediante profiling.

Nunca sacrificar precisión perceptible solamente por seguir esta tabla.

---

# 23. GAME FEEL

El aspecto profesional del juego dependerá enormemente del **feedback**.

Cada acción importante debe sentirse.

Herramientas principales:

* hit stop;
* screen shake;
* squash & stretch;
* flash;
* particles;
* trails;
* rings;
* shockwaves;
* sound;
* scale punch;
* color;
* animation timing.

---

# 24. FX RECIPES

No implementar efectos de manera arbitraria por todo el código.

Crear un sistema central.

Ejemplo:

```ts
ImpactFX.play("critical", position);
```

Configuración conceptual:

```ts
critical = {

    flash: true,

    particles: 8,

    ring: true,

    shake: 3,

    hitStop: 25,

    scalePunch: 1.15,

    sound: "critical"
};
```

Esto permite controlar el coste visual global.

---

# 25. HIT STOP

Utilizar micro pausas en impactos importantes.

Ejemplo:

```text
impacto normal
0-10ms

critical
20-35ms

boss impact
30-50ms
```

No bloquear input de manera molesta.

No abusar del efecto.

Debe aumentar la sensación de impacto.

---

# 26. SCREEN SHAKE

Debe existir un sistema centralizado.

Ejemplo conceptual:

```text
normal hit       0-1
critical         2
explosion        3
boss attack      4
boss death       6+
```

Evitar vibración constante.

---

# 27. SQUASH & STRETCH

La geometría debe sentirse viva.

Una esfera puede deformarse:

```text
normal

●

attack

◉━━>

impact

━━●━━
```

y regresar rápidamente.

Animaciones pequeñas de aproximadamente:

```text
60-150 ms
```

pueden producir mucho feedback con coste mínimo.

---

# 28. GLOW BARATO

Evitar filtros blur costosos en cientos de entidades.

Preferir técnicas como:

```text
sprite principal

+

sprite ligeramente mayor
alpha bajo
additive blending
```

Ejemplo:

```text
      ○
     ◉
      ○
```

Utilizar filtros reales solamente cuando estén justificados y medidos.

---

# 29. TRAILS

Preferir trails económicos basados en:

* posiciones históricas;
* sprites reutilizados;
* alpha;
* scale;

en lugar de filtros complejos.

Aplicable a:

* projectiles;
* dash;
* lasers;
* bosses;
* fast enemies.

---

# 30. PARTICLES

Las partículas deben estar presupuestadas.

Nunca crear partículas ilimitadas simplemente porque visualmente se ven bien.

Ejemplo inicial:

```text
LOW       ~30% FX
MEDIUM    ~60% FX
HIGH      100% FX
```

Los valores reales deben determinarse mediante profiling.

---

# 31. QUALITY MANAGER

Crear desde el principio:

```text
QualityManager
```

Niveles:

```text
LOW
MEDIUM
HIGH
```

Puede controlar:

* partículas;
* trails;
* glow;
* damage text;
* resolution;
* shaders;
* screen effects;
* background complexity.

Gameplay debe ser idéntico.

Solo cambia fidelidad visual.

---

# 32. ADAPTIVE QUALITY

Considerar ajuste automático.

Ejemplo:

Si FPS permanece bajo durante varios segundos:

```text
HIGH → MEDIUM
```

Después:

```text
MEDIUM → LOW
```

No cambiar calidad agresivamente por un único frame lento.

Utilizar medias móviles / ventanas temporales.

---

# 33. DEVICE PIXEL RATIO

Nunca asumir que:

```ts
resolution = devicePixelRatio;
```

es siempre correcto.

Un teléfono con pantalla de alta resolución puede tener GPU modesta.

Ejemplo inicial:

```text
LOW      DPR 1.0
MEDIUM   DPR 1.25
HIGH     DPR 1.5
```

Determinar valores finales mediante pruebas.

---

# 34. PERFORMANCE TARGET

Objetivo:

```text
60 FPS
```

Debe seguir siendo jugable en:

```text
30 FPS
```

El proyecto debe probarse frecuentemente en hardware móvil modesto.

No desarrollar exclusivamente en una PC potente y optimizar al final.

---

# 35. PRESUPUESTO INICIAL DE ENTIDADES

Objetivos aproximados de estrés:

```text
200-500 enemies

200-600 projectiles

100-300 pickups (solo para recompensas físicas opcionales; la XP del MVP no usa pickups)
```

No significa que siempre deban existir esas cantidades.

Son referencias para stress testing.

El número final dependerá de:

* GPU;
* CPU;
* arquitectura;
* gameplay;
* FX.

---

# 36. AUDIO

El audio es parte fundamental del game feel.

Considerar:

**Web Audio API**

o una librería pequeña como:

**Howler**

si aporta suficiente valor.

Investigar antes de agregar dependencia.

Necesitamos:

* weapon sounds;
* impacts;
* criticals;
* pickups;
* level up;
* UI;
* bosses;
* ambient/music.

Evitar reproducir cientos de sonidos simultáneamente.

Crear:

```text
AudioManager
```

con límites de voces/canales.

---

# 37. PLATFORM ABSTRACTION

Nunca llenar el juego con llamadas directas a:

```text
PokiSDK
CrazyGamesSDK
```

Crear una interfaz:

```ts
interface GamePlatform {

    init(): Promise<void>;

    gameplayStart(): void;

    gameplayStop(): void;

    commercialBreak(): Promise<void>;

    rewardedAd(): Promise<boolean>;

    save(data: unknown): Promise<void>;
}
```

Implementaciones:

```text
LocalPlatform
PokiPlatform
CrazyGamesPlatform
```

Así mantenemos un solo juego.

---

# 38. POKI

Antes de integrar:

* revisar documentación actual;
* revisar SDK actual;
* revisar requisitos móviles;
* revisar eventos gameplay;
* revisar publicidad;
* revisar almacenamiento;
* revisar audio;
* revisar requisitos de publicación.

No asumir que documentación antigua continúa vigente.

---

# 39. CRAZYGAMES

Igualmente:

* revisar SDK HTML5 actual;
* publicidad;
* lifecycle;
* gameplay events;
* almacenamiento;
* requisitos móviles;
* tamaño máximo;
* performance requirements.

Mantener integración aislada mediante `CrazyGamesPlatform`.

---

# 40. ESTRUCTURA PROPUESTA

```text
src/

├── core/
│   ├── Game.ts
│   ├── GameLoop.ts
│   ├── Time.ts
│   ├── Camera.ts
│   └── QualityManager.ts
│
├── world/
│   ├── World.ts
│   ├── Arena.ts
│   ├── SpatialGrid.ts
│   └── Bounds.ts
│
├── systems/
│   ├── PlayerSystem.ts
│   ├── EnemySystem.ts
│   ├── MovementSystem.ts
│   ├── WeaponSystem.ts
│   ├── ProjectileSystem.ts
│   ├── CollisionSystem.ts
│   ├── DamageSystem.ts
│   ├── PickupSystem.ts
│   ├── ExperienceSystem.ts
│   └── SpawnSystem.ts
│
├── render/
│   ├── Renderer.ts
│   ├── ShapeLibrary.ts
│   ├── SpritePool.ts
│   ├── ParticleRenderer.ts
│   └── TrailRenderer.ts
│
├── fx/
│   ├── FxManager.ts
│   ├── FxRecipes.ts
│   ├── ScreenShake.ts
│   ├── HitStop.ts
│   ├── Flash.ts
│   └── Shockwave.ts
│
├── content/
│   ├── enemies/
│   ├── weapons/
│   ├── upgrades/
│   ├── hazards/
│   └── waves/
│
├── platform/
│   ├── GamePlatform.ts
│   ├── LocalPlatform.ts
│   ├── PokiPlatform.ts
│   └── CrazyGamesPlatform.ts
│
├── audio/
│   └── AudioManager.ts
│
└── ui/
```

Modificar esta estructura si durante implementación existe una razón arquitectónica clara.

No crear carpetas, managers o abstracciones que todavía no tengan utilidad real.

---

# 41. SKILLS / DOCUMENTACIÓN DEL PROYECTO

Crear o mantener instrucciones especializadas para agentes.

Ejemplo:

```text
skills/

architecture.md
performance.md
rendering.md
visual-language.md
weapons.md
enemies.md
fx.md
mobile.md
poki.md
crazygames.md
testing.md
```

Si el entorno de desarrollo posee un formato oficial para skills, agents, rules o instrucciones de proyecto, utilizar preferentemente ese formato.

---

# 42. PERFORMANCE RULES

Reglas iniciales:

* evitar allocations frecuentes dentro del game loop;
* usar pooling para entidades frecuentes;
* evitar algoritmos O(n²) cuando las cantidades puedan crecer;
* usar spatial queries;
* evitar filtros caros por enemigo;
* limitar DPR;
* presupuestar partículas;
* no ejecutar AI innecesariamente cada frame;
* reutilizar texturas;
* aprovechar batching;
* utilizar atlases cuando sea conveniente;
* medir antes de optimizar;
* probar en dispositivos reales.

---

# 43. VISUAL LANGUAGE

El juego debe mantener identidad coherente.

No agregar assets aleatorios únicamente porque estén disponibles.

La estética debe basarse en:

```text
GEOMETRY
NEON / ENERGY
CONTRAST
MOVEMENT
CLEAN SHAPES
POWERFUL IMPACTS
```

Evitar saturar constantemente toda la pantalla.

Debe existir contraste entre:

```text
CALM
↓
BUILDUP
↓
IMPACT
↓
RECOVERY
```

Esto hace que los efectos fuertes realmente parezcan fuertes.

---

# 44. COLORES COMO INFORMACIÓN

El color debe comunicar gameplay.

Ejemplo:

```text
azul/cyan
player / friendly

rojo
danger

amarillo
warning

verde
healing

violeta
special / corruption

blanco
high-energy impact
```

La paleta definitiva debe diseñarse posteriormente.

Mantener accesibilidad y legibilidad.

No depender únicamente del color para comunicar amenazas importantes.

---

# 45. TELEGRAPHING

Todo ataque peligroso debe avisar.

Por ejemplo:

```text
WARNING

───────
```

después:

```text
LASER

███████
```

Separar claramente:

```text
anticipation
attack
recovery
```

Esto permite ataques visualmente brutales sin sentirse injustos.

---

# 46. CAMERA

La cámara puede contribuir enormemente al game feel mediante:

* shake;
* zoom punch;
* boss intro;
* level-up;
* arena expansion.

Pero nunca debe perjudicar el control táctil.

Movimientos pequeños y deliberados.

---

# 47. ARENA COMO ELEMENTO VISUAL

La frontera circular no debe sentirse como una simple línea invisible.

Puede reaccionar.

Ejemplos:

* pulso al subir nivel;
* energía al expandirse;
* ondas;
* partículas;
* cambio gradual de color;
* reacción al recibir impactos;
* warning cuando el jugador toca el borde.

La arena puede convertirse en parte importante de la identidad visual.

---

# 48. EXPANSIÓN DE ARENA

Cuando crezca:

```text
     ○

↓

    ((○))

↓

   (((○)))
```

hacerlo visualmente satisfactorio mediante:

* ring;
* shockwave;
* particles;
* audio;
* breve camera zoom;
* cambio visual del background.

No necesita ser computacionalmente caro.

---

# 49. BACKGROUND

El fondo debe ser ligero.

Considerar:

* grid procedural;
* puntos;
* líneas;
* figuras;
* parallax simple;
* ondas;
* pequeñas partículas ambientales.

No utilizar fondos enormes innecesariamente.

El fondo debe proporcionar sensación de movimiento sin competir con enemigos y proyectiles.

---

# 50. MOBILE FIRST

Todas las decisiones deben preguntarse:

> ¿Esto funciona correctamente en un teléfono Android modesto?

Priorizar:

* input táctil;
* botones grandes;
* texto legible;
* bajo consumo;
* orientación apropiada;
* safe areas;
* diferentes aspect ratios;
* pause/resume;
* pérdida de focus;
* audio lifecycle.

---

# 51. INPUT

Crear:

```text
InputManager
```

que abstraiga:

```text
mouse
touch
keyboard
```

Gameplay no debe preguntar directamente:

```text
if touch...
if mouse...
```

Debe preguntar algo conceptual:

```ts
input.movementVector
```

---

# 52. LEVEL-UP UI

Cuando aparece selección de upgrade:

```text
GAME PAUSED

┌─────────┐
│ OPTION 1│
└─────────┘

┌─────────┐
│ OPTION 2│
└─────────┘

┌─────────┐
│ OPTION 3│
└─────────┘
```

En móvil deben ser fáciles de pulsar.

Mostrar claramente:

* icono;
* nombre;
* efecto;
* nivel;
* diferencia respecto al estado actual.

Mantener textos breves.

---

# 53. RUN STRUCTURE

Primera meta aproximada:

```text
5-15 minutos por run
```

No fijar duración definitiva todavía.

La intensidad debe escalar continuamente.

---

# 54. DIRECTOR DE DIFICULTAD

Considerar eventualmente un:

```text
DifficultyDirector
```

responsable de controlar:

* spawn budget;
* enemy composition;
* elites;
* hazards;
* intensidad;
* descansos;
* bosses.

No limitar dificultad únicamente a:

```text
enemyHP *= 1.1
```

El director puede producir curvas:

```text
tensión
   /\
  /  \      /\
 /    \____/  \____
```

en lugar de caos constante.

---

# 55. SPAWN BUDGET

Utilizar un presupuesto conceptual.

Ejemplo:

```text
chaser = 1 point
fast   = 1 point
ranged = 2 points
tank   = 3 points
elite  = 6 points
```

DifficultyDirector recibe:

```text
budget = 20
```

y construye una composición.

Esto facilita muchísimo el balance.

---

# 56. CHAOS CONTROL

Late game debe verse caótico.

Pero el jugador siempre necesita distinguir:

1. su personaje;
2. amenazas;
3. zonas seguras;
4. XP;
5. ataques importantes.

Nunca confundir:

**muchos efectos**

con:

**buenos efectos.**

---

# 57. PRIORIDAD VISUAL

Orden aproximado:

```text
CRITICAL HAZARD
PLAYER
BOSS ATTACK
ENEMIES
PLAYER ATTACKS
PICKUPS
PARTICLES
BACKGROUND
```

Los FX deben respetar esta jerarquía.

---

# 58. MVP / VERTICAL SLICE

NO comenzar creando enormes cantidades de contenido.

Primera versión:

```text
1 player

3 enemies

Chaser
Fast
Tank

3 weapons

Projectile
Orbit
Chain Lightning

1 hazard

Laser

1 boss

~10 upgrades

XP

Level Up

Game Over

Arena Growth
```

Objetivo:

**5 minutos extremadamente divertidos.**

---

# 59. PRIMERA META VISUAL

Antes de agregar más contenido, conseguir que:

```text
moverse
disparar
impactar
matar
ganar XP al derrotar
subir nivel
seleccionar upgrade
expandir arena
```

se sienta excelente.

Después crear contenido.

---

# 60. ORDEN DE IMPLEMENTACIÓN RECOMENDADO

## Phase 1 — Foundation

```text
Vite
TypeScript
PixiJS
GameLoop
Input
Arena
Player
Camera
```

## Phase 2 — Combat

```text
Enemy
Weapon
Projectile
Damage
Collision
SpatialGrid
Pooling
```

## Phase 3 — Progression

```text
XP directa por baja
Level
Upgrade selection
Weapon upgrades
```

## Phase 4 — Game Feel

```text
particles
shake
hit stop
trails
glow
audio
arena effects
```

## Phase 5 — Difficulty

```text
enemy variants
laser hazard
spawn budget
difficulty director
boss
```

## Phase 6 — Mobile Optimization

```text
profiling
QualityManager
adaptive quality
DPR limits
stress tests
memory tests
```

## Phase 7 — Platforms

```text
LocalPlatform
PokiPlatform
CrazyGamesPlatform
SDK lifecycle
ads
save
testing
```

---

# 61. TESTING

Crear stress-test/debug modes.

Ejemplo:

```text
Spawn 100 enemies
Spawn 250 enemies
Spawn 500 enemies

Spawn 500 projectiles

Spawn 500 particles
```

Mostrar opcionalmente:

```text
FPS
frame time
enemy count
projectile count
particle count
draw calls
memory indicators
quality level
```

No publicar necesariamente este HUD.

---

# 62. PROFILING

No decir:

> "esto debería ser rápido."

Medir.

Revisar:

```text
CPU
GPU
GC
frame time
draw calls
texture switches
memory
```

Especialmente cuando existan:

```text
muchos enemigos
muchos proyectiles
muchas partículas
```

---

# 63. DEPENDENCIAS

Mantener dependencias al mínimo.

Antes de instalar una dependencia preguntarse:

> ¿Resuelve suficientemente un problema real como para justificar peso y mantenimiento?

No instalar frameworks completos para utilidades pequeñas.

---

# 64. IA COMO PARTE DEL WORKFLOW

Este proyecto debe estar diseñado para permitir que agentes como:

* GPT / Codex;
* Grok;
* Claude;
* Cursor;
* otros agentes de programación;

puedan agregar contenido de manera segura.

Para conseguirlo:

* sistemas estables;
* interfaces claras;
* configuración data-driven;
* documentación;
* tests;
* separación de responsabilidades.

---

# 65. REGLA PARA AGENTES

Cuando agregues contenido:

**NO modifiques el engine si no es necesario.**

Ejemplo:

Si se solicita:

> agrega un enemigo que explota al morir

primero intenta construirlo utilizando:

```text
EnemyDefinition
Behavior
DeathEffect
ExplosionEffect
```

antes de modificar `EnemySystem`.

---

# 66. REGLA DE COMPLEJIDAD

Siempre elegir la solución más sencilla que cumpla:

```text
performance
maintainability
game feel
mobile compatibility
```

No utilizar patrones sofisticados únicamente porque existen.

---

# 67. REGLA DE OPTIMIZACIÓN

Optimizar primero aquello que ocurre:

```text
muchas veces × cada frame
```

Ejemplos:

```text
movement
collision
targeting
particles
rendering
```

No invertir tiempo optimizando menús que aparecen una vez.

---

# 68. REGLA DE DISEÑO

Cada nueva mecánica debe responder al menos una pregunta:

```text
¿hace más interesante moverse?

¿hace más interesante construir la build?

¿aumenta sensación de poder?

¿crea una decisión?

¿crea una amenaza?

¿mejora variedad?
```

Si no hace ninguna, probablemente no sea necesaria.

---

# 69. OBJETIVO FINAL

El juego debe sentirse:

**simple de jugar, difícil de dominar y espectacular al avanzar.**

Visualmente:

> geometría sencilla convertida en espectáculo mediante animación, color, partículas, sonido y feedback.

Técnicamente:

> HTML5 ligero, rápido y escalable.

Comercialmente:

> diseñado desde el principio para funcionar correctamente en Poki, CrazyGames, desktop y móviles modestos.

Arquitectónicamente:

> suficientemente organizado para crecer, pero suficientemente sencillo para que humanos y agentes de IA puedan comprenderlo y modificarlo.

---

# 70. INSTRUCCIÓN DE ARRANQUE PARA EL AGENTE

Cuando recibas este documento en un proyecto nuevo:

1. Analiza estos requisitos.
2. Examina las skills disponibles en tu entorno.
3. Busca y utiliza las skills relevantes.
4. Investiga documentación actual cuando corresponda.
5. Revisa especialmente las versiones actuales de:

   * PixiJS;
   * Vite;
   * Poki SDK;
   * CrazyGames SDK.
6. Evalúa el stack propuesto.
7. Identifica posibles mejoras reales.
8. No cambies la visión fundamental del juego.
9. Propón primero la arquitectura final.
10. Define un plan de implementación por fases.
11. Después comienza con el vertical slice.
12. Mantén rendimiento móvil como requisito desde la primera implementación.

La primera pregunta técnica que debe resolver el proyecto no es:

> ¿Cuántas armas podemos crear?

Es:

> **¿Podemos conseguir que un jugador, tres tipos de enemigos y tres armas se sientan excelentes y mantengan 60 FPS en hardware modesto?**

Si la respuesta es sí, construir el resto del juego encima.

# 70. MODELO DE IA AGNÓSTICO

Este proyecto será desarrollado utilizando diferentes modelos y agentes de programación.

Entre ellos pueden encontrarse:

* GPT / Codex
* GPT Sol
* GPT Luna
* Grok
* Claude
* Cursor Agents
* otros modelos actuales o futuros

Las instrucciones, reglas, documentación y skills del proyecto **NO deben depender de un modelo concreto**.

Nunca diseñar una skill bajo supuestos como:

```text
Grok entiende esto de esta forma
GPT necesita aquello
Claude debe hacer esto
```

En su lugar, definir:

```text
INPUT
CONSTRAINTS
EXPECTED OUTPUT
VALIDATION
EXAMPLES
```

Las skills pertenecen al **proyecto**, no al modelo.

---

# 71. PRINCIPIO DE PORTABILIDAD ENTRE AGENTES

Cualquier agente que abra el repositorio debe poder comprender el proyecto leyendo los mismos documentos.

La información crítica debe existir dentro del repositorio.

No depender de:

* memoria de conversaciones anteriores;
* instrucciones almacenadas únicamente en Cursor;
* contexto particular de Codex;
* prompts privados de Grok;
* memoria de un modelo concreto.

El repositorio debe ser la fuente de verdad.

Ejemplo:

```text
/project

AGENTS.md
PROJECT.md

/skills
    architecture.md
    performance.md
    svg-art.md
    svg-ui.md
    svg-characters.md
    fx.md
    enemies.md
    weapons.md
    mobile.md
```

Si un entorno determinado utiliza otro estándar para sus instrucciones:

```text
Cursor Rules
Claude Skills
Codex instructions
etc.
```

se pueden crear adaptadores pequeños.

Pero estos adaptadores deben apuntar a las reglas comunes del proyecto.

No mantener versiones contradictorias de las mismas instrucciones.

---

# 72. CAPABILITY DISCOVERY

Antes de comenzar una tarea importante, el agente debe revisar las capacidades disponibles en su entorno.

Buscar:

* skills;
* MCP/tools;
* documentación;
* browser/web search;
* image generation;
* testing tools;
* browser automation;
* terminal;
* profiling;
* SVG optimizers;
* build tools.

El agente debe utilizar las capacidades útiles disponibles independientemente de quién sea el proveedor del modelo.

Ejemplo:

```text
TASK:
crear nuevo boss

↓

CHECK AVAILABLE CAPABILITIES

↓

svg skill
enemy skill
fx skill
performance skill

↓

IMPLEMENTATION
```

---

# 73. SVG COMO PILAR DEL PROYECTO

SVG no debe considerarse simplemente:

> un formato para guardar imágenes.

Debe tratarse como un **lenguaje gráfico programable**.

SVG será uno de los pilares del pipeline artístico del juego.

Utilizarlo para:

* personajes;
* enemigos;
* bosses;
* armas;
* proyectiles;
* pickups;
* iconos;
* HUD;
* botones;
* marcos;
* barras;
* indicadores;
* warnings;
* elementos de arena;
* ciertos efectos visuales;
* material fuente para texturas.

---

# 74. OBJETIVO DEL SISTEMA SVG

Crear progresivamente una biblioteca reutilizable similar conceptualmente a una biblioteca de assets tipo Kenney.

Pero:

**vectorial + procedural + configurable + optimizada para IA.**

En vez de necesitar:

```text
enemy_blue.png
enemy_red.png
enemy_green.png
enemy_elite.png
enemy_fire.png
```

preferir:

```text
enemy.svg
```

más configuración:

```ts
{
    tint,
    outline,
    scale,
    glow,
    accent,
    animation,
    effects
}
```

Un mismo diseño base puede producir numerosas variantes.

---

# 75. SVG DESIGN SYSTEM

Crear un lenguaje visual común.

Los assets deben compartir convenciones.

Ejemplo:

```text
viewBox
0 0 100 100
```

cuando sea razonable.

El punto central debe ser consistente.

Por ejemplo:

```text
center = 50,50
```

Esto facilita:

* rotación;
* escalado;
* animación;
* generación por IA;
* composición;
* conversión a textura.

---

# 76. REGLAS PARA SVG GENERADO POR IA

Todo SVG generado debe:

1. tener `viewBox`;
2. evitar dimensiones arbitrarias innecesarias;
3. mantener geometría limpia;
4. evitar paths excesivamente complejos;
5. evitar miles de puntos;
6. utilizar grupos semánticos;
7. utilizar IDs/clases cuando sea útil manipular partes;
8. evitar datos/editor metadata innecesarios;
9. evitar imágenes raster embebidas salvo justificación;
10. evitar filtros caros por defecto;
11. ser escalable;
12. ser recoloreable siempre que sea posible;
13. ser fácil de rasterizar;
14. tener origen/centro predecible.

---

# 77. SVG SEMÁNTICO

Cuando un asset tenga varias partes, estructurarlo.

Ejemplo:

```xml
<svg viewBox="0 0 100 100">

    <g id="body">
        ...
    </g>

    <g id="core">
        ...
    </g>

    <g id="weapon">
        ...
    </g>

    <g id="accent">
        ...
    </g>

</svg>
```

Esto permite que herramientas o agentes modifiquen partes concretas sin reconstruir el asset.

Por ejemplo:

```text
increase core size
change weapon
animate accent
recolor body
```

---

# 78. PERSONAJES SVG MODULARES

No pensar necesariamente cada personaje como una sola ilustración plana.

Construirlos mediante piezas.

Ejemplo conceptual:

```text
PLAYER

       shield
         │
     ┌───○───┐
     │       │
   weapon   weapon

        core
```

SVG:

```text
player
├── shadow
├── outer-ring
├── body
├── core
├── weapon-left
├── weapon-right
└── highlight
```

Estas piezas pueden transformarse independientemente.

Permite:

* recoil;
* squash;
* rotation;
* damage feedback;
* charging;
* upgrades visuales.

---

# 79. ANIMACIÓN DE PERSONAJES SIN SPRITESHEETS

No depender automáticamente de spritesheets tradicionales.

La geometría permite animación procedural.

Ejemplo:

```text
idle
scale pulse

movement
tilt

shooting
recoil

damage
flash + compression

level up
expansion + rotation
```

Un personaje compuesto por pocos elementos puede transmitir mucha vida mediante transforms.

---

# 80. SVG PARA BOSSES

Los bosses deben beneficiarse especialmente de composición modular.

Ejemplo:

```text
          ◇
       ╱     ╲

   ◇      ◎      ◇

       ╲     ╱
          ◇
```

Puede estar compuesto de:

```text
core
armor rings
satellites
weapons
shield
energy lines
```

Sin necesidad de animación frame-by-frame.

---

# 81. SVG PARA UI

Crear una skill específica:

```text
svg-ui
```

Debe conocer y mantener el lenguaje visual del HUD.

SVG puede utilizarse para:

* iconos;
* health bars;
* XP bars;
* ability cards;
* upgrade cards;
* currency;
* warnings;
* badges;
* buttons;
* boss health;
* minimap symbols.

---

# 82. UI ESCALABLE

Una ventaja importante es mantener interfaces limpias en:

```text
720p
1080p
1440p
móviles high-DPI
```

Los SVG deben diseñarse para adaptarse a diferentes tamaños.

Pero mantener:

* texto legible;
* targets táctiles suficientes;
* contrastes fuertes.

No utilizar SVG solamente porque sea vectorial.

Para texto dinámico puede resultar mejor utilizar HTML, CSS, Pixi Text o bitmap fonts dependiendo del caso.

---

# 83. SVG + HTML/CSS

SVG también puede servir como recurso para HTML/CSS.

Por ejemplo:

```text
mask
clip-path
background image
icons
decorative shapes
```

Esto permite que la UI externa al canvas mantenga el mismo lenguaje artístico.

La skill SVG debe distinguir entre:

```text
SVG usado por Pixi

SVG inline DOM

SVG usado por CSS

SVG convertido a textura
```

porque sus capacidades y costes son diferentes.

---

# 84. CUATRO MODOS DE USAR SVG

La arquitectura debe contemplar al menos cuatro estrategias.

## A. SVG COMO TEXTURA

```text
SVG
↓
rasterización
↓
Pixi Texture
↓
Sprite
```

Usar cuando:

* existen muchas instancias;
* el gráfico no necesita modificar sus paths;
* performance es prioritario.

---

## B. SVG COMO GRAPHICS VECTORIAL

```text
SVG
↓
Pixi GraphicsContext
↓
Graphics
```

Útil cuando:

* necesitamos escalado vectorial real;
* geometría dinámica;
* pocas instancias;
* reutilización de contexto.

Antes de utilizar esta ruta, validar compatibilidad de las características SVG utilizadas.

---

## C. SVG INLINE EN HTML

```text
DOM SVG
```

Adecuado para:

* determinadas interfaces;
* elementos interactivos;
* pantallas no gameplay;
* gráficos que necesiten manipulación DOM.

No utilizar para cientos de enemigos durante gameplay.

---

## D. SVG COMO FUENTE DE BUILD

```text
SVG master
     ↓
asset pipeline
     ↓
PNG/WebP/atlas
     ↓
runtime
```

Puede ser la opción ideal para partes críticas de rendimiento.

---

# 85. DECISIÓN AUTOMÁTICA DE REPRESENTACIÓN

Crear una guía para decidir.

```text
¿Necesitamos cientos de copias?

YES
→ Texture/Sprite

NO
↓

¿Necesitamos modificar la geometría?

YES
→ Graphics/SVG

NO
↓

Texture generalmente preferida
```

La skill debe ayudar al agente a escoger.

---

# 86. SVG PERFORMANCE BUDGET

SVG puede ser muy ligero o sorprendentemente pesado.

Evitar:

* miles de nodos;
* paths gigantes;
* filtros Gaussian blur repetidos;
* máscaras complejas en cientos de objetos;
* parsing repetido;
* demasiados gradients únicos.

Priorizar:

* formas básicas;
* paths simples;
* reutilización;
* cache;
* texturas;
* GraphicsContext compartido.

---

# 87. SVG COMPLEXITY METRIC

Considerar eventualmente crear una herramienta interna que inspeccione assets.

Ejemplo:

```text
SVG REPORT

asset: boss_hex.svg

nodes:        27
paths:         8
path points:  144
gradients:     2
filters:       0
masks:         1

rating:
GOOD
```

Puede ejecutarse durante desarrollo/build.

La IA también puede utilizar estos datos para simplificar gráficos.

---

# 88. SVG OPTIMIZATION PIPELINE

Investigar integrar:

```text
SVGO
```

o herramienta equivalente vigente.

Pipeline conceptual:

```text
AI SVG
   ↓
validation
   ↓
cleanup
   ↓
optimization
   ↓
preview
   ↓
runtime asset
```

Nunca ejecutar optimización destructiva sin comprobar visualmente el resultado.

---

# 89. SVG VALIDATOR

Crear eventualmente:

```text
npm run validate:svg
```

Debe detectar cosas como:

* viewBox ausente;
* embedded raster;
* paths excesivamente complejos;
* dimensiones incorrectas;
* filtros prohibidos;
* IDs duplicados;
* unsupported features;
* metadata innecesaria.

---

# 90. SVG PREVIEW GALLERY

Crear una herramienta de desarrollo:

```text
/dev/svg-gallery
```

que muestre todos los assets.

Ejemplo:

```text
PLAYER

○ default
○ damaged
○ shield
○ elite

ENEMIES

△ chaser
◇ ranged
⬡ tank
✦ boss
```

Permitir probar:

```text
background
scale
tint
outline
glow
rotation
```

Esto acelera muchísimo el trabajo artístico con IA.

---

# 91. SVG LAB

Además de la galería, considerar:

```text
/dev/svg-lab
```

Un pequeño entorno donde podamos pegar SVG generado por IA y probarlo inmediatamente.

Funciones deseables:

```text
paste SVG

preview

change:
fill
stroke
scale
rotation

test:
dark background
light background
small size
large size

Pixi preview

export
```

Esto puede convertirse en una herramienta central del proyecto.

---

# 92. SKILL: SVG-ART

Crear una skill central:

```text
skills/svg-art.md
```

Su función:

> crear y modificar assets vectoriales compatibles con el lenguaje visual y pipeline técnico del proyecto.

Debe conocer:

* SVG syntax;
* paths;
* polygons;
* transforms;
* gradients;
* masks;
* clipping;
* composition;
* optimization;
* Pixi compatibility;
* mobile constraints.

---

# 93. SKILL: SVG-CHARACTER

Crear:

```text
skills/svg-character.md
```

Responsabilidades:

* player;
* enemies;
* elites;
* bosses.

Debe producir personajes:

```text
recognizable
modular
simple
animatable
recolorable
performant
```

Debe preferir identidad mediante silueta.

Por ejemplo:

```text
△
```

debe seguir siendo reconocible incluso:

```text
muy pequeño
sin glow
sin partículas
```

Los efectos mejoran el personaje.

No deben ser necesarios para reconocerlo.

---

# 94. SKILL: SVG-UI

Crear:

```text
skills/svg-ui.md
```

Responsable de:

* HUD;
* iconografía;
* cards;
* buttons;
* borders;
* indicators;
* warning symbols.

Reglas:

* mobile-first;
* touch-friendly;
* high contrast;
* legible;
* minimal;
* visual consistency.

---

# 95. SKILL: SVG-FX

Crear:

```text
skills/svg-fx.md
```

Responsable de diseñar efectos baratos utilizando geometría.

Ejemplos:

```text
rings
arcs
lines
stars
bursts
cones
waves
warning zones
target indicators
```

Pero debe conocer cuándo delegar efectos masivos al sistema de partículas/WebGL.

---

# 96. SKILL: SVG-OPTIMIZER

Crear:

```text
skills/svg-optimizer.md
```

Responsable de revisar assets.

Debe poder recibir:

```text
boss.svg
```

y responder:

```text
visual fidelity: GOOD
complexity: HIGH

recommendations:

- reduce path points
- reuse gradient
- remove blur
- merge groups
```

---

# 97. SVG COMPONENT LIBRARY

Crear progresivamente una biblioteca de piezas reutilizables.

Ejemplo:

```text
components/

cores/
rings/
wings/
spikes/
shields/
barrels/
blades/
eyes/
arrows/
stars/
energy/
```

Entonces un agente puede construir:

```text
boss =
core_03
+
ring_02
+
spikes_04
+
cannon_01 × 4
```

en vez de inventar todo desde cero.

---

# 98. PROCEDURAL ASSET COMPOSITION

Esta biblioteca puede evolucionar hacia composición procedural.

Ejemplo conceptual:

```ts
createEnemyVisual({

    core: "hex",

    satellites: 3,

    spikes: 6,

    ring: true,

    symmetry: 3

});
```

Esto permitiría generar cientos de variantes visualmente coherentes.

No implementar inmediatamente si aumenta demasiado la complejidad.

Pero mantener la arquitectura preparada para ello.

---

# 99. SVG TOKENS

Crear tokens visuales compartidos.

Ejemplo conceptual:

```ts
VisualTokens = {

    strokeThin: 2,

    strokeNormal: 4,

    strokeHeavy: 6,

    glowSmall: 4,

    glowMedium: 8,

    glowLarge: 16

}
```

Y colores:

```ts
GameColors = {

    player: ...,

    enemy: ...,

    danger: ...,

    warning: ...,

    energy: ...,

    xp: ...
}
```

Esto ayuda especialmente a agentes de IA a mantener consistencia.

---

# 100. IA + SVG: WORKFLOW ESPERADO

Ejemplo de solicitud:

> Crear un enemigo ranged que parezca una torreta geométrica.

El agente debe:

1. revisar `visual-language`;
2. revisar `svg-character`;
3. revisar `performance`;
4. reutilizar componentes existentes cuando sea posible;
5. generar SVG;
6. validar SVG;
7. probarlo en SVG Gallery;
8. comprobar Pixi compatibility;
9. añadir configuración del enemigo;
10. probarlo en gameplay.

No simplemente generar un archivo SVG aislado.

---

# 101. RESEARCH SVG

Antes de construir el sistema definitivo de assets, realizar una investigación técnica específica sobre SVG.

Investigar:

* capacidades SVG modernas;
* compatibilidad navegadores móviles;
* PixiJS SVG support actual;
* Graphics vs Texture;
* GraphicsContext;
* SVG rasterization;
* masks;
* clip paths;
* gradients;
* filters;
* CSS masks;
* optimization;
* SVGO;
* texture atlases;
* WebGL interaction;
* performance Android low-end.

El resultado debe convertirse en reglas permanentes del proyecto.

---

# 102. PRINCIPIO FINAL DEL PIPELINE ARTÍSTICO

No preguntar:

> ¿SVG o Pixi?

Son partes diferentes del sistema.

La arquitectura buscada es:

```text
             AI
              │
              ▼
         SVG SOURCE
              │
       ┌──────┼──────┐
       │      │      │
       ▼      ▼      ▼

     SVG    Graphics Texture
     UI      Pixi    Pixi

       │      │      │
       └──────┼──────┘
              ▼

          GAME RUNTIME
```

SVG proporciona:

**lenguaje artístico editable.**

PixiJS proporciona:

**renderer eficiente.**

TypeScript proporciona:

**comportamiento.**

El sistema de FX proporciona:

**impacto visual.**

La IA proporciona:

**producción acelerada de contenido.**

---

# 103. OBJETIVO A LARGO PLAZO

El proyecto debería terminar poseyendo una pequeña biblioteca artística propia.

Algo equivalente conceptualmente a:

> un mini Kenney específico para Geometry Survivor.

Pero construido alrededor de:

```text
SVG
+
procedural composition
+
AI generation
+
code-driven animation
```

Esta biblioteca podría posteriormente reutilizarse en otros juegos.

Por ello, los assets genéricos deben mantenerse desacoplados de reglas demasiado específicas de Geometry Survivor cuando tenga sentido.

# 104. MODULARIDAD COMO REQUISITO

La modularidad es un requisito fundamental del proyecto.

El proyecto debe evitar explícitamente:

* God Objects;
* God Classes;
* archivos gigantes;
* managers que controlan sistemas no relacionados;
* funciones con múltiples responsabilidades;
* dependencias circulares;
* lógica de gameplay dentro del renderer;
* lógica de UI dentro de entidades;
* lógica específica de armas dentro de sistemas genéricos;
* llamadas directas a SDKs externos desde gameplay;
* archivos `utils.ts` convertidos en contenedores de funciones sin relación.

La prioridad es que cualquier desarrollador o agente pueda localizar rápidamente dónde pertenece una funcionalidad.

---

# 105. SINGLE RESPONSIBILITY

Cada módulo debe tener una responsabilidad principal claramente identificable.

Ejemplo correcto:

```text
CollisionSystem
→ detecta/resuelve interacciones espaciales.

DamageSystem
→ procesa daño.

WeaponSystem
→ actualiza armas.

FxManager
→ dispara efectos visuales.

AudioManager
→ administra audio.
```

Ejemplo incorrecto:

```text
EnemyManager

→ crea enemigos
→ mueve enemigos
→ calcula colisiones
→ aplica daño
→ reproduce sonidos
→ genera partículas
→ entrega XP
→ controla dificultad
```

Esto constituye un God Object y debe dividirse.

---

# 106. REGLA DE UNA RAZÓN PARA CAMBIAR

Un archivo debe tener idealmente **una razón principal para cambiar**.

Ejemplo:

Si cambia la fórmula de daño:

```text
DamageSystem
```

Si cambia cómo se dibuja un enemigo:

```text
EnemyRenderer
```

Si cambia su definición:

```text
EnemyDefinition
```

Si cambia cómo aparecen:

```text
SpawnSystem
```

Si cambia la dificultad:

```text
DifficultyDirector
```

Modificar una mecánica no debería requerir editar numerosos archivos sin relación.

---

# 107. SEPARACIÓN DE CAPAS

Mantener separación conceptual:

```text
CONTENT
   ↓
SIMULATION
   ↓
EVENTS / STATE
   ↓
PRESENTATION
   ↓
RENDER
```

Además:

```text
INPUT → SIMULATION
AUDIO ← EVENTS
FX    ← EVENTS
UI    ← STATE/EVENTS
```

Nunca:

```text
Enemy
   ↓
DOM
   ↓
PokiSDK
   ↓
Audio
   ↓
Particles
```

---

# 108. GAMEPLAY NO CONOCE EL RENDERER

La simulación debe poder representar:

```text
enemy position
enemy health
enemy state
projectile position
damage
XP
```

sin necesitar conocer detalles visuales de PixiJS.

Evitar:

```ts
enemy.sprite.tint = ...
```

dentro de lógica de gameplay.

Preferir:

```ts
enemy.state = EnemyState.Damaged;
```

o emitir:

```ts
events.emit("enemy:damaged", data);
```

La capa visual decide cómo representar ese evento.

---

# 109. RENDERER NO DECIDE GAMEPLAY

El renderer puede:

* mostrar;
* ocultar;
* animar;
* interpolar;
* aplicar efectos.

No debe decidir:

* daño;
* HP;
* experiencia;
* cooldown;
* dificultad;
* drops;
* reglas de armas.

PixiJS representa el juego.

No gobierna sus reglas.

---

# 110. EVENTOS ENTRE SISTEMAS

Cuando sistemas desacoplados necesiten reaccionar a una acción, preferir eventos tipados.

Ejemplo:

```ts
type GameEvents = {
    enemyKilled: EnemyKilledEvent;
    playerDamaged: PlayerDamagedEvent;
    levelUp: LevelUpEvent;
    criticalHit: CriticalHitEvent;
};
```

Entonces:

```text
DamageSystem
     │
     └── enemyKilled
             │
      ┌──────┼────────┐
      ▼      ▼        ▼
     XP     FX       Audio
```

`DamageSystem` no necesita saber cómo funcionan XP, partículas o sonido.

---

# 111. NO CONVERTIR EVENTBUS EN OTRO GOD OBJECT

Los eventos tampoco deben utilizarse indiscriminadamente.

No crear:

```text
GlobalEventBus
```

con cientos de eventos arbitrarios y dependencias invisibles.

Los eventos deben:

* estar tipados;
* tener propósito claro;
* documentarse;
* utilizarse para desacoplar sistemas;
* evitar cadenas difíciles de seguir.

Las llamadas directas entre módulos pueden ser preferibles cuando existe una dependencia clara y estable.

---

# 112. COMPOSICIÓN SOBRE HERENCIA

Preferir:

**composition over inheritance.**

Evitar jerarquías como:

```text
Entity
 ↓
LivingEntity
 ↓
Enemy
 ↓
RangedEnemy
 ↓
EliteRangedEnemy
 ↓
FireEliteRangedEnemy
```

Preferir:

```text
EnemyDefinition

components:
- movement
- health
- attack
- behavior
- modifiers
```

Ejemplo:

```ts
{
    type: "triangle",

    behavior: "chase",

    modifiers: [
        "fast",
        "explosive"
    ]
}
```

---

# 113. CONTENIDO NO ES ENGINE

Agregar:

```text
enemy
weapon
upgrade
boss
hazard
```

no debería requerir modificar el engine salvo que introduzca una mecánica fundamentalmente nueva.

Preferir:

```text
content/
   enemies/
   weapons/
   upgrades/
   bosses/
   hazards/
```

El contenido configura sistemas existentes.

---

# 114. SISTEMAS PEQUEÑOS

Evitar sistemas que acumulen responsabilidades con el tiempo.

Por ejemplo, si:

```text
WeaponSystem.ts
```

termina administrando:

* targeting;
* projectile creation;
* cooldowns;
* damage;
* visual effects;
* audio;
* upgrades;

dividirlo.

Podría evolucionar hacia:

```text
weapons/

WeaponSystem.ts
TargetingSystem.ts
ProjectileSpawner.ts
WeaponDefinitions.ts
WeaponModifiers.ts
```

Solo crear estas divisiones cuando exista responsabilidad real.

No fragmentar artificialmente código pequeño.

---

# 115. MODULARIDAD SIN SOBREINGENIERÍA

Modularidad no significa:

> un archivo por cada función.

Evitar ambos extremos:

```text
GOD FILE
5000 líneas
```

y:

```text
200 archivos
de 5 líneas
```

La unidad correcta es:

> responsabilidad cohesiva.

Un módulo puede contener varias funciones si todas pertenecen claramente al mismo propósito.

---

# 116. LÍMITE DE COMPLEJIDAD

No imponer un límite rígido de líneas.

Pero utilizar señales de alerta.

Revisar un archivo cuando:

```text
> ~300-500 líneas
```

especialmente si continúa creciendo.

Revisar una función cuando:

```text
> ~40-60 líneas
```

especialmente si realiza diferentes operaciones conceptuales.

Estos números son señales.

No reglas absolutas.

Una función larga pero cohesiva puede ser válida.

Una función de 20 líneas con cinco responsabilidades puede ser incorrecta.

---

# 117. DEPENDENCY DIRECTION

Las dependencias deben apuntar principalmente hacia abstracciones estables.

Ejemplo:

```text
CONTENT
   ↓
GAME SYSTEMS
   ↓
CORE
```

Mientras:

```text
Pixi Adapter
Poki Adapter
CrazyGames Adapter
Audio Adapter
```

se encuentran alrededor del core.

El core no debe depender directamente de plataformas externas.

---

# 118. ADAPTER PATTERN PARA EXTERNOS

Utilizar adaptadores para tecnologías externas importantes.

```text
Game
 │
 ├── Renderer
 │      └── PixiRenderer
 │
 ├── Platform
 │      ├── PokiPlatform
 │      └── CrazyGamesPlatform
 │
 └── Audio
        └── WebAudioAdapter
```

Si posteriormente cambia una tecnología externa, el impacto debe estar localizado.

---

# 119. COMPOSITION ROOT

Debe existir un único lugar principal donde se ensamblen las dependencias.

Ejemplo:

```ts
const world = new World();

const events = new GameEventBus();

const renderer = new PixiRenderer();

const audio = new AudioManager();

const collision = new CollisionSystem(world);

const damage = new DamageSystem(world, events);

const fx = new FxManager(renderer, events);

const game = new Game({
    world,
    renderer,
    audio,
    collision,
    damage,
    fx
});
```

Este archivo puede conocer muchos sistemas porque su responsabilidad es precisamente:

**ensamblar la aplicación.**

No debe contener sus implementaciones.

---

# 120. GAME CLASS PEQUEÑA

`Game.ts` NO debe convertirse en:

```text
Game.ts
8,000 líneas
```

Su responsabilidad debería limitarse aproximadamente a:

* lifecycle;
* coordinación principal;
* start;
* pause;
* resume;
* shutdown;
* conexión con game loop.

No implementar directamente:

* enemigos;
* armas;
* colisiones;
* partículas;
* UI;
* bosses;
* publicidad.

---

# 121. WORLD TAMPOCO ES GOD OBJECT

`World` puede contener/referenciar estado global de simulación.

Pero no debe convertirse en un manager universal.

Correcto:

```ts
world.enemies
world.projectiles
world.pickups
world.player
```

Incorrecto:

```ts
world.spawnEnemy()
world.playSound()
world.showAd()
world.createExplosion()
world.updateUI()
```

`World` almacena estado.

Los sistemas operan sobre él.

---

# 122. UI DESACOPLADA

La UI debe reaccionar a:

* state;
* events;
* selectors/view models.

No debe modificar internamente sistemas arbitrarios.

Ejemplo:

```text
LevelUpUI
     │
     ▼
UpgradeSelection
     │
     ▼
UpgradeSystem
```

No:

```text
LevelUpUI
→ modifica WeaponSystem internamente
→ cambia Player directamente
→ reproduce FX
→ guarda partida
```

---

# 123. SVG TAMBIÉN DEBE SER MODULAR

Los assets SVG complejos deben seguir las mismas reglas.

Ejemplo:

```text
boss.svg

boss
├── core
├── armor
├── weapons
├── satellites
└── accents
```

Cuando convenga, utilizar componentes reutilizables:

```text
svg/components/

cores/
rings/
wings/
weapons/
shields/
spikes/
```

No crear un SVG monstruoso imposible de modificar.

---

# 124. FX DESACOPLADOS

Gameplay no debe construir partículas directamente.

Incorrecto:

```ts
enemy.takeDamage();

createParticle(...);
createParticle(...);
shakeCamera();
playSound();
flashScreen();
```

Preferir:

```ts
events.emit("criticalHit", event);
```

Y posteriormente:

```text
FxManager
AudioManager
CameraEffects
```

reaccionan según corresponda.

---

# 125. CONFIGURACIÓN CENTRALIZADA

Valores importantes no deben estar dispersos.

Evitar:

```ts
if (distance < 150)
```

en seis archivos diferentes.

Preferir configuraciones apropiadas:

```ts
weapon.range
enemy.attackRange
arena.radius
quality.maxParticles
```

No convertir tampoco un único `config.ts` en otro archivo dios.

Separar:

```text
config/

gameplay.ts
rendering.ts
quality.ts
audio.ts
platform.ts
```

---

# 126. CONTRATOS TIPADOS

Utilizar TypeScript para crear contratos claros.

Ejemplos:

```ts
WeaponDefinition
EnemyDefinition
UpgradeDefinition
HazardDefinition
FxRecipe
GamePlatform
Renderer
AudioService
```

Evitar:

```ts
any
```

salvo casos excepcionales justificados.

---

# 127. PUBLIC API DE CADA MÓDULO

Cada módulo importante debe exponer solamente aquello que otros módulos necesitan.

Evitar manipular internals.

Ejemplo:

```ts
weaponSystem.fire(...)
```

en lugar de:

```ts
weaponSystem.weapons[4]
    .internalState
    .cooldownTimer = ...
```

Esto permite cambiar implementación posteriormente.

---

# 128. REGLA PARA AGENTES DE IA

Antes de modificar código, cualquier agente debe preguntarse:

```text
1. ¿A qué módulo pertenece esta responsabilidad?

2. ¿Ya existe un sistema encargado?

3. ¿Estoy mezclando gameplay, render, UI o platform?

4. ¿Estoy haciendo crecer un God Object?

5. ¿Esta funcionalidad puede ser data-driven?

6. ¿Estoy duplicando lógica existente?

7. ¿Estoy introduciendo una dependencia circular?

8. ¿Necesito realmente modificar el engine?
```

---

# 129. REGLA DE REFACTOR PREVENTIVO

Si una tarea nueva obliga a meter una responsabilidad no relacionada dentro de un módulo existente:

**no añadirla simplemente por comodidad.**

Evaluar primero extraer una abstracción apropiada.

Ejemplo:

```text
EnemySystem
```

ya tiene movimiento y estado.

Se solicita targeting.

No agregar automáticamente otras 300 líneas.

Evaluar:

```text
TargetingSystem
```

si targeting será compartido por:

* enemies;
* weapons;
* bosses;
* chain lightning.

---

# 130. REGLA ANTI-DUPLICACIÓN

Si dos sistemas empiezan a implementar la misma lógica:

```text
distance query
target selection
pool management
cooldown calculation
```

extraer una abstracción compartida cuando exista una generalización real.

No abstraer solamente porque dos fragmentos casualmente se parecen.

---

# 131. TESTABILIDAD COMO SEÑAL ARQUITECTÓNICA

La lógica importante debería poder probarse sin arrancar todo PixiJS.

Idealmente podemos ejecutar:

```text
DamageSystem test
WeaponSystem test
SpatialGrid test
UpgradeSystem test
DifficultyDirector test
```

sin:

```text
browser
canvas
Poki SDK
CrazyGames SDK
```

Si una regla básica de daño necesita levantar Pixi para probarse, existe demasiado acoplamiento.

---

# 132. DEFINICIÓN DE HECHO PARA CAMBIOS DE CÓDIGO

Una feature no se considera terminada solamente porque:

> funciona.

También debe cumplir:

* responsabilidad ubicada correctamente;
* sin duplicación innecesaria;
* sin dependencia circular;
* tipos correctos;
* performance razonable;
* compatible con mobile;
* código comprensible;
* configuración separada cuando corresponda;
* tests para lógica crítica;
* documentación actualizada si modifica arquitectura.

---

# 133. PRINCIPIO ARQUITECTÓNICO FINAL

El objetivo no es tener la arquitectura más sofisticada.

El objetivo es que dentro de meses podamos abrir:

```text
EnemySystem.ts
```

y encontrar lógica de enemigos.

Abrir:

```text
FxManager.ts
```

y encontrar efectos.

Abrir:

```text
svg-character
```

y encontrar reglas de personajes SVG.

Abrir:

```text
PokiPlatform.ts
```

y encontrar Poki.

Y que agregar:

```text
1 arma
1 enemigo
1 upgrade
```

no requiera comprender o modificar todo el proyecto.

La arquitectura debe favorecer:

**LOCALIDAD DEL CAMBIO.**

Una feature debería modificar la menor superficie posible del proyecto.

---

# 134. INSTRUCCIÓN OBLIGATORIA PARA CUALQUIER MODELO

Estas reglas son independientes del modelo utilizado.

Aplican igualmente a:

```text
Grok
GPT
Codex
Claude
Cursor Agents
y futuros modelos
```

Si una solicitud del usuario parece requerir una solución rápida que viole estas reglas, el agente debe preferir una implementación modular y mantenible.

No sacrificar arquitectura permanentemente para ahorrar unos minutos de implementación.

                    PROJECT
                       │
       ┌───────────────┼────────────────┐
       │               │                │
     CORE          SIMULATION      PRESENTATION
       │               │                │
   GameLoop          World            Pixi
   Time              Systems          SVG
   Lifecycle         SpatialGrid      FX
                                      Audio
                       │
                    CONTENT
                  ↙    ↓    ↘
              enemies weapons upgrades

                       │
                    PLATFORM
                  ↙          ↘
                Poki       CrazyGames
