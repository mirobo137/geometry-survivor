# Vistas Pixi de enemigos

Contrato vigente: [Enemigos de una imagen](../../../../docs/design/ENEMIGOS_IMAGEN_UNICA.md).
Las 13 familias comunes y tres bosses muestran su cuerpo completo en combate
y comparten la muerte de 420 ms aprobada a partir de Tank. Los masters SVG
se conservan; PNG nuevos y entradas especiales de bosses siguen pendientes.

`EnemyShipVisual` usa `flat` como cuerpo completo en todos los presets.
Medium/High aplican transforms secundarios a la imagen; Low/movimiento reducido
los omiten. Splitter conserva la escala de sus hijos y Warden Replica la suya.
Las capas modulares siguen cacheadas como fuente/fallback de contratos antiguos,
no como varias imágenes nuevas por enemigo. Los bosses mantienen las cuatro
capas de su entrada actual y pasan al cuerpo completo al acabar el ensamblaje.

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
y pasos del futuro reemplazo PNG.
