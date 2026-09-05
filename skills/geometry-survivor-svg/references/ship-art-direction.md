# Construcción artística de naves — estándar de referencia

Aplicar a cada nave nueva o rediseñada, independientemente del modelo.
No significa copiar la silueta del Tank en todos los enemigos.

## Ejemplo ejecutable

- Fuente: `src/assets/svg/enemies/tank/tank.svg` y sus cuatro piezas.
- Ficha: `src/assets/svg/enemies/tank/README.md`.
- Lámina comparativa: `docs/visual/tank-reference.html`, servida por Vite en
  desarrollo; incluye original, master, piezas, tamaños, silueta y compositor Pixi.
- Referencia anterior conservada sólo en `docs/visual/tank-before.svg`.

Estas rutas parten de la raíz del repositorio. La lámina no se importa al juego
ni exige construir un editor o una galería general. Es un candidato de referencia:
no confundir validación estructural con aprobación artística del usuario.

## Procedimiento obligatorio: no empezar por adornos

1. **Contrato y verbo visual.** Declarar rol real, tamaño mínimo, dirección,
   colisión existente, calidad, piezas y frase visual: «blindaje pesado que
   encierra un reactor», no «nave increíble con muchos detalles».
2. **Tres siluetas.** Comparar proporciones diferentes en negro: ancha, alargada,
   segmentada, según rol. Elegir una y explicar por qué las otras se descartan.
   No cuentan tres colores de la misma geometría. Si el usuario ya eligió una
   silueta concreta, conservarla y documentar la elección en lugar de rehacerla.
3. **Tres niveles de forma.** Masa principal reconocible; componentes que
   explican ensamblaje; acentos pequeños. No añadir detalle terciario mientras
   la masa principal falle a 32 px. El frente debe sobrevivir a un giro de 180°.
4. **Volumen con planos.** Chasis oscuro → blindaje medio → bisel claro →
   cavidad oscura → energía localizada. Dos o tres planos por placa bastan;
   no contornear en blanco todas las superficies ni usar blur para crear volumen.
5. **Espacio negativo.** Reservar muescas o separaciones reales en la silueta;
   una línea pintada del color del fondo no es un agujero. No sugerir un paso
   atravesable en el centro de una entidad cuya colisión siga siendo circular.
6. **Ensamblaje.** Mostrar una raíz, soporte o solape entre piezas. Dibujar con
   el orden runtime real: rear → wings → hull → cockpit. Los movimientos deben
   conservar la unión; no puede aparecer un hueco accidental al oscilar una placa.
7. **Material y luz.** Los tonos planos sugieren espesor, no iluminación física.
   Mantener convención coherente en espacio local; no afirmar luz mundial fija
   cuando la textura rota con la nave. Cavidad, metal y energía no comparten valor.
8. **Acento con función.** Núcleo y motores pueden emitir luz; la pintura no
   brilla igual. No inventar cañones, escudos o estados de ataque inexistentes.
9. **Despiece y Low.** Separar sólo grupos con movimiento/muerte útil. Si Low
   oculta piezas que definen identidad, usar un master compuesto cacheado en un
   sprite, no una nave amputada. No crear una textura por enemigo.
10. **Comparar y entregar.** Original/propuesta al mismo tamaño, silueta negra,
    grises, 32/48/64/96 px, fondos claro/oscuro y render Pixi. Después probar
    giro, impacto, separación, pausa, restart y presencia en caos real.

## Cómo construir un bisel por código

En el Tank, `prow` es la cara principal; `prow-bevel` ocupa sólo el borde
frontal y `prow-shadow` el retorno de la placa. Son polígonos cerrados que
comparten vértices. No son tres copias escaladas con strokes cada vez más claros.
`reactor-well` es mayor que `reactor-mount`: deja visible una franja oscura que
separa la energía del blindaje. `armor-shadow` y `vents` dan espesor lateral.

Primero dibujar las masas; luego deducir biseles de sus vértices. Trabajar con
coordenadas legibles y IDs semánticos. No comprimir centenares de puntos dentro
de un solo path para aparentar que se cumple un límite de primitivas.

## Presupuesto: distinguir fuente y runtime

El Tank de referencia usa 23 paths repartidos en cuatro piezas y un master
compuesto para Low. El presupuesto específico es 24 primitivas; no amplía el
de todas las familias. No se añaden filtros, gradientes, máscaras ni partículas.
Los biseles se rasterizan una vez con el mismo frame y resolución existente.
El master Low añade una textura compartida, no otro sprite por instancia.

Antes de ampliar un presupuesto anotar bytes SVG, segmentos aproximados,
dimensiones reales de textura, texturas únicas, sprites visibles y parseo/carga.
Medir frame time/overdraw en el mismo escenario. «Más paths horneados» no implica
automáticamente más coste por frame, pero tampoco certifica coste cero.
No incrementar DPR, pool ni resolución para que un detalle diminuto sea visible.

## Rechazo artístico: corregir antes de seguir

- Se distingue sólo por color: cambiar masa o espacio negativo.
- Parece un icono con borde blanco: jerarquizar superficies y ensamblaje.
- Parece una piedra: recuperar frente, motor y función mediante proporciones.
- Todo brilla: reducir blancos y aislar reactor/motores en cavidades.
- Sólo impresiona a 400 px: quitar detalles, ensanchar rasgo distintivo.
- Todas las naves parecen Tank: cambiar verbo y proporciones, conservar materiales.
- Piezas flotan al animar: revisar solapes, frame común y amplitud antes de offsets.
- Low pierde identidad: revisar composición plana; no ocultar información.
- El master difiere de las piezas: actualizar ambos y probar equivalencia de
  primitivas, atributos y orden; no aceptar sólo coincidencia parcial de paths.

La rúbrica de SKILL.md sigue vigente; una autoevaluación 8/10 no es evidencia
visual ni sustituye la aprobación del usuario. Registrar problemas observados,
no declarar «espectacular» porque el SVG parsea o los tests pasan.

## Plantilla de encargo para cualquier agente

```text
Rol real / verbo visual:
Referencia aprobada y rasgos que NO se copiarán:
Tres siluetas / elección justificada:
Tamaño mínimo y orientación:
Masa principal / componentes / acento:
Materiales y jerarquía de valores:
Espacios negativos y colisión conservada:
Piezas, orden, solapes, animación y muerte:
Low / Medium / High:
Presupuesto de fuente, texturas y sprites:
Comparación visual y resultados medidos:
Pendiente humano y archivos de referencia:
```

Crear una sola familia por entrega. No rediseñar simultáneamente todo el juego,
no tocar gameplay ni convertir cada detalle estático en un objeto animado.
