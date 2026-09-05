# Bastión de placas — referencia artística

## Contrato

- Rol real: Tank resistente y lento; no incorpora escudo ni arma nueva.
- Verbo visual: blindaje pesado que encierra un reactor hundido.
- Frente: `-Y`; ancla `(0,0)`; frame compartido `-32 -32 64 64`.
- Lectura: proa truncada, hombros anchos, dos motores traseros y reactor pequeño.
- Cuatro piezas: rear (chasis/motores), wings (blindaje lateral), hull
  (proa/quilla/cavidad), cockpit (reactor). Conservan animación y desarme existentes.
- Master: concatenación exacta de primitivas en el orden de esas cuatro piezas.
- Low: master rasterizado compartido en el sprite hull; no se pierden hombros.
- Medium/High: piezas cacheadas y compositor existente. Sin cambio de daño,
  colisión, HP, velocidad, spawn, drops ni capacidad de pools.

## Elección de silueta

Se compararon conceptualmente tres construcciones: aguja con placas (demasiado
próxima a Fast), disco concéntrico (sin frente claro) y bastión ancho con proa
truncada (elegida por masa y orientación). Esta comparación conceptual no se
presenta como prueba visual de tres propuestas renderizadas.

## Construcción

El chasis conecta las piezas detrás del blindaje. Dos muescas separan proa y
hombros; la popa se estrecha alrededor de motores gemelos. El bisel frontal es
claro; caras laterales medias; retorno de placas oscuro. Las ranuras no tienen
contorno blanco. El reactor facetado se aloja dentro de una cavidad negra más
grande que su montaje. La marca cálida lateral es pintura, no una nueva amenaza.

Palette por material: cavidad `#0b1120`, chasis `#15182e`, blindaje violeta medio,
biseles lila claro; blanco limitado al reactor, luces violetas en motores y dos
marcas de pintura cálida. La luz es estilizada local, no una iluminación mundial.

Presupuesto: 23 paths (4 rear, 6 wings, 8 hull, 5 cockpit), techo 24 sólo para
este asset. Sin curvas complejas, filtros, máscaras, gradientes o dependencias.
Se justifica superar las 12 primitivas antiguas por planos estáticos horneados;
se mantienen cuatro piezas runtime y el flash existente. Se suma una textura
plana compartida para Low, con el mismo frame/resolución de la fábrica actual.

## Inspección

Arrancar Vite desde la raíz con `npm run dev` y abrir
`/docs/visual/tank-reference.html`. No abrir con file://: la comparación Pixi
importa los módulos reales mediante Vite. No forma parte de dist ni del menú.
La lámina muestra original, master, composición Pixi, Low, tamaños, grises y
despiece. Después comprobar `?stress=1` en Low/High y una muerte de Tank.

La aprobación artística y rendimiento físico se reportan en CONTINUACION.md;
no se consideran satisfechos sólo por existir esta ficha.
Procedimiento canónico: `skills/geometry-survivor-svg/references/ship-art-direction.md`.
