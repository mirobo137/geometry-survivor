# Contrato de asset SVG

Este documento complementa `SKILL.md` cuando la tarea necesita definir varios assets o una familia parametrizada.

## Ficha minima

Cada asset compartido debe poder describirse con una ficha equivalente a esta:

```ts
export interface SvgAssetSpec {
  id: string;
  file: string;
  role: 'ui' | 'player' | 'enemy' | 'weapon' | 'hazard' | 'pickup' | 'fx' | 'logo';
  viewBox: readonly [number, number, number, number];
  anchor: readonly [number, number];
  renderMode: 'inline' | 'texture' | 'graphics-context';
  maxInstances: number;
  states: readonly string[];
  paletteTokens: readonly string[];
}
```

No es obligatorio crear esta interfaz para un icono aislado. Sí es recomendable cuando el asset aparece en contenido, se comparte entre escenas o puede cambiar de modo de render.

## Reglas geometricas

- Iconos: `viewBox` cuadrado y ancla en el centro salvo que el icono sea una flecha o una pieza con pivote claro.
- Player/enemigos: usa un `viewBox` centrado alrededor de `(0, 0)` si el runtime rota o escala desde el centro.
- Proyectiles: deja el centro de masa en el origen y evita padding invisible que falsee colisiones visuales.
- Hazards: separa el contorno de advertencia de la superficie dañina; el jugador debe entender el limite antes de recibir daño.
- Botones: el SVG dibuja el fondo y el icono; el hit-area y el texto viven en el componente UI.

## Recetas de bajo coste

### Icono de estado

Usa una silueta principal, un contorno con `stroke-linecap="round"`, una marca secundaria y como maximo un gradiente o highlight. Entrega estados como grupos o variantes predefinidas, no como docenas de paths generados en runtime.

### Enemigo geometrico

Usa una forma dominante reconocible a 32–48 px, un detalle de direccion y una senal de estado separada. La sombra debe ser una forma plana o alpha baja, no un filtro por entidad.

### Hazard circular

Usa anillos o segmentos con `stroke-dasharray`, contraste suficiente y una animacion de escala/alpha en el contenedor. Mantén una version Low sin filtros ni miles de segmentos.

### Pickup

Usa una silueta de alto contraste y un halo barato construido con uno o dos circulos alpha. El halo no debe ser la unica señal del pickup.

## Paleta y estados

Define tokens fuera del SVG cuando el consumidor pueda recolorear. Cada estado debe decir que cambia:

- `normal`: silueta y contraste base;
- `hover`: solo para desktop, nunca requisito de lectura;
- `pressed`: escala o desplazamiento minimo, no desaparicion;
- `disabled`: contraste reducido pero legible;
- `selected`: contorno/pattern adicional;
- `warning`/`critical`: forma o ritmo de animacion mas urgente, ademas del color.

## IDs, defs y seguridad

- Prefija todo `id` con el asset y evita IDs genericos como `a`, `clip0` o `gradient1`.
- Usa `defs` solo si hay una referencia real. Si un `clipPath` o gradiente no se reutiliza, una forma plana puede ser mejor.
- No uses `url(http...)`, `data:` remotos, enlaces, eventos XML ni contenido HTML incrustado.
- Un optimizador nunca debe eliminar `viewBox`, `title`, `desc` o un ID referenciado. Si hay duda, desactiva el plugin concreto y mide el resultado.
