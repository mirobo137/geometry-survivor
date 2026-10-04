# Vistas Pixi de enemigos

Contrato vigente: [Enemigos de una imagen](../../../../docs/design/ENEMIGOS_IMAGEN_UNICA.md).
Las 13 familias comunes y tres bosses usan un PNG transparente como cuerpo
completo y comparten la muerte de 420 ms aprobada a partir de Tank. Catálogo,
procedencia y briefs de generación: [assets enemigos](../../../assets/images/enemies/README.md).

`EnemyShipVisual` empieza con el master `flat` SVG de fallback; al decodificar
su PNG correspondiente cambia la textura del sprite existente. Mantiene el
cuerpo completo en todos los presets.
Medium/High aplican transforms secundarios a la imagen; Low/movimiento reducido
los omiten. Splitter conserva la escala de sus hijos y Warden Replica la suya.
Los masters SVG completos se conservan como fallback. Los SVG separados de
piezas comunes se conservan como fuentes, pero ya no se cargan al runtime;
`FractureEnemySvgMarkup` sigue ensamblando sus masters de fallback.
Los bosses mantienen las cuatro capas de su entrada actual y pasan al PNG al
acabar el ensamblaje.

`SingleImageDefeat` define la partición y movimiento compartidos.
`EnemyDefeatFxView` reutiliza 18×4 sprites High / 12×4 Medium; cada
`BossShipVisual` reutiliza sus propios sprites y conserva identidad tras reset.
Low/movimiento reducido no crean fragmentos. Las vistas de textura comparten
la fuente del cuerpo; destroy no destruye esa fuente.

Prism Weaver conserva su telegraph pooled independiente en
`PrismWeaverTelegraphView`; Charger, Orbiter y amenazas Fracture mantienen sus
vistas de warning. La muerte/cambio de cuerpo no altera los ataques.

`CombatEntitiesView` coordina pools, handoff de pose por índice/generación y
limpieza. Las vistas no deciden daño, XP, colisiones ni reglas.
El feedback transversal en `../fx/EnemyImpactFxView.ts` reutiliza bloom y
chispas. La muerte añade descarga del reactor (destello blanco-dorado,
resplandor azul y seis rayos breves) desde contextos cacheados, independientes
del cuerpo SVG/PNG. Reutiliza los tres Graphics por slot y el pool de partículas;
el contrato vigente detalla límites y degradación.

Prueba visual: `/docs/visual/tank-defeat.html`, ahora con las 16 familias.
Diagnóstico: `node scripts/qa-tank-defeat.mjs`; ver contrato para evidencia
y el flujo de sustitución actual. El usuario revisará el arte en su juego.
