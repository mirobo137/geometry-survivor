# Colección de recompensas — catálogo funcional

Estado: implementado localmente el 04-10-2026, tras aprobación explícita del
piloto por el usuario. No requiere otra aprobación para integrarse. La revisión
humana final en móvil y la publicación remota quedan a cargo de la siguiente
validación. Sustituye la galería sintética del piloto.

## Alcance y acceso

30 cosméticos exclusivos: diez naves (incluye Asterion y Solstice), diez cañones
y diez fondos. Cada catálogo normal conserva sus diez entradas base y añade
las diez recompensas: **20 entradas por familia**. No hay un cuarto tab de
recompensas ni una tienda que venda premios de temporada por su precio cero.

Prueba completa: `/?debug=1&reward-catalog=1`, por ejemplo
`http://localhost:5173/?debug=1&reward-catalog=1`.

Abre el catálogo normal con las 30 recompensas desbloqueadas en una copia del
guardado **sólo en memoria**. Se pueden equipar, ver en Inicio y jugar con ellas;
no modifica NOVA, desbloqueos ni progreso real en localStorage. Volver a una
dirección sin esos parámetros recupera el progreso real. El aviso en el Hangar
identifica la prueba. Está habilitada sólo en el target local, también usado
por Pages; Poki y CrazyGames ignoran esta entrada de depuración.

## Obtención y temporadas

`src/content/retention/RewardCosmeticDefinitions.ts` es el manifiesto puro de
identidad, familia y fuente. Cada fuente tiene 15 premios, uno visible por semana.
El calendario usa semanas UTC desde 05-10-2026 y repite después de 15 semanas.
La rotación de los tres bosses aprobados sigue siendo de tres semanas,
independientemente de los premios. No se cambian ataques ni dificultad.

| Familia | Retos y Bitácora | Ruleta diaria |
| --- | --- | --- |
| Naves | Asterion Courier, Riftwake Strider, Iron Orchid, Tidebreaker, Umbra Manta | Solstice Regent, Halo Drifter, Vesper Kite, Sunscar, Crown Wasp |
| Cañones | Astral Fang, Embercoil, Jade Serpent, Rose Thorn, Abyss Maw | Frostbite, Voidspindle, Sunhammer, Starweaver, Prism Judge |
| Fondos | Ember Remnant, Binary Veil, Silver Dunes, Pearl Torrent, Echo Scar | Frozen Meridian, Tether Citadel, Amber Hive, Rust Cathedral, Night Garden |

Cada fuente recorre su lista en el orden del manifiesto, no por categoría.
En catálogo, un premio actual no poseído enlaza a su fuente; los otros indican
«Fuera de temporada» y no pueden comprarse. Una recompensa ganada permanece
disponible para equipar, aunque termine su temporada. El calendario del cliente
no proporciona seguridad autoritativa frente a manipulación del reloj.

El reto entrega el premio al confirmar una victoria elegible y durable, una vez
por edición; si ya se posee, entrega 250 NOVA. Los reintentos de la misma edición
no vuelven a pagar. Las prácticas de depuración no entregan premios.

La ruleta conserva 10 ranuras NOVA y una de cosmético. Gratis cada 24 horas y un
extra con video completado; ambos pueden ganar el premio. Probabilidad inicial
1%, aumenta un punto por giro guardado hasta 20%, sin reiniciarse por semana ni
por victoria. Duplicado: 500 NOVA. Un video o reintento de guardado que atraviese
el cambio de semana mantiene el premio ofrecido al iniciar el giro.

## Guardado y equipamiento

`RewardCosmeticOwnership` resuelve la familia y añade el ID a `skins`,
`cannonSkins` o `backgrounds`. Se conserva schema 13: las listas ya admiten las
nuevas identidades. El recibo de ruleta añade `rewardId` opcional y conserva
`skin` como campo compatible para cualquiera de las tres familias; los recibos
antiguos de Solstice siguen migrando. No se equipa automáticamente al premiar.
Equipar desde la ruleta o el catálogo guarda la selección y actualiza batalla
y la nave de Inicio. La compensación, cuota y premio se confirman juntos.

## Arte, balas y estelas

Una nave completa por imagen, con sus propulsores definidos en
`PlayerPropulsionDefinitions`; cañones intercambiables con cable, recoil y FX
existentes. Los diez cañones añaden **20 texturas originales** de bala y estela:

| Cañón | Bala/estela | Movimiento visual |
| --- | --- | --- |
| Astral Fang | Diamante azul, filamentos ámbar | Arco |
| Frostbite | Esquirla de hielo, vapor bifurcado | Hélice |
| Embercoil | Pulso fundido, brasas | Recto |
| Voidspindle | Lente violeta, interferencia | Arco |
| Jade Serpent | Media luna menta, cintas esmeralda | Serpentina |
| Sunhammer | Cincel ámbar, plasma segmentado | Recto |
| Rose Thorn | Aguja rosa, pétalos | Recto |
| Starweaver | Estrella blanca, trenza turquesa | Recto |
| Abyss Maw | Pulso anular, lóbulos cian | Hélice |
| Prism Judge | Chevrón lima, cortes violeta | Vibración dentada |

Los gestos son de presentación: no cambian daño, colisión, velocidad, alcance
ni número de disparos. Se reutiliza el pooling y el presupuesto existente de
estelas; Low y reduced-motion mantienen sus límites actuales. Las tarjetas
muestran un cañón/disparo horizontal; el modal muestra el paquete animado.

Fondos con centro oscuro, pintura periférica y corrientes de vapor compartidas
con la presentación existente. High anima cuatro sprites de humo; Low respeta
el perfil económico del sistema. No se añaden shaders o partículas por skin.

## Producción y coste

PNG maestros transparentes para naves/cañones; fondos opacos. Se conservan en
`src/assets/images/reward-catalog/masters`, **sin importarlos al runtime**.
Los prompts exactos del lote y la identidad están en `prompts.json`; los tres
conceptos del piloto conservan sus briefs históricos. Derivados reproducibles
con `scripts/prepare-reward-catalog.py` y Pillow:

- nave 224×256 lossless WebP;
- cañón 120×156, bala 128×64, estela 256×64, lossless WebP con alpha real;
- fondo 1024×1024 Q80 y miniatura 512×512 Q78;
- recorte por alpha y gutter transparente, sin cortar las piezas del kit;
- `asset-report.json` registra tamaño, dimensiones y alpha de 58 derivados.

Coste derivado nuevo: **1,463,696 bytes**. Los PNG se usan como fuentes de arte;
WebP mantiene la transparencia y reduce transferencia. Las URL compartidas no
precargan todas las texturas GPU: batalla carga nave/cañón seleccionados,
materiales usados y fondo activo. Las miniaturas de catálogo son imágenes de UI.
El fallback SVG existente permanece si falla una carga; no se duplican masters
antiguos. El presupuesto publicado sigue siendo 15,000,000 B, sin source maps;
éstos se conservan por separado para diagnóstico. La medida final de builds y
pruebas de esta entrega está registrada en CONTINUACION.md.

## Validación pendiente de producto

Revisar tamaño/contraste de las siluetas y estelas en móvil físico, sobre todo
Prism Judge, Abyss Maw y los fondos más cálidos. Probar el catálogo completo
con la entrada temporal; no usar esa ruta para comprobar premios persistentes.
No se ha ejecutado ni publicado un deploy remoto en esta entrega.
