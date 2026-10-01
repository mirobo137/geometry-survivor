# Naves y cañones PNG — dirección aprobada, 30-09-2026

Entrada canónica: PLAN_DESARROLLO.md §8. Procedimiento de producción:
[Arte híbrido](ARTE_HIBRIDO.md). La aprobación humana de esta fecha reemplaza
la propuesta anterior de construir las naves con casco y propulsor separados.

## Decisión y alcance actual

El usuario aprueba **UNA imagen PNG transparente por nave completa**, con
motor integrado y orientación cenital. No separar alas, casco, reactor o motor
por defecto. El volumen/material del arte aporta presencia; no añadir piezas
que no tengan una necesidad real y autorizada de movimiento.

Los cañones permanecen **dos módulos independientes, vinculados por cables**,
compartiendo un único PNG por modelo de cañón. La nave gira con el movimiento;
las bocas mantienen el apuntado independiente y slots reales de simulación.
No física de cuerda, hitbox de alas/cables, cambios de daño ni targeting.

Primera skin equipable: `spearhead` / **Ivory Spear**, GRATIS, en Skins → Naves.
Se desbloquea/equipa desde su modal y persiste con el guardado cosmético actual.
No URL experimental necesaria ni cambio de schema. `?skin=spearhead&act=radial`
sirve como ruta directa de desarrollo; `?ship-preview=tether` queda compatible.
PNG/navíos, anclas, alpha, prompts y presupuesto:
[ficha Ivory Spear](../../src/assets/skins/tethered/README.md).

Esta primera skin incluye los módulos PNG aprobados del prototipo; mantiene
el paquete de proyectil/estela seleccionado y NO modifica `cannonSkins` en el
guardado. Es una excepción temporal visual explícita. Durante la migración
completa, restablecer la elección independiente de MODELO de cañón mediante
su ID actual; no forzar cañones por nave ni sobrescribir elecciones del usuario.

## Próxima sesión: migrar catálogo, sin comenzar ahora

1. Inventariar SkinDefinitions/CannonSkinDefinitions, arte y consumidores
   (locker, modal, PlayerView, tiros/estelas). Mantener IDs, precios, propiedad,
   selección y guardados de las skins existentes; no borrar progreso cosmético.
2. Diseñar una silueta/material reconocible por nave y cañón, no recolores de
   Ivory Spear. Generar con herramienta integrada PNG RGBA reales y registrar
   prompts. Ajustar referencias al tema de cada modelo ya existente.
3. Naves pendientes: Aurora Strider, Eclipse Prism, Solar Bastion, Verdant
   Vector, Obsidian Relay, Nova Warden y Manta Veil. Cada una pasa a una imagen
   completa; Ivory Spear ya es la referencia técnica aprobada. No desarmar Manta
   en nuevas piezas. No nuevos fondos o rediseño de armas dentro de este bloque.
4. Cañones pendientes: Pulse Standard, Arc Needle, Cinder Bloom, Spectrum Drive,
   Lattice Halo, Helix Lance y Bloomwake. Un PNG reutilizado en los dos módulos
   por modelo, pivote en punta/slot y conector trasero. Conservar las estelas y
   cosméticos de proyectil aprobados; no cambiar interacción ni balance.
5. Conectar arte por ID y separar composición nave/cañón: mismo modelo de
   cañón usable con cualquier nave. Mostrar en previews las imágenes reales,
   nunca una ilustración publicitaria distinta. Tarjetas estáticas y sólo modal
   animado; reduced-motion/panel oculto detienen movimiento.
6. Carga bajo demanda, fuentes compartidas y ownership explícito; Image/Assets
   antes de Texture.from. Fallback seguro sin parseo nuevo durante combate.
   Reutilizar el consumidor existente, no crear un renderer paralelo por skin.
7. Comprobar selección gratuita/pagada, persistencia, cambio en ambas direcciones,
   pausa/daño/derrota/revive/reinicio, bocas exactas, Low/High, móvil portrait y
   landscape, alpha, errores de carga y ausencia de requests innecesarios.
8. Sólo retirar compositores o referencias de runtime antiguos cuando exista
   paridad y aprobación visual; preservar maestros SVG útiles, no hacer borrado
   masivo ni destruir texturas compartidas. Medir nodos/texturas antes/después:
   la prueba actual conserva fallback y no demuestra FPS o ahorro global.

Base de referencia: nave256², cañón128²; frame de nave56×64, cañón20×26,
ancla de punta0.5/0.08. No copiar el tamaño de imagen del generador a runtime.
Conservar colisión22 y slots `(±27,−11)`; una silueta visual mayor no amplía daño.
Si una silueta necesita otro frame lógico, validar alineación y legibilidad sin
cambiar los datos físicos. Mantener identidad en Low, limitar DPR/FX existentes.
Coste de archivo y memoria RGBA son distintos: medir ambos, no prometer FPS.

## Pendientes explícitos, fuera de esta entrega

- Shaders/efectos de propulsión: futuro FX localizado al motor, no partir la
  nave. Comparar overlay acotado contra shader con medición real antes de elegir.
- Inicio personalizado: mostrar el PNG de la nave EQUIPADA en `#start-mark`.
  Arte independiente del fondo portrait/landscape; compartir identidad/maestro
  con gameplay, derivado de resolución apropiada. No implementado todavía.
- Nueva animación de derrota: propuesta futura, no condición de esta migración.
- Laboratorio: pruebas humanas siguen pendientes; este bloque no las valida.

## Cómo retomar mañana

Leer CONTINUACION.md, esta guía, el plan §8 y las skills de rendering,
mobile-performance y validation. Revisar Git y conservar cambios ajenos.
Comenzar por inventario/paridad y nuevas imágenes; no volver a generar Ivory
Spear ni reintroducir la nave dividida. No commit/push ni esperar builds remotos
sin solicitud del usuario; la prueba en móvil requiere publicar cuando lo pida.
